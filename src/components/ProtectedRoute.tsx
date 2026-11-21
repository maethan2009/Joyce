import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const isLoadingAuth = useAppStore((s) => s.isLoadingAuth);
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Chargement de la session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
