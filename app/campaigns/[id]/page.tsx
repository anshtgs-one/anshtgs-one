'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Flag, Calendar, Wallet, Users, TrendingUp,
  CheckSquare, FileText, BarChart3, Eye
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  useCampaigns, useSchools, useUsers, useATLCampaigns, useBTLCampaigns,
  useLeads, useTasks, useBudgets
} from '@/lib/hooks';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useAuth, getInitials } from '@/lib/auth-context';
import { ROLE_COLORS } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Timeline } from '@/components/timeline';
import { TimelineDrawer } from '@/components/timeline-drawer';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: campaigns, loading } = useCampaigns();
  const { data: schools } = useSchools();
  const { data: users } = useUsers();
  const { data: atlCampaigns } = useATLCampaigns();
  const { data: btlCampaigns } = useBTLCampaigns();
  const { data: leads } = useLeads();
  const { data: tasks } = useTasks();
  const { data: budgets } = useBudgets();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const campaign = campaigns.find(c => c.id === id);

  const campaignSchools = useMemo(() => schools.filter(s => campaign?.school_ids?.includes(s.id)), [schools, campaign]);
  const campaignATL = useMemo(() => atlCampaigns.filter(a => a.campaign_id === id), [atlCampaigns, id]);
  const campaignBTL = useMemo(() => btlCampaigns.filter(b => b.campaign_id === id), [btlCampaigns, id]);
  const campaignLeads = useMemo(() => leads.filter(l => l.campaign_id === id), [leads, id]);
  const campaignTasks = useMemo(() => tasks.filter(t => t.related_id === id), [tasks, id]);
  const campaignBudgets = useMemo(() => budgets.filter(b => b.campaign_id === id), [budgets, id]);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!campaign) return <div className="flex flex-col items-center justify-center h-96 gap-4"><p className="text-muted-foreground">Campaign not found</p><Button onClick={() => router.push('/campaigns')}>Back</Button></div>;

  const budgetUtilization = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
  const admittedLeads = campaignLeads.filter(l => l.status === 'admitted').length;
  const roi = campaign.spent > 0 && admittedLeads > 0 ? (admittedLeads * 50000 / campaign.spent) * 100 : 0;

  return (
    <div className="animate-fade-in-up">
      <Button variant="ghost" size="sm" onClick={() => router.push('/campaigns')} className="mb-3">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Campaigns
      </Button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="uppercase">{campaign.type}</Badge>
          <StatusBadge status={campaign.status} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
        {campaign.objective && <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{campaign.objective}</p>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Budget" value={formatCurrency(campaign.budget)} icon={<Wallet className="h-5 w-5" />} accent="primary" />
        <StatCard label="Spent" value={formatCurrency(campaign.spent)} icon={<Wallet className="h-5 w-5" />} accent="warning" />
        <StatCard label="Leads" value={campaignLeads.length} icon={<Users className="h-5 w-5" />} accent="info" />
        <StatCard label="Admissions" value={admittedLeads} icon={<TrendingUp className="h-5 w-5" />} accent="success" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schools">Schools ({campaignSchools.length})</TabsTrigger>
          <TabsTrigger value="atl">ATL ({campaignATL.length})</TabsTrigger>
          <TabsTrigger value="btl">BTL ({campaignBTL.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({campaignTasks.length})</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Campaign Workflow</h3>
                <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
                  <Eye className="mr-1.5 h-4 w-4" /> Details
                </Button>
              </div>
              <Timeline
                entityType="campaign"
                entityId={campaign.id}
                currentStatus={campaign.status}
                steps={['planning', 'active', 'completed', 'on_hold', 'cancelled']}
              />
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <h3 className="font-semibold mb-4">Campaign Details</h3>
              <div className="space-y-3">
                {[
                  { label: 'Type', value: campaign.type.toUpperCase() },
                  { label: 'Start Date', value: formatDate(campaign.start_date) },
                  { label: 'End Date', value: formatDate(campaign.end_date) },
                  { label: 'Budget', value: formatCurrency(campaign.budget) },
                  { label: 'Spent', value: formatCurrency(campaign.spent) },
                  { label: 'Schools', value: campaignSchools.length },
                  { label: 'ATL Campaigns', value: campaignATL.length },
                  { label: 'BTL Campaigns', value: campaignBTL.length },
                ].map(item => (
                  <div key={item.label} className="flex justify-between border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-4">Assigned Team</h3>
              <div className="space-y-2">
                {(campaign.assigned_user_ids || []).map(uid => {
                  const user = users.find(u => u.id === uid);
                  if (!user) return null;
                  return (
                    <div key={uid} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={cn('text-xs font-semibold', ROLE_COLORS[user.role])}>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user.role.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schools">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Participating Schools</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {campaignSchools.map(school => (
                <div key={school.id} className="rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => router.push(`/schools/${school.id}`)}>
                  <p className="font-medium text-sm">{school.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{school.city}, {school.state}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={school.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="atl">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">ATL Campaigns ({campaignATL.length})</h3>
            <div className="space-y-2">
              {campaignATL.map(atl => (
                <div key={atl.id} className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-accent/50" onClick={() => router.push(`/atl/${atl.id}`)}>
                  <div>
                    <p className="text-sm font-medium">{atl.title}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(atl.budget)}</p>
                  </div>
                  <StatusBadge status={atl.status} />
                </div>
              ))}
              {campaignATL.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No ATL campaigns</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="btl">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">BTL Campaigns ({campaignBTL.length})</h3>
            <div className="space-y-2">
              {campaignBTL.map(btl => (
                <div key={btl.id} className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-accent/50" onClick={() => router.push(`/btl/${btl.id}`)}>
                  <div>
                    <p className="text-sm font-medium">{btl.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(btl.event_date)} • {btl.actual_attendance} attended</p>
                  </div>
                  <StatusBadge status={btl.status} />
                </div>
              ))}
              {campaignBTL.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No BTL campaigns</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Campaign Tasks</h3>
            <div className="space-y-2">
              {campaignTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {formatDate(task.due_date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{task.priority}</Badge>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
              {campaignTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Budget Breakdown</h3>
            <div className="space-y-3">
              {campaignBudgets.map(b => {
                const util = b.allocated > 0 ? (b.spent / b.allocated) * 100 : 0;
                return (
                  <div key={b.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">{b.category} • {b.fiscal_year} {b.quarter}</span>
                      <span className="text-sm font-semibold">{formatCurrency(b.spent)} / {formatCurrency(b.allocated)}</span>
                    </div>
                    <Progress value={util} className="h-2" />
                    <p className="mt-1 text-xs text-muted-foreground">{util.toFixed(1)}% utilized</p>
                  </div>
                );
              })}
              {campaignBudgets.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No budget data</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="roi">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Return on Investment</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(campaign.spent)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">Admissions</p>
                <p className="text-2xl font-bold mt-1">{admittedLeads}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">Cost per Admission</p>
                <p className="text-2xl font-bold mt-1">
                  {admittedLeads > 0 ? formatCurrency(campaign.spent / admittedLeads) : '-'}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Budget Utilization</span>
                <span className="text-sm font-semibold">{budgetUtilization.toFixed(1)}%</span>
              </div>
              <Progress value={budgetUtilization} className="h-3" />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <TimelineDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entityType="campaign"
        entityId={campaign.id}
        entityTitle={campaign.name}
      />
    </div>
  );
}
