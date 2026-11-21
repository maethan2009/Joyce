import { type ReactNode, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Compass,
  Home,
  IdCard,
  Layers,
  Menu,
  MessageSquare,
  Moon,
  Settings,
  Shield,
  Sun,
  Users,
  Vote,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { SiteFooter } from '@/components/SiteFooter';
import { ProfileCabinetDrawer } from './ProfileCabinetDrawer';
import { canAccessAcademicHub, canAccessStudentCard } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  visible?: boolean;
}

interface PillarGroup {
  title: string;
  items: NavItem[];
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cabinetOpen, setCabinetOpen] = useState(false);

  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isConfigured = useAppStore((s) => s.isConfigured);
  const profile = useAppStore((s) => s.profile);
  const user = useAppStore((s) => s.user);
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/enroll';
  if (isAuthPage) return <>{children}</>;

  const role = profile?.role;
  const userInitial =
    profile?.full_name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('') || 'U';
  const userSubtitle = profile?.filiere || profile?.company_name || (role ? role.replace('_', ' ') : 'Membre');

  const pillarGroups: PillarGroup[] = [
    {
      title: '1. Académique & Campus',
      items: [
        { to: '/dashboard', label: 'Tableau de bord', icon: Home, visible: true },
        { to: '/hub', label: 'Espace Académique', icon: BookOpen, visible: canAccessAcademicHub(role) },
        { to: '/student-card', label: 'Carte Étudiante', icon: IdCard, visible: canAccessStudentCard(role) },
        { to: '/events', label: 'Événements', icon: Calendar, visible: true },
        { to: '/elections', label: 'Élections', icon: Vote, visible: canAccessAcademicHub(role) },
        { to: '/mentorship', label: 'Mentorat', icon: Users, visible: true },
      ],
    },
    {
      title: '2. Orientation & Avenir',
      items: [{ to: '/orientation', label: 'Écoles, Bourses & Métiers', icon: Compass, visible: true }],
    },
    {
      title: '3. EduAmis & Messagerie',
      items: [
        { to: '/eduamis', label: 'EduAmis', icon: Users, visible: true },
        { to: '/skilllink', label: 'SkillLink', icon: Layers, visible: true },
        { to: '/messaging', label: 'Messagerie Directe', icon: MessageSquare, visible: true },
      ],
    },
    {
      title: '4. Portail Pro & Admin',
      items: [
        {
          to: '/pro',
          label: 'Portail Pro & Cours',
          icon: Briefcase,
          visible: role === 'pro_recruiter' || role === 'super_admin',
        },
        {
          to: '/school',
          label: 'Portail Établissement',
          icon: Building2,
          visible: role === 'school_admin' || role === 'super_admin',
        },
        {
          to: '/admin',
          label: 'Super Administration',
          icon: Shield,
          visible: role === 'super_admin',
        },
      ],
    },
  ];

  const mobileTabs: NavItem[] = [
    { to: '/dashboard', label: 'Accueil', icon: Home },
    { to: '/orientation', label: 'Orientation', icon: Compass },
    { to: '/eduamis', label: 'EduAmis', icon: Users },
    { to: '/messaging', label: 'Messages', icon: MessageSquare },
    { to: '/events', label: 'Campus', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans antialiased flex flex-col">
      {!isConfigured && (
        <div className="bg-brand-600 text-white px-4 py-2 text-center text-xs font-semibold">
          Variables Supabase manquantes dans l’environnement (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
        </div>
      )}

      {/* Header principal */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-2 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            aria-label="Ouvrir le menu de navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 border border-brand-700 shrink-0">
              <img
                src="/logo-educampus-icon.svg"
                alt="EduCampus"
                className="h-6 w-6 object-contain brightness-0 invert"
              />
            </div>
            <div>
              <span className="font-display text-lg font-extrabold tracking-tight text-zinc-950 dark:text-white">
                EduCampus
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 -mt-0.5">
                Portail Unifié
              </p>
            </div>
          </Link>
        </div>

        {/* Raccourcis desktop des 4 piliers */}
        <nav aria-label="Piliers principaux" className="hidden lg:flex items-center gap-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`
            }
          >
            Académique & Campus
          </NavLink>
          <NavLink
            to="/orientation"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`
            }
          >
            Orientation & Avenir
          </NavLink>
          <NavLink
            to="/eduamis"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`
            }
          >
            EduAmis & Messagerie
          </NavLink>
          {(role === 'pro_recruiter' || role === 'school_admin' || role === 'super_admin') && (
            <NavLink
              to={role === 'super_admin' ? '/admin' : role === 'school_admin' ? '/school' : '/pro'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                }`
              }
            >
              Portail Pro & Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            aria-label="Basculer le thème"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          {user && (
            <button
              type="button"
              onClick={() => setCabinetOpen(true)}
              aria-label="Ouvrir le panneau Comptes et Paramètres"
              className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-3 pr-1.5 py-1 hover:border-brand-600 dark:hover:border-brand-500 transition-colors"
            >
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 leading-tight max-w-[140px] truncate">
                  {profile?.full_name || user.email}
                </p>
                <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 capitalize truncate">
                  {userSubtitle}
                </p>
              </div>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-8 w-8 rounded-md object-cover border border-zinc-200 dark:border-zinc-700"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
                  {userInitial}
                </div>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar rétractable structurée en 4 piliers */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 top-[65px] z-30 bg-zinc-950/40"
              />
              <motion.aside
                initial={{ x: -290, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -290, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="fixed left-0 top-[65px] z-40 h-[calc(100vh-65px)] w-72 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-cabinet"
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    Architecture 4 Piliers
                  </span>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                    aria-label="Fermer le menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                  {pillarGroups.map((group) => {
                    const visibleItems = group.items.filter((i) => i.visible !== false);
                    if (visibleItems.length === 0) return null;
                    return (
                      <div key={group.title} className="space-y-1">
                        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                          {group.title}
                        </p>
                        {visibleItems.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                isActive
                                  ? 'bg-brand-600 text-white font-semibold'
                                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
                              }`
                            }
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    );
                  })}
                </nav>

                <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-3">
                  <NavLink
                    to="/settings"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-600 text-white font-semibold'
                          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
                      }`
                    }
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    <span>Comptes & Paramètres</span>
                  </NavLink>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Contenu principal + Footer */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1">{children}</main>
          <div className="pb-14 lg:pb-0">
            <SiteFooter />
          </div>
        </div>
      </div>

      {/* Barre de navigation mobile */}
      <nav
        aria-label="Navigation mobile"
        className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-2 py-2 lg:hidden"
      >
        {mobileTabs.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-500 dark:text-zinc-400'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Tiroir Armoire Articulé pour Comptes & Paramètres */}
      <ProfileCabinetDrawer open={cabinetOpen} onClose={() => setCabinetOpen(false)} />
    </div>
  );
}