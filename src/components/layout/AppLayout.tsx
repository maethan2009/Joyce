import { type ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Home,
  IdCard,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
  Vote,
  X,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/events', label: 'Événements', icon: Calendar },
  { to: '/elections', label: 'Elections', icon: Vote },
  { to: '/student-card', label: 'Student Card', icon: IdCard },
  { to: '/hub', label: 'Academic Hub', icon: BookOpen },
  { to: '/skilllink', label: 'SkillLink', icon: Sparkles },
  { to: '/mentorship', label: 'Mentorship', icon: Users },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isMockMode = useAppStore((s) => s.isMockMode);
  const profile = useAppStore((s) => s.profile);
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/enroll';

  if (isAuthPage) return <>{children}</>;

  const userInitial = profile?.full_name?.trim().charAt(0).toUpperCase() || 'U';
  const userLevel = (profile as Record<string, any>)?.level || 'Étudiant';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased flex flex-col">
      {/* Demo banner */}
      {isMockMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-2 text-center text-xs font-semibold">
          Demo Mode — connect Supabase in Settings to enable real data, authentication, and persistence.
        </div>
      )}

      {/* Top Header avec le bouton Burger (3 barres) et le grand logo */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-4">
          {/* Bouton Burger (3 barres) pour ouvrir/rétracter le menu */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-3">
            <img 
              src="/logo-educampus-icon.svg" 
              alt="EduCampus Logo" 
              className="h-12 w-12 object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo-educampus.png';
              }}
            />
            <div>
              <span className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">EduCampus</span>
              <p className="text-[10px] text-slate-400 font-medium -mt-1">Plateforme Académique</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme} 
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-amber-400" />}
          </button>

          {profile && (
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{profile.full_name}</p>
                <p className="text-[10px] text-slate-400 font-medium">{userLevel}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-sm">
                {userInitial}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar Coulissante / Rétractable via le bouton burger */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed left-0 top-[73px] z-40 h-[calc(100vh-73px)] w-72 flex-col border-r border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 flex shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation</span>
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-semibold shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="border-t border-slate-200/80 px-3 py-4 dark:border-slate-800/80 space-y-1">
                <NavLink
                  to="/settings"
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                    }`
                  }
                >
                  <Settings className="h-5 w-5 shrink-0" />
                  Settings
                </NavLink>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area (prend tout l'espace lorsque la sidebar est fermée) */}
        <main className="flex-1 min-h-[calc(100vh-73px)] pb-16">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar pour accès rapide */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-around px-2 py-2 lg:hidden">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${
                isActive ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-400 dark:text-slate-500'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}