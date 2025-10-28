'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Dialer({
  number,
  userName,
  autoHangupOnUnmount = true
}: {
  number?: string;
  userName?: string;
  autoHangupOnUnmount?: boolean;
}) {
  const [status, setStatus] = useState<string>('Idle');
  const statusRef = useRef<string>('Idle');
  const [currentNumber, setCurrentNumber] = useState<string>(number || '');
  const [lastDialed, setLastDialed] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('lastDialedNumber') : null
  );

  const uaRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const callStartRef = useRef<string | null>(null);
  const answerTimeRef = useRef<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[] | null>(null);
  const recordingUrlRef = useRef<string | null>(null);
  // Track whether UA handlers are bound for this component instance
  const uaBoundRef = useRef<boolean>(false);
  const uaHandlerRefs = useRef<{ [k: string]: any } | null>(null);

  const [muted, setMuted] = useState<boolean>(false);
  const [onHold, setOnHold] = useState<boolean>(false);
  const [durationSec, setDurationSec] = useState<number>(0);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconcileTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (number && number !== currentNumber) setCurrentNumber(number);
  }, [number]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    let mounted = true;

    async function initUA() {
      try {
        const username = typeof window !== 'undefined' ? localStorage.getItem('extension') || '' : '';
        const password = typeof window !== 'undefined' ? localStorage.getItem('sip_password') || '' : '';

        if (!username || !password) {
          setStatus('Missing SIP credentials in localStorage (extension, sip_password)');
          return;
        }

        // Reuse window-scoped UA if already created; bind handlers per component instance
        const JsSIP = (await import('jssip')).default;
        // @ts-ignore
        const existingUA = typeof window !== 'undefined' ? (window as any).__sipUA : null;
        let ua: any = existingUA;
        let created = false;
        if (!ua) {
          const socket = new JsSIP.WebSocketInterface('wss://pbx2.telxio.com.sg:8089/ws');
          ua = new JsSIP.UA({
            uri: `sip:${username}@pbx2.telxio.com.sg`,
            password,
            sockets: [socket],
            register: true,
            session_timers: true,
            session_timers_refresh_method: 'UPDATE',
            connection_recovery_min_interval: 2,
            connection_recovery_max_interval: 30
          });
          created = true;
        }

        JsSIP.debug.enable('JsSIP:*');
        // Bind handlers once per component instance
        if (!uaBoundRef.current) {
          const onRegistered = () => mounted && setStatus('Registered');
          const onRegistrationFailed = (e: any) =>
            mounted && setStatus(`Registration failed: ${e?.cause || 'unknown'}`);
          const onNewRTCSession = (data: any) => {
            sessionRef.current = data.session;
            const s = sessionRef.current;
            if (s.direction === 'incoming') {
              setStatus('Incoming call');
            }

            s.on('progress', () => {
              if (!mounted) return;
              if (sessionRef.current !== s) return; // ignore stale events
              try {
                const inProg = typeof s.isInProgress === 'function' ? !!s.isInProgress() : true;
                if (inProg) setStatus('Ringing...');
              } catch {
                setStatus('Ringing...');
              }
              // Start/refresh a ringing watchdog (auto-end after 35s to match common SIP timer B)
              try {
                if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current as unknown as number);
              } catch {}
              ringingTimerRef.current = setTimeout(() => {
                try {
                  if (sessionRef.current && statusRef.current === 'Ringing...') {
                    setStatus('No Answer');
                    sessionRef.current.terminate?.();
                    sessionRef.current = null;
                  }
                } catch {}
              }, 35_000) as unknown as NodeJS.Timeout;
            });

            s.on('accepted', () => {
              if (!mounted) return;
              if (sessionRef.current !== s) return;
              setStatus('In Call');
              answerTimeRef.current = new Date().toISOString();
              // Clear ringing watchdog
              try {
                if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current as unknown as number);
              } catch {}
              ringingTimerRef.current = null;
              // Start duration ticker
              try {
                if (durationTimerRef.current) clearInterval(durationTimerRef.current as unknown as number);
              } catch {}
              setDurationSec(0);
              durationTimerRef.current = setInterval(() => {
                try {
                  const start = answerTimeRef.current ? new Date(answerTimeRef.current).getTime() : null;
                  if (start) setDurationSec(Math.max(0, Math.floor((Date.now() - start) / 1000)));
                } catch {}
              }, 1000) as unknown as NodeJS.Timeout;
              try {
                // Build a mixed stream from peer connection tracks (remote + local if available)
                const pc: RTCPeerConnection | undefined = (s as any).connection;
                const tracks: MediaStreamTrack[] = [];
                try {
                  pc?.getReceivers?.().forEach(r => r.track && tracks.push(r.track));
                } catch {}
                try {
                  pc?.getSenders?.().forEach(sd => sd.track && tracks.push(sd.track));
                } catch {}
                const mix = new MediaStream(tracks.filter(Boolean));
                if (mix.getTracks().length && typeof MediaRecorder !== 'undefined') {
                  const rec = new MediaRecorder(mix, { mimeType: 'audio/webm;codecs=opus' });
                  recorderRef.current = rec;
                  recordChunksRef.current = [];
                  rec.ondataavailable = e => {
                    if (e.data && e.data.size) recordChunksRef.current?.push(e.data);
                  };
                  rec.start(1000);
                }
              } catch {}
            });
            // Confirmed (both sides established)
            s.on('confirmed', () => {
              if (!mounted) return;
              if (sessionRef.current !== s) return;
              setStatus('In Call');
              // Ensure timer started even if 'accepted' path was skipped/missed
              if (!answerTimeRef.current) {
                try {
                  answerTimeRef.current = new Date().toISOString();
                  try {
                    if (durationTimerRef.current) clearInterval(durationTimerRef.current as unknown as number);
                  } catch {}
                  setDurationSec(0);
                  durationTimerRef.current = setInterval(() => {
                    try {
                      const start = answerTimeRef.current ? new Date(answerTimeRef.current).getTime() : null;
                      if (start) setDurationSec(Math.max(0, Math.floor((Date.now() - start) / 1000)));
                    } catch {}
                  }, 1000) as unknown as NodeJS.Timeout;
                } catch {}
              }
            });

            // Remote party explicitly hangs up
            s.on('bye', () => {
              if (!mounted) return;
              setStatus('Ended');
              removeRemoteAudio();
              void finalizeRecordingAndLog('completed');
              setMuted(false);
              setOnHold(false);
              try {
                if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current as unknown as number);
              } catch {}
              ringingTimerRef.current = null;
              try {
                if (durationTimerRef.current) clearInterval(durationTimerRef.current as unknown as number);
              } catch {}
              durationTimerRef.current = null;
              setDurationSec(0);
              sessionRef.current = null;
            });
            // Outgoing call canceled or remote rejected during setup
            // Some stacks emit 'cancel' when caller cancels; treat as end
            try {
              s.on('cancel', () => {
                if (!mounted) return;
                if (sessionRef.current !== s) return;
                setStatus('Ended');
                removeRemoteAudio();
                try {
                  if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current as unknown as number);
                } catch {}
                ringingTimerRef.current = null;
                try {
                  if (durationTimerRef.current) clearInterval(durationTimerRef.current as unknown as number);
                } catch {}
                durationTimerRef.current = null;
                setDurationSec(0);
                sessionRef.current = null;
              });
            } catch {}
            s.on('muted', () => {
              if (mounted) setMuted(true);
            });
            s.on('unmuted', () => {
              if (mounted) setMuted(false);
            });
            s.on('hold', () => {
              if (mounted) setOnHold(true);
            });
            s.on('unhold', () => {
              if (mounted) setOnHold(false);
            });
            s.on('ended', () => {
              if (!mounted) return;
              if (sessionRef.current !== s) return;
              setStatus('Ended');
              removeRemoteAudio();
              void finalizeRecordingAndLog('completed');
              setMuted(false);
              setOnHold(false);
              try {
                if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current as unknown as number);
              } catch {}
              ringingTimerRef.current = null;
              // Clear duration and session
              try {
                if (durationTimerRef.current) clearInterval(durationTimerRef.current as unknown as number);
              } catch {}
              durationTimerRef.current = null;
              setDurationSec(0);
              sessionRef.current = null;
            });
            s.on('failed', (d: any) => {
              if (!mounted) return;
              if (sessionRef.current !== s) return;
              setStatus(`Failed: ${d?.cause || 'unknown'}`);
              removeRemoteAudio();
              void finalizeRecordingAndLog('failed', d?.cause);
              setMuted(false);
              setOnHold(false);
              try {
                if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current as unknown as number);
              } catch {}
              ringingTimerRef.current = null;
              try {
                if (durationTimerRef.current) clearInterval(durationTimerRef.current as unknown as number);
              } catch {}
              durationTimerRef.current = null;
              setDurationSec(0);
              sessionRef.current = null;
            });
            s.on('terminated', () => {
              if (!mounted) return;
              if (sessionRef.current !== s) return;
              setStatus('Terminated');
              removeRemoteAudio();
              void finalizeRecordingAndLog('terminated');
              setMuted(false);
              setOnHold(false);
              try {
                if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current as unknown as number);
              } catch {}
              ringingTimerRef.current = null;
              try {
                if (durationTimerRef.current) clearInterval(durationTimerRef.current as unknown as number);
              } catch {}
              durationTimerRef.current = null;
              setDurationSec(0);
              sessionRef.current = null;
            });

            s.connection &&
              (s.connection.ontrack = (event: any) => {
                const audio = getOrCreateRemoteAudio();
                const streams: MediaStream[] = (event && event.streams) || [];
                if (streams[0]) {
                  audio.srcObject = streams[0];
                  audio.play().catch(() => {});
                  // Start recorder when we actually have remote media
                  try {
                    const pc: RTCPeerConnection | undefined = (s as any).connection;
                    const tracks: MediaStreamTrack[] = [];
                    try {
                      pc?.getReceivers?.().forEach(r => r.track && tracks.push(r.track));
                    } catch {}
                    try {
                      pc?.getSenders?.().forEach(sd => sd.track && tracks.push(sd.track));
                    } catch {}
                    const mix = new MediaStream(tracks.filter(Boolean));
                    if (!recorderRef.current && mix.getTracks().length && typeof MediaRecorder !== 'undefined') {
                      const rec = new MediaRecorder(mix, { mimeType: 'audio/webm;codecs=opus' });
                      recorderRef.current = rec;
                      recordChunksRef.current = [];
                      rec.ondataavailable = e => {
                        if (e.data && e.data.size) recordChunksRef.current?.push(e.data);
                      };
                      rec.start(1000);
                    }
                  } catch {}
                }
              });
            // Also watch peer connection state to proactively end UI
            try {
              const pc: RTCPeerConnection | undefined = (s as any).connection;
              if (pc) {
                pc.onconnectionstatechange = () => {
                  if (sessionRef.current !== s) return;
                  const st = pc.connectionState;
                  if (st === 'disconnected' || st === 'failed' || st === 'closed') {
                    setStatus(st === 'failed' ? 'Failed' : 'Ended');
                    removeRemoteAudio();
                    try {
                      if (durationTimerRef.current) clearInterval(durationTimerRef.current as unknown as number);
                    } catch {}
                    durationTimerRef.current = null;
                    setDurationSec(0);
                    setMuted(false);
                    setOnHold(false);
                    sessionRef.current = null;
                  }
                };
                pc.oniceconnectionstatechange = () => {
                  if (sessionRef.current !== s) return;
                  const ist = pc.iceConnectionState;
                  if (ist === 'failed' || ist === 'disconnected' || ist === 'closed') {
                    setStatus(ist === 'failed' ? 'Failed' : 'Ended');
                    removeRemoteAudio();
                    try {
                      if (durationTimerRef.current) clearInterval(durationTimerRef.current as unknown as number);
                    } catch {}
                    durationTimerRef.current = null;
                    setDurationSec(0);
                    setMuted(false);
                    setOnHold(false);
                    sessionRef.current = null;
                  }
                };
              }
            } catch {}
          };
          ua.on('registered', onRegistered);
          ua.on('registrationFailed', onRegistrationFailed);
          ua.on('newRTCSession', onNewRTCSession);
          uaHandlerRefs.current = { onRegistered, onRegistrationFailed, onNewRTCSession };
          uaBoundRef.current = true;
        }

        // Start and cache UA only when newly created
        if (created) {
          ua.start();
          // @ts-ignore
          if (typeof window !== 'undefined') (window as any).__sipUA = ua;
        } else {
          // If reusing, ensure it is registered
          try {
            if (!ua.isRegistered && ua.register) ua.register();
          } catch {}
        }
        uaRef.current = ua;
      } catch (e: any) {
        setStatus(`Init error: ${String(e)}`);
      }
    }

    initUA();

    // Listen for global logout and credentials updates
    function onSipLogout() {
      try {
        sessionRef.current?.terminate?.();
      } catch {}
      try {
        uaRef.current?.stop?.();
      } catch {}
      // @ts-ignore
      if (typeof window !== 'undefined') (window as any).__sipUA = null;
      setStatus('Logged out');
    }
    async function onSipCredsUpdated() {
      // Restart UA with new credentials
      try {
        uaRef.current?.stop?.();
      } catch {}
      // @ts-ignore
      if (typeof window !== 'undefined') (window as any).__sipUA = null;
      await initUA();
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('sip-logout', onSipLogout as any);
      window.addEventListener('sip-credentials-updated', onSipCredsUpdated as any);
    }
    // Periodic reconciliation to avoid stale UI state
    try {
      if (reconcileTimerRef.current) clearInterval(reconcileTimerRef.current as unknown as number);
    } catch {}
    reconcileTimerRef.current = setInterval(() => {
      try {
        const s = sessionRef.current;
        const hasSession = !!s;
        const st = statusRef.current;
        // If no active session but UI shows in-progress states, reset
        if (!hasSession && (st === 'Ringing...' || st === 'In Call' || st === 'Ending...')) {
          setStatus('Idle');
          try {
            if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current as unknown as number);
          } catch {}
          ringingTimerRef.current = null;
          try {
            if (durationTimerRef.current) clearInterval(durationTimerRef.current as unknown as number);
          } catch {}
          durationTimerRef.current = null;
          setDurationSec(0);
          setMuted(false);
          setOnHold(false);
        }
        // If a session exists but it is ended, also reset
        if (hasSession) {
          try {
            const ended = typeof s.isEnded === 'function' ? !!s.isEnded() : false;
            const inProg = typeof s.isInProgress === 'function' ? !!s.isInProgress() : false;
            const established = typeof s.isEstablished === 'function' ? !!s.isEstablished() : false;
            if ((ended || (!inProg && !established)) && (st === 'Ringing...' || st === 'In Call')) {
              setStatus(ended ? 'Ended' : 'No Answer');
              removeRemoteAudio();
              try {
                if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current as unknown as number);
              } catch {}
              ringingTimerRef.current = null;
              try {
                if (durationTimerRef.current) clearInterval(durationTimerRef.current as unknown as number);
              } catch {}
              durationTimerRef.current = null;
              setDurationSec(0);
              setMuted(false);
              setOnHold(false);
              sessionRef.current = null;
            }
          } catch {}
        }
      } catch {}
    }, 2000) as unknown as NodeJS.Timeout;
    return () => {
      mounted = false;
      // Do NOT stop UA on unmount; keep registered until explicit logout
      if (typeof window !== 'undefined') {
        window.removeEventListener('sip-logout', onSipLogout as any);
        window.removeEventListener('sip-credentials-updated', onSipCredsUpdated as any);
      }
      try {
        if (reconcileTimerRef.current) clearInterval(reconcileTimerRef.current as unknown as number);
      } catch {}
      reconcileTimerRef.current = null;
      // Remove our UA listeners to prevent duplicate handlers and ensure fresh bindings on next mount
      try {
        const ua = uaRef.current;
        const refs = uaHandlerRefs.current;
        if (ua && refs) {
          try {
            ua.off ? ua.off('registered', refs.onRegistered) : ua.removeListener?.('registered', refs.onRegistered);
          } catch {}
          try {
            ua.off
              ? ua.off('registrationFailed', refs.onRegistrationFailed)
              : ua.removeListener?.('registrationFailed', refs.onRegistrationFailed);
          } catch {}
          try {
            ua.off
              ? ua.off('newRTCSession', refs.onNewRTCSession)
              : ua.removeListener?.('newRTCSession', refs.onNewRTCSession);
          } catch {}
        }
      } catch {}
      uaHandlerRefs.current = null;
      uaBoundRef.current = false;
    };
  }, []);

  // End any active call if the dialer UI is unmounted (optional)
  useEffect(() => {
    return () => {
      try {
        if (autoHangupOnUnmount && sessionRef.current) {
          sessionRef.current.terminate?.();
        }
      } catch {}
    };
  }, [autoHangupOnUnmount]);

  function getOrCreateRemoteAudio(): HTMLAudioElement {
    let audio = document.getElementById('remote-audio') as HTMLAudioElement | null;
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'remote-audio';
      audio.style.display = 'none';
      document.body.appendChild(audio);
    }
    return audio;
  }

  function removeRemoteAudio() {
    const audio = document.getElementById('remote-audio');
    if (audio && audio.parentNode) (audio.parentNode as HTMLElement).removeChild(audio);
  }

  async function finalizeRecordingAndLog(finalStatus: 'completed' | 'failed' | 'terminated', cause?: string) {
    try {
      // Stop recorder if running
      const rec = recorderRef.current;
      if (rec && rec.state !== 'inactive') {
        const stopP = new Promise<void>(resolve => {
          rec.onstop = () => resolve();
        });
        try {
          rec.stop();
        } catch {}
        await stopP;
        // Build blob
        const chunks = recordChunksRef.current || [];
        if (chunks.length) {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const url = await uploadRecording(blob);
          recordingUrlRef.current = url || null;
        }
      }
    } catch {
    } finally {
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

  function statusBadgeClass(st: string): string {
    if (st === 'In Call' || st === 'Connected' || st === 'Call in progress') return 'bg-green-100 text-green-700';
    if (st === 'Ringing...' || st === 'Incoming call') return 'bg-yellow-100 text-yellow-700';
    if (st === 'Registered') return 'bg-blue-100 text-blue-700';
    if (st.startsWith('Failed') || st === 'Failed') return 'bg-red-100 text-red-700';
    if (st === 'Ended' || st === 'No Answer' || st === 'Terminated') return 'bg-gray-100 text-gray-700';
    return 'bg-gray-100 text-gray-700';
  }

  function resetUI() {
    try {
      sessionRef.current?.terminate?.();
    } catch {}
    removeRemoteAudio();
    try {
      if (ringingTimerRef.current) clearTimeout(ringingTimerRef.current as unknown as number);
    } catch {}
    ringingTimerRef.current = null;
    try {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current as unknown as number);
    } catch {}
    durationTimerRef.current = null;
    setDurationSec(0);
    setMuted(false);
    setOnHold(false);
    sessionRef.current = null;
    setStatus('Idle');
  }

  async function makeCall() {
    if (!currentNumber) return alert('Enter a number');
    if (!uaRef.current) return alert('UA not ready');
    if (sessionRef.current && sessionRef.current.isInProgress()) {
      return alert('Call already in progress');
    }

    try {
      // Request microphone with voice-friendly constraints
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000
        } as MediaTrackConstraints,
        video: false as any
      } as MediaStreamConstraints);
      // Ensure all audio tracks are enabled
      try {
        localStream.getAudioTracks().forEach(t => (t.enabled = true));
      } catch {}

      const normalized = (currentNumber || '').replace(/[^0-9]/g, '');
      if (!normalized) return alert('Invalid number');
      const session = uaRef.current.call(`sip:${normalized}@pbx2.telxio.com.sg`, {
        mediaConstraints: { audio: true, video: false },
        mediaStream: localStream,
        pcConfig: {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        }
      });

      sessionRef.current = session;
      setStatus('Ringing...');
      setLastDialed(currentNumber);
      localStorage.setItem('lastDialedNumber', currentNumber);
      callStartRef.current = new Date().toISOString();
    } catch (e: any) {
      setStatus(`Call error: ${String(e)}`);
    }
  }

  function hangup() {
    try {
      if (sessionRef.current) {
        setStatus('Ending...');
        sessionRef.current.terminate?.();
      }
    } catch {}
  }

  function redial() {
    const num = lastDialed || currentNumber;
    if (!num) return alert('No number to redial');
    setCurrentNumber(num);
    makeCall();
  }

  function toggleMute() {
    try {
      const s = sessionRef.current;
      if (!s) return;
      const isMuted = typeof s.isMuted === 'function' ? !!s.isMuted().audio : muted;
      if (isMuted) {
        s.unmute({ audio: true });
        setMuted(false);
      } else {
        s.mute({ audio: true });
        setMuted(true);
      }
    } catch {}
  }

  function toggleHold() {
    try {
      const s = sessionRef.current;
      if (!s) return;
      const localHold = typeof s.isOnHold === 'function' ? !!s.isOnHold().local : onHold;
      if (localHold) {
        s.unhold({ useUpdate: true });
        setOnHold(false);
      } else {
        s.hold({ useUpdate: true });
        setOnHold(true);
      }
    } catch {}
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
          try {
            localStorage.setItem('userName', pretty);
          } catch {}
          return { name: pretty, source: 'api:auth/me' };
        }
      }
    } catch {}
    return { name: null, source: 'unknown' };
  }

  async function logFinalCall(finalStatus: 'completed' | 'failed' | 'terminated', cause?: string) {
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
      const res = await fetch('/api/call-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extension: extension || null,
          source_number: did || extension || null,
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
          meta
        })
      });
      try {
        const j = await res.json().catch(() => null);
        if (!res.ok || (j && j.error)) {
          console.warn('call-data POST failed', { status: res.status, body: j });
        }
      } catch {}
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

  const inProgress = !!(
    sessionRef.current &&
    (sessionRef.current.isInProgress?.() || status === 'In Call' || status === 'Ringing...')
  );

  async function acceptIncoming() {
    try {
      const s = sessionRef.current;
      if (!s) return;
      // Prepare microphone stream
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000
        } as MediaTrackConstraints,
        video: false as any
      } as MediaStreamConstraints);
      try {
        localStream.getAudioTracks().forEach(t => (t.enabled = true));
      } catch {}
      s.answer({
        mediaConstraints: { audio: true, video: false },
        mediaStream: localStream,
        pcConfig: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
      });
      // Optimistically set in-call state and start duration immediately
      setStatus('In Call');
      try {
        if (!answerTimeRef.current) answerTimeRef.current = new Date().toISOString();
        try {
          if (durationTimerRef.current) clearInterval(durationTimerRef.current as unknown as number);
        } catch {}
        setDurationSec(0);
        durationTimerRef.current = setInterval(() => {
          try {
            const start = answerTimeRef.current ? new Date(answerTimeRef.current).getTime() : null;
            if (start) setDurationSec(Math.max(0, Math.floor((Date.now() - start) / 1000)));
          } catch {}
        }, 1000) as unknown as NodeJS.Timeout;
      } catch {}
    } catch {}
  }

  function rejectIncoming() {
    try {
      sessionRef.current?.terminate?.();
    } catch {}
  }

  return (
    <div className="mt-2">
      <div className="mb-2 text-sm text-gray-600 flex items-center gap-3">
        <span>SIP Status:</span>
        {(() => {
          const displayStatus = status === 'In Call' ? 'Call in progress' : status;
          return (
            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${statusBadgeClass(displayStatus)}`}>
              {displayStatus}
            </span>
          );
        })()}
        {status === 'In Call' && (
          <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
            {Math.floor(durationSec / 60)
              .toString()
              .padStart(2, '0')}
            :{(durationSec % 60).toString().padStart(2, '0')}
          </span>
        )}
        {status === 'In Call' && (
          <span className="text-xs text-gray-500">
            {(() => {
              try {
                const t = answerTimeRef.current ? new Date(answerTimeRef.current) : null;
                return t ? `Started ${t.toLocaleTimeString()}` : '';
              } catch {
                return '';
              }
            })()}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          className="w-56"
          placeholder="Enter number"
          value={currentNumber}
          onChange={e => setCurrentNumber(e.target.value)}
        />
        {status === 'Incoming call' && (
          <>
            <Button type="button" onClick={acceptIncoming}>
              Accept
            </Button>
            <Button type="button" variant="destructive" onClick={rejectIncoming}>
              Reject
            </Button>
          </>
        )}
        <Button type="button" onClick={makeCall} disabled={inProgress}>
          Call
        </Button>
        <Button type="button" variant="destructive" onClick={hangup} disabled={!sessionRef.current}>
          Hangup
        </Button>
        <Button type="button" variant="secondary" onClick={redial} disabled={inProgress}>
          Redial
        </Button>
        <Button type="button" variant="secondary" onClick={toggleMute} disabled={!sessionRef.current}>
          {muted ? 'Unmute' : 'Mute'}
        </Button>
        <Button type="button" variant="secondary" onClick={toggleHold} disabled={!sessionRef.current}>
          {onHold ? 'Resume' : 'Hold'}
        </Button>
        <Button type="button" variant="outline" onClick={resetUI}>
          Reset
        </Button>
      </div>
    </div>
  );
}
