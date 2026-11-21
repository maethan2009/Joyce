import { useCallback, useEffect, useRef, useState } from 'react';
import * as OTPAuth from 'otpauth';

export function generateTotpSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

export function generateTotpUri(secret: string, email: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: 'EduCampus',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

export function generateTotpCode(secret: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: 'EduCampus',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.generate();
}

export function isValidBase32Secret(secret?: string | null): boolean {
  if (!secret) return false;
  const cleaned = secret.trim().toUpperCase();
  return cleaned.length >= 16 && /^[A-Z2-7]+=*$/.test(cleaned);
}

export function verifyTotpCode(secret: string, code: string): boolean {
  if (!isValidBase32Secret(secret)) return false;
  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'EduCampus',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret.trim().toUpperCase()),
    });
    const delta = totp.validate({ token: code.trim(), window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

export function useDynamicTotp(secretBase32: string, matricule: string) {
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [currentCode, setCurrentCode] = useState('');
  const [payload, setPayload] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generate = useCallback(() => {
    const totp = new OTPAuth.TOTP({
      issuer: 'EduCampus',
      algorithm: 'SHA1',
      digits: 8,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretBase32),
    });
    const code = totp.generate();
    const timeStep = Math.floor(Date.now() / 30_000);
    const qrPayload = JSON.stringify({ m: matricule, c: code, n: timeStep });
    setCurrentCode(code);
    setPayload(qrPayload);
    setSecondsRemaining(30 - (Math.floor(Date.now() / 1000) % 30));
  }, [secretBase32, matricule]);

  useEffect(() => {
    generate();
    intervalRef.current = setInterval(() => {
      const sec = 30 - (Math.floor(Date.now() / 1000) % 30);
      setSecondsRemaining(sec);
      if (sec === 30) generate();
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generate]);

  return { secondsRemaining, currentCode, payload };
}
