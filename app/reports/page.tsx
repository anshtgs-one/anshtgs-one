'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3, Building2, Megaphone, Users, Truck, Wallet,
  PiggyBank, TrendingUp, GraduationCap, FileText, Download, Target
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadialBarChart, RadialBar
} from 'recharts';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  useSchools, useCampaigns, useATLCampaigns, useBTLCampaigns,
  useVendors, useBudgets, useSavings, useLeads, useExpenses,
  useAdmissionStats, useLeadStats, useEmployeeLeadStats
} from '@/lib/hooks';
import { formatCurrency, cn } from '@/lib/utils';
import { exportCSV } from '@/lib/export';

const ACTIVITY_KEYS = [
  'board_activity', 'canopy_standee', 'co_branding', 'door_to_door',
  'leaflet_activity', 'local_tutor_saathi', 'newspaper_insertion', 'ntst',
  'other', 'pre_school_activity', 'play_school_referral', 'rwa_activity',
  'saathi_referral', 'seminar'
];

const ACTIVITY_LABELS: Record<string, string> = {
  board_activity: 'Board', canopy_standee: 'Canopy/Standee', co_branding: 'Co-Branding',
  door_to_door: 'Door to Door', leaflet_activity: 'Leaflet', local_tutor_saathi: 'Local Tutor/Saathi',
  newspaper_insertion: 'Newspaper Insertion', ntst: 'NTST', other: 'Other',
  pre_school_activity: 'Pre-School Activity', play_school_referral: 'Play School Referral',
  rwa_activity: 'RWA', saathi_referral: 'Saathi Referral', seminar: 'Seminar',
};

const REPORT_TYPES = [
  { key: 'school', label: 'School Reports', icon: Building2, color: 'text-primary' },
  { key: 'campaign', label: 'Campaign Reports', icon: Megaphone, color: 'text-info' },
  { key: 'atl', label: 'ATL Reports', icon: TrendingUp, color: 'text-success' },
  { key: 'btl', label: 'BTL Reports', icon: Users, color: 'text-warning' },
  { key: 'vendor', label: 'Vendor Reports', icon: Truck, color: 'text-chart-4' },
  { key: 'budget', label: 'Budget Reports', icon: Wallet, color: 'text-chart-5' },
  { key: 'savings', label: 'Savings Reports', icon: PiggyBank, color: 'text-success' },
  { key: 'roi', label: 'ROI Reports', icon: BarChart3, color: 'text-primary' },
  { key: 'lead', label: 'Lead Reports', icon: GraduationCap, color: 'text-info' },
  { key: 'admission', label: 'Admission Reports', icon: GraduationCap, color: 'text-success' },
];

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-6))'];

