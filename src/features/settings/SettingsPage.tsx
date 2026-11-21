import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LockKeyhole,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore } from '@/store/useAppStore';
import { authService } from '@/services';
import { generateTotpSecret, generateTotpUri, verifyTotpCode } from '@/lib/totp';
import { PageMeta } from '@/components/PageMeta';

type SettingsTab = 'profile' | 'security' | 'totp';

export function SettingsPage() {
  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const refreshProfile = useAppStore((s) => s.refreshProfile);
  const addToast = useAppStore((s) => s.addToast);

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [isMentorOptIn, setIsMentorOptIn] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [savingTotp, setSavingTotp] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || '');
    setHeadline(profile.headline || '');
    setBio(profile.bio || '');
    setWebsiteUrl(profile.website_url || '');
    setSkillsText((profile.skills ?? []).join(', '));
    setIsMentorOptIn(Boolean(profile.is_mentor_opt_in));
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const skills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await authService.updateProfile(user.id, {
        full_name: fullName.trim() || profile?.full_name,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        website_url: websiteUrl.trim() || null,
        skills,
        is_mentor_opt_in: isMentorOptIn,
      });
      await refreshProfile();
      addToast('success', 'Profil mis à jour sur Supabase.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erreur de mise à jour.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      addToast('error', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', 'Les mots de passe ne correspondent pas.');
      return;
    }
    setSavingPassword(true);
    try {
      await authService.updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      addToast('success', 'Mot de passe mis à jour avec succès.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Modification du mot de passe impossible.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleActivateTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !totpSecret) return;
    if (!verifyTotpCode(totpSecret, totpCode)) {
      addToast('error', 'Code 2FA invalide.');
      return;
    }
    setSavingTotp(true);
    try {
      await authService.enrollTotp(user.id, totpSecret);
      await refreshProfile();
      setTotpSecret('');
      setTotpCode('');
      addToast('success', 'Double facteur (2FA) activé.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Activation 2FA impossible.');
    } finally {
      setSavingTotp(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-8 antialiased">
      <PageMeta title="Comptes & Paramètres" description="Gestion de votre compte et sécurité EduCampus." />

      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 text-white">
        <span className="inline-block rounded border border-brand-700 bg-brand-950 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-brand-300">
          Comptes & Paramètres
        </span>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
          Gestion du profil & sécurité
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-xl">
          Les modifications sont enregistrées directement sur votre profil Supabase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 space-y-3">
          <div className="card-base p-2 space-y-1">
            {[
              { id: 'profile' as const, label: 'Profil & Parcours', icon: User },
              { id: 'security' as const, label: 'Mot de passe', icon: Lock },
              { id: 'totp' as const, label: 'Double facteur (2FA)', icon: KeyRound },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-brand-600 text-white'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="card-base p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-zinc-950 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Dossier Institutionnel</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Email : <span className="font-mono">{user?.email || '—'}</span>
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Matricule : <span className="font-mono font-bold">{profile?.matricule || 'Non rattaché'}</span>
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Établissement : <span>{profile?.school?.name || profile?.company_name || 'Campus Libre'}</span>
            </p>
          </div>
        </div>

        <div className="md:col-span-8">
          <div className="card-base p-6 sm:p-8">
            {activeTab === 'profile' && (
              <motion.form
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSaveProfile}
                className="space-y-5 text-xs"
              >
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                      Informations personnelles & académiques
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Les champs vérifiés par votre établissement restent verrouillés.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-[11px] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                    <span>{profile?.role || 'student_free'}</span>
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1.5">Nom complet</label>
                    <input
                      type="text"
                      className="input-base"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1.5 flex items-center justify-between">
                      <span>Matricule officiel</span>
                      <LockKeyhole className="w-3.5 h-3.5 text-zinc-400" />
                    </label>
                    <input
                      type="text"
                      disabled
                      value={profile?.matricule || 'Non attribué'}
                      className="input-base font-mono opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1.5 flex items-center justify-between">
                      <span>Filière</span>
                      <LockKeyhole className="w-3.5 h-3.5 text-zinc-400" />
                    </label>
                    <input
                      type="text"
                      disabled
                      value={profile?.filiere || 'Non renseignée'}
                      className="input-base opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1.5 flex items-center justify-between">
                      <span>Niveau</span>
                      <LockKeyhole className="w-3.5 h-3.5 text-zinc-400" />
                    </label>
                    <input
                      type="text"
                      disabled
                      value={profile?.niveau || 'Non renseigné'}
                      className="input-base opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1.5">Titre / Accroche profil</label>
                    <input
                      type="text"
                      className="input-base"
                      placeholder="Ex: Étudiant en génie logiciel / Développeur web"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1.5">Compétences (séparées par des virgules)</label>
                    <input
                      type="text"
                      className="input-base"
                      placeholder="TypeScript, Réseaux, UI Design"
                      value={skillsText}
                      onChange={(e) => setSkillsText(e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1.5">Site ou Portfolio (URL)</label>
                    <input
                      type="url"
                      className="input-base"
                      placeholder="https://..."
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1.5">Biographie</label>
                    <textarea
                      rows={3}
                      className="input-base"
                      placeholder="Présentez votre parcours ou vos objectifs…"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>

                  <label className="sm:col-span-2 flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 cursor-pointer">
                    <div>
                      <p className="font-semibold text-zinc-950 dark:text-white">Disponible comme mentor</p>
                      <p className="text-[11px] text-zinc-500">Apparaître dans les propositions de mentorat du campus.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isMentorOptIn}
                      onChange={(e) => setIsMentorOptIn(e.target.checked)}
                      className="h-4 w-4 accent-brand-600"
                    />
                  </label>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                  <button type="submit" className="btn-primary" disabled={savingProfile}>
                    <Save className="w-4 h-4" />
                    <span>{savingProfile ? 'Enregistrement…' : 'Enregistrer le profil'}</span>
                  </button>
                </div>
              </motion.form>
            )}

            {activeTab === 'security' && (
              <motion.form
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSavePassword}
                className="space-y-4 text-xs"
              >
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
                  <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                    Modifier le mot de passe
                  </h2>
                  <p className="text-xs text-zinc-500">
                    La mise à jour s’applique immédiatement à votre compte Supabase Auth.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold mb-1.5">Nouveau mot de passe (min. 8 caractères)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-base pr-10 normal-case"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500"
                      aria-label={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1.5">Confirmer le nouveau mot de passe</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-base normal-case"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                  <button type="submit" className="btn-primary" disabled={savingPassword}>
                    <Save className="w-4 h-4" />
                    <span>{savingPassword ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}</span>
                  </button>
                </div>
              </motion.form>
            )}

            {activeTab === 'totp' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 text-xs"
              >
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                      Authentification Double Facteur (TOTP)
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Protection supplémentaire lors de la connexion et des opérations sensibles.
                    </p>
                  </div>
                  <span className="rounded border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 font-semibold">
                    {profile?.totp_enrolled_at ? 'Activée' : 'Non activée'}
                  </span>
                </div>

                {!totpSecret ? (
                  <button
                    type="button"
                    onClick={() => setTotpSecret(generateTotpSecret())}
                    className="btn-primary"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{profile?.totp_enrolled_at ? 'Renouveler la clé 2FA' : 'Générer une clé 2FA'}</span>
                  </button>
                ) : (
                  <form onSubmit={handleActivateTotp} className="space-y-4">
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
                      <QRCodeSVG
                        value={generateTotpUri(totpSecret, user?.email || 'educampus')}
                        size={150}
                        bgColor="#ffffff"
                        fgColor="#09090b"
                      />
                      <code className="rounded bg-zinc-200 dark:bg-zinc-800 px-3 py-1 font-mono text-xs font-bold break-all">
                        {totpSecret}
                      </code>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1.5">Code à 6 chiffres</label>
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
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setTotpSecret('')} className="btn-secondary">
                        Annuler
                      </button>
                      <button type="submit" className="btn-primary" disabled={savingTotp}>
                        {savingTotp ? 'Activation…' : 'Activer la 2FA'}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}