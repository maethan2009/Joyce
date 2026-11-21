import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getDefaultRouteForRole, useAppStore } from '@/store/useAppStore';
import { authService } from '@/services';
import { generateTotpSecret, generateTotpUri, verifyTotpCode } from '@/lib/totp';

type EnrollMode = 'verified' | 'free' | 'school_admin' | 'pro_recruiter';

export function EnrollPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMatricule = searchParams.get('matricule') ?? '';

  const addToast = useAppStore((s) => s.addToast);
  const enrollAndActivate = useAppStore((s) => s.enrollAndActivate);
  const signUpFree = useAppStore((s) => s.signUpFree);
  const signUpRole = useAppStore((s) => s.signUpRole);
  const refreshProfile = useAppStore((s) => s.refreshProfile);

  const [mode, setMode] = useState<EnrollMode>('verified');
  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Shared fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [matricule, setMatricule] = useState(initialMatricule);
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // TOTP step 2 (verified)
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetFeedback = () => {
    setError('');
    setLoading(false);
  };

  const handleModeChange = (nextMode: EnrollMode) => {
    setMode(nextMode);
    setStep(0);
    setError('');
  };

  const handleVerifyEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const eligible = await authService.verifyEligibility(matricule, email);
      if (!eligible) {
        setError('Matricule introuvable, déjà activé ou email non correspondant.');
        return;
      }
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vérification impossible.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifiedActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await enrollAndActivate(email, password, matricule, fullName.trim() || email.split('@')[0]);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation impossible.');
    } finally {
      setLoading(false);
    }
  };

  const handleTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!totpSecret || !verifyTotpCode(totpSecret, totpCode)) {
      setError('Le code 2FA saisi est invalide.');
      return;
    }
    setLoading(true);
    try {
      const user = useAppStore.getState().user;
      if (user) {
        await authService.enrollTotp(user.id, totpSecret);
      }
      await refreshProfile();
      addToast('success', 'Compte vérifié activé avec 2FA.');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement 2FA impossible.');
    } finally {
      setLoading(false);
    }
  };

  const handleStandardSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'free') {
        const profile = await signUpFree(email, password, fullName.trim());
        addToast('success', 'Compte étudiant créé avec succès.');
        navigate(getDefaultRouteForRole(profile.role));
      } else if (mode === 'school_admin' || mode === 'pro_recruiter') {
        const profile = await signUpRole(email, password, fullName.trim(), mode, companyName.trim() || undefined);
        addToast(
          'info',
          'Compte créé. Si votre organisation requiert une validation, un administrateur validera votre accès.',
        );
        navigate(getDefaultRouteForRole(profile.role));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création de compte impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-lg font-extrabold tracking-tight">EduCampus</span>
              <p className="text-[11px] text-zinc-500">Enrôlement & Création d’accès</p>
            </div>
          </Link>
          <Link to="/login" className="btn-secondary text-xs">
            Déjà inscrit ? Connexion
          </Link>
        </div>

        {/* Sélecteur de type de compte */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleModeChange('verified')}
            className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
              mode === 'verified'
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400'
            }`}
          >
            <ShieldCheck className="h-4 w-4 mb-1" />
            <p className="text-xs font-bold">Étudiant Vérifié</p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('free')}
            className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
              mode === 'free'
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400'
            }`}
          >
            <UserPlus className="h-4 w-4 mb-1" />
            <p className="text-xs font-bold">Étudiant Libre</p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('school_admin')}
            className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
              mode === 'school_admin'
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400'
            }`}
          >
            <Building2 className="h-4 w-4 mb-1" />
            <p className="text-xs font-bold">Établissement</p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('pro_recruiter')}
            className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
              mode === 'pro_recruiter'
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400'
            }`}
          >
            <Briefcase className="h-4 w-4 mb-1" />
            <p className="text-xs font-bold">Partenaire Pro</p>
          </button>
        </div>

        {/* Formulaire */}
        <div className="card-base p-6 sm:p-8 space-y-5">
          {mode === 'verified' ? (
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.form
                  key="verified-step0"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleVerifyEligibility}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <h1 className="font-display text-lg font-bold">1. Vérification d’éligibilité</h1>
                    <span className="font-mono text-xs text-zinc-500">Étape 1 / 3</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Saisissez le matricule et l’adresse email enregistrés par votre établissement.
                  </p>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold">Matricule officiel</label>
                    <input
                      type="text"
                      className="input-base font-mono normal-case"
                      placeholder="Ex: 26IAI001"
                      value={matricule}
                      onChange={(e) => {
                        setMatricule(e.target.value);
                        resetFeedback();
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold">Email officiel</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <input
                        type="email"
                        className="input-base pl-9 normal-case"
                        placeholder="prenom.nom@ecole.org"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          resetFeedback();
                        }}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  )}

                  <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Vérification…</span>
                      </>
                    ) : (
                      <>
                        <span>Vérifier mon dossier</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}

              {step === 1 && (
                <motion.form
                  key="verified-step1"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleVerifiedActivate}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <h1 className="font-display text-lg font-bold">2. Activation & Mot de passe</h1>
                    <span className="font-mono text-xs text-zinc-500">Étape 2 / 3</span>
                  </div>

                  <div className="rounded-lg border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 p-3 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Matricule {matricule} confirmé éligible.</span>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold">Nom complet</label>
                    <input
                      type="text"
                      className="input-base normal-case"
                      placeholder="Votre nom complet"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold">Mot de passe (min. 8 caractères)</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input-base pr-10 normal-case"
                        placeholder="Choisissez votre mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500"
                        aria-label={showPassword ? 'Masquer' : 'Afficher'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold">Confirmer le mot de passe</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-base normal-case"
                      placeholder="Confirmez le mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStep(0)} className="btn-secondary">
                      <ArrowLeft className="h-4 w-4" />
                      <span>Retour</span>
                    </button>
                    <button type="submit" className="btn-primary flex-1" disabled={loading}>
                      {loading ? 'Activation…' : 'Activer mon compte'}
                    </button>
                  </div>
                </motion.form>
              )}

              {step === 2 && (
                <motion.div
                  key="verified-step2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <h1 className="font-display text-lg font-bold">3. Double facteur (Optionnel)</h1>
                    <span className="font-mono text-xs text-zinc-500">Étape 3 / 3</span>
                  </div>

                  {!totpSecret ? (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Activez l’authentification TOTP pour sécuriser vos votes et votre carte étudiante, ou passez directement au tableau de bord.
                      </p>
                      <button
                        type="button"
                        onClick={() => setTotpSecret(generateTotpSecret())}
                        className="btn-primary w-full"
                      >
                        <KeyRound className="h-4 w-4" />
                        <span>Configurer l’authentificateur 2FA</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="btn-secondary w-full"
                      >
                        Accéder directement au tableau de bord
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleTotpVerify} className="space-y-4">
                      <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
                        <QRCodeSVG
                          value={generateTotpUri(totpSecret, email)}
                          size={150}
                          bgColor="#ffffff"
                          fgColor="#09090b"
                        />
                        <code className="rounded bg-zinc-200 dark:bg-zinc-800 px-3 py-1 font-mono text-xs font-bold break-all">
                          {totpSecret}
                        </code>
                      </div>

                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="input-base text-center font-mono text-lg font-bold tracking-widest"
                        placeholder="000000"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value)}
                        required
                      />

                      {error && (
                        <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
                          {error}
                        </div>
                      )}

                      <button type="submit" className="btn-primary w-full" disabled={loading}>
                        {loading ? 'Validation…' : 'Valider la 2FA et accéder'}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <form onSubmit={handleStandardSignUp} className="space-y-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h1 className="font-display text-lg font-bold">
                  {mode === 'free'
                    ? 'Inscription Étudiant Libre'
                    : mode === 'school_admin'
                      ? 'Demande d’accès Établissement'
                      : 'Inscription Partenaire Pro & Recruteur'}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {mode === 'free'
                    ? 'Accès immédiat à Orientation & Avenir, EduAmis et Messagerie.'
                    : 'Votre compte sera rattaché à votre organisation après vérification.'}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold">Nom complet</label>
                <input
                  type="text"
                  className="input-base normal-case"
                  placeholder="Prénom et Nom"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {(mode === 'school_admin' || mode === 'pro_recruiter') && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">
                    {mode === 'school_admin' ? 'Nom de l’établissement' : 'Nom de l’entreprise'}
                  </label>
                  <input
                    type="text"
                    className="input-base normal-case"
                    placeholder={mode === 'school_admin' ? 'Ex: Institut Supérieur...' : 'Ex: Tech Solutions'}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold">Adresse email</label>
                <input
                  type="email"
                  className="input-base normal-case"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold">Mot de passe (min. 8 caractères)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-base pr-10 normal-case"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500"
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold">Confirmer le mot de passe</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-base normal-case"
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Création en cours…</span>
                  </>
                ) : (
                  <>
                    <span>Créer mon compte</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}