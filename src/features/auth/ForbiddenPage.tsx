import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-4 text-slate-100 font-sans antialiased">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <ShieldX className="h-12 w-12" />
        </div>
        
        <h1 className="font-display text-2xl font-black text-slate-100">403 — Accès Restreint</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Vous ne disposez pas des autorisations nécessaires pour consulter cette section réservée du système EduCampus.
        </p>

        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Retourner au Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}