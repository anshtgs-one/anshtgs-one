'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Megaphone, MapPin, Pencil, Trash2, Download } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { DataTable, type Column } from '@/components/data-table';
import { useATLCampaigns, useSchools, useVendors } from '@/lib/hooks';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { exportCSV } from '@/lib/export';
import { ATL_TYPE_LABELS, ATL_STATUS_LABELS, type ATLStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const STATUS_GROUPS: { label: string; statuses: ATLStatus[] }[] = [
  { label: 'All', statuses: [] },
  { label: 'Recce', statuses: ['created', 'recce_assigned', 'site_visit', 'gps_captured', 'measurement_taken', 'photos_uploaded'] },
  { label: 'Quotation', statuses: ['quotation_received', 'quotation_comparison', 'vendor_finalized'] },
  { label: 'Approval', statuses: ['sig_approval', 'central_approval', 'finance_approval'] },
  { label: 'Execution', statuses: ['printing', 'dispatch', 'installation'] },
  { label: 'Live', statuses: ['live', 'maintenance', 'completed'] },
];

export default function ATLPage() {
  const router = useRouter();
  const { data: atlCampaigns, loading, refetch } = useATLCampaigns();
  const { data: schools } = useSchools();
  const { data: vendors } = useVendors();
  const [statusGroup, setStatusGroup] = useState(0);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const atlFields: FormField[] = [
    { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Hoarding - Main Road' },
    { key: 'type', label: 'Type', type: 'select', required: true, defaultValue: 'hoarding', options: Object.entries(ATL_TYPE_LABELS).map(([value, label]) => ({ value, label })) },
    { key: 'school_id', label: 'School', type: 'select', options: schools.map(s => ({ value: s.id, label: s.name })) },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'Site location' },
    { key: 'latitude', label: 'Latitude', type: 'number', placeholder: '0.0', step: 0.000001 },
    { key: 'longitude', label: 'Longitude', type: 'number', placeholder: '0.0', step: 0.000001 },
    { key: 'width', label: 'Width (ft)', type: 'number', placeholder: '0', min: 0 },
    { key: 'height', label: 'Height (ft)', type: 'number', placeholder: '0', min: 0 },
    { key: 'budget', label: 'Budget', type: 'number', defaultValue: 0, min: 0 },
  ];

  const filtered = useMemo(() => {
    return atlCampaigns.filter(a => {
      const group = STATUS_GROUPS[statusGroup];
      const matchStatus = group.statuses.length === 0 || group.statuses.includes(a.status);
      const matchType = typeFilter === 'all' || a.type === typeFilter;
      return matchStatus && matchType;
    });
  }, [atlCampaigns, statusGroup, typeFilter]);

  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium hover:text-primary cursor-pointer" onClick={() => router.push(`/atl/${r.id}`)}>{r.title}</p>
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
      sortable: true,
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
      key: 'budget',
      header: 'Budget',
      sortable: true,
      render: (r) => formatCurrency(r.budget),
    },
    {
      key: 'area_sqft',
      header: 'Area',
      sortable: true,
      render: (r) => r.area_sqft ? `${r.area_sqft} sqft` : '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} label={ATL_STATUS_LABELS[r.status as ATLStatus]} />,
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

  const typeOptions = ['all', ...Object.keys(ATL_TYPE_LABELS)];

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="ATL Campaigns"
        description="Above-the-line marketing — hoardings, GSB, gate branding, and more"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, 'atl-campaigns')}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => { setEditRecord(null); setShowForm(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> New ATL
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_GROUPS.map((group, i) => (
            <Button
              key={group.label}
              variant={statusGroup === i ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusGroup(i)}
            >
              {group.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            {typeOptions.map(t => (
              <option key={t} value={t}>{t === 'all' ? 'All Types' : ATL_TYPE_LABELS[t as keyof typeof ATL_TYPE_LABELS]}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button size="sm" variant="destructive" onClick={() => { setDeleteRecord({ id: selectedIds[0], name: `${selectedIds.length} ATL campaigns`, bulkIds: selectedIds }); }}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete Selected
          </Button>
        </div>
      )}

      <Card className="p-5">
        <DataTable
          data={filtered}
          columns={columns}
          searchKeys={['title', 'location']}
          searchPlaceholder="Search ATL campaigns..."
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => router.push(`/atl/${row.id}`)}
        />
      </Card>
      <EntityFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        table="atl_campaigns"
        title={editRecord ? 'Edit ATL Campaign' : 'New ATL Campaign'}
        description={editRecord ? 'Update ATL campaign' : 'Create a new above-the-line marketing asset'}
        fields={atlFields}
        editId={editRecord?.id}
        onSuccess={refetch}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table="atl_campaigns"
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.title || 'ATL Campaign'}
        onSuccess={() => { refetch(); setSelectedIds([]); }}
      />
    </div>
  );
}
