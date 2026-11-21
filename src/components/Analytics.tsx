import { useEffect, useState } from 'react';
import { hasAnalyticsConsent } from '@/lib/cookies';

/**
 * Respectful analytics loader — only injects after explicit cookie consent.
 * Replace VITE_ANALYTICS_ID with your provider measurement ID when ready.
 */
export function Analytics() {
  const [enabled, setEnabled] = useState(hasAnalyticsConsent());

  useEffect(() => {
    const onConsent = () => setEnabled(hasAnalyticsConsent());
    window.addEventListener('educampus:cookie-consent', onConsent);
    return () => window.removeEventListener('educampus:cookie-consent', onConsent);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const id = import.meta.env.VITE_ANALYTICS_ID as string | undefined;
    if (!id) return;

    // Lightweight custom beacon — no third-party script until ID is set
    const script = document.createElement('script');
    script.async = true;
    script.dataset.educampusAnalytics = '1';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);

    const inline = document.createElement('script');
    inline.dataset.educampusAnalytics = '1';
    inline.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${id}', { anonymize_ip: true });
    `;
    document.head.appendChild(inline);

    return () => {
      document.querySelectorAll('[data-educampus-analytics]').forEach((n) => n.remove());
    };
  }, [enabled]);

  return null;
}
