import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ALL_NAV_ITEMS } from '@/components/layout/nav';
import { RequireAuth } from '@/components/RequireAuth';
import { DashboardPage } from '@/pages/DashboardPage';
import { ComingSoonPage } from '@/pages/ComingSoonPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';

const upcoming = ALL_NAV_ITEMS.filter((i) => i.phase).map((i) => ({
  path: i.to,
  element: i.auth ? (
    <RequireAuth>
      <ComingSoonPage />
    </RequireAuth>
  ) : (
    <ComingSoonPage />
  ),
}));

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      ...upcoming,
      {
        path: '/settings',
        element: (
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        ),
      },
      {
        path: '/settings/:tab',
        element: (
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        ),
      },
      {
        path: '/admin/users',
        element: (
          <RequireAuth role="admin">
            <AdminUsersPage />
          </RequireAuth>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
    ],
  },
]);
