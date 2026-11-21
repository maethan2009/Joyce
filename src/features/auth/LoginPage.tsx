import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { getDefaultRouteForRole, useAppStore } from '@/store/useAppStore';
import { isValidBase32Secret, verifyTotpCode } from '@/lib/totp';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppStore((s) => s.user);
  const existingProfile = useAppStore((s) => s.profile);
  const signIn = useAppStore((s) => s.signIn);
  const addToast = useAppStore((s) => s.addToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsTotp, setNeedsTotp] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState('');
  const [pendingTarget, setPendingTarget] = useState('/dashboard');

  const requestedFrom = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  useEffect(() => {
    if (user && !needsTotp) {
      const target = requestedFrom || getDefaultRouteForRole(existingProfile?.role);
      navigate(target, { replace: true });
    }
  }, [user, existingProfile?.role, needsTotp, navigate, requestedFrom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const profile = await signIn(email, password);
      const target = requestedFrom || getDefaultRouteForRole(profile.role);

      if (profile.totp_enrolled_at && isValidBase32Secret(profile.totp_secret)) {
        setPendingTarget(target);
        setNeedsTotp(true);
      } else {
        addToast('success', 'Connexion réussie. Bienvenue sur EduCampus.');
        navigate(target, { replace: true });
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Impossible de vous connecter. Vérifiez vos identifiants.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpError('');
    const profile = useAppStore.getState().profile;
    if (!profile?.totp_secret || !isValidBase32Secret(profile.totp_secret)) {
      addToast('success', 'Connexion réussie. Bienvenue sur EduCampus.');
      navigate(pendingTarget, { replace: true });
      return;
    }
    if (!verifyTotpCode(profile.totp_secret, totpCode)) {
      setTotpError('Code 2FA invalide. Veuillez vérifier votre application.');
      return;
    }
    addToast('success', 'Vérification validée. Bienvenue sur EduCampus.');
    navigate(pendingTarget, { replace: true });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row">
      {/* Panneau éditorial gauche Bordeaux / Noir */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-brand-600 p-12 text-white border-r border-brand-700">
        <Link to="/" className="inline-flex items-center gap-3 w-fit">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-display text-xl font-extrabold tracking-tight">EduCampus</span>
            <p className="text-[11px] uppercase tracking-widest text-brand-100">Portail Unifié</p>
          </div>
        </Link>

        <div className="space-y-6 max-w-md">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-100">
            Authentification Directe & Sécurisée
          </p>
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight">
            Accédez à vos 4 espaces universitaires et professionnels.
          </h2>
          <p className="text-sm text-brand-100 leading-relaxed">
            Espace académique, orientation & bourses, réseau EduAmis et portail partenaires réunis dans une session unique chiffrée.
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-brand-100 border-t border-brand-500/50 pt-6">
          <span>Infrastructure Supabase Auth</span>
          <Link to="/legal" className="underline underline-offset-4 hover:text-white">
            Confidentialité & CGU
          </Link>
        </div>
      </div>

      {/* Panneau droit : Formulaire Email + Mot de passe */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md space-y-6"
        >
          <div className="lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight">EduCampus</span>
          </div>

          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Connexion au portail</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Entrez votre adresse email et votre mot de passe tels qu’enregistrés.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-card space-y-5">
            {!needsTotp ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      className="input-base pl-9 normal-case"
                      placeholder="nom@etablissement.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="input-base pl-9 pr-10 normal-case"
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full py-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Connexion en cours…</span>
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
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  <h2 className="text-base font-bold">Vérification 2FA</h2>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Saisissez le code à 6 chiffres généré par votre application d’authentification.
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="input-base text-center font-mono text-lg font-bold tracking-widest"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  required
                />

                {totpError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300"
                  >
                    {totpError}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-3">
                  <KeyRound className="h-4 w-4" />
                  <span>Valider et accéder</span>
                </button>
              </form>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <Link to="/" className="hover:text-zinc-950 dark:hover:text-white underline-offset-4 hover:underline">
              Retour à l’accueil
            </Link>
            <span>
              Pas encore de compte ?{' '}
              <Link to="/enroll" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
                Créer un accès
              </Link>
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}