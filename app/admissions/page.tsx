'use client';

import { useState, useMemo } from 'react';
import { Plus, GraduationCap, Users, TrendingUp, Target, Filter, BarChart3, Pencil, Trash2, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from 'recharts';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DataTable, type Column } from '@/components/data-table';
import {
  useLeads, useSchools, useAdmissionStats, useLeadStats
} from '@/lib/hooks';
import { LEAD_STATUS_LABELS } from '@/lib/types';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { formatDate, cn } from '@/lib/utils';
import { exportCSV } from '@/lib/export';

const FUNNEL_STAGES = [
  { key: 'new', label: 'New', color: 'hsl(var(--info))' },
  { key: 'contacted', label: 'Contacted', color: 'hsl(var(--chart-6))' },
  { key: 'counselling_done', label: 'Counselling', color: 'hsl(var(--chart-4))' },
  { key: 'visited', label: 'Visited', color: 'hsl(var(--chart-3))' },
  { key: 'application_submitted', label: 'Application', color: 'hsl(var(--warning))' },
  { key: 'admitted', label: 'Admitted', color: 'hsl(var(--success))' },
];

const ACTIVITY_LABELS: Record<string, string> = {
  board_activity: 'Board',
  canopy_standee: 'Canopy/Standee',
  co_branding: 'Co-Branding',
  door_to_door: 'Door to Door',
  leaflet_activity: 'Leaflet',
  local_tutor_saathi: 'Local Tutor/Saathi',
  newspaper_insertion: 'Newspaper Insertion',
  ntst: 'NTST',
  other: 'Other',
  pre_school_activity: 'Pre-School Activity',
  play_school_referral: 'Play School Referral',
  rwa_activity: 'RWA',
  saathi_referral: 'Saathi Referral',
  seminar: 'Seminar',
};

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-6))'];

