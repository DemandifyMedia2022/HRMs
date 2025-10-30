import crypto from 'crypto';
 
// AES-256-GCM helper for field-level encryption at rest
// - Key source: process.env.EMPDATA_SECRET (any string). We derive a 32-byte key via SHA-256.
// - Format: enc.v1.<b64url(iv)>.<b64url(cipher)>.<b64url(tag)>
 
function getKey(): Buffer {
  const raw = process.env.EMPDATA_SECRET || '';
  // Derive 32-byte key from provided secret using SHA-256
  return crypto.createHash('sha256').update(raw).digest();
}
 
function b64url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
 
function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 2 ? '==' : s.length % 4 === 3 ? '=' : '';
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}
 
export function encryptField(plain: string | null | undefined): string | null {
  if (plain == null) return null;
  const val = String(plain);
  if (!val) return '';
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(val, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const out = `enc.v1.${b64url(iv)}.${b64url(enc)}.${b64url(tag)}`;
  return out;
}
 
export function isEncrypted(s: unknown): boolean {
  return typeof s === 'string' && s.startsWith('enc.v1.');
}
 
export function decryptField(encVal: string | null | undefined): string | null {
  if (!encVal) return null;
  if (!isEncrypted(encVal)) return encVal;
  try {
    const parts = encVal.split('.');
    if (parts.length !== 5) return encVal;
    const iv = fromB64url(parts[2]);
    const data = fromB64url(parts[3]);
    const tag = fromB64url(parts[4]);
    const key = getKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    // If decryption fails (wrong key or corrupted), return the original to avoid breaking API
    return encVal;
  }
}
 
export function encryptPatch(patch: Record<string, unknown>, fields: Set<string>) {
  const out: Record<string, unknown> = { ...patch };
  for (const k of fields) {
    if (k in out) {
      const v = out[k];
      if (typeof v === 'string') {
        out[k] = encryptField(v);
      } else if (v == null || v === '') {
        out[k] = null;
      }
    }
  }
  return out;
}
 
export function decryptRecord<T extends Record<string, unknown>>(rec: T, fields: Set<string>): T {
  const out: Record<string, unknown> = { ...rec };
  for (const k of fields) {
    if (k in out && typeof out[k] === 'string') {
      out[k] = decryptField(out[k] as string);
    }
  }
  return out as T;
}