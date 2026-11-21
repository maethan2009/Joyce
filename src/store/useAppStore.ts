import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppUser, Profile, UserRole } from '@/types';
import { authService } from '@/services';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type Theme = 'light' | 'dark';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function getDefaultRouteForRole(role?: UserRole | null): string {
  switch (role) {
    case 'super_admin':
      return '/admin';
    case 'school_admin':
      return '/school';
    case 'pro_recruiter':
      return '/pro';
    default:
      return '/dashboard';
  }
}

function buildFallbackProfile(user: AppUser): Profile {
  const now = new Date().toISOString();
  const displayName = user.full_name?.trim() || user.email.split('@')[0] || 'Utilisateur';
  return {
    id: user.id,
    matricule: null,
    full_name: displayName,
    role: user.role ?? 'student_free',
    filiere: null,
    niveau: null,
    school_id: null,
    account_status: 'approved',
    company_name: null,
    bio: null,
    headline: null,
    skills: [],
    website_url: null,
    avatar_url: user.avatar_url ?? null,
    totp_secret: null,
    totp_enrolled_at: null,
    interests: [],
    is_mentor_opt_in: false,
    validated_by: null,
    validated_at: null,
    created_at: now,
    updated_at: now,
    school: null,
  };
}

let authSubscriptionBound = false;

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
        let profile = await authService.getProfile(user.id);
        if (!profile) {
          profile = buildFallbackProfile(user);
        }
        if (profile.account_status === 'rejected') {
          await authService.signOut().catch(() => undefined);
          set({ user: null, profile: null });
          throw new Error('Votre compte a été refusé par l’administration.');
        }
        set({ user, profile });
        return profile;
      },

      signUpFree: async (email, password, fullName) => {
        const user = await authService.signUp(email, password, {
          full_name: fullName,
          role: 'student_free',
        });
        try {
          await authService.signIn(email, password);
        } catch {
          /* Email confirmation may be required by project settings */
        }
        const sessionUser = (await authService.getSessionUser()) ?? user;
        let profile = await authService.getProfile(sessionUser.id);
        if (!profile) {
          await new Promise((r) => setTimeout(r, 400));
          profile = await authService.getProfile(sessionUser.id);
        }
        const resolvedProfile = profile ?? buildFallbackProfile(sessionUser);
        set({ user: sessionUser, profile: resolvedProfile });
        return resolvedProfile;
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
          /* Email confirmation may be required */
        }
        const sessionUser = (await authService.getSessionUser()) ?? user;
        let profile = await authService.getProfile(sessionUser.id);
        if (!profile) {
          await new Promise((r) => setTimeout(r, 400));
          profile = await authService.getProfile(sessionUser.id);
        }
        const resolvedProfile = profile ?? buildFallbackProfile(sessionUser);
        set({ user: sessionUser, profile: resolvedProfile });
        return resolvedProfile;
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
        const profile = (await authService.getProfile(sessionUser.id)) ?? buildFallbackProfile(sessionUser);
        set({ user: sessionUser, profile });
        return profile;
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
        if (profile) {
          set({ profile });
        }
      },

      setSession: (user) => set({ user }),

      bootstrapSession: async () => {
        if (!isSupabaseConfigured) return;

        if (!authSubscriptionBound) {
          authSubscriptionBound = true;
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || !session?.user) {
              set({ user: null, profile: null });
              return;
            }
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              const nextUser: AppUser = {
                id: session.user.id,
                email: session.user.email ?? '',
                full_name: (session.user.user_metadata?.full_name as string | undefined) ?? null,
                role: session.user.user_metadata?.role as UserRole | undefined,
              };
              const fetchedProfile = await authService.getProfile(nextUser.id);
              const currentProfile = get().profile;
              set({
                user: nextUser,
                profile: fetchedProfile ?? (currentProfile?.id === nextUser.id ? currentProfile : buildFallbackProfile(nextUser)),
              });
            }
          });
        }

        set({ isLoadingAuth: true });
        try {
          const user = await authService.getSessionUser();
          if (!user) {
            set({ user: null, profile: null });
            return;
          }
          const profile = (await authService.getProfile(user.id)) ?? buildFallbackProfile(user);
          if (profile.account_status === 'rejected') {
            await authService.signOut().catch(() => undefined);
            set({ user: null, profile: null });
            return;
          }
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
