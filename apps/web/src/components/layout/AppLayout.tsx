import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { ROLE_RANK } from '@careerradar/shared';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { ADMIN_NAV, NAV_SECTIONS, type NavItem } from './nav';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 px-2 font-semibold tracking-tight">
      <img src="/favicon.svg" alt="" className="size-7" />
      <span className="text-lg">CareerRadar</span>
    </Link>
  );
}

function NavEntry({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/' || item.to === '/jobs'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-brand-100'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        )
      }
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{item.label}</span>
      {item.phase && (
        <span className="ml-auto text-[10px] font-semibold uppercase text-slate-400">Soon</span>
      )}
    </NavLink>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const isAdmin = !!user && ROLE_RANK[user.role] >= ROLE_RANK.admin;
  return (
    <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {NAV_SECTIONS.map((section, i) => (
        <div key={i} className="space-y-1">
          {section.title && (
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {section.title}
            </p>
          )}
          {section.items.map((item) => (
            <NavEntry key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
      {isAdmin && (
        <div className="space-y-1 border-t border-slate-200 pt-4 dark:border-slate-800">
          <NavEntry item={ADMIN_NAV} onNavigate={onNavigate} />
        </div>
      )}
    </nav>
  );
}

function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  return (
    <form
      role="search"
      className="relative w-full max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/jobs${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
      }}
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search jobs, organizations, skills…"
        aria-label="Global search"
        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-900 dark:focus:bg-slate-900"
      />
    </form>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 items-center border-b border-slate-200 px-3 dark:border-slate-800">
          <Logo />
        </div>
        <SidebarContent />
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl dark:bg-slate-900">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-3 dark:border-slate-800">
              <Logo />
              <Button
                variant="ghost"
                size="sm"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/80">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              onClick={toggle}
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            {user ? (
              <>
                <Link
                  to="/settings/profile"
                  className="hidden text-sm text-slate-600 hover:text-slate-900 sm:block dark:text-slate-300"
                >
                  {user.email}
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                >
                  <LogOut className="size-4" /> <span className="hidden sm:inline">Sign out</span>
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate('/login', { state: { from: location.pathname } })}
              >
                <LogIn className="size-4" /> Sign in
              </Button>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
