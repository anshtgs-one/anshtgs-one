'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Building2, Megaphone, Users, Flag, Palette, Plane,
  Truck, Wallet, Clock
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import {
  useCampaigns, useATLCampaigns, useBTLCampaigns, useEvents,
  useTasks, useCreativeRequests, useTravelPlans
} from '@/lib/hooks';
import { formatDate, cn } from '@/lib/utils';

const FILTERS = [
  { key: 'all', label: 'All', color: 'bg-primary' },
  { key: 'school', label: 'School', color: 'bg-chart-4' },
  { key: 'atl', label: 'ATL', color: 'bg-chart-1' },
  { key: 'btl', label: 'BTL', color: 'bg-chart-2' },
  { key: 'campaign', label: 'Campaign', color: 'bg-chart-3' },
  { key: 'event', label: 'Event', color: 'bg-chart-5' },
  { key: 'creative', label: 'Creative', color: 'bg-chart-6' },
  { key: 'travel', label: 'Travel', color: 'bg-info' },
  { key: 'task', label: 'Task', color: 'bg-warning' },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState('all');
  const [view, setView] = useState<'month' | 'agenda'>('month');

  const { data: campaigns } = useCampaigns();
  const { data: atlCampaigns } = useATLCampaigns();
  const { data: btlCampaigns } = useBTLCampaigns();
  const { data: events } = useEvents();
  const { data: tasks } = useTasks();
  const { data: creativeRequests } = useCreativeRequests();
  const { data: travelPlans } = useTravelPlans();

  const allEvents = useMemo(() => {
    const items: { date: Date; title: string; type: string; status?: string }[] = [];
    if (activeFilter === 'all' || activeFilter === 'campaign') {
      campaigns.forEach(c => {
        if (c.start_date) items.push({ date: new Date(c.start_date), title: c.name, type: 'campaign', status: c.status });
        if (c.end_date) items.push({ date: new Date(c.end_date), title: `${c.name} (End)`, type: 'campaign', status: c.status });
      });
    }
    if (activeFilter === 'all' || activeFilter === 'atl') {
      atlCampaigns.forEach(a => {
        if (a.installation_date) items.push({ date: new Date(a.installation_date), title: a.title, type: 'atl', status: a.status });
      });
    }
    if (activeFilter === 'all' || activeFilter === 'btl') {
      btlCampaigns.forEach(b => {
        if (b.event_date) items.push({ date: new Date(b.event_date), title: b.title, type: 'btl', status: b.status });
      });
    }
    if (activeFilter === 'all' || activeFilter === 'event') {
      events.forEach(e => {
        if (e.start_date) items.push({ date: new Date(e.start_date), title: e.title, type: 'event', status: e.status });
      });
    }
    if (activeFilter === 'all' || activeFilter === 'task') {
      tasks.forEach(t => {
        if (t.due_date) items.push({ date: new Date(t.due_date), title: t.title, type: 'task', status: t.status });
      });
    }
    if (activeFilter === 'all' || activeFilter === 'creative') {
      creativeRequests.forEach(c => {
        if (c.delivery_date) items.push({ date: new Date(c.delivery_date), title: c.title, type: 'creative', status: c.status });
      });
    }
    if (activeFilter === 'all' || activeFilter === 'travel') {
      travelPlans.forEach(t => {
        if (t.departure_date) items.push({ date: new Date(t.departure_date), title: t.title, type: 'travel', status: t.status });
      });
    }
    return items;
  }, [campaigns, atlCampaigns, btlCampaigns, events, tasks, creativeRequests, travelPlans, activeFilter]);

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const getTypeColor = (type: string) => {
    const filter = FILTERS.find(f => f.key === type);
    return filter?.color || 'bg-muted';
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const sortedAgenda = useMemo(() => {
    return [...allEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allEvents]);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Calendar"
        description="Unified calendar for all marketing activities and deadlines"
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {['month', 'agenda'].map(v => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              className={cn('rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors', view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                activeFilter === f.key ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
              )}
            >
              <div className={cn('h-2 w-2 rounded-full', f.color)} />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">{day}</div>
            ))}
            {Array.from({ length: startDay }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] rounded-lg border border-border bg-muted/20" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dayEvents = allEvents.filter(e => e.date.toDateString() === date.toDateString());
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={day} className={cn('min-h-[100px] rounded-lg border p-1.5', isToday ? 'border-primary bg-primary/5' : 'border-border')}>
                  <p className={cn('text-xs mb-1', isToday ? 'font-bold text-primary' : 'text-muted-foreground')}>{day}</p>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event, idx) => (
                      <div key={idx} className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium truncate text-white', getTypeColor(event.type))}>
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view === 'agenda' && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Upcoming Events</h3>
          <div className="space-y-2">
            {sortedAgenda.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No events scheduled</p>
            ) : (
              sortedAgenda.map((event, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                  <div className={cn('h-10 w-1 rounded-full', getTypeColor(event.type))} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(event.date.toISOString())}</p>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs">{event.type}</Badge>
                  {event.status && <StatusBadge status={event.status} />}
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
