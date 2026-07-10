'use client';

import { useState, useMemo } from 'react';
import { Plus, Plane, MapPin, Calendar, Wallet, Users, Pencil, Trash2, Download } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/data-table';
import { useTravelPlans, useSchools, useUsers } from '@/lib/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { exportCSV } from '@/lib/export';

export default function TravelPage() {
  const { data: travelPlans, loading, refetch } = useTravelPlans();
  const { data: schools } = useSchools();
  const { data: users } = useUsers();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const travelFields: FormField[] = [
    { key: 'title', label: 'Trip Title', type: 'text', required: true, placeholder: 'Site visit to TGS Bhopal' },
    { key: 'type', label: 'Type', type: 'select', required: true, defaultValue: 'local_visit', options: [
      { value: 'local_visit', label: 'Local Visit' },
      { value: 'education_tour', label: 'Education Tour' },
      { value: 'one_day_visit', label: 'One Day Visit' },
      { value: 'hotel', label: 'Hotel' },
      { value: 'transport', label: 'Transport' },
      { value: 'cab', label: 'Cab' },
      { value: 'train', label: 'Train' },
      { value: 'flight', label: 'Flight' },
    ] },
    { key: 'school_id', label: 'School', type: 'select', options: schools.map(s => ({ value: s.id, label: s.name })) },
    { key: 'origin', label: 'Origin', type: 'text', placeholder: 'Departure city' },
    { key: 'destination', label: 'Destination', type: 'text', placeholder: 'Destination city' },
    { key: 'departure_date', label: 'Departure Date', type: 'date' },
    { key: 'return_date', label: 'Return Date', type: 'date' },
    { key: 'transport_mode', label: 'Transport Mode', type: 'text', placeholder: 'e.g. cab, train, flight' },
    { key: 'hotel_name', label: 'Hotel Name', type: 'text', placeholder: 'Hotel name' },
    { key: 'hotel_cost', label: 'Hotel Cost', type: 'number', defaultValue: 0, min: 0 },
    { key: 'transport_cost', label: 'Transport Cost', type: 'number', defaultValue: 0, min: 0 },
    { key: 'misc_cost', label: 'Misc Cost', type: 'number', defaultValue: 0, min: 0 },
    { key: 'total_budget', label: 'Total Budget', type: 'number', defaultValue: 0, min: 0 },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'planning', options: [
      { value: 'planning', label: 'Planning' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'completed', label: 'Completed' },
    ] },
  ];

  const filtered = useMemo(() => {
    return statusFilter === 'all' ? travelPlans : travelPlans.filter(t => t.status === statusFilter);
  }, [travelPlans, statusFilter]);

  const totalBudget = travelPlans.reduce((s, t) => s + t.total_budget, 0);
  const totalActual = travelPlans.reduce((s, t) => s + t.actual_cost, 0);
  const approved = travelPlans.filter(t => t.status === 'approved').length;
  const completed = travelPlans.filter(t => t.status === 'completed').length;

  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Trip',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium">{r.title}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" /> {r.origin} → {r.destination}
          </p>
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
      key: 'departure_date',
      header: 'Departure',
      sortable: true,
      render: (r) => formatDate(r.departure_date),
    },
    {
      key: 'transport_mode',
      header: 'Transport',
      render: (r) => r.transport_mode ? <Badge variant="outline" className="capitalize">{r.transport_mode}</Badge> : '-',
    },
    {
      key: 'total_budget',
      header: 'Budget',
      sortable: true,
      render: (r) => formatCurrency(r.total_budget),
    },
    {
      key: 'actual_cost',
      header: 'Actual',
      sortable: true,
      render: (r) => formatCurrency(r.actual_cost),
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
        title="Travel Planner"
        description="Plan and track travel for site visits, education tours, and inspections"
        actions={<div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, 'travel-plans')}>
            <Download className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => { setEditRecord(null); setShowForm(true); }}><Plus className="mr-1.5 h-4 w-4" /> New Trip</Button>
        </div>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Trips" value={travelPlans.length} icon={<Plane className="h-5 w-5" />} accent="primary" />
        <StatCard label="Approved" value={approved} icon={<Plane className="h-5 w-5" />} accent="success" />
        <StatCard label="Total Budget" value={formatCurrency(totalBudget)} icon={<Wallet className="h-5 w-5" />} accent="info" />
        <StatCard label="Total Actual" value={formatCurrency(totalActual)} icon={<Wallet className="h-5 w-5" />} accent="warning" />
      </div>

      <div className="mb-4 flex items-center gap-2">
        {['all', 'planning', 'approved', 'rejected', 'completed'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">{s}</Button>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button size="sm" variant="destructive" onClick={() => { setDeleteRecord({ id: selectedIds[0], name: `${selectedIds.length} travel plans`, bulkIds: selectedIds }); }}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete Selected
          </Button>
        </div>
      )}

      <Card className="p-5">
        <DataTable
          data={filtered}
          columns={columns}
          searchKeys={['title', 'origin', 'destination']}
          searchPlaceholder="Search trips..."
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </Card>

      <EntityFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        table="travel_plans"
        title={editRecord ? 'Edit Travel Plan' : 'New Travel Plan'}
        description={editRecord ? 'Update travel plan' : 'Plan a new trip or travel arrangement'}
        fields={travelFields}
        editId={editRecord?.id}
        onSuccess={refetch}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table="travel_plans"
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.title || 'Travel Plan'}
        onSuccess={() => { refetch(); setSelectedIds([]); }}
      />
    </div>
  );
}
