'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Flag, Calendar, Wallet, TrendingUp, Users, Pencil, Trash2, Download } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { DataTable, type Column } from '@/components/data-table';
import { useCampaigns, useSchools, useUsers } from '@/lib/hooks';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportCSV } from '@/lib/export';

export default function CampaignsPage() {
  const router = useRouter();
  const { data: campaigns, loading, refetch } = useCampaigns();
  const { data: schools } = useSchools();
  const { data: users } = useUsers();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const campaignFields: FormField[] = [
    { key: 'name', label: 'Campaign Name', type: 'text', required: true, placeholder: 'Summer Admission Drive 2026' },
    { key: 'type', label: 'Type', type: 'select', required: true, defaultValue: 'mixed', options: [
      { value: 'atl', label: 'ATL' },
      { value: 'btl', label: 'BTL' },
      { value: 'mixed', label: 'Mixed' },
    ] },
    { key: 'objective', label: 'Objective', type: 'textarea', placeholder: 'Campaign objective' },
    { key: 'start_date', label: 'Start Date', type: 'date' },
    { key: 'end_date', label: 'End Date', type: 'date' },
    { key: 'budget', label: 'Budget', type: 'number', defaultValue: 0, min: 0 },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'planning', options: [
      { value: 'planning', label: 'Planning' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'on_hold', label: 'On Hold' },
      { value: 'cancelled', label: 'Cancelled' },
    ] },
  ];

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchType = typeFilter === 'all' || c.type === typeFilter;
      return matchStatus && matchType;
    });
  }, [campaigns, statusFilter, typeFilter]);

  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const activeCount = campaigns.filter(c => c.status === 'active').length;

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Campaign',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium hover:text-primary cursor-pointer" onClick={() => router.push(`/campaigns/${r.id}`)}>{r.name}</p>
          {r.objective && <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{r.objective}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (r) => <Badge variant="outline" className="uppercase">{r.type}</Badge>,
    },
    {
      key: 'start_date',
      header: 'Start',
      sortable: true,
      render: (r) => formatDate(r.start_date),
    },
    {
      key: 'end_date',
      header: 'End',
      sortable: true,
      render: (r) => formatDate(r.end_date),
    },
    {
      key: 'budget',
      header: 'Budget',
      sortable: true,
      render: (r) => formatCurrency(r.budget),
    },
    {
      key: 'spent',
      header: 'Spent',
      sortable: true,
      render: (r) => (
        <div>
          <span className="text-sm font-medium">{formatCurrency(r.spent)}</span>
          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${r.budget > 0 ? (r.spent / r.budget) * 100 : 0}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'schools',
      header: 'Schools',
      render: (r) => {
        const count = r.school_ids?.length || 0;
        return <Badge variant="outline">{count} school{count !== 1 ? 's' : ''}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
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
        title="Campaigns"
        description="Plan, execute, and track marketing campaigns across all schools"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, 'campaigns')}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => { setEditRecord(null); setShowForm(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> New Campaign
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Campaigns" value={campaigns.length} icon={<Flag className="h-5 w-5" />} accent="primary" />
        <StatCard label="Active" value={activeCount} icon={<TrendingUp className="h-5 w-5" />} accent="success" />
        <StatCard label="Total Budget" value={formatCurrency(totalBudget)} icon={<Wallet className="h-5 w-5" />} accent="info" />
        <StatCard label="Total Spent" value={formatCurrency(totalSpent)} icon={<Wallet className="h-5 w-5" />} accent="warning" />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'planning', 'active', 'completed', 'on_hold', 'cancelled'].map(s => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
              {s.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">All Types</option>
          <option value="atl">ATL</option>
          <option value="btl">BTL</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button size="sm" variant="destructive" onClick={() => { setDeleteRecord({ id: selectedIds[0], name: `${selectedIds.length} campaigns`, bulkIds: selectedIds }); }}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete Selected
          </Button>
        </div>
      )}

      <Card className="p-5">
        <DataTable
          data={filtered}
          columns={columns}
          searchKeys={['name', 'objective']}
          searchPlaceholder="Search campaigns..."
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => router.push(`/campaigns/${row.id}`)}
        />
      </Card>
      <EntityFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        table="campaigns"
        title={editRecord ? 'Edit Campaign' : 'New Campaign'}
        description={editRecord ? 'Update campaign information' : 'Create a new marketing campaign'}
        fields={campaignFields}
        editId={editRecord?.id}
        onSuccess={refetch}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table="campaigns"
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.name || 'Campaign'}
        onSuccess={() => { refetch(); setSelectedIds([]); }}
      />
    </div>
  );
}
