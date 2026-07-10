'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, MapPin, Users, Wallet, Pencil, Trash2, Download } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { DataTable, type Column } from '@/components/data-table';
import { useEvents, useSchools, useVendors } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { exportCSV } from '@/lib/export';

export default function EventsPage() {
  const router = useRouter();
  const { data: events, loading, refetch } = useEvents();
  const { data: schools } = useSchools();
  const { data: vendors } = useVendors();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const eventFields: FormField[] = [
    { key: 'title', label: 'Event Title', type: 'text', required: true, placeholder: 'Annual Day 2026' },
    { key: 'type', label: 'Type', type: 'text', required: true, placeholder: 'e.g. cultural, sports, academic' },
    { key: 'school_id', label: 'School', type: 'select', options: schools.map(s => ({ value: s.id, label: s.name })) },
    { key: 'venue', label: 'Venue', type: 'text', placeholder: 'Event venue' },
    { key: 'start_date', label: 'Start Date', type: 'date' },
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

  const filtered = useMemo(() => {
    return statusFilter === 'all' ? events : events.filter(e => e.status === statusFilter);
  }, [events, statusFilter]);

  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Event',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium hover:text-primary cursor-pointer" onClick={() => router.push(`/events/${r.id}`)}>{r.title}</p>
          {r.venue && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{r.venue}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (r) => <Badge variant="outline" className="capitalize">{r.type.replace(/_/g, ' ')}</Badge>,
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
      key: 'start_date',
      header: 'Start Date',
      sortable: true,
      render: (r) => formatDate(r.start_date),
    },
    {
      key: 'expected_attendance',
      header: 'Expected',
      sortable: true,
    },
    {
      key: 'budget',
      header: 'Budget',
      sortable: true,
      render: (r) => formatCurrency(r.budget),
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
        title="Events"
        description="Event workspaces with timeline, tasks, vendors, and galleries"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, 'events')}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => { setEditRecord(null); setShowForm(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> New Event
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Events" value={events.length} icon={<Calendar className="h-5 w-5" />} accent="primary" />
        <StatCard label="Active" value={events.filter(e => e.status === 'active').length} icon={<Calendar className="h-5 w-5" />} accent="info" />
        <StatCard label="Completed" value={events.filter(e => e.status === 'completed').length} icon={<Calendar className="h-5 w-5" />} accent="success" />
        <StatCard label="Total Budget" value={formatCurrency(events.reduce((s, e) => s + e.budget, 0))} icon={<Wallet className="h-5 w-5" />} accent="warning" />
      </div>

      <div className="mb-4 flex items-center gap-2">
        {['all', 'planning', 'active', 'completed', 'cancelled'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">{s}</Button>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button size="sm" variant="destructive" onClick={() => { setDeleteRecord({ id: selectedIds[0], name: `${selectedIds.length} events`, bulkIds: selectedIds }); }}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete Selected
          </Button>
        </div>
      )}

      <Card className="p-5">
        <DataTable
          data={filtered}
          columns={columns}
          searchKeys={['title', 'venue']}
          searchPlaceholder="Search events..."
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => router.push(`/events/${row.id}`)}
        />
      </Card>
      <EntityFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        table="events"
        title={editRecord ? 'Edit Event' : 'New Event'}
        description={editRecord ? 'Update event information' : 'Create a new event'}
        fields={eventFields}
        editId={editRecord?.id}
        onSuccess={refetch}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table="events"
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.title || 'Event'}
        onSuccess={() => { refetch(); setSelectedIds([]); }}
      />
    </div>
  );
}
