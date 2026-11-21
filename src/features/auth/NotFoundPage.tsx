import { Link } from 'react-router-dom';
import { Home, LayoutDashboard } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useAppStore } from '@/store/useAppStore';

export function NotFoundPage() {
  const user = useAppStore((s) => s.user);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <PageMeta title="Page introuvable" description="La page demandée n’existe pas sur EduCampus." />
      <p className="text-6xl font-display font-black text-brand-600">404</p>
      <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100">Page introuvable</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Ce lien n’existe pas ou a été déplacé. Retournez à l’accueil ou à votre tableau de bord.
      </p>
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Link to="/" className="btn-secondary">
          <Home className="h-4 w-4" /> Accueil
        </Link>
        {user && (
          <Link to="/dashboard" className="btn-primary">
            <LayoutDashboard className="h-4 w-4" /> Tableau de bord
          </Link>
        )}
      </div>
    </div>
  );
}
