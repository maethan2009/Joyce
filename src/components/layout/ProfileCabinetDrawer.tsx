import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Briefcase,
  Building2,
  Compass,
  GraduationCap,
  IdCard,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  Shield,
  Sun,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { canAccessStudentCard } from '@/types';
import type { UserRole } from '@/types';

interface ProfileCabinetDrawerProps {
  open: boolean;
  onClose: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Administrateur',
  school_admin: 'Administration École',
  pro_recruiter: 'Partenaire Pro & Recruteur',
  student_verified: 'Étudiant Vérifié',
  student_free: 'Étudiant Libre',
  student: 'Étudiant',
  candidate: 'Candidat',
  election_admin: 'Admin Scrutins',
  campus_admin: 'Admin Campus',
};

const cabinetEase = [0.22, 1, 0.36, 1] as const;

export function ProfileCabinetDrawer({ open, onClose }: ProfileCabinetDrawerProps) {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const signOut = useAppStore((s) => s.signOut);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const roleLabel = profile?.role ? ROLE_LABELS[profile.role] ?? profile.role : 'Membre EduCampus';
  const initials =
    profile?.full_name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U';

  const handleNavigate = (to: string) => {
    onClose();
    navigate(to);
  };

  const handleSignOut = async () => {
    onClose();
    await signOut();
    navigate('/login');
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Voile d'arrière-plan */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/65 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Panneau armoire articulé (charnière droite) */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Armoire Comptes et Paramètres"
            initial={{
              opacity: 0,
              x: 44,
              rotateY: 16,
              transformPerspective: 1200,
              transformOrigin: 'right center',
            }}
            animate={{
              opacity: 1,
              x: 0,
              rotateY: 0,
              transformPerspective: 1200,
              transformOrigin: 'right center',
            }}
            exit={{
              opacity: 0,
              x: 44,
              rotateY: 16,
              transformPerspective: 1200,
              transformOrigin: 'right center',
            }}
            transition={{ duration: 0.28, ease: cabinetEase }}
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-cabinet"
          >
            {/* Barre mécanique supérieure bordeaux */}
            <div className="h-1.5 w-full bg-brand-600 shrink-0" />

            {/* En-tête identité */}
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
              <div className="flex items-center gap-3.5 min-w-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="h-14 w-14 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-lg font-display font-extrabold text-white border border-brand-700">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-zinc-950 dark:text-zinc-50 truncate">
                    {profile?.full_name || user?.email || 'Compte EduCampus'}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user?.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 rounded border border-brand-200 dark:border-brand-900 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:text-brand-300">
                    <span>{roleLabel}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 transition-colors"
                aria-label="Fermer le panneau compte"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Compartiments articulés */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Compartiment 1 : Fiche Dossier */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.22, ease: cabinetEase }}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Dossier Actif
                  </span>
                  {profile?.matricule && (
                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                      {profile.matricule}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Établissement</p>
                    <p className="font-semibold text-zinc-950 dark:text-zinc-100 truncate">
                      {profile?.school?.name || profile?.company_name || 'Campus Libre'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Statut</p>
                    <p className="font-semibold text-zinc-950 dark:text-zinc-100 capitalize">
                      {profile?.account_status === 'pending'
                        ? 'En attente de validation'
                        : profile?.account_status === 'rejected'
                          ? 'Refusé'
                          : 'Actif'}
                    </p>
                  </div>
                  {(profile?.filiere || profile?.niveau) && (
                    <div className="col-span-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                      <p className="text-zinc-500 dark:text-zinc-400">Parcours</p>
                      <p className="font-semibold text-zinc-950 dark:text-zinc-100">
                        {[profile.filiere, profile.niveau].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  )}
                </div>
              </motion.section>

              {/* Compartiment 2 : Comptes & Paramètres */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.09, duration: 0.22, ease: cabinetEase }}
                className="space-y-2"
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 px-1">
                  Comptes & Paramètres
                </p>

                <button
                  type="button"
                  onClick={() => handleNavigate('/settings')}
                  className="w-full flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-left hover:border-brand-600 dark:hover:border-brand-500 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                        Accounts & Settings
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Profil, mot de passe, sécurité 2FA
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-brand-600 transition-colors" />
                </button>

                {canAccessStudentCard(profile?.role) && (
                  <button
                    type="button"
                    onClick={() => handleNavigate('/student-card')}
                    className="w-full flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-left hover:border-brand-600 dark:hover:border-brand-500 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-800 text-white">
                        <IdCard className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                          Carte Étudiante Numérique
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          QR dynamique sécurisé
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-brand-600 transition-colors" />
                  </button>
                )}
              </motion.section>

              {/* Compartiment 3 : Accès aux 4 Piliers */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.13, duration: 0.22, ease: cabinetEase }}
                className="space-y-2"
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 px-1">
                  Les 4 Piliers EduCampus
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <Link
                    to="/dashboard"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <GraduationCap className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <span>1. Espace Académique & Campus</span>
                  </Link>
                  <Link
                    to="/orientation"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <Compass className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <span>2. Orientation & Avenir</span>
                  </Link>
                  <Link
                    to="/eduamis"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <MessageSquare className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <span>3. EduAmis & Messagerie</span>
                  </Link>
                  {profile?.role === 'pro_recruiter' && (
                    <Link
                      to="/pro"
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <Briefcase className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      <span>4. Portail Pro & Recrutement</span>
                    </Link>
                  )}
                  {profile?.role === 'school_admin' && (
                    <Link
                      to="/school"
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      <span>4. Administration Établissement</span>
                    </Link>
                  )}
                  {profile?.role === 'super_admin' && (
                    <Link
                      to="/admin"
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <Shield className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      <span>4. Super Administration</span>
                    </Link>
                  )}
                </div>
              </motion.section>

              {/* Compartiment 4 : Préférence visuelle */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.22, ease: cabinetEase }}
                className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {theme === 'light' ? (
                    <Sun className="h-4 w-4 text-zinc-700" />
                  ) : (
                    <Moon className="h-4 w-4 text-zinc-300" />
                  )}
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Mode {theme === 'light' ? 'Clair' : 'Sombre'}
                  </span>
                </div>
                <button type="button" onClick={toggleTheme} className="btn-secondary py-1.5 px-3 text-xs">
                  Basculer
                </button>
              </motion.section>
            </div>

            {/* Pied du tiroir armoire */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full btn-danger justify-center py-2.5"
              >
                <LogOut className="h-4 w-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
