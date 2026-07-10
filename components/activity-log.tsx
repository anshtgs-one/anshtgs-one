'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, CheckCircle2, FileText, User,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth, getInitials } from '@/lib/auth-context';
import { cn, timeAgo } from '@/lib/utils';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityLogProps {
  entityType: string;
  entityId: string;
  limit?: number;
}

interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

// Color coding by action type
const ACTION_STYLES: Record<
  string,
  { dot: string; icon: typeof Plus; iconColor: string; label: string }
> = {
  create: { dot: 'bg-success', icon: Plus, iconColor: 'text-success', label: 'Created' },
  update: { dot: 'bg-info', icon: Pencil, iconColor: 'text-info', label: 'Updated' },
  delete: { dot: 'bg-destructive', icon: Trash2, iconColor: 'text-destructive', label: 'Deleted' },
  approve: { dot: 'bg-warning', icon: CheckCircle2, iconColor: 'text-warning', label: 'Approved' },
};

function getActionStyle(action: string) {
  const key = action.toLowerCase();
  if (key.includes('create') || key.includes('insert') || key.includes('add'))
    return ACTION_STYLES.create;
  if (key.includes('delete') || key.includes('remove'))
    return ACTION_STYLES.delete;
  if (key.includes('approve') || key.includes('accept'))
    return ACTION_STYLES.approve;
  return ACTION_STYLES.update;
}

function getInitialsFor(name: string | null | undefined): string {
  if (!name) return '?';
  return getInitials(name);
}

export function ActivityLog({ entityType, entityId, limit = 20 }: ActivityLogProps) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      toast.error('Failed to load activity log');
      setLogs([]);
    } else {
      setLogs((data || []) as AuditLog[]);
    }
    setLoading(false);
  }, [entityType, entityId, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              <div className="mt-1 w-px flex-1 bg-border" />
            </div>
            <div className="flex-1 space-y-2 pb-4">
              <div className="h-3 w-32 rounded bg-muted animate-pulse" />
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No activity recorded yet</p>
        <p className="text-xs text-muted-foreground">
          Actions taken on this item will appear here.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="relative">
        {logs.map((log, index) => {
          const style = getActionStyle(log.action);
          const Icon = style.icon;
          const isLast = index === logs.length - 1;

          return (
            <div key={log.id} className="flex gap-3">
              {/* Timeline column */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background',
                    style.dot
                  )}
                >
                  <Icon className={cn('h-4 w-4', style.iconColor)} />
                </div>
                {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {getInitialsFor(log.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">
                    {log.user_name || 'System'}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      style.dot.replace('bg-', 'bg-').replace('bg-', 'bg-') + '/15',
                      style.iconColor
                    )}
                  >
                    {style.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(log.created_at)}
                  </span>
                </div>

                <p className="mt-1 text-sm text-foreground/90 break-words">
                  {log.description}
                </p>

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-2 rounded-md border border-border bg-muted/30 p-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Details
                    </p>
                    <dl className="mt-1 space-y-0.5">
                      {Object.entries(log.metadata).slice(0, 5).map(([key, value]) => (
                        <div key={key} className="flex gap-2 text-xs">
                          <dt className="font-medium text-muted-foreground">{key}:</dt>
                          <dd className="text-foreground/80 break-words">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export default ActivityLog;
