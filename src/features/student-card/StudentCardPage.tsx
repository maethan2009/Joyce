import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, RotateCw, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore } from '@/store/useAppStore';
import { useDynamicTotp } from '@/lib/totp';
import { PageMeta } from '@/components/PageMeta';
import { EmptyState } from '@/components/EmptyState';

export function StudentCardPage() {
  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const addToast = useAppStore((s) => s.addToast);

  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const matricule = profile?.matricule || '';
  const totpSecret = profile?.totp_secret && /^[A-Z2-7]+=*$/.test(profile.totp_secret)
    ? profile.totp_secret
    : 'JBSWY3DPEHPK3PXP';

  const { secondsRemaining, currentCode, payload } = useDynamicTotp(
    totpSecret,
    matricule || user?.id || 'EDUCAMPUS',
  );

  const handleCopy = () => {
    if (!matricule) return;
    void navigator.clipboard.writeText(matricule);
    setCopied(true);
    addToast('info', 'Matricule copié dans le presse-papier.');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          title="Profil étudiant introuvable"
          description="Connectez-vous avec un compte étudiant vérifié pour afficher votre carte."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-8 antialiased">
      <PageMeta title="Carte Étudiante Numérique" description="Badge officiel QR dynamique EduCampus." />

      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Pilier 1 · Identité Campus
          </span>
          <h1 className="font-display text-2xl font-extrabold text-zinc-950 dark:text-white mt-0.5">
            Carte d’Étudiant Numérique
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Badge d’identification dynamique renouvelé toutes les 30 secondes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFlipped((prev) => !prev)}
          className="btn-secondary self-start sm:self-auto"
        >
          <RotateCw className="h-4 w-4" />
          <span>{isFlipped ? 'Voir le recto' : 'Voir le QR code'}</span>
        </button>
      </div>

      {/* Carte recto-verso Bordeaux / Noir / Blanc */}
      <div className="flex flex-col items-center justify-center py-2">
        <div
          className="w-full max-w-[420px] h-[265px] cursor-pointer"
          onClick={() => setIsFlipped((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setIsFlipped((prev) => !prev);
          }}
          aria-label="Retourner la carte étudiante"
        >
          <motion.div
            className="relative w-full h-full"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Recto */}
            {!isFlipped ? (
              <div className="absolute inset-0 w-full h-full rounded-2xl p-6 bg-zinc-950 text-white border border-zinc-800 shadow-cabinet flex flex-col justify-between">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    {profile.school?.logo_url ? (
                      <img
                        src={profile.school.logo_url}
                        alt={profile.school.name}
                        className="h-8 w-8 rounded object-contain bg-white p-0.5"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-600 font-display font-bold text-sm">
                        E
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-bold tracking-widest uppercase">
                        {profile.school?.name || 'EduCampus'}
                      </p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                        Carte Officielle
                      </p>
                    </div>
                  </div>
                  <span className="rounded border border-brand-700 bg-brand-950 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-300">
                    {profile.account_status === 'approved' ? 'Vérifiée' : profile.account_status}
                  </span>
                </div>

                <div className="flex items-center gap-4 my-auto">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="h-18 w-18 rounded-xl object-cover border border-zinc-700"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-brand-600 flex items-center justify-center text-2xl font-display font-extrabold text-white shrink-0">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="font-display text-base font-bold text-white truncate">
                      {profile.full_name}
                    </h2>
                    <p className="text-xs text-zinc-300 truncate">
                      {profile.filiere || 'Parcours académique'}
                    </p>
                    <p className="text-xs text-zinc-400">{profile.niveau || 'Étudiant'}</p>
                    {matricule && (
                      <p className="font-mono text-xs font-bold text-brand-400 pt-0.5">
                        {matricule}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-zinc-800 pt-2.5 text-[11px] text-zinc-400">
                  <span>Jeton dynamique actif</span>
                  <span className="flex items-center gap-1 text-white font-semibold">
                    <RotateCw className="h-3 w-3" /> Afficher le QR
                  </span>
                </div>
              </div>
            ) : (
              /* Verso QR Code */
              <div
                className="absolute inset-0 w-full h-full rounded-2xl p-6 bg-white text-zinc-950 border border-zinc-200 shadow-cabinet flex flex-col justify-between"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">Contrôle QR Dynamique</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-brand-600 tabular-nums">
                    {secondsRemaining}s
                  </span>
                </div>

                <div className="flex items-center gap-5 my-auto">
                  <div className="p-2 rounded-xl border border-zinc-200 bg-white shrink-0">
                    <QRCodeSVG value={payload} size={112} bgColor="#ffffff" fgColor="#09090b" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <p className="text-[11px] font-bold uppercase text-zinc-500">Code de contrôle</p>
                    <p className="font-mono text-lg font-extrabold tracking-widest text-zinc-950 tabular-nums">
                      {currentCode}
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-snug">
                      Présentez ce QR code aux bornes d’examen ou d’accès campus.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-zinc-200 pt-2.5 text-[11px] text-zinc-500">
                  <span>{user?.email}</span>
                  <span className="flex items-center gap-1 font-semibold text-brand-600">
                    <RotateCw className="h-3 w-3" /> Recto
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Infos & Copie Matricule */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-xl mx-auto">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!matricule}
          className="card-base p-4 flex items-center justify-between hover:border-brand-600 transition-colors text-left disabled:opacity-50"
        >
          <div>
            <p className="text-[11px] text-zinc-500">Matricule officiel</p>
            <p className="font-mono text-sm font-bold">{matricule || 'Non attribué'}</p>
          </div>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-zinc-400" />}
        </button>

        <div className="card-base p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-500">Renouvellement QR</p>
            <p className="font-mono text-sm font-bold tabular-nums">{secondsRemaining} secondes</p>
          </div>
          <ShieldCheck className="h-4 w-4 text-brand-600" />
        </div>
      </div>
    </div>
  );
}