export default function ReportsPage() {
  const { data: schools } = useSchools();
  const { data: campaigns } = useCampaigns();
  const { data: atlCampaigns } = useATLCampaigns();
  const { data: btlCampaigns } = useBTLCampaigns();
  const { data: vendors } = useVendors();
  const { data: budgets } = useBudgets();
  const { data: savings } = useSavings();
  const { data: leads } = useLeads();
  const { data: expenses } = useExpenses();
  const { data: admissionStats } = useAdmissionStats();
  const { data: leadStats } = useLeadStats();
  const { data: empLeadStats } = useEmployeeLeadStats();
  const [activeReport, setActiveReport] = useState('school');

  const totalBudget = budgets.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalSavings = savings.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.money_saved, 0);
  const admittedLeads = leads.filter(l => l.status === 'admitted').length;

  const totalAdmissionTarget = admissionStats.reduce((s, a) => s + a.ay_target, 0);
  const totalAdmissions = admissionStats.reduce((s, a) => s + a.total_admissions, 0);
  const totalWalkin = admissionStats.reduce((s, a) => s + a.total_walkin, 0);
  const totalYTDLeads = leadStats.reduce((s, ls) => s + ls.total_leads, 0);

  const schoolData = useMemo(() => {
    return schools.map(s => {
      const admStat = admissionStats.find(a => a.school_id === s.id);
      const ls = leadStats.find(l => l.school_id === s.id);
      return {
        name: s.code.replace('TGS-', '').replace('THS-', ''),
        full: s.name,
        leads: ls?.total_leads || leads.filter(l => l.school_id === s.id).length,
        admissions: admStat?.total_admissions || leads.filter(l => l.school_id === s.id && l.status === 'admitted').length,
        target: admStat?.ay_target || 0,
        walkin: admStat?.total_walkin || 0,
        achievement: admStat?.target_achievement_pct || 0,
        budget: budgets.filter(b => b.school_id === s.id).reduce((sum, b) => sum + b.allocated, 0),
        spent: budgets.filter(b => b.school_id === s.id).reduce((sum, b) => sum + b.spent, 0),
      };
    });
  }, [schools, leads, budgets, admissionStats, leadStats]);

  const activityTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    leadStats.forEach(ls => {
      ACTIVITY_KEYS.forEach(key => {
        const val = (ls as any)[key] as number;
        if (val > 0) totals[key] = (totals[key] || 0) + val;
      });
    });
    return Object.entries(totals)
      .map(([key, value]) => ({ key, name: ACTIVITY_LABELS[key], value }))
      .sort((a, b) => b.value - a.value);
  }, [leadStats]);

  const employeeData = useMemo(() => {
    return empLeadStats.map(els => ({
      name: els.email.split('@')[0].replace(/\./g, ' '),
      total: els.total_leads,
    })).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [empLeadStats]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    const totalLeadsCount = leads.length;
    const totalAdm = leads.filter(l => l.status === 'admitted').length;
    return months.map((month, i) => {
      const monthExpenses = expenses.filter(e => {
        if (!e.expense_date) return false;
        const d = new Date(e.expense_date);
        return d.getMonth() === i;
      });
      const monthLeads = leads.filter(l => {
        if (!l.created_at) return false;
        const d = new Date(l.created_at);
        return d.getMonth() === i;
      });
      const monthAdmissions = monthLeads.filter(l => l.status === 'admitted').length;
      return {
        name: month,
        spent: monthExpenses.reduce((s, e) => s + e.amount, 0),
        leads: monthLeads.length,
        admissions: monthAdmissions,
      };
    });
  }, [budgets, expenses, leads]);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive reporting across all marketing operations with real-time data"
        actions={
          <Button size="sm" variant="outline" onClick={() => {
            if (activeReport === 'school') exportCSV(schoolData, 'school-report');
            else if (activeReport === 'campaign') exportCSV(campaigns, 'campaign-report');
            else if (activeReport === 'lead') exportCSV(activityTotals, 'lead-report');
            else if (activeReport === 'admission') exportCSV(schoolData, 'admission-report');
            else exportCSV(monthlyData, `${activeReport}-report`);
          }}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Budget" value={formatCurrency(totalBudget)} icon={<Wallet className="h-5 w-5" />} accent="primary" />
        <StatCard label="Total Spent" value={formatCurrency(totalSpent)} icon={<Wallet className="h-5 w-5" />} accent="warning" />
        <StatCard label="Total Savings" value={formatCurrency(totalSavings)} icon={<PiggyBank className="h-5 w-5" />} accent="success" />
        <StatCard label="Admissions" value={totalAdmissions} icon={<GraduationCap className="h-5 w-5" />} accent="info" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon;
          return (
            <button
              key={rt.key}
              onClick={() => setActiveReport(rt.key)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-4 transition-all',
                activeReport === rt.key ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
              )}
            >
              <Icon className={cn('h-6 w-6', rt.color)} />
              <span className="text-xs font-medium text-center">{rt.label}</span>
            </button>
          );
        })}
      </div>

      {activeReport === 'school' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">School-wise Leads & Admissions</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={schoolData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="leads" name="YTD Leads" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="admissions" name="Admissions" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold mb-4">School-wise Budget vs Spent</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={schoolData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="budget" name="Budget" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" name="Spent" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {activeReport === 'admission' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="AY Target" value={totalAdmissionTarget} icon={<Target className="h-5 w-5" />} accent="primary" />
            <StatCard label="Total Admissions" value={totalAdmissions} icon={<GraduationCap className="h-5 w-5" />} accent="success" />
            <StatCard label="Total Walk-ins" value={totalWalkin} icon={<Users className="h-5 w-5" />} accent="info" />
            <StatCard label="Achievement %" value={`${totalAdmissionTarget > 0 ? ((totalAdmissions / totalAdmissionTarget) * 100).toFixed(1) : 0}%`} icon={<TrendingUp className="h-5 w-5" />} accent="success" />
          </div>
          <Card className="p-5">
            <h3 className="font-semibold mb-4">School-wise Admission Target vs Achievement</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={schoolData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="target" name="AY Target" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="admissions" name="Admissions" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="walkin" name="Walk-ins" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Detailed Admission Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">School</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">AY Target</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Walk-ins</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Admissions</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Remaining</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Achievement %</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolData.map((row) => (
                    <tr key={row.full} className="border-b border-border/50 hover:bg-accent/30">
                      <td className="py-3 pr-4 font-medium">{row.full}</td>
                      <td className="py-3 pr-4 text-right">{row.target}</td>
                      <td className="py-3 pr-4 text-right">{row.walkin}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-success">{row.admissions}</td>
                      <td className="py-3 pr-4 text-right text-warning">{row.target - row.admissions}</td>
                      <td className="py-3 pr-4 text-right font-semibold">{row.achievement.toFixed(1)}%</td>
                      <td className="py-3 pr-4 min-w-[120px]"><Progress value={row.achievement} className="h-2" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeReport === 'lead' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total YTD Leads" value={totalYTDLeads} icon={<Users className="h-5 w-5" />} accent="primary" />
            <StatCard label="Activity Types" value={activityTotals.length} icon={<BarChart3 className="h-5 w-5" />} accent="info" />
            <StatCard label="Top Activity" value={activityTotals[0]?.name || '-'} icon={<TrendingUp className="h-5 w-5" />} accent="success" />
            <StatCard label="Employees Tracked" value={empLeadStats.length} icon={<Users className="h-5 w-5" />} accent="warning" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Activity-wise Lead Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityTotals} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={120} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]}>
                    {activityTotals.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Top 10 Employees by Leads</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeeData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="total" name="Total Leads" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {activeReport === 'campaign' && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Campaign Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Campaign</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Type</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Budget</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Spent</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Utilization</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map(c => {
                  const util = c.budget > 0 ? (c.spent / c.budget) * 100 : 0;
                  return (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="uppercase">{c.type}</Badge></td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(c.budget)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(c.spent)}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={cn('font-medium', util > 90 ? 'text-destructive' : util > 70 ? 'text-warning' : 'text-success')}>{util.toFixed(0)}%</span>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{c.status.replace(/_/g, ' ')}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {(activeReport === 'atl' || activeReport === 'btl' || activeReport === 'vendor' || activeReport === 'budget' || activeReport === 'savings' || activeReport === 'roi') && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Monthly Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="spent" name="Spent" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                <Line type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                <Line type="monotone" dataKey="admissions" name="Admissions" stroke="hsl(var(--chart-3))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Schools', value: schools.length },
                { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'active').length },
                { label: 'Live ATL', value: atlCampaigns.filter(a => a.status === 'live').length },
                { label: 'Active BTL', value: btlCampaigns.filter(b => b.status === 'active').length },
                { label: 'Total Vendors', value: vendors.length },
                { label: 'Total YTD Leads', value: totalYTDLeads },
                { label: 'Total Admissions', value: totalAdmissions },
                { label: 'Total Savings', value: formatCurrency(totalSavings) },
              ].map(item => (
                <div key={item.label} className="flex justify-between border-b border-border pb-2">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
