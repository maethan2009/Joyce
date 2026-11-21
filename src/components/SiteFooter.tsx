import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/logo-educampus-icon.svg"
            alt=""
            className="h-8 w-8 object-contain"
            loading="lazy"
            width={32}
            height={32}
          />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">EduCampus</p>
            <p className="text-xs text-slate-500">Plateforme académique multi-portails</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
          <Link to="/legal" className="hover:text-brand-600 dark:hover:text-brand-400">
            Confidentialité & CGU
          </Link>
          <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400">
            Connexion
          </Link>
          <Link to="/enroll" className="hover:text-brand-600 dark:hover:text-brand-400">
            Inscription
          </Link>
        </nav>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-900 px-4 py-3 text-center text-[11px] text-slate-400">
        © {new Date().getFullYear()} EduCampus. Tous droits réservés.
      </div>
    </footer>
  );
}
