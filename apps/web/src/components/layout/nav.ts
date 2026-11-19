import {
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardList,
  Cpu,
  Landmark,
  LayoutDashboard,
  LineChart,
  Newspaper,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Roadmap phase in which the page's data becomes available; undefined = available now. */
  phase?: number;
  auth?: boolean;
}

export const NAV_SECTIONS: { title?: string; items: NavItem[] }[] = [
  { items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    title: 'Jobs',
    items: [
      { to: '/jobs', label: 'Explore Jobs', icon: Search, phase: 2 },
      { to: '/jobs/government', label: 'Government Jobs', icon: Landmark, phase: 2 },
      { to: '/jobs/private', label: 'Private Jobs', icon: Building2, phase: 2 },
      { to: '/jobs/banking', label: 'Banking Jobs', icon: Briefcase, phase: 2 },
      { to: '/jobs/it', label: 'IT Jobs', icon: Cpu, phase: 2 },
      { to: '/recommended', label: 'Recommended Jobs', icon: Sparkles, phase: 4, auth: true },
    ],
  },
  {
    title: 'Insights',
    items: [
      { to: '/tech-radar', label: 'Technology Radar', icon: Cpu, phase: 5 },
      { to: '/news/industry', label: 'Industry News', icon: Newspaper, phase: 5 },
      { to: '/news/market', label: 'Market News', icon: LineChart, phase: 5 },
    ],
  },
  {
    title: 'My space',
    items: [
      { to: '/tracker', label: 'Application Tracker', icon: ClipboardList, phase: 6, auth: true },
      { to: '/learning', label: 'Learning Centre', icon: BookOpen, phase: 5 },
      { to: '/notifications', label: 'Notifications', icon: Bell, phase: 6, auth: true },
      { to: '/settings/profile', label: 'Profile Settings', icon: Settings, auth: true },
    ],
  },
];

export const ADMIN_NAV: NavItem = {
  to: '/admin/users',
  label: 'Admin',
  icon: ShieldCheck,
  auth: true,
};

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);
