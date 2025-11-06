export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

export function getRequiredInt(key: string): number {
  const raw = getRequiredEnv(key);
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return n;
}
