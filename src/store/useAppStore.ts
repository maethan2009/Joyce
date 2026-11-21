import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppUser, Profile, UserRole } from '@/types';
import { authService } from '@/services';
import { isSupabaseConfigured } from '@/lib/supabase';

type Theme = 'light' | 'dark';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppState {
  user: AppUser | null;
  profile: Profile | null;
  isLoadingAuth: boolean;
  signIn: (email: string, password: string) => Promise<Profile>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setSession: (user: AppUser) => void;
  enrollAndActivate: (email: string, password: string, matricule: string, fullName: string) => Promise<Profile>;
  signUpFree: (email: string, password: string, fullName: string) => Promise<Profile>;
  signUpRole: (
    email: string,
    password: string,
    fullName: string,
    role: Extract<UserRole, 'school_admin' | 'pro_recruiter'>,
    companyName?: string,
  ) => Promise<Profile>;
  bootstrapSession: () => Promise<void>;

  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;

  isConfigured: boolean;

  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoadingAuth: false,
      isConfigured: isSupabaseConfigured,

      signIn: async (email, password) => {
        const user = await authService.signIn(email, password);
        set({ user });
        const profile = await authService.getProfile(user.id);
        set({ profile });
        return profile ?? ({} as Profile);
      },

      signUpFree: async (email, password, fullName) => {
        const user = await authService.signUp(email, password, {
          full_name: fullName,
          role: 'student_free',
        });
        // Ensure session after signup when email confirm is disabled
        try {
          await authService.signIn(email, password);
        } catch {
          /* email confirmation may be required */
        }
        const sessionUser = (await authService.getSessionUser()) ?? user;
        set({ user: sessionUser });
        let profile = await authService.getProfile(sessionUser.id);
        if (!profile) {
          await new Promise((r) => setTimeout(r, 400));
          profile = await authService.getProfile(sessionUser.id);
        }
        set({ profile });
        return profile ?? ({} as Profile);
      },

      signUpRole: async (email, password, fullName, role, companyName) => {
        const user = await authService.signUp(email, password, {
          full_name: fullName,
          role,
          company_name: companyName,
        });
        try {
          await authService.signIn(email, password);
        } catch {
          /* email confirmation */
        }
        const sessionUser = (await authService.getSessionUser()) ?? user;
        set({ user: sessionUser });
        const profile = await authService.getProfile(sessionUser.id);
        set({ profile });
        return profile ?? ({} as Profile);
      },

      enrollAndActivate: async (email, password, matricule, fullName) => {
        const user = await authService.signUp(email, password, {
          full_name: fullName,
          role: 'student_verified',
        });
        try {
          await authService.signIn(email, password);
        } catch {
          /* */
        }
        const sessionUser = (await authService.getSessionUser()) ?? user;
        await authService.activateStudent(sessionUser.id, matricule, fullName);
        const profile = await authService.getProfile(sessionUser.id);
        set({ user: sessionUser, profile });
        return profile ?? ({} as Profile);
      },

      signOut: async () => {
        try {
          await authService.signOut();
        } catch {
          /* ignore */
        }
        set({ user: null, profile: null });
      },

      refreshProfile: async () => {
        const { user } = get();
        if (!user) return;
        const profile = await authService.getProfile(user.id);
        set({ profile });
      },

      setSession: (user) => set({ user }),

      bootstrapSession: async () => {
        if (!isSupabaseConfigured) return;
        set({ isLoadingAuth: true });
        try {
          const user = await authService.getSessionUser();
          if (!user) {
            set({ user: null, profile: null });
            return;
          }
          const profile = await authService.getProfile(user.id);
          set({ user, profile });
        } finally {
          set({ isLoadingAuth: false });
        }
      },

      theme: 'light',
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        applyTheme(next);
      },
      setTheme: (t) => {
        set({ theme: t });
        applyTheme(t);
      },

      toasts: [],
      addToast: (type, message) => {
        const id = crypto.randomUUID();
        set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 4000);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'educampus-store',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyTheme(state.theme);
      },
    },
  ),
);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}
