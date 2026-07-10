'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MapPin, Users, TrendingUp, BarChart3, Activity, Pencil, Trash2, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/status-badge';
import { DataTable, type Column } from '@/components/data-table';
import {
  useBTLCampaigns, useSchools, useLeadStats, useEmployeeLeadStats, useEmployees
} from '@/lib/hooks';
import { BTL_TYPE_LABELS } from '@/lib/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { exportCSV } from '@/lib/export';

const ACTIVITY_KEYS = [
  'board_activity', 'canopy_standee', 'co_branding', 'door_to_door',
  'leaflet_activity', 'local_tutor_saathi', 'newspaper_insertion', 'ntst',
  'other', 'pre_school_activity', 'play_school_referral', 'rwa_activity',
  'saathi_referral', 'seminar'
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

export default function BTLPage() {
  const router = useRouter();
  const { data: btlCampaigns, refetch } = useBTLCampaigns();
  const { data: schools } = useSchools();
  const { data: leadStats } = useLeadStats();
  const { data: empLeadStats } = useEmployeeLeadStats();
  const { data: employees } = useEmployees();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [view, setView] = useState<'campaigns' | 'analytics'>('campaigns');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const btlFields: FormField[] = [
    { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Society Event - Sunrise Apartments' },
    { key: 'type', label: 'Type', type: 'select', required: true, defaultValue: 'society_event', options: Object.entries(BTL_TYPE_LABELS).map(([value, label]) => ({ value, label })) },
    { key: 'school_id', label: 'School', type: 'select', options: schools.map(s => ({ value: s.id, label: s.name })) },
    { key: 'venue', label: 'Venue', type: 'text', placeholder: 'Event venue' },
    { key: 'event_date', label: 'Event Date', type: 'date' },
    { key: 'end_date', label: 'End Date', type: 'date' },
    { key: 'expected_attendance', label: 'Expected Attendance', type: 'number', defaultValue: 0, min: 0 },
    { key: 'budget', label: 'Budget', type: 'number', defaultValue: 0, min: 0 },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'planning', options: [
      { value: 'planning', label: 'Planning' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ] },
  ];

  const totalLeads = useMemo(() => leadStats.reduce((s, ls) => s + ls.total_leads, 0), [leadStats]);

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

  const schoolLeadData = useMemo(() => {
    return schools.map(s => {
      const ls = leadStats.find(l => l.school_id === s.id);
      const shortName = s.code.replace('TGS-', '').replace('THS-', '');
      return {
        name: shortName,
        full: s.name,
        total: ls?.total_leads || 0,
        topActivity: ACTIVITY_KEYS.reduce((max, key) => {
          const val = (ls as any)?.[key] as number || 0;
          return val > max.val ? { key, val } : max;
        }, { key: '', val: 0 }),
      };
    }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);
  }, [schools, leadStats]);

  const employeePerformance = useMemo(() => {
    return empLeadStats.map(els => {
      const emp = employees.find(e => e.id === els.employee_id);
      const school = schools.find(s => s.id === els.school_id);
      return {
        name: emp?.full_name || els.email.split('@')[0],
        school: school?.code || '',
        total: els.total_leads,
        leaflet: els.leaflet_activity,
        d2d: els.door_to_door,
        saathi: els.saathi_referral,
        canopy: els.canopy_standee,
      };
    }).sort((a, b) => b.total - a.total);
  }, [empLeadStats, employees, schools]);

  const radarData = useMemo(() => {
    const top5 = schoolLeadData.slice(0, 5);
    return ACTIVITY_KEYS.slice(0, 8).map(act => {
      const row: Record<string, any> = { activity: ACTIVITY_LABELS[act] };
      top5.forEach(s => {
        const ls = leadStats.find(l => l.school_id === schools.find(sc => sc.code.replace('TGS-', '').replace('THS-', '') === s.name)?.id);
        row[s.name] = (ls as any)?.[act] || 0;
      });
      return row;
    });
  }, [schoolLeadData, leadStats, schools]);

  const filtered = useMemo(() => {
    return btlCampaigns.filter(b => {
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchType = typeFilter === 'all' || b.type === typeFilter;
      return matchStatus && matchType;
    });
  }, [btlCampaigns, statusFilter, typeFilter]);

  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium hover:text-primary cursor-pointer" onClick={() => router.push(`/btl/${r.id}`)}>{r.title}</p>
          {r.venue && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{r.venue}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (r) => <Badge variant="outline">{BTL_TYPE_LABELS[r.type as keyof typeof BTL_TYPE_LABELS]}</Badge>,
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
    { key: 'event_date', header: 'Date', sortable: true, render: (r) => formatDate(r.event_date) },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (r) => (
        <div className="text-sm">
          <span className="font-medium">{r.actual_attendance || 0}</span>
          <span className="text-muted-foreground"> / {r.expected_attendance}</span>
        </div>
      ),
    },
    { key: 'walk_ins', header: 'Walk-ins', sortable: true },
    {
      key: 'admissions',
      header: 'Admissions',
      sortable: true,
      render: (r) => r.admissions > 0 ? <Badge className="bg-success text-success-foreground">{r.admissions}</Badge> : <span className="text-muted-foreground">0</span>,
    },
    { key: 'budget', header: 'Budget', sortable: true, render: (r) => formatCurrency(r.budget) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditRecord(r); setShowForm(true); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteRecord(r); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="BTL Marketing"
        description="Below-the-line activities, lead tracking, and employee-wise performance analytics"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border p-0.5">
              <Button variant={view === 'campaigns' ? 'default' : 'ghost'} size="sm" onClick={() => setView('campaigns')}>
                <BarChart3 className="mr-1.5 h-4 w-4" /> Campaigns
              </Button>
              <Button variant={view === 'analytics' ? 'default' : 'ghost'} size="sm" onClick={() => setView('analytics')}>
                <Activity className="mr-1.5 h-4 w-4" /> Analytics
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, 'btl-campaigns')}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => { setEditRecord(null); setShowForm(true); }}><Plus className="mr-1.5 h-4 w-4" /> New BTL</Button>
          </div>
        }
      />

      {view === 'analytics' ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total YTD Leads" value={totalLeads} icon={<Users className="h-5 w-5" />} accent="primary" />
            <StatCard label="Active Activities" value={activityTotals.length} icon={<Activity className="h-5 w-5" />} accent="info" />
            <StatCard label="Top Activity" value={activityTotals[0]?.name || '-'} icon={<TrendingUp className="h-5 w-5" />} accent="success" />
            <StatCard label="Employees Tracked" value={employeePerformance.length} icon={<Users className="h-5 w-5" />} accent="warning" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold">Activity-wise Lead Distribution</h3>
                <p className="text-xs text-muted-foreground">YTD 2025-26 — Total leads by BTL activity type</p>
              </div>
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
              <div className="mb-4">
                <h3 className="text-base font-semibold">School-wise Lead Comparison</h3>
                <p className="text-xs text-muted-foreground">Total leads per school (YTD)</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={schoolLeadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: number) => [v, 'Leads']}
                  />
                  <Bar dataKey="total" name="Total Leads" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="mt-6">
            <Card className="p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold">Employee-wise BTL Performance</h3>
                <p className="text-xs text-muted-foreground">YTD leads generated by each BTL executive, broken down by activity</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Employee</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">School</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Total</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Leaflet</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">D2D</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Saathi Ref</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Canopy</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeePerformance.map((emp, i) => {
                      const maxTotal = employeePerformance[0]?.total || 1;
                      const pct = (emp.total / maxTotal) * 100;
                      return (
                        <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                          <td className="py-3 pr-4 font-medium capitalize">{emp.name}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{emp.school}</td>
                          <td className="py-3 pr-4 text-right font-semibold">{emp.total}</td>
                          <td className="py-3 pr-4 text-right">{emp.leaflet}</td>
                          <td className="py-3 pr-4 text-right">{emp.d2d}</td>
                          <td className="py-3 pr-4 text-right">{emp.saathi}</td>
                          <td className="py-3 pr-4 text-right">{emp.canopy}</td>
                          <td className="py-3 pr-4 min-w-[100px]"><Progress value={pct} className="h-2" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="mt-6">
            <Card className="p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold">Activity Radar — Top 5 Schools</h3>
                <p className="text-xs text-muted-foreground">Comparison of activity types across top performing schools</p>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="activity" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <PolarRadiusAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  {schoolLeadData.slice(0, 5).map((s, i) => (
                    <Radar key={s.name} name={s.name} dataKey={s.name} stroke={PIE_COLORS[i % PIE_COLORS.length]} fill={PIE_COLORS[i % PIE_COLORS.length]} fillOpacity={0.15} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {['all', 'planning', 'active', 'completed', 'cancelled'].map(s => (
                <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">{s}</Button>
              ))}
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
              <option value="all">All Types</option>
              {Object.entries(BTL_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {selectedIds.length > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <Button size="sm" variant="destructive" onClick={() => { setDeleteRecord({ id: selectedIds[0], name: `${selectedIds.length} BTL campaigns`, bulkIds: selectedIds }); }}>
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete Selected
              </Button>
            </div>
          )}

          <Card className="p-5">
            <DataTable
              data={filtered}
              columns={columns}
              searchKeys={['title', 'venue']}
              searchPlaceholder="Search BTL campaigns..."
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onRowClick={(row) => router.push(`/btl/${row.id}`)}
            />
          </Card>
        </>
      )}
      <EntityFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        table="btl_campaigns"
        title={editRecord ? 'Edit BTL Campaign' : 'New BTL Campaign'}
        description={editRecord ? 'Update BTL campaign' : 'Create a new below-the-line marketing activity'}
        fields={btlFields}
        editId={editRecord?.id}
        onSuccess={refetch}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table="btl_campaigns"
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.title || 'BTL Campaign'}
        onSuccess={() => { refetch(); setSelectedIds([]); }}
      />
    </div>
  );
}
