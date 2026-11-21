import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, KeyRound, ShieldCheck, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { verifyTotpCode } from '@/lib/totp';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAppStore((s) => s.signIn);
  const addToast = useAppStore((s) => s.addToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsTotp, setNeedsTotp] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState('');

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const profile = await signIn(email, password);
      if (profile.totp_enrolled_at) {
        setNeedsTotp(true);
      } else {
        addToast('success', 'Bienvenue sur votre espace !');
        navigate(from);
      }
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpError('');
    const profile = useAppStore.getState().profile;
    if (!profile?.totp_secret) {
      addToast('success', 'Bienvenue sur votre espace !');
      navigate(from);
      return;
    }
    if (!verifyTotpCode(profile.totp_secret, totpCode)) {
      setTotpError('Code 2FA invalide. Veuillez réessayer.');
      return;
    }
    addToast('success', 'Bienvenue sur votre espace !');
    navigate(from);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-4 text-slate-100 font-sans antialiased">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
        
        {/* En-tête */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-black tracking-tight">Portail EduCampus</h1>
          <p className="text-xs text-slate-400">Connectez-vous à votre espace étudiant centralisé</p>
        </div>

        {/* Carte Glassmorphism */}
        <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4">
          {!needsTotp ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">Adresse Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    className="w-full pl-9 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="votre.email@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    className="w-full pl-9 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{error}</p>}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleTotp} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                <h2 className="text-base font-bold text-slate-100">Vérification 2FA</h2>
              </div>
              <p className="text-xs text-slate-400">Entrez le code à 6 chiffres généré par votre application d'authentification.</p>
              
              <div>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-center font-mono text-lg font-bold tracking-widest text-indigo-300 focus:outline-none focus:border-indigo-500"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  required
                />
              </div>

              {totpError && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{totpError}</p>}

              <button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2">
                <KeyRound className="h-4 w-4" /> Valider & Accéder
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          Pas encore de compte ?{' '}
          <Link to="/enroll" className="font-bold text-indigo-400 hover:underline">Activer mon dossier étudiant</Link>
        </p>
      </motion.div>
    </div>
  );
}