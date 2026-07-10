import {
  LayoutDashboard, Building2, Megaphone, CalendarDays, Users,
  CheckSquare, Palette, Truck, Wallet, PiggyBank, Plane,
  GraduationCap, FileText, BarChart3, Map, Bell, Settings,
  Flag, Package, ShieldCheck, UserCog
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Calendar', href: '/calendar', icon: CalendarDays },
      { label: 'Maps', href: '/maps', icon: Map },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Schools', href: '/schools', icon: Building2 },
      { label: 'ATL', href: '/atl', icon: Megaphone },
      { label: 'BTL', href: '/btl', icon: Users },
      { label: 'Campaigns', href: '/campaigns', icon: Flag },
      { label: 'Events', href: '/events', icon: CalendarDays },
      { label: 'Creative Hub', href: '/creative', icon: Palette },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Tasks', href: '/tasks', icon: CheckSquare },
      { label: 'Vendor Management', href: '/vendors', icon: Truck },
      { label: 'Asset Dispatch', href: '/assets', icon: Package },
      { label: 'Travel Planner', href: '/travel', icon: Plane },
      { label: 'Admissions', href: '/admissions', icon: GraduationCap },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Budget & Finance', href: '/finance', icon: Wallet },
      { label: 'Savings Tracker', href: '/savings', icon: PiggyBank },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Documents', href: '/documents', icon: FileText },
      { label: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Settings', href: '/settings', icon: Settings },
      { label: 'User Management', href: '/settings/users', icon: UserCog },
      { label: 'Access Control', href: '/settings/roles', icon: ShieldCheck },
    ],
  },
];
