import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { ALL_NAV_ITEMS } from '@/components/layout/nav';
import { Badge, Card } from '@/components/ui';

const PHASE_NAMES: Record<number, string> = {
  2: 'Job Management',
  4: 'Eligibility Engine',
  5: 'News & Technology',
  6: 'Application Tracker & Notifications',
};

export function ComingSoonPage() {
  const { pathname } = useLocation();
  const item = ALL_NAV_ITEMS.find((i) => i.to === pathname);
  const phase = item?.phase;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{item?.label ?? 'Coming soon'}</h1>
      <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <Construction className="size-10 text-slate-400" aria-hidden />
        <p className="font-medium">This section is not built yet.</p>
        {phase && (
          <Badge tone="brand">
            Phase {phase}: {PHASE_NAMES[phase]}
          </Badge>
        )}
        <p className="max-w-md text-sm text-slate-500">
          It is part of the CareerRadar roadmap and will show live, source-verified data once its
          phase ships.
        </p>
      </Card>
    </div>
  );
}
