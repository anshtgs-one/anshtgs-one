'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Building2, Megaphone, CheckSquare, Wallet, TrendingUp,
  Users, GraduationCap, ArrowRight, Activity as ActivityIcon,
  Clock, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  useSchools, useCampaigns, useTasks, useBudgets, useSavings,
  useLeads, useActivities, useATLCampaigns, useBTLCampaigns, useUsers
} from '@/lib/hooks';
import { formatCurrency, timeAgo, cn } from '@/lib/utils';
import { ROLE_COLORS } from '@/lib/types';
import { useAuth, getInitials } from '@/lib/auth-context';

export default function DashboardPage() {
  const { data: schools } = useSchools();
  const { data: campaigns } = useCampaigns();
  const { data: tasks } = useTasks();
  const { data: budgets } = useBudgets();
  const { data: savings } = useSavings();
  const { data: leads } = useLeads();
  const { data: activities } = useActivities();
  const { data: atlCampaigns } = useATLCampaigns();
  const { data: btlCampaigns } = useBTLCampaigns();
  const { data: users } = useUsers();
  const { profile } = useAuth();

  const stats = useMemo(() => {
    const activeSchools = schools.filter(s => s.status === 'active').length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const pendingTasks = tasks.filter(t => t.status !== 'done').length;
    const totalBudget = budgets.reduce((sum, b) => sum + b.allocated, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalSavings = savings.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.money_saved, 0);
    const admittedLeads = leads.filter(l => l.status === 'admitted').length;
    const totalLeads = leads.length;
    const liveATL = atlCampaigns.filter(a => a.status === 'live').length;
    const activeBTL = btlCampaigns.filter(b => b.status === 'active' || b.status === 'completed').length;
    return {
      activeSchools, activeCampaigns, pendingTasks, totalBudget, totalSpent,
      totalSavings, admittedLeads, totalLeads, liveATL, activeBTL,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };
  }, [schools, campaigns, tasks, budgets, savings, leads, atlCampaigns, btlCampaigns]);

  const budgetByCategory = useMemo(() => {
    const categories: Record<string, { allocated: number; spent: number }> = {};
    budgets.forEach(b => {
      if (!categories[b.category]) categories[b.category] = { allocated: 0, spent: 0 };
      categories[b.category].allocated += b.allocated;
      categories[b.category].spent += b.spent;
    });
    return Object.entries(categories).map(([name, val]) => ({ name, ...val }));
  }, [budgets]);

  const leadsBySource = useMemo(() => {
    const sources: Record<string, number> = {};
    leads.forEach(l => {
      const key = l.source.replace(/_/g, ' ');
      sources[key] = (sources[key] || 0) + 1;
    });
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const schoolPerformance = useMemo(() => {
    return schools.slice(0, 6).map(s => ({
      name: s.code.replace('TGS-', '').replace('THS-', ''),
      full: s.name,
      leads: leads.filter(l => l.school_id === s.id).length,
      admissions: leads.filter(l => l.school_id === s.id && l.status === 'admitted').length,
    }));
  }, [schools, leads]);

  const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-6))'];

  const recentActivities = activities.slice(0, 8);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Executive Dashboard"
        description="Real-time overview of marketing operations across all TGS schools"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/reports">View Reports</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/campaigns">New Campaign</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Schools"
          value={stats.activeSchools}
          icon={<Building2 className="h-5 w-5" />}
          accent="primary"
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          label="Active Campaigns"
          value={stats.activeCampaigns}
          icon={<Megaphone className="h-5 w-5" />}
          accent="info"
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          label="Pending Tasks"
          value={stats.pendingTasks}
          icon={<CheckSquare className="h-5 w-5" />}
          accent="warning"
        />
        <StatCard
          label="Total Savings"
          value={formatCurrency(stats.totalSavings)}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="success"
          trend={{ value: 15, positive: true }}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Budget"
          value={formatCurrency(stats.totalBudget)}
          icon={<Wallet className="h-5 w-5" />}
          accent="primary"
        />
        <StatCard
          label="Budget Spent"
          value={formatCurrency(stats.totalSpent)}
          icon={<Wallet className="h-5 w-5" />}
          accent="warning"
        />
        <StatCard
          label="Total Leads"
          value={stats.totalLeads}
          icon={<Users className="h-5 w-5" />}
          accent="info"
        />
        <StatCard
          label="Admissions"
          value={stats.admittedLeads}
          icon={<GraduationCap className="h-5 w-5" />}
          accent="success"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Budget vs Spent by Category</h3>
              <p className="text-xs text-muted-foreground">Fiscal year 2025-26 allocation and utilization</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={budgetByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="allocated" name="Allocated" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" name="Spent" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold">Leads by Source</h3>
            <p className="text-xs text-muted-foreground">Distribution of lead sources</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={leadsBySource}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={2}
              >
                {leadsBySource.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">School Performance</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/schools">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={schoolPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="leads" name="Leads" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="admissions" name="Admissions" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Recent Activity</h3>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto scrollbar-thin">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              recentActivities.map((act) => {
                const user = users.find(u => u.id === act.user_id);
                return (
                  <div key={act.id} className="flex items-start gap-3">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className={cn('text-[10px] font-semibold', user ? ROLE_COLORS[user.role] : 'bg-muted')}>
                        {user ? getInitials(user.name) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-snug">{act.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(act.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Pending Approvals & Tasks</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tasks">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="space-y-2">
            {tasks.filter(t => t.status !== 'done').slice(0, 5).map((task) => {
              const assignee = users.find(u => u.id === task.assigned_to);
              return (
                <Link
                  key={task.id}
                  href="/tasks"
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold',
                    task.priority === 'urgent' ? 'bg-destructive/15 text-destructive' :
                    task.priority === 'high' ? 'bg-warning/15 text-warning' :
                    task.priority === 'medium' ? 'bg-info/15 text-info' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {task.priority === 'urgent' ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{assignee?.name || 'Unassigned'}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'New Campaign', href: '/campaigns', icon: Megaphone, color: 'text-primary' },
              { label: 'New ATL', href: '/atl', icon: TrendingUp, color: 'text-info' },
              { label: 'New BTL', href: '/btl', icon: Users, color: 'text-success' },
              { label: 'New Task', href: '/tasks', icon: CheckSquare, color: 'text-warning' },
              { label: 'Add Vendor', href: '/vendors', icon: Building2, color: 'text-chart-4' },
              { label: 'Add Lead', href: '/admissions', icon: GraduationCap, color: 'text-chart-5' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex flex-col items-center gap-2 rounded-lg border border-border p-4 hover:border-primary/30 hover:bg-accent/50 transition-all"
                >
                  <Icon className={cn('h-6 w-6 transition-transform group-hover:scale-110', action.color)} />
                  <span className="text-xs font-medium">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
