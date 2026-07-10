'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Calendar, Users, Wallet, CheckCircle2,
  Circle, Camera, FileText, ClipboardList, TrendingUp
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEvents, useSchools, useVendors } from '@/lib/hooks';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Timeline } from '@/components/timeline';
import { TimelineDrawer } from '@/components/timeline-drawer';

const EVENT_CHECKLIST = [
  'Event concept finalized',
  'Venue booked',
  'Budget approved',
  'Vendor confirmed',
  'Creative materials designed',
  'Marketing plan executed',
  'Team assigned',
  'Equipment arranged',
  'Registration setup',
  'Post-event follow-up plan',
];

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: events, loading } = useEvents();
  const { data: schools } = useSchools();
  const { data: vendors } = useVendors();
  const [activeTab, setActiveTab] = useState('overview');
  const [checklist, setChecklist] = useState<boolean[]>(EVENT_CHECKLIST.map(() => false));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const event = events.find(e => e.id === id);
  const school = schools.find(s => s.id === event?.school_id);
  const vendor = vendors.find(v => v.id === event?.vendor_id);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!event) return <div className="flex flex-col items-center justify-center h-96 gap-4"><p className="text-muted-foreground">Event not found</p><Button onClick={() => router.push('/events')}>Back</Button></div>;

  const budgetUtil = event.budget > 0 ? (event.spent / event.budget) * 100 : 0;
  const completedChecklist = checklist.filter(Boolean).length;

  return (
    <div className="animate-fade-in-up">
      <Button variant="ghost" size="sm" onClick={() => router.push('/events')} className="mb-3">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Events
      </Button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="capitalize">{event.type.replace(/_/g, ' ')}</Badge>
          <StatusBadge status={event.status} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
        {event.venue && <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.venue}</p>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Expected" value={event.expected_attendance} icon={<Users className="h-5 w-5" />} accent="info" />
        <StatCard label="Actual" value={event.actual_attendance} icon={<Users className="h-5 w-5" />} accent="primary" />
        <StatCard label="Budget" value={formatCurrency(event.budget)} icon={<Wallet className="h-5 w-5" />} accent="warning" />
        <StatCard label="Spent" value={formatCurrency(event.spent)} icon={<Wallet className="h-5 w-5" />} accent="success" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checklist">Checklist ({completedChecklist}/{EVENT_CHECKLIST.length})</TabsTrigger>
          <TabsTrigger value="vendor">Vendor</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Event Workflow</h3>
              <Timeline
                entityType="event"
                entityId={event.id}
                currentStatus={event.status}
                steps={['planning', 'approved', 'in_progress', 'completed', 'cancelled']}
              />
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <h3 className="font-semibold mb-4">Event Details</h3>
              <div className="space-y-3">
                {[
                  { label: 'Type', value: event.type.replace(/_/g, ' ') },
                  { label: 'Venue', value: event.venue || '-' },
                  { label: 'Start Date', value: formatDate(event.start_date) },
                  { label: 'End Date', value: formatDate(event.end_date) },
                  { label: 'School', value: school?.name || '-' },
                  { label: 'Expected Attendance', value: event.expected_attendance },
                  { label: 'Actual Attendance', value: event.actual_attendance },
                  { label: 'Budget', value: formatCurrency(event.budget) },
                  { label: 'Spent', value: formatCurrency(event.spent) },
                ].map(item => (
                  <div key={item.label} className="flex justify-between border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-4">Budget & Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Budget Utilization</span>
                    <span className="font-medium">{budgetUtil.toFixed(0)}%</span>
                  </div>
                  <Progress value={budgetUtil} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Attendance Rate</span>
                    <span className="font-medium">{event.expected_attendance > 0 ? ((event.actual_attendance / event.expected_attendance) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <Progress value={event.expected_attendance > 0 ? (event.actual_attendance / event.expected_attendance) * 100 : 0} className="h-2" />
                </div>
              </div>
            </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="checklist">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Event Checklist</h3>
              <Badge variant="outline">{completedChecklist} of {EVENT_CHECKLIST.length} completed</Badge>
            </div>
            <div className="space-y-2">
              {EVENT_CHECKLIST.map((item, i) => (
                <div
                  key={item}
                  onClick={() => setChecklist(prev => prev.map((v, idx) => idx === i ? !v : v))}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  {checklist[i] ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                  <span className={cn('text-sm', checklist[i] && 'line-through text-muted-foreground')}>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="vendor">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Vendor Details</h3>
            {vendor ? (
              <div className="rounded-lg border border-border p-4">
                <p className="font-medium">{vendor.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{vendor.type}</p>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{vendor.contact_person || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{vendor.phone || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span>{vendor.rating}/5</span></div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No vendor assigned</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setDrawerOpen(true)}>View Details</Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Photo Gallery</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {['Setup', 'Event', 'Audience', 'Group Photo'].map(item => (
                <div key={item} className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/30 transition-colors cursor-pointer">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Documents</h3>
            <div className="space-y-2">
              {['Event Proposal', 'Budget Sheet', 'Vendor Agreement', 'Event Report', 'MOM'].map(doc => (
                <div key={doc} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{doc}</span>
                  </div>
                  <Button variant="ghost" size="sm">Upload</Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <TimelineDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entityType="event"
        entityId={event.id}
        entityTitle={event.title}
      />
    </div>
  );
}
