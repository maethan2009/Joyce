import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-100 font-sans antialiased">
      <div className="w-full max-w-md p-8 rounded-xl bg-zinc-900 border border-zinc-800 shadow-cabinet text-center space-y-5">
        <div className="inline-flex p-4 rounded-xl bg-brand-950 border border-brand-800 text-brand-400">
          <ShieldX className="h-10 w-10" />
        </div>

        <h1 className="font-display text-2xl font-extrabold text-white">403 — Accès Restreint</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Votre rôle actuel ne dispose pas des autorisations requises pour consulter cet espace EduCampus.
        </p>

        <div className="pt-2">
          <Link to="/dashboard" className="btn-primary w-full py-3">
            <ArrowLeft className="h-4 w-4" />
            <span>Retourner au tableau de bord</span>
          </Link>
        </div>
      </div>
    </div>
  );
}