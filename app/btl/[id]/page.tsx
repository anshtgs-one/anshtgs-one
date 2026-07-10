'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Calendar, Users, Wallet, CheckCircle2,
  Circle, Camera, FileText, GraduationCap, TrendingUp, ClipboardList, Eye
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBTLCampaigns, useSchools, useLeads, useCampaigns } from '@/lib/hooks';
import { BTL_TYPE_LABELS, LEAD_STATUS_LABELS } from '@/lib/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Timeline } from '@/components/timeline';
import { TimelineDrawer } from '@/components/timeline-drawer';

const BTL_CHECKLIST = [
  'Venue finalized',
  'Permissions obtained',
  'Creative materials ready',
  'Vendor confirmed',
  'Team briefed',
  'Registration desk setup',
  'Refreshments arranged',
  'Photography arranged',
  'Lead collection forms ready',
  'Follow-up plan prepared',
];

export default function BTLDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: btlCampaigns, loading } = useBTLCampaigns();
  const { data: schools } = useSchools();
  const { data: leads } = useLeads();
  const { data: campaigns } = useCampaigns();
  const [activeTab, setActiveTab] = useState('overview');
  const [checklist, setChecklist] = useState<boolean[]>(BTL_CHECKLIST.map(() => false));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const btl = btlCampaigns.find(b => b.id === id);
  const school = schools.find(s => s.id === btl?.school_id);
  const campaign = campaigns.find(c => c.id === btl?.campaign_id);
  const btlLeads = useMemo(() => leads.filter(l => l.campaign_id === btl?.campaign_id && l.school_id === btl?.school_id), [leads, btl]);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-pulse text-muted-foreground">Loading BTL campaign...</div></div>;
  }

  if (!btl) {
    return <div className="flex flex-col items-center justify-center h-96 gap-4">
      <p className="text-muted-foreground">BTL campaign not found</p>
      <Button onClick={() => router.push('/btl')}>Back to BTL</Button>
    </div>;
  }

  const attendanceRate = btl.expected_attendance > 0 ? (btl.actual_attendance / btl.expected_attendance) * 100 : 0;
  const conversionRate = btl.walk_ins > 0 ? (btl.admissions / btl.walk_ins) * 100 : 0;
  const budgetUtilization = btl.budget > 0 ? (btl.spent / btl.budget) * 100 : 0;
  const completedChecklist = checklist.filter(Boolean).length;

  return (
    <div className="animate-fade-in-up">
      <Button variant="ghost" size="sm" onClick={() => router.push('/btl')} className="mb-3">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to BTL
      </Button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{BTL_TYPE_LABELS[btl.type]}</Badge>
            <StatusBadge status={btl.status} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{btl.title}</h1>
          {btl.venue && <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {btl.venue}</p>}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Expected" value={btl.expected_attendance} icon={<Users className="h-5 w-5" />} accent="info" />
        <StatCard label="Actual" value={btl.actual_attendance} icon={<Users className="h-5 w-5" />} accent="primary" />
        <StatCard label="Walk-ins" value={btl.walk_ins} icon={<TrendingUp className="h-5 w-5" />} accent="warning" />
        <StatCard label="Admissions" value={btl.admissions} icon={<GraduationCap className="h-5 w-5" />} accent="success" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checklist">Checklist ({completedChecklist}/{BTL_CHECKLIST.length})</TabsTrigger>
          <TabsTrigger value="leads">Leads ({btlLeads.length})</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Workflow</h3>
                <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
                  <Eye className="mr-1.5 h-4 w-4" /> Details
                </Button>
              </div>
              <Timeline
                entityType="btl"
                entityId={btl.id}
                currentStatus={btl.status}
                steps={['planning', 'approved', 'in_progress', 'completed']}
              />
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <h3 className="font-semibold mb-4">Campaign Details</h3>
              <div className="space-y-3">
                {[
                  { label: 'Type', value: BTL_TYPE_LABELS[btl.type] },
                  { label: 'Venue', value: btl.venue || '-' },
                  { label: 'Start Date', value: formatDate(btl.event_date) },
                  { label: 'End Date', value: formatDate(btl.end_date) },
                  { label: 'School', value: school?.name || '-' },
                  { label: 'Campaign', value: campaign?.name || '-' },
                  { label: 'Budget', value: formatCurrency(btl.budget) },
                  { label: 'Spent', value: formatCurrency(btl.spent) },
                ].map(item => (
                  <div key={item.label} className="flex justify-between border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Attendance Rate</span>
                      <span className="font-medium">{attendanceRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={attendanceRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Conversion Rate</span>
                      <span className="font-medium">{conversionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={conversionRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Budget Utilization</span>
                      <span className="font-medium">{budgetUtilization.toFixed(0)}%</span>
                    </div>
                    <Progress value={budgetUtilization} className="h-2" />
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold mb-3">Lead Funnel</h3>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-info">{btl.expected_attendance}</p>
                    <p className="text-xs text-muted-foreground">Expected</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{btl.actual_attendance}</p>
                    <p className="text-xs text-muted-foreground">Attended</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">{btl.walk_ins}</p>
                    <p className="text-xs text-muted-foreground">Walk-ins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">{btl.admissions}</p>
                    <p className="text-xs text-muted-foreground">Admitted</p>
                  </div>
                </div>
              </Card>
            </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="checklist">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Event Checklist</h3>
              <Badge variant="outline">{completedChecklist} of {BTL_CHECKLIST.length} completed</Badge>
            </div>
            <div className="space-y-2">
              {BTL_CHECKLIST.map((item, i) => (
                <div
                  key={item}
                  onClick={() => setChecklist(prev => prev.map((v, idx) => idx === i ? !v : v))}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  {checklist[i] ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={cn('text-sm', checklist[i] && 'line-through text-muted-foreground')}>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Leads from this Campaign</h3>
            <div className="space-y-2">
              {btlLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No leads recorded</p>
              ) : (
                btlLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">{lead.student_name}</p>
                      <p className="text-xs text-muted-foreground">Class {lead.class_applying_for} • {lead.source.replace(/_/g, ' ')}</p>
                    </div>
                    <StatusBadge status={lead.status} label={LEAD_STATUS_LABELS[lead.status]} />
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Media Gallery</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {['Event Setup', 'Registration', 'Main Event', 'Audience', 'Q&A Session', 'Group Photo'].map(item => (
                <div key={item} className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/30 transition-colors cursor-pointer">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">{item}</p>
                  <p className="text-xs text-muted-foreground mt-1">Click to upload</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Final Report</h3>
            <div className="prose prose-sm max-w-none">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Event ROI</p>
                    <p className="text-2xl font-bold mt-1">
                      {btl.spent > 0 && btl.admissions > 0 ? `${formatCurrency(btl.spent / btl.admissions)}` : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Cost per admission</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Lead Conversion</p>
                    <p className="text-2xl font-bold mt-1">{conversionRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Walk-in to admission</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground">
                    The {btl.title} event was held on {formatDate(btl.event_date)} at {btl.venue || 'the venue'}.
                    {btl.actual_attendance > 0 && ` A total of ${btl.actual_attendance} people attended out of ${btl.expected_attendance} expected (${attendanceRate.toFixed(0)}% attendance rate).`}
                    {btl.walk_ins > 0 && ` The event generated ${btl.walk_ins} walk-in inquiries.`}
                    {btl.admissions > 0 && ` ${btl.admissions} students were admitted as a result of this event.`}
                    {btl.spent > 0 && ` Total expenditure was ${formatCurrency(btl.spent)} out of a budget of ${formatCurrency(btl.budget)} (${budgetUtilization.toFixed(0)}% utilization).`}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <TimelineDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entityType="btl"
        entityId={btl.id}
        entityTitle={btl.title}
      />
    </div>
  );
}
