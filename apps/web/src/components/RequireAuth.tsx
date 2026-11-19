import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROLE_RANK, type Role } from '@careerradar/shared';
import { useAuth } from '@/lib/auth';
import { FullPageSpinner } from './ui';

export function RequireAuth({ children, role }: { children: ReactNode; role?: Role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && ROLE_RANK[user.role] < ROLE_RANK[role]) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-slate-500">You don't have permission to view this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}
