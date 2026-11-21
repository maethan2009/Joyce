export type CookieConsent = 'accepted' | 'rejected' | null;

const KEY = 'educampus-cookie-consent';

export function getCookieConsent(): CookieConsent {
  const v = localStorage.getItem(KEY);
  if (v === 'accepted' || v === 'rejected') return v;
  return null;
}

export function setCookieConsent(value: 'accepted' | 'rejected') {
  localStorage.setItem(KEY, value);
  window.dispatchEvent(new CustomEvent('educampus:cookie-consent', { detail: value }));
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() === 'accepted';
}
