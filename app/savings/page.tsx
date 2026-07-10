'use client';

import { useState, useMemo } from 'react';
import {
  PiggyBank, TrendingUp, CheckCircle2, Clock, Plus, Pencil, Trash2, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSavings, useSchools } from '@/lib/hooks';
import { formatCurrency, cn } from '@/lib/utils';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { exportCSV } from '@/lib/export';

export default function SavingsPage() {
  const { data: savings, loading, refetch } = useSavings();
  const { data: schools } = useSchools();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);

  const savingsFields: FormField[] = [
    { key: 'description', label: 'Description', type: 'text', required: true, placeholder: 'Hoarding printing cost comparison' },
    { key: 'school_id', label: 'School', type: 'select', options: schools.map(s => ({ value: s.id, label: s.name })) },
    { key: 'original_budget', label: 'Original Budget', type: 'number', required: true, min: 0, step: 0.01 },
    { key: 'pw_rate', label: 'PW Rate', type: 'number', defaultValue: 0, min: 0, step: 0.01 },
    { key: 'vendor_a', label: 'Vendor A Quote', type: 'number', defaultValue: 0, min: 0, step: 0.01 },
    { key: 'vendor_b', label: 'Vendor B Quote', type: 'number', defaultValue: 0, min: 0, step: 0.01 },
    { key: 'vendor_c', label: 'Vendor C Quote', type: 'number', defaultValue: 0, min: 0, step: 0.01 },
    { key: 'vendor_d', label: 'Vendor D Quote', type: 'number', defaultValue: 0, min: 0, step: 0.01 },
    { key: 'approved_vendor', label: 'Approved Vendor', type: 'text', placeholder: 'Vendor name' },
    { key: 'final_cost', label: 'Final Cost', type: 'number', defaultValue: 0, min: 0, step: 0.01 },
    { key: 'money_saved', label: 'Money Saved', type: 'number', defaultValue: 0, min: 0, step: 0.01 },
    { key: 'savings_percentage', label: 'Savings %', type: 'number', defaultValue: 0, min: 0, step: 0.01 },
    { key: 'savings_reason', label: 'Savings Reason', type: 'textarea', placeholder: 'How was the saving achieved?' },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'pending', options: [
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
    ] },
  ];

  const filtered = useMemo(() => {
    return statusFilter === 'all' ? savings : savings.filter(s => s.status === statusFilter);
  }, [savings, statusFilter]);

  const approvedSavings = savings.filter(s => s.status === 'approved');
  const totalSavings = approvedSavings.reduce((sum, s) => sum + s.money_saved, 0);
  const pendingCount = savings.filter(s => s.status === 'pending').length;
  const avgPercentage = approvedSavings.length > 0
    ? approvedSavings.reduce((sum, s) => sum + s.savings_percentage, 0) / approvedSavings.length
    : 0;

  const savingsBySchool = useMemo(() => {
    const map: Record<string, number> = {};
    approvedSavings.forEach(s => {
      if (s.school_id) {
        map[s.school_id] = (map[s.school_id] || 0) + s.money_saved;
      }
    });
    return Object.entries(map).map(([schoolId, saved]) => ({
      name: schools.find(s => s.id === schoolId)?.code.replace('TGS-', '').replace('THS-', '') || 'Unknown',
      savings: saved,
    }));
  }, [approvedSavings, schools]);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Savings Tracker"
        description="Track vendor cost comparisons and savings across campaigns"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, 'savings')}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => { setEditRecord(null); setShowForm(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> New Entry
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Savings" value={formatCurrency(totalSavings)} icon={<PiggyBank className="h-5 w-5" />} accent="success" />
        <StatCard label="Approved" value={formatCurrency(approvedSavings.reduce((s, x) => s + x.money_saved, 0))} icon={<CheckCircle2 className="h-5 w-5" />} accent="primary" />
        <StatCard label="Pending Approval" value={pendingCount} icon={<Clock className="h-5 w-5" />} accent="warning" />
        <StatCard label="Avg Savings %" value={`${avgPercentage.toFixed(1)}%`} icon={<TrendingUp className="h-5 w-5" />} accent="info" />
      </div>

      <div className="mb-4 flex items-center gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">{s}</Button>
        ))}
      </div>

      {savingsBySchool.length > 0 && (
        <Card className="p-5 mb-6">
          <h3 className="font-semibold mb-4">Savings by School</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={savingsBySchool}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar dataKey="savings" name="Savings" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Vendor Comparison & Savings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Description</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Original</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">PW Rate</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Vendor A</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Vendor B</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Vendor C</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Vendor D</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Approved</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Final</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Saved</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">%</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Status</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={13} className="px-3 py-8 text-center text-sm text-muted-foreground">No savings entries</td></tr>
              ) : (
                filtered.map(s => {
                  const savingsColor = s.savings_percentage > 5 ? 'text-success' : s.savings_percentage > 2 ? 'text-warning' : 'text-destructive';
                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-sm font-medium max-w-[200px] truncate">{s.description}</td>
                      <td className="px-3 py-2.5 text-sm text-right text-muted-foreground">{formatCurrency(s.original_budget)}</td>
                      <td className="px-3 py-2.5 text-sm text-right text-muted-foreground">{formatCurrency(s.pw_rate)}</td>
                      <td className="px-3 py-2.5 text-sm text-right">{formatCurrency(s.vendor_a)}</td>
                      <td className="px-3 py-2.5 text-sm text-right">{formatCurrency(s.vendor_b)}</td>
                      <td className="px-3 py-2.5 text-sm text-right">{formatCurrency(s.vendor_c)}</td>
                      <td className="px-3 py-2.5 text-sm text-right">{formatCurrency(s.vendor_d)}</td>
                      <td className="px-3 py-2.5 text-sm font-medium">{s.approved_vendor || '-'}</td>
                      <td className="px-3 py-2.5 text-sm text-right font-semibold">{formatCurrency(s.final_cost)}</td>
                      <td className="px-3 py-2.5 text-sm text-right font-semibold text-success">{formatCurrency(s.money_saved)}</td>
                      <td className={cn('px-3 py-2.5 text-sm text-right font-bold', savingsColor)}>{s.savings_percentage.toFixed(1)}%</td>
                      <td className="px-3 py-2.5"><StatusBadge status={s.status} /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditRecord(s); setShowForm(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteRecord(s)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <EntityFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        table="savings"
        title={editRecord ? 'Edit Savings Entry' : 'New Savings Entry'}
        description={editRecord ? 'Update savings entry' : 'Record a vendor cost comparison and savings'}
        fields={savingsFields}
        editId={editRecord?.id}
        onSuccess={refetch}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table="savings"
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.description || 'Savings Entry'}
        onSuccess={refetch}
      />
    </div>
  );
}
