"use client";

import React, { useEffect, useRef, useState } from "react";

export default function Dialer({ number, userName }: { number?: string; userName?: string }) {
  const [status, setStatus] = useState<string>("Idle");
  const [currentNumber, setCurrentNumber] = useState<string>(number || "");
  const [lastDialed, setLastDialed] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("lastDialedNumber") : null
  );

  const uaRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const callStartRef = useRef<string | null>(null);
  const answerTimeRef = useRef<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[] | null>(null);
  const recordingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (number && number !== currentNumber) setCurrentNumber(number);
  }, [number]);

  useEffect(() => {
    let mounted = true;

    async function initUA() {
      try {
        const username = typeof window !== "undefined" ? localStorage.getItem("extension") || "" : "";
        const password = typeof window !== "undefined" ? localStorage.getItem("sip_password") || "" : "";

        if (!username || !password) {
          setStatus("Missing SIP credentials in localStorage (extension, sip_password)");
          return;
        }

        // Reuse window-scoped UA if already created
        const JsSIP = (await import("jssip")).default;
        // @ts-ignore
        const existingUA = typeof window !== 'undefined' ? (window as any).__sipUA : null;
        if (existingUA) {
          uaRef.current = existingUA;
          setStatus("Registered");
          return;
        }
        const socket = new JsSIP.WebSocketInterface("wss://pbx2.telxio.com.sg:8089/ws");
        const ua = new JsSIP.UA({
          uri: `sip:${username}@pbx2.telxio.com.sg`,
          password,
          sockets: [socket],
          register: true,
          session_timers: true,
          session_timers_refresh_method: "UPDATE",
          connection_recovery_min_interval: 2,
          connection_recovery_max_interval: 30,
        });

        JsSIP.debug.enable("JsSIP:*");
        ua.on("registered", () => mounted && setStatus("Registered"));
        ua.on("registrationFailed", (e: any) => mounted && setStatus(`Registration failed: ${e?.cause || "unknown"}`));
        ua.on("newRTCSession", (data: any) => {
          sessionRef.current = data.session;
          const s = sessionRef.current;
          if (s.direction === "incoming") {
            setStatus("Incoming call");
          }

          s.on("accepted", () => {
            if (!mounted) return;
            setStatus("In Call");
            answerTimeRef.current = new Date().toISOString();
            try {
              // Build a mixed stream from peer connection tracks (remote + local if available)
              const pc: RTCPeerConnection | undefined = (s as any).connection;
              const tracks: MediaStreamTrack[] = [];
              try { pc?.getReceivers?.().forEach(r => r.track && tracks.push(r.track)); } catch {}
              try { pc?.getSenders?.().forEach(sd => sd.track && tracks.push(sd.track)); } catch {}
              const mix = new MediaStream(tracks.filter(Boolean));
              if (mix.getTracks().length && typeof MediaRecorder !== 'undefined') {
                const rec = new MediaRecorder(mix, { mimeType: 'audio/webm;codecs=opus' });
                recorderRef.current = rec;
                recordChunksRef.current = [];
                rec.ondataavailable = (e) => { if (e.data && e.data.size) recordChunksRef.current?.push(e.data); };
                rec.start(1000);
              }
            } catch {}
          });
          s.on("ended", () => {
            if (!mounted) return;
            setStatus("Ended");
            removeRemoteAudio();
            void finalizeRecordingAndLog("completed");
          });
          s.on("failed", (d: any) => {
            if (!mounted) return;
            setStatus(`Failed: ${d?.cause || "unknown"}`);
            removeRemoteAudio();
            void finalizeRecordingAndLog("failed", d?.cause);
          });
          s.on("terminated", () => {
            if (!mounted) return;
            setStatus("Terminated");
            removeRemoteAudio();
            void finalizeRecordingAndLog("terminated");
          });

          s.connection && (s.connection.ontrack = (event: any) => {
            const audio = getOrCreateRemoteAudio();
            const streams: MediaStream[] = (event && event.streams) || [];
            if (streams[0]) {
              audio.srcObject = streams[0];
              audio.play().catch(() => {});
            }
          });
        });

        ua.start();
        uaRef.current = ua;
        // @ts-ignore
        if (typeof window !== 'undefined') (window as any).__sipUA = ua;
      } catch (e: any) {
        setStatus(`Init error: ${String(e)}`);
      }
    }

    initUA();

    // Listen for global logout and credentials updates
    function onSipLogout() {
      try { sessionRef.current?.terminate?.(); } catch {}
      try { uaRef.current?.stop?.(); } catch {}
      // @ts-ignore
      if (typeof window !== 'undefined') (window as any).__sipUA = null;
      setStatus('Logged out');
    }
    async function onSipCredsUpdated() {
      // Restart UA with new credentials
      try { uaRef.current?.stop?.(); } catch {}
      // @ts-ignore
      if (typeof window !== 'undefined') (window as any).__sipUA = null;
      await initUA();
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('sip-logout', onSipLogout as any);
      window.addEventListener('sip-credentials-updated', onSipCredsUpdated as any);
    }
    return () => {
      mounted = false;
      // Do NOT stop UA on unmount; keep registered until explicit logout
      if (typeof window !== 'undefined') {
        window.removeEventListener('sip-logout', onSipLogout as any);
        window.removeEventListener('sip-credentials-updated', onSipCredsUpdated as any);
      }
    };
  }, []);

  function getOrCreateRemoteAudio(): HTMLAudioElement {
    let audio = document.getElementById("remote-audio") as HTMLAudioElement | null;
    if (!audio) {
      audio = document.createElement("audio");
      audio.id = "remote-audio";
      audio.style.display = "none";
      document.body.appendChild(audio);
    }
    return audio;
  }

  function removeRemoteAudio() {
    const audio = document.getElementById("remote-audio");
    if (audio && audio.parentNode) (audio.parentNode as HTMLElement).removeChild(audio);
  }

  async function finalizeRecordingAndLog(finalStatus: "completed" | "failed" | "terminated", cause?: string) {
    try {
      // Stop recorder if running
      const rec = recorderRef.current;
      if (rec && rec.state !== 'inactive') {
        const stopP = new Promise<void>((resolve) => {
          rec.onstop = () => resolve();
        });
        try { rec.stop(); } catch {}
        await stopP;
        // Build blob
        const chunks = recordChunksRef.current || [];
        if (chunks.length) {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const url = await uploadRecording(blob);
          recordingUrlRef.current = url || null;
        }
      }
    } catch {}
    finally {
      recorderRef.current = null;
      recordChunksRef.current = null;
    }
    await logFinalCall(finalStatus, cause);
  }

  async function uploadRecording(blob: Blob): Promise<string | null> {
    try {
      const fd = new FormData();
      const fileName = `call_${Date.now()}.webm`;
      fd.append('file', blob, fileName);
      const res = await fetch('/api/call-data/upload', { method: 'POST', body: fd });
      if (!res.ok) return null;
      const j = await res.json();
      return j?.url || null;
    } catch {
      return null;
    }
  }

  async function makeCall() {
    if (!currentNumber) return alert("Enter a number");
    if (!uaRef.current) return alert("UA not ready");
    if (sessionRef.current && sessionRef.current.isInProgress()) {
      return alert("Call already in progress");
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const session = uaRef.current.call(`sip:${currentNumber}@pbx2.telxio.com.sg`, {
        mediaConstraints: { audio: true, video: false },
      });
      sessionRef.current = session;
      setStatus("Ringing...");
      setLastDialed(currentNumber);
      localStorage.setItem("lastDialedNumber", currentNumber);
      callStartRef.current = new Date().toISOString();
    } catch (e: any) {
      setStatus(`Call error: ${String(e)}`);
    }
  }

  function hangup() {
    try {
      sessionRef.current?.terminate?.();
    } catch {}
  }

  function redial() {
    const num = lastDialed || currentNumber;
    if (!num) return alert("No number to redial");
    setCurrentNumber(num);
    makeCall();
  }

  async function resolveUserNamePreferred(): Promise<{ name: string | null; source: string }> {
    // 1) Prop (but ignore generic placeholder "Current User")
    if (userName && userName.trim() && userName.trim().toLowerCase() !== 'current user') {
      return { name: userName.trim(), source: 'prop' };
    }
    // 2) LocalStorage
    try {
      const ls = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
      if (ls && ls.trim() && ls.trim().toLowerCase() !== 'current user') {
        return { name: ls.trim(), source: 'localStorage' };
      }
    } catch {}
    // 3) Auth endpoint
    try {
      const r = await fetch('/api/auth/me', { credentials: 'include' });
      if (r.ok) {
        const me = await r.json();
        const pretty = (me?.name || '').trim();
        if (pretty) {
          try { localStorage.setItem('userName', pretty); } catch {}
          return { name: pretty, source: 'api:auth/me' };
        }
      }
    } catch {}
    return { name: null, source: 'unknown' };
  }

  async function logFinalCall(finalStatus: "completed" | "failed" | "terminated", cause?: string) {
    try {
      const extension = typeof window !== 'undefined' ? localStorage.getItem('extension') : null;
      const did = typeof window !== 'undefined' ? localStorage.getItem('did') : null;
      const resolved = await resolveUserNamePreferred();
      const user_name = resolved.name;
      const start_time = callStartRef.current;
      const answer_time = answerTimeRef.current;
      const end_time = new Date().toISOString();
      let duration_seconds: number | null = null;
      try {
        const start = start_time ? new Date(start_time).getTime() : null;
        const end = new Date(end_time).getTime();
        duration_seconds = start ? Math.max(0, Math.floor((end - start) / 1000)) : null;
      } catch {}

      const meta = { user_name_source: resolved.source } as const;
      await fetch('/api/call-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extension: extension || null,
          source_number: (did || extension) || null,
          user_name: user_name || null,
          destination: currentNumber || null,
          direction: 'outbound',
          status: finalStatus,
          start_time,
          answer_time,
          end_time,
          duration_seconds,
          cause: cause || null,
          recording_url: recordingUrlRef.current || null,
          meta,
        })
      });
      // Persist last recording URL for UI convenience
      try {
        if (recordingUrlRef.current) localStorage.setItem('lastRecordingUrl', recordingUrlRef.current);
      } catch {}
    } catch (err) {
      // swallow logging errors to not disrupt UI
      console.warn('call-data log error', err);
    } finally {
      callStartRef.current = null;
      answerTimeRef.current = null;
    }
  }

  return (
    <div className="mt-2">
      <div className="mb-2 text-sm text-gray-600">SIP Status: {status}</div>
      <div className="flex gap-2 items-center">
        <input
          className="border rounded px-2 py-1 w-48"
          placeholder="Enter number"
          value={currentNumber}
          onChange={(e) => setCurrentNumber(e.target.value)}
        />
        <button type="button" onClick={makeCall} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
          Call
        </button>
        <button type="button" onClick={hangup} className="bg-red-600 text-white px-3 py-1 rounded text-sm">
          Hangup
        </button>
        <button type="button" onClick={redial} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
          Redial
        </button>
      </div>
    </div>
  );
}