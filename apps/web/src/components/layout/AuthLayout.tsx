import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="mb-8 flex items-center gap-2 text-xl font-semibold">
        <img src="/favicon.svg" alt="" className="size-8" /> CareerRadar
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <Outlet />
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        Jobs, eligibility and industry insights in one place.
      </p>
    </div>
  );
}
