'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, Users, Calendar,
  Megaphone, Wallet, GraduationCap, FileText, Image as ImageIcon,
  Clock, Package, TrendingUp, CheckSquare
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { DataTable, type Column } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useSchools, useLeads, useATLCampaigns, useBTLCampaigns,
  useBudgets, useTasks, useActivities, useUsers
} from '@/lib/hooks';
import { ATL_TYPE_LABELS, ATL_STATUS_LABELS, BTL_TYPE_LABELS, LEAD_STATUS_LABELS } from '@/lib/types';
import { formatCurrency, formatDate, timeAgo, cn } from '@/lib/utils';
import { useAuth, getInitials } from '@/lib/auth-context';
import { ROLE_COLORS } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: schools, loading } = useSchools();
  const { data: leads } = useLeads();
  const { data: atlCampaigns } = useATLCampaigns();
  const { data: btlCampaigns } = useBTLCampaigns();
  const { data: budgets } = useBudgets();
  const { data: tasks } = useTasks();
  const { data: activities } = useActivities();
  const { data: users } = useUsers();
  const { profile } = useAuth();

  const school = schools.find(s => s.id === id);
  const [activeTab, setActiveTab] = useState('overview');

  const schoolLeads = useMemo(() => leads.filter(l => l.school_id === id), [leads, id]);
  const schoolATL = useMemo(() => atlCampaigns.filter(a => a.school_id === id), [atlCampaigns, id]);
  const schoolBTL = useMemo(() => btlCampaigns.filter(b => b.school_id === id), [btlCampaigns, id]);
  const schoolBudgets = useMemo(() => budgets.filter(b => b.school_id === id), [budgets, id]);
  const schoolTasks = useMemo(() => tasks.filter(t => t.school_id === id), [tasks, id]);
  const schoolActivities = useMemo(() => activities.filter(a => a.school_id === id), [activities, id]);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-pulse text-muted-foreground">Loading school...</div></div>;
  }

  if (!school) {
    return <div className="flex flex-col items-center justify-center h-96 gap-4">
      <p className="text-muted-foreground">School not found</p>
      <Button onClick={() => router.push('/schools')}>Back to Schools</Button>
    </div>;
  }

  const totalBudget = schoolBudgets.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = schoolBudgets.reduce((s, b) => s + b.spent, 0);
  const admissions = schoolLeads.filter(l => l.status === 'admitted').length;

  const atlColumns: Column<any>[] = [
    { key: 'title', header: 'Title', sortable: true, render: (r) => <Link href={`/atl/${r.id}`} className="font-medium hover:text-primary">{r.title}</Link> },
    { key: 'type', header: 'Type', sortable: true, render: (r) => <Badge variant="outline">{ATL_TYPE_LABELS[r.type as keyof typeof ATL_TYPE_LABELS]}</Badge> },
    { key: 'budget', header: 'Budget', sortable: true, render: (r) => formatCurrency(r.budget) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} label={ATL_STATUS_LABELS[r.status as keyof typeof ATL_STATUS_LABELS]} /> },
  ];

  const btlColumns: Column<any>[] = [
    { key: 'title', header: 'Title', sortable: true, render: (r) => <Link href={`/btl/${r.id}`} className="font-medium hover:text-primary">{r.title}</Link> },
    { key: 'type', header: 'Type', sortable: true, render: (r) => <Badge variant="outline">{BTL_TYPE_LABELS[r.type as keyof typeof BTL_TYPE_LABELS]}</Badge> },
    { key: 'event_date', header: 'Date', sortable: true, render: (r) => formatDate(r.event_date) },
    { key: 'walk_ins', header: 'Walk-ins', sortable: true },
    { key: 'admissions', header: 'Admissions', sortable: true },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  const leadColumns: Column<any>[] = [
    { key: 'student_name', header: 'Student', sortable: true, render: (r) => <Link href={`/admissions`} className="font-medium hover:text-primary">{r.student_name}</Link> },
    { key: 'class_applying_for', header: 'Class', sortable: true },
    { key: 'source', header: 'Source', sortable: true, render: (r) => <Badge variant="outline" className="capitalize">{r.source.replace(/_/g, ' ')}</Badge> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} label={LEAD_STATUS_LABELS[r.status as keyof typeof LEAD_STATUS_LABELS]} /> },
  ];

  const taskColumns: Column<any>[] = [
    { key: 'title', header: 'Task', sortable: true, render: (r) => <Link href="/tasks" className="font-medium hover:text-primary">{r.title}</Link> },
    { key: 'priority', header: 'Priority', sortable: true, render: (r) => <Badge variant="outline" className="capitalize">{r.priority}</Badge> },
    { key: 'due_date', header: 'Due', sortable: true, render: (r) => formatDate(r.due_date) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/schools')} className="mb-3">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Schools
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{school.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {school.city}, {school.state}</span>
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {school.sig_phone || '-'}</span>
                <StatusBadge status={school.status} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Budget" value={formatCurrency(totalBudget)} icon={<Wallet className="h-5 w-5" />} accent="primary" />
        <StatCard label="Budget Spent" value={formatCurrency(totalSpent)} icon={<Wallet className="h-5 w-5" />} accent="warning" />
        <StatCard label="Total Leads" value={schoolLeads.length} icon={<Users className="h-5 w-5" />} accent="info" />
        <StatCard label="Admissions" value={admissions} icon={<GraduationCap className="h-5 w-5" />} accent="success" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="atl">ATL ({schoolATL.length})</TabsTrigger>
          <TabsTrigger value="btl">BTL ({schoolBTL.length})</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="leads">Leads ({schoolLeads.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({schoolTasks.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-semibold mb-4">School Profile</h3>
              <div className="space-y-3">
                {[
                  { label: 'School Code', value: school.code },
                  { label: 'Address', value: school.address || '-' },
                  { label: 'SIG Name', value: school.sig_name || '-' },
                  { label: 'SIG Phone', value: school.sig_phone || '-' },
                  { label: 'SIG Email', value: school.sig_email || '-' },
                  { label: 'Opened Date', value: formatDate(school.opened_date) },
                  { label: 'Capacity', value: school.capacity || '-' },
                  { label: 'Current Strength', value: school.current_strength || '-' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-4">School Team</h3>
              <div className="space-y-3">
                {users.filter(u => u.school_id === school.id).map((user, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className={cn('text-xs font-semibold', ROLE_COLORS[user.role])}>
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role.replace(/_/g, ' ')}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{user.email}</Badge>
                  </div>
                ))}
                {users.filter(u => u.school_id === school.id).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No team members assigned</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="atl">
          <Card className="p-5">
            <DataTable
              data={schoolATL}
              columns={atlColumns}
              searchKeys={['title', 'location']}
              searchPlaceholder="Search ATL..."
              onRowClick={(row) => router.push(`/atl/${row.id}`)}
            />
          </Card>
        </TabsContent>

        <TabsContent value="btl">
          <Card className="p-5">
            <DataTable
              data={schoolBTL}
              columns={btlColumns}
              searchKeys={['title', 'venue']}
              searchPlaceholder="Search BTL..."
              onRowClick={(row) => router.push(`/btl/${row.id}`)}
            />
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Budget Allocation</h3>
            <div className="space-y-3">
              {schoolBudgets.map(b => {
                const utilization = b.allocated > 0 ? (b.spent / b.allocated) * 100 : 0;
                return (
                  <div key={b.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium capitalize">{b.category}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{b.fiscal_year} {b.quarter || ''}</span>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(b.spent)} / {formatCurrency(b.allocated)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full', utilization > 90 ? 'bg-destructive' : utilization > 70 ? 'bg-warning' : 'bg-success')}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{utilization.toFixed(1)}% utilized</p>
                  </div>
                );
              })}
              {schoolBudgets.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No budget allocated</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <Card className="p-5">
            <DataTable
              data={schoolLeads}
              columns={leadColumns}
              searchKeys={['student_name', 'parent_name', 'phone']}
              searchPlaceholder="Search leads..."
            />
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="p-5">
            <DataTable
              data={schoolTasks}
              columns={taskColumns}
              searchKeys={['title', 'description']}
              searchPlaceholder="Search tasks..."
            />
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {schoolActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No activity recorded</p>
              ) : (
                schoolActivities.map(act => {
                  const user = users.find(u => u.id === act.user_id);
                  return (
                    <div key={act.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                        <div className="w-px flex-1 bg-border" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">{act.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {user?.name || 'System'} • {timeAgo(act.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
