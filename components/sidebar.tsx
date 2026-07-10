'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, GraduationCap } from 'lucide-react';
import { NAV_SECTIONS } from '@/lib/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile, permissions } = useAuth();

  const hasAccess = (sectionTitle: string): boolean => {
    if (!permissions) return true;
    if (permissions.role === 'super_admin') return true;
    return permissions.menu_access.includes(sectionTitle);
  };

  const visibleSections = NAV_SECTIONS.filter(section => hasAccess(section.title));

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-card transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-[60px] items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold tracking-tight">TGS Marketing OS</div>
            <div className="text-[10px] text-muted-foreground">The Gurukulam School</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
          {visibleSections.map((section) => (
            <div key={section.title} className="mb-5">
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-blue-700 text-white shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground')} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-gradient-to-br from-blue-700/10 to-blue-700/5 p-3">
            <div className="text-xs font-semibold text-foreground">{profile?.full_name || 'User'}</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">{profile?.designation || ''}</div>
          </div>
        </div>
      </aside>
    </>
  );
}
