import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, ShieldCheck, KeyRound, Mail, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { authService } from '@/services';
import { generateTotpSecret, generateTotpUri, verifyTotpCode } from '@/lib/totp';
import { QRCodeSVG } from 'qrcode.react';

// Formulaire : L'étudiant n'entre QUE son matricule et son email
const eligibilitySchema = z.object({
  matricule: z.string().min(3, 'Un matricule valide est requis'),
  email: z.string().email('Saisissez une adresse email valide'),
});
type EligibilityForm = z.infer<typeof eligibilitySchema>;

const passwordSchema = z.object({
  password: z
    .string()
    .min(12, 'Au moins 12 caractères')
    .regex(/[A-Z]/, 'Doit inclure une majuscule')
    .regex(/[a-z]/, 'Doit inclure une minuscule')
    .regex(/[0-9]/, 'Doit inclure un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Doit inclure un symbole'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Les mots de passe ne correspondent pas', path: ['confirm'] });
type PasswordForm = z.infer<typeof passwordSchema>;

const totpSchema = z.object({ code: z.string().length(6, 'Entrez le code à 6 chiffres') });
type TotpForm = z.infer<typeof totpSchema>;

const steps = ['Vérification Matricule', 'Mot de Passe', 'Sécurité 2FA'] as const;

export function EnrollPage() {
  const navigate = useNavigate();
  const addToast = useAppStore((s) => s.addToast);
  const enrollAndActivate = useAppStore((s) => s.enrollAndActivate);
  const refreshProfile = useAppStore((s) => s.refreshProfile);

  const [step, setStep] = useState(0);
  const [matricule, setMatricule] = useState('');
  const [email, setEmail] = useState('');
  const [studentInfo, setStudentInfo] = useState<{ fullName: string; className: string } | null>(null);
  const [totpSecret, setTotpSecret] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const eligibilityForm = useForm<EligibilityForm>({ resolver: zodResolver(eligibilitySchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const totpForm = useForm<TotpForm>({ resolver: zodResolver(totpSchema) });

  // Recherche automatique dans le registre
  const onEligibility = async (data: EligibilityForm) => {
    setError('');
    setVerifying(true);
    try {
      // 1. Vérification d'éligibilité via le service
      const isOk = await authService.verifyEligibility(data.matricule, data.email);
      
      if (!isOk) {
        setError('Matricule non reconnu dans le registre académique ou combinaison invalide.');
        return;
      }

      setMatricule(data.matricule);
      setEmail(data.email);

      // 2. Récupération dynamique du nom et de la classe depuis le registre mock
      const mockModule = await import('@/services/mockData');
      const foundStudent = mockModule.mockData.eligible.find((e) => e.matricule === data.matricule);

      setStudentInfo({
        fullName: foundStudent?.full_name || 'Étudiant Registre',
        className: (foundStudent as any)?.class_name || (foundStudent as any)?.filiere || 'Génie Logiciel (GL)'
      });

      setStep(1);
    } catch {
      setError('Erreur lors de la vérification du matricule. Veuillez réessayer.');
    } finally {
      setVerifying(false);
    }
  };

  const onPassword = async (data: PasswordForm) => {
    setError('');
    setVerifying(true);
    try {
      if (!studentInfo) return;
      
      await enrollAndActivate(email, data.password, matricule, studentInfo.fullName);
      setStep(2);
    } catch {
      setError('Erreur lors de la création de vos accès. Veuillez réessayer.');
    } finally {
      setVerifying(false);
    }
  };

  const onTotpEnroll = () => {
    setTotpSecret(generateTotpSecret());
  };

  const onTotpVerify = async (data: TotpForm) => {
    setError('');
    setVerifying(true);
    try {
      if (!totpSecret) {
        setError('Veuillez générer votre clé 2FA.');
        return;
      }
      if (!verifyTotpCode(totpSecret, data.code)) {
        setError('Le code 2FA est incorrect.');
        return;
      }
      const user = useAppStore.getState().user;
      if (user) await authService.enrollTotp(user.id, totpSecret);
      await refreshProfile();
      addToast('success', 'Activation réussie ! Votre profil a été configuré automatiquement.');
      navigate('/dashboard');
    } catch {
      setError('Échec de la validation 2FA.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-4 text-slate-100 font-sans antialiased">
      <div className="w-full max-w-md space-y-6">
        
        {/* En-tête */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-black tracking-tight">Activation EduCampus</h1>
          <p className="text-xs text-slate-400">Enrôlement automatique basé sur le registre officiel</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-500'
              }`}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 w-8 ${i < step ? 'bg-emerald-500' : 'bg-slate-800'}`} />}
            </div>
          ))}
        </div>

        {/* Carte Principale Glassmorphism */}
        <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4">
          <AnimatePresence mode="wait">
            
            {/* Étape 0 : Matricule & Email */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-slate-100">Vérification d’Éligibilité</h2>
                </div>
                <p className="mb-4 text-xs text-slate-400 leading-relaxed">
                  Entrez votre matricule. Le système récupérera automatiquement vos informations académiques.
                </p>

                <form onSubmit={eligibilityForm.handleSubmit(onEligibility)} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">Matricule Officiel</label>
                    <input 
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500 transition-colors uppercase" 
                      placeholder="ex: M2024001" 
                      {...eligibilityForm.register('matricule')} 
                    />
                    {eligibilityForm.formState.errors.matricule && (
                      <p className="mt-1 text-[11px] text-red-400">{eligibilityForm.formState.errors.matricule.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">Votre Adresse Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input 
                        type="email" 
                        className="w-full pl-9 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors" 
                        placeholder="votre.email@exemple.com" 
                        {...eligibilityForm.register('email')} 
                      />
                    </div>
                    {eligibilityForm.formState.errors.email && (
                      <p className="mt-1 text-[11px] text-red-400">{eligibilityForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{error}</p>}

                  <button type="submit" className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2" disabled={verifying}>
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Recherche dans le registre...</span>
                      </>
                    ) : (
                      <>
                        <span>Rechercher mon Dossier</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Étape 1 : Auto-Déploiement du Profil & Mot de passe */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-slate-100">Dossier Identifié !</h2>
                </div>
                
                <div className="mb-4 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-indigo-400">Étudiant Identifié</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/30">
                      {studentInfo?.className}
                    </span>
                  </div>
                  <p className="font-bold text-slate-100 text-sm">{studentInfo?.fullName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">Matricule : {matricule}</p>
                </div>

                <form onSubmit={passwordForm.handleSubmit(onPassword)} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">Définir un Mot de passe</label>
                    <input type="password" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500" placeholder="••••••••••••" {...passwordForm.register('password')} />
                    {passwordForm.formState.errors.password && <p className="mt-1 text-[11px] text-red-400">{passwordForm.formState.errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">Confirmer le mot de passe</label>
                    <input type="password" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500" placeholder="••••••••••••" {...passwordForm.register('confirm')} />
                    {passwordForm.formState.errors.confirm && <p className="mt-1 text-[11px] text-red-400">{passwordForm.formState.errors.confirm.message}</p>}
                  </div>

                  {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{error}</p>}

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStep(0)} className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all flex items-center justify-center gap-1">
                      <ArrowLeft className="h-4 w-4" /> Annuler
                    </button>
                    <button type="submit" className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all" disabled={verifying}>
                      {verifying ? 'Création...' : 'Valider & Continuer'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Étape 2 : Configuration 2FA */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-4 flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-slate-100">Sécurisation Double Facteur (TOTP)</h2>
                </div>

                {!totpSecret ? (
                  <button onClick={onTotpEnroll} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all">
                    Générer la clé d'authentification 2FA
                  </button>
                ) : (
                  <form onSubmit={totpForm.handleSubmit(onTotpVerify)} className="space-y-4">
                    <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/40 border border-white/10 p-4">
                      <QRCodeSVG value={generateTotpUri(totpSecret, email)} size={150} bgColor="#000000" fgColor="#ffffff" />
                      <div className="text-center">
                        <p className="text-[11px] text-slate-400">Scannez avec Google Authenticator ou saisissez la clé :</p>
                        <code className="mt-1 block rounded-lg bg-indigo-500/20 px-3 py-1 font-mono text-xs font-bold text-indigo-300 border border-indigo-500/30 break-all">{totpSecret}</code>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300 text-center">Code à 6 chiffres</label>
                      <input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-center font-mono text-lg font-bold tracking-widest text-indigo-300 focus:outline-none focus:border-indigo-500" maxLength={6} placeholder="000000" {...totpForm.register('code')} />
                    </div>

                    {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{error}</p>}

                    <button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all" disabled={verifying}>
                      {verifying ? 'Validation...' : 'Terminer & Ouvrir mon Portail'}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-slate-400">
          Vous avez déjà un compte activé ?{' '}
          <Link to="/login" className="font-bold text-indigo-400 hover:underline">Se connecter avec mon Email</Link>
        </p>
      </div>
    </div>
  );
}