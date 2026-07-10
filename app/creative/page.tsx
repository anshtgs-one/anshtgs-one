'use client';

import { useState, useMemo } from 'react';
import { useCreativeRequests, useSchools } from '@/lib/hooks';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { exportCSV } from '@/lib/export';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { DataTable, type Column } from '@/components/data-table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Palette, CheckCircle2, Clock, AlertCircle, Pencil, Trash2, Download } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { CreativeRequest } from '@/lib/types';

const STATUS_FILTERS = ['all', 'requested', 'in_review', 'approved', 'in_progress', 'delivered', 'rejected'] as const;

const TYPE_LABELS: Record<CreativeRequest['type'], string> = {
  poster: 'Poster',
  standee: 'Standee',
  leaflet: 'Leaflet',
  brochure: 'Brochure',
  video: 'Video',
  social_media: 'Social Media',
  content_request: 'Content Request',
  other: 'Other',
};

const PRIORITY_STYLES: Record<CreativeRequest['priority'], string> = {
  low: 'bg-muted text-muted-foreground border-border',
  medium: 'bg-info/15 text-info border-info/20',
  high: 'bg-warning/15 text-warning border-warning/20',
  urgent: 'bg-destructive/15 text-destructive border-destructive/20',
};

function formatTypeLabel(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function CreativeHubPage() {
  const { data: requests, refetch } = useCreativeRequests();
  const { data: schools } = useSchools();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const creativeFields: FormField[] = [
    { key: 'title', label: 'Request Title', type: 'text', required: true, placeholder: 'Admission Flyer 2026' },
    { key: 'type', label: 'Type', type: 'select', required: true, defaultValue: 'poster', options: Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })) },
    { key: 'school_id', label: 'School', type: 'select', options: schools.map(s => ({ value: s.id, label: s.name })) },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe what you need' },
    { key: 'priority', label: 'Priority', type: 'select', defaultValue: 'medium', options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' },
    ] },
    { key: 'delivery_date', label: 'Delivery Date', type: 'date' },
    { key: 'dimensions', label: 'Dimensions', type: 'text', placeholder: 'e.g. 12x18 inch' },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'requested', options: [
      { value: 'requested', label: 'Requested' },
      { value: 'in_review', label: 'In Review' },
      { value: 'approved', label: 'Approved' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'rejected', label: 'Rejected' },
    ] },
  ];

  const schoolMap = useMemo(() => {
    const map = new Map<string, string>();
    schools.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [schools]);

  const filtered = useMemo(() => {
    return requests.filter((r) => statusFilter === 'all' || r.status === statusFilter);
  }, [requests, statusFilter]);

  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length;
  const deliveredCount = requests.filter((r) => r.status === 'delivered').length;
  const pendingApprovalCount = requests.filter(
    (r) => r.status === 'in_review' || r.status === 'approved'
  ).length;

  const columns: Column<CreativeRequest>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.title}</p>
          {r.description && (
            <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
              {r.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (r) => (
        <Badge variant="outline" className="font-medium">
          {TYPE_LABELS[r.type] ?? formatTypeLabel(r.type)}
        </Badge>
      ),
    },
    {
      key: 'school_id',
      header: 'School',
      sortable: true,
      render: (r) => (r.school_id ? schoolMap.get(r.school_id) ?? '-' : '-'),
    },
    {
      key: 'assigned_to',
      header: 'Assigned To',
      render: (r) => (r.assigned_to ? r.assigned_to : <span className="text-muted-foreground">Unassigned</span>),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (r) => (
        <Badge variant="outline" className={`font-medium capitalize ${PRIORITY_STYLES[r.priority]}`}>
          {r.priority}
        </Badge>
      ),
    },
    {
      key: 'delivery_date',
      header: 'Delivery Date',
      sortable: true,
      render: (r) => formatDate(r.delivery_date),
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
        title="Creative Hub"
        description="Manage creative requests, approvals, and delivery timelines"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, 'creative-requests')}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => { setEditRecord(null); setShowForm(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> New Request
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Requests"
          value={requests.length}
          icon={<Palette className="h-5 w-5" />}
          accent="primary"
        />
        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon={<Clock className="h-5 w-5" />}
          accent="info"
        />
        <StatCard
          label="Delivered"
          value={deliveredCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="success"
        />
        <StatCard
          label="Pending Approval"
          value={pendingApprovalCount}
          icon={<AlertCircle className="h-5 w-5" />}
          accent="warning"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className="capitalize"
          >
            {s.replace(/_/g, ' ')}
          </Button>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button size="sm" variant="destructive" onClick={() => { setDeleteRecord({ id: selectedIds[0], name: `${selectedIds.length} creative requests`, bulkIds: selectedIds }); }}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete Selected
          </Button>
        </div>
      )}

      <Card className="p-5">
        <DataTable
          data={filtered}
          columns={columns}
          searchKeys={['title', 'description']}
          searchPlaceholder="Search creative requests..."
          emptyMessage="No creative requests found"
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </Card>
      <EntityFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        table="creative_requests"
        title={editRecord ? 'Edit Creative Request' : 'New Creative Request'}
        description={editRecord ? 'Update creative request' : 'Submit a new creative design request'}
        fields={creativeFields}
        editId={editRecord?.id}
        onSuccess={refetch}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table="creative_requests"
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.title || 'Creative Request'}
        onSuccess={() => { refetch(); setSelectedIds([]); }}
      />
    </div>
  );
}
