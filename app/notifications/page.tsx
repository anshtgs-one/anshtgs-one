'use client';

import { useMemo } from 'react';
import {
  Bell, CheckCircle2, Clock, AlertCircle, MessageSquare,
  Wallet, Palette, Truck, Calendar, Check
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications, updateRecord } from '@/lib/hooks';
import { timeAgo, cn } from '@/lib/utils';
import { toast } from 'sonner';

const NOTIF_ICONS: Record<string, any> = {
  task_assigned: CheckCircle2,
  approval_pending: Clock,
  budget_approved: Wallet,
  creative_delivered: Palette,
  vendor_updated: Truck,
  reminder: AlertCircle,
  deadline: Calendar,
  comment: MessageSquare,
  mention: MessageSquare,
  system: Bell,
};

const NOTIF_COLORS: Record<string, string> = {
  task_assigned: 'bg-info/15 text-info',
  approval_pending: 'bg-warning/15 text-warning',
  budget_approved: 'bg-success/15 text-success',
  creative_delivered: 'bg-chart-4/15 text-chart-4',
  vendor_updated: 'bg-chart-5/15 text-chart-5',
  reminder: 'bg-info/15 text-info',
  deadline: 'bg-destructive/15 text-destructive',
  comment: 'bg-muted text-muted-foreground',
  mention: 'bg-primary/15 text-primary',
  system: 'bg-muted text-muted-foreground',
};

export default function NotificationsPage() {
  const { data: notifications, loading, refetch } = useNotifications();

  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);

  const markAsRead = async (id: string) => {
    const { error } = await updateRecord('notifications', id, { is_read: true });
    if (error) {
      toast.error('Failed to mark as read');
    } else {
      refetch();
    }
  };

  const markAllAsRead = async () => {
    for (const n of unread) {
      await updateRecord('notifications', n.id, { is_read: true });
    }
    refetch();
    toast.success('All notifications marked as read');
  };

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Notifications"
        description={`${unread.length} unread notifications`}
        actions={
          unread.length > 0 && (
            <Button size="sm" variant="outline" onClick={markAllAsRead}>
              <Check className="mr-1.5 h-4 w-4" /> Mark All Read
            </Button>
          )
        }
      />

      <div className="space-y-6">
        {unread.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Unread ({unread.length})</h3>
            <div className="space-y-2">
              {unread.map(notif => {
                const Icon = NOTIF_ICONS[notif.type] || Bell;
                return (
                  <Card
                    key={notif.id}
                    className="p-4 border-l-4 border-l-primary cursor-pointer hover:shadow-md transition-all"
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', NOTIF_COLORS[notif.type] || 'bg-muted')}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.created_at)}</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {read.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Read ({read.length})</h3>
            <div className="space-y-2">
              {read.map(notif => {
                const Icon = NOTIF_ICONS[notif.type] || Bell;
                return (
                  <Card key={notif.id} className="p-4 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex items-start gap-3">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', NOTIF_COLORS[notif.type] || 'bg-muted')}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.created_at)}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {notifications.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </Card>
        )}
      </div>
    </div>
  );
}
