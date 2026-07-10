'use client';

import { useState, useMemo } from 'react';
import { Package, Plus, MapPin, Truck, CheckCircle2, Clock, Pencil, Trash2, Download } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table';
import { useATLCampaigns, useSchools, useVendors } from '@/lib/hooks';
import { ATL_TYPE_LABELS, ATL_STATUS_LABELS } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { exportCSV } from '@/lib/export';

export default function AssetDispatchPage() {
  const { data: atlCampaigns, loading, refetch } = useATLCampaigns();
  const { data: schools } = useSchools();
  const { data: vendors } = useVendors();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const assetFields: FormField[] = [
    { key: 'title', label: 'Asset Title', type: 'text', required: true, placeholder: 'Hoarding - Main Road' },
    { key: 'type', label: 'Type', type: 'select', required: true, defaultValue: 'hoarding', options: Object.entries(ATL_TYPE_LABELS).map(([value, label]) => ({ value, label })) },
    { key: 'school_id', label: 'School', type: 'select', options: schools.map(s => ({ value: s.id, label: s.name })) },
    { key: 'vendor_id', label: 'Vendor', type: 'select', options: vendors.map(v => ({ value: v.id, label: v.name })) },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'Site location' },
    { key: 'budget', label: 'Budget', type: 'number', defaultValue: 0, min: 0 },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'printing', options: [
      { value: 'printing', label: 'Printing' },
      { value: 'dispatch', label: 'Dispatch' },
      { value: 'installation', label: 'Installation' },
      { value: 'live', label: 'Live' },
      { value: 'completed', label: 'Completed' },
    ] },
  ];

  const dispatchAssets = useMemo(() => {
    return atlCampaigns.filter(a => ['printing', 'dispatch', 'installation', 'live', 'completed'].includes(a.status));
  }, [atlCampaigns]);

  const filtered = useMemo(() => {
    return statusFilter === 'all' ? dispatchAssets : dispatchAssets.filter(a => a.status === statusFilter);
  }, [dispatchAssets, statusFilter]);

  const printing = dispatchAssets.filter(a => a.status === 'printing').length;
  const inTransit = dispatchAssets.filter(a => a.status === 'dispatch').length;
  const installing = dispatchAssets.filter(a => a.status === 'installation').length;
  const live = dispatchAssets.filter(a => a.status === 'live' || a.status === 'completed').length;

  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Asset',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium">{r.title}</p>
          {r.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{r.location}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (r) => <Badge variant="outline">{ATL_TYPE_LABELS[r.type as keyof typeof ATL_TYPE_LABELS]}</Badge>,
    },
    {
      key: 'school',
      header: 'School',
      render: (r) => {
        const school = schools.find(s => s.id === r.school_id);
        return school ? <span className="text-sm">{school.name}</span> : '-';
      },
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (r) => {
        const vendor = vendors.find(v => v.id === r.vendor_id);
        return vendor ? <span className="text-sm">{vendor.name}</span> : <span className="text-xs text-muted-foreground">Not assigned</span>;
      },
    },
    {
      key: 'installation_date',
      header: 'Install Date',
      sortable: true,
      render: (r) => formatDate(r.installation_date),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} label={ATL_STATUS_LABELS[r.status as keyof typeof ATL_STATUS_LABELS]} />,
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
        title="Asset Dispatch"
        description="Track printing, dispatch, and installation of marketing assets"
        actions={<Button size="sm" onClick={() => { setEditRecord(null); setShowForm(true); }}><Plus className="mr-1.5 h-4 w-4" /> New Dispatch</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Printing" value={printing} icon={<Package className="h-5 w-5" />} accent="warning" />
        <StatCard label="In Transit" value={inTransit} icon={<Truck className="h-5 w-5" />} accent="info" />
        <StatCard label="Installing" value={installing} icon={<Clock className="h-5 w-5" />} accent="primary" />
        <StatCard label="Live" value={live} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" />
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {['all', 'printing', 'dispatch', 'installation', 'live', 'completed'].map(s => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
              {s === 'all' ? 'All' : ATL_STATUS_LABELS[s as keyof typeof ATL_STATUS_LABELS]}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, 'asset-dispatch')}>
          <Download className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button size="sm" variant="destructive" onClick={() => { setDeleteRecord({ id: selectedIds[0], name: `${selectedIds.length} assets`, bulkIds: selectedIds }); }}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete Selected
          </Button>
        </div>
      )}

      <Card className="p-5">
        <DataTable
          data={filtered}
          columns={columns}
          searchKeys={['title', 'location']}
          searchPlaceholder="Search assets..."
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </Card>

      <EntityFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        table="atl_campaigns"
        title={editRecord ? 'Edit Asset Dispatch' : 'New Asset Dispatch'}
        description={editRecord ? 'Update asset dispatch' : 'Create a new asset for dispatch tracking'}
        fields={assetFields}
        editId={editRecord?.id}
        onSuccess={refetch}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table="atl_campaigns"
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.title || 'Asset'}
        onSuccess={() => { refetch(); setSelectedIds([]); }}
      />
    </div>
  );
}