export default function AdmissionsPage() {
  const { data: leads, loading, refetch } = useLeads();
  const { data: schools } = useSchools();
  const { data: admissionStats } = useAdmissionStats();
  const { data: leadStats } = useLeadStats();
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [view, setView] = useState<'dashboard' | 'leads'>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const leadFields: FormField[] = [
    { key: 'student_name', label: 'Student Name', type: 'text', required: true, placeholder: 'Student full name' },
    { key: 'parent_name', label: 'Parent Name', type: 'text', placeholder: 'Parent name' },
    { key: 'phone', label: 'Phone', type: 'tel', placeholder: '9876543210' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
    { key: 'class_applying_for', label: 'Class Applying For', type: 'text', placeholder: 'e.g. Class 5' },
    { key: 'school_id', label: 'School', type: 'select', options: schools.map(s => ({ value: s.id, label: s.name })) },
    { key: 'source', label: 'Source', type: 'select', required: true, defaultValue: 'walk_in', options: [
      { value: 'walk_in', label: 'Walk In' },
      { value: 'hoarding', label: 'Hoarding' },
      { value: 'social_media', label: 'Social Media' },
      { value: 'referral', label: 'Referral' },
      { value: 'event', label: 'Event' },
      { value: 'rwa', label: 'RWA' },
      { value: 'society_event', label: 'Society Event' },
      { value: 'open_house', label: 'Open House' },
      { value: 'workshop', label: 'Workshop' },
      { value: 'influencer', label: 'Influencer' },
      { value: 'other', label: 'Other' },
    ] },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'new', options: Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({ value, label })) },
    { key: 'remarks', label: 'Remarks', type: 'textarea', placeholder: 'Additional notes' },
  ];

  const totals = useMemo(() => {
    const totalTarget = admissionStats.reduce((s, a) => s + a.ay_target, 0);
    const totalAdmissions = admissionStats.reduce((s, a) => s + a.total_admissions, 0);
    const totalWalkin = admissionStats.reduce((s, a) => s + a.total_walkin, 0);
    const totalReg = admissionStats.reduce((s, a) => s + a.total_registrations, 0);
    const totalRemaining = admissionStats.reduce((s, a) => s + a.remaining_admissions, 0);
    const achievementPct = totalTarget > 0 ? (totalAdmissions / totalTarget) * 100 : 0;
    const conversionPct = totalWalkin > 0 ? (totalAdmissions / totalWalkin) * 100 : 0;
    return { totalTarget, totalAdmissions, totalWalkin, totalReg, totalRemaining, achievementPct, conversionPct };
  }, [admissionStats]);

  const schoolAdmissionData = useMemo(() => {
    return schools.map(s => {
      const stat = admissionStats.find(a => a.school_id === s.id);
      const shortName = s.code.replace('TGS-', '').replace('THS-', '');
      return {
        name: shortName,
        full: s.name,
        target: stat?.ay_target || 0,
        admissions: stat?.total_admissions || 0,
        walkin: stat?.total_walkin || 0,
        achievement: stat?.target_achievement_pct || 0,
      };
    }).filter(d => d.target > 0);
  }, [schools, admissionStats]);

  const activityLeadData = useMemo(() => {
    const totals: Record<string, number> = {};
    leadStats.forEach(ls => {
      Object.keys(ACTIVITY_LABELS).forEach(key => {
        const val = (ls as any)[key] as number;
        if (val > 0) totals[key] = (totals[key] || 0) + val;
      });
    });
    return Object.entries(totals)
      .map(([key, value]) => ({ name: ACTIVITY_LABELS[key], value }))
      .sort((a, b) => b.value - a.value);
  }, [leadStats]);

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const matchStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchSource = sourceFilter === 'all' || l.source === sourceFilter;
      return matchStatus && matchSource;
    });
  }, [leads, statusFilter, sourceFilter]);

  const admitted = leads.filter(l => l.status === 'admitted').length;
  const conversionRate = leads.length > 0 ? (admitted / leads.length) * 100 : 0;

  const funnelData = FUNNEL_STAGES.map(stage => ({
    name: stage.label,
    count: leads.filter(l => l.status === stage.key).length,
    fill: stage.color,
  }));

  const sourceData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach(l => {
      const key = l.source.replace(/_/g, ' ');
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const columns: Column<any>[] = [
    {
      key: 'student_name',
      header: 'Student',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium">{r.student_name}</p>
          {r.parent_name && <p className="text-xs text-muted-foreground">Parent: {r.parent_name}</p>}
        </div>
      ),
    },
    { key: 'class_applying_for', header: 'Class', sortable: true },
    {
      key: 'phone',
      header: 'Contact',
      render: (r) => (
        <div className="text-sm">
          <p>{r.phone || '-'}</p>
          <p className="text-xs text-muted-foreground">{r.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'school',
      header: 'School',
      sortable: true,
      render: (r) => {
        const school = schools.find(s => s.id === r.school_id);
        return school ? <span className="text-sm">{school.name}</span> : '-';
      },
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      render: (r) => <Badge variant="outline" className="capitalize">{r.source.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} label={LEAD_STATUS_LABELS[r.status as keyof typeof LEAD_STATUS_LABELS]} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditRecord(r); setShowForm(true); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteRecord(r)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Admissions Dashboard"
        description="AY 2026-27 admission tracking, school-wise targets, and activity-wise lead analytics"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border p-0.5">
              <Button variant={view === 'dashboard' ? 'default' : 'ghost'} size="sm" onClick={() => setView('dashboard')}>
                <BarChart3 className="mr-1.5 h-4 w-4" /> Dashboard
              </Button>
              <Button variant={view === 'leads' ? 'default' : 'ghost'} size="sm" onClick={() => setView('leads')}>
                <Users className="mr-1.5 h-4 w-4" /> Leads
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, 'leads')}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => { setEditRecord(null); setShowForm(true); }}><Plus className="mr-1.5 h-4 w-4" /> Add Lead</Button>
          </div>
        }
      />

      {view === 'dashboard' ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="AY Target" value={totals.totalTarget} icon={<Target className="h-5 w-5" />} accent="primary" />
            <StatCard label="Total Admissions" value={totals.totalAdmissions} icon={<GraduationCap className="h-5 w-5" />} accent="success" trend={{ value: totals.achievementPct, positive: true }} />
            <StatCard label="Total Walk-ins" value={totals.totalWalkin} icon={<Users className="h-5 w-5" />} accent="info" />
            <StatCard label="Remaining" value={totals.totalRemaining} icon={<TrendingUp className="h-5 w-5" />} accent="warning" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Registrations" value={totals.totalReg} icon={<GraduationCap className="h-5 w-5" />} accent="info" />
            <StatCard label="Achievement %" value={`${totals.achievementPct.toFixed(1)}%`} icon={<Target className="h-5 w-5" />} accent="success" />
            <StatCard label="Walk-in Conversion" value={`${totals.conversionPct.toFixed(1)}%`} icon={<TrendingUp className="h-5 w-5" />} accent="primary" />
            <StatCard label="Active Schools" value={schoolAdmissionData.length} icon={<Users className="h-5 w-5" />} accent="info" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <div className="mb-4">
                <h3 className="text-base font-semibold">School-wise Admission Target vs Achievement</h3>
                <p className="text-xs text-muted-foreground">AY 2026-27 — Target vs Admissions per school</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={schoolAdmissionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: number, name: string) => [v, name === 'target' ? 'AY Target' : 'Admissions']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="target" name="target" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="admissions" name="admissions" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold">Activity-wise Lead Distribution</h3>
                <p className="text-xs text-muted-foreground">YTD 2025-26 leads by BTL activity type</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={activityLeadData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                  >
                    {activityLeadData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '9px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="mt-6">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">School-wise Admission Progress</h3>
                  <p className="text-xs text-muted-foreground">Detailed breakdown of targets, walk-ins, admissions, and achievement percentage</p>
                </div>
              </div>
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
                    {schoolAdmissionData.map((row) => (
                      <tr key={row.full} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                        <td className="py-3 pr-4 font-medium">{row.full}</td>
                        <td className="py-3 pr-4 text-right">{row.target}</td>
                        <td className="py-3 pr-4 text-right">{row.walkin}</td>
                        <td className="py-3 pr-4 text-right font-semibold text-success">{row.admissions}</td>
                        <td className="py-3 pr-4 text-right text-warning">{row.target - row.admissions}</td>
                        <td className="py-3 pr-4 text-right font-semibold">{row.achievement.toFixed(1)}%</td>
                        <td className="py-3 pr-4 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <Progress value={row.achievement} className="h-2" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border font-semibold">
                      <td className="py-3 pr-4">Total</td>
                      <td className="py-3 pr-4 text-right">{totals.totalTarget}</td>
                      <td className="py-3 pr-4 text-right">{totals.totalWalkin}</td>
                      <td className="py-3 pr-4 text-right text-success">{totals.totalAdmissions}</td>
                      <td className="py-3 pr-4 text-right text-warning">{totals.totalRemaining}</td>
                      <td className="py-3 pr-4 text-right">{totals.achievementPct.toFixed(1)}%</td>
                      <td className="py-3 pr-4"><Progress value={totals.achievementPct} className="h-2" /></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Leads" value={leads.length} icon={<Users className="h-5 w-5" />} accent="info" />
            <StatCard label="Admitted" value={admitted} icon={<GraduationCap className="h-5 w-5" />} accent="success" />
            <StatCard label="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} icon={<TrendingUp className="h-5 w-5" />} accent="primary" />
            <StatCard label="In Pipeline" value={leads.filter(l => !['admitted', 'lost'].includes(l.status)).length} icon={<Users className="h-5 w-5" />} accent="warning" />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Conversion Funnel</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={80} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-4">Leads by Source</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                    {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {['all', ...Object.keys(LEAD_STATUS_LABELS).map(k => k.toLowerCase())].map(s => (
                <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
                  {s === 'all' ? 'All Status' : LEAD_STATUS_LABELS[s as keyof typeof LEAD_STATUS_LABELS] || s}
                </Button>
              ))}
            </div>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
              <option value="all">All Sources</option>
              {['walk_in', 'hoarding', 'social_media', 'referral', 'event', 'rwa', 'society_event', 'open_house', 'workshop', 'influencer', 'other'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>

          {selectedIds.length > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <Button size="sm" variant="destructive" onClick={() => { setDeleteRecord({ id: selectedIds[0], name: `${selectedIds.length} leads`, bulkIds: selectedIds }); }}>
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete Selected
              </Button>
            </div>
          )}

          <Card className="p-5">
            <DataTable
              data={filtered}
              columns={columns}
              searchKeys={['student_name', 'parent_name', 'phone', 'email']}
              searchPlaceholder="Search leads..."
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </Card>
        </>
      )}
      <EntityFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        table="leads"
        title={editRecord ? 'Edit Lead' : 'Add New Lead'}
        description={editRecord ? 'Update lead information' : 'Register a new admission lead'}
        fields={leadFields}
        editId={editRecord?.id}
        onSuccess={refetch}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table="leads"
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.student_name || 'Lead'}
        onSuccess={() => { refetch(); setSelectedIds([]); }}
      />
    </div>
  );
}
