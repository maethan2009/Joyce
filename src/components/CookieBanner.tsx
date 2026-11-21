import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCookieConsent, setCookieConsent } from '@/lib/cookies';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getCookieConsent() === null);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentement aux cookies"
      className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-5 sm:p-6">
        <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
          Cookies & mesure d’audience
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Nous utilisons uniquement des cookies essentiels au fonctionnement, et des cookies
          d’audience non essentiels uniquement avec votre accord explicite. Consultez la{' '}
          <Link to="/legal" className="text-brand-600 dark:text-brand-400 font-semibold underline-offset-2 hover:underline">
            Politique de confidentialité
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setCookieConsent('rejected');
              setVisible(false);
            }}
          >
            Refuser
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setCookieConsent('accepted');
              setVisible(false);
            }}
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
