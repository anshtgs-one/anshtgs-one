'use client';

import { useState, useMemo } from 'react';
import { Plus, Truck, Star, Phone, MapPin, Building2, Pencil, Trash2, Download } from 'lucide-react';
import { useVendors } from '@/lib/hooks';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getRatingStars } from '@/lib/utils';
import { exportCSV } from '@/lib/export';

const VENDOR_TYPES = [
  'all',
  'printing',
  'outdoor',
  'fabrication',
  'event',
  'creative',
  'digital',
  'transport',
] as const;

type VendorTypeFilter = (typeof VENDOR_TYPES)[number];

const TYPE_LABELS: Record<string, string> = {
  printing: 'Printing',
  outdoor: 'Outdoor',
  fabrication: 'Fabrication',
  event: 'Event',
  creative: 'Creative',
  digital: 'Digital',
  transport: 'Transport',
  installation: 'Installation',
  other: 'Other',
};

const TYPE_ACCENT: Record<string, string> = {
  printing: 'bg-chart-5/15 text-chart-5',
  outdoor: 'bg-chart-3/15 text-chart-3',
  fabrication: 'bg-chart-4/15 text-chart-4',
  event: 'bg-chart-6/15 text-chart-6',
  creative: 'bg-primary/15 text-primary',
  digital: 'bg-info/15 text-info',
  transport: 'bg-warning/15 text-warning',
  installation: 'bg-primary/15 text-primary',
  other: 'bg-muted text-muted-foreground',
};

export default function VendorsPage() {
  const { data: vendors, loading, refetch } = useVendors();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<VendorTypeFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);

  const vendorFields: FormField[] = [
    { key: 'name', label: 'Vendor Name', type: 'text', required: true, placeholder: 'ABC Enterprises' },
    { key: 'type', label: 'Type', type: 'select', required: true, defaultValue: 'printing', options: [
      { value: 'printing', label: 'Printing' },
      { value: 'installation', label: 'Installation' },
      { value: 'fabrication', label: 'Fabrication' },
      { value: 'digital', label: 'Digital' },
      { value: 'outdoor', label: 'Outdoor' },
      { value: 'event', label: 'Event' },
      { value: 'creative', label: 'Creative' },
      { value: 'transport', label: 'Transport' },
      { value: 'other', label: 'Other' },
    ] },
    { key: 'contact_person', label: 'Contact Person', type: 'text', placeholder: 'John Doe' },
    { key: 'phone', label: 'Phone', type: 'tel', placeholder: '9876543210' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'vendor@example.com' },
    { key: 'city', label: 'City', type: 'text', placeholder: 'City' },
    { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Full address' },
    { key: 'gst_number', label: 'GST Number', type: 'text', placeholder: 'GST number' },
    { key: 'rating', label: 'Rating (0-5)', type: 'number', defaultValue: 0, min: 0, step: 0.5 },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'active', options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'blacklisted', label: 'Blacklisted' },
    ] },
  ];

  const stats = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter((v) => v.status === 'active').length;
    const rated = vendors.filter((v) => v.rating > 0);
    const avgRating =
      rated.length > 0
        ? rated.reduce((sum, v) => sum + v.rating, 0) / rated.length
        : 0;
    const totalOrders = vendors.reduce((sum, v) => sum + (v.total_orders || 0), 0);
    return { total, active, avgRating, totalOrders };
  }, [vendors]);

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch =
        !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        (v.contact_person || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.city || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.phone || '').toLowerCase().includes(search.toLowerCase());
      const matchType =
        typeFilter === 'all' || v.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [vendors, search, typeFilter]);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Vendor Management"
        description="Manage vendor profiles, quotations, ratings, and payments"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, 'vendors')}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => { setEditRecord(null); setShowForm(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Vendor
            </Button>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Vendors"
          value={stats.total}
          icon={<Building2 className="h-5 w-5" />}
          accent="primary"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<Truck className="h-5 w-5" />}
          accent="success"
        />
        <StatCard
          label="Avg Rating"
          value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
          icon={<Star className="h-5 w-5" />}
          accent="warning"
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          icon={<Truck className="h-5 w-5" />}
          accent="info"
        />
      </div>

      {/* Search + type filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Star className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {VENDOR_TYPES.map((t) => (
            <Button
              key={t}
              variant={typeFilter === t ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(t)}
              className="capitalize"
            >
              {t === 'all' ? 'All' : TYPE_LABELS[t] || t}
            </Button>
          ))}
        </div>
      </div>

      {/* Vendor grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-56 animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No vendors found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vendor) => (
            <Card
              key={vendor.id}
              className="group relative flex flex-col p-5 transition-all hover:shadow-lg hover:border-primary/30"
            >
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => { setEditRecord(vendor); setShowForm(true); }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7 text-destructive"
                  onClick={() => setDeleteRecord(vendor)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {/* Header: icon + name + type badge */}
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                      TYPE_ACCENT[vendor.type] || TYPE_ACCENT.other
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-sm group-hover:text-primary transition-colors">
                      {vendor.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className="mt-1 capitalize"
                    >
                      {TYPE_LABELS[vendor.type] || vendor.type}
                    </Badge>
                  </div>
                </div>
                <StatusBadge status={vendor.status} />
              </div>

              {/* Contact details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {vendor.contact_person || 'No contact'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {vendor.phone || 'No phone'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {vendor.city || 'No city'}
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="font-medium tracking-wide">
                    {getRatingStars(vendor.rating)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'No ratings'}
                </span>
              </div>

              {/* Footer: total orders */}
              <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-none">
                      {vendor.total_orders || 0}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Total Orders
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-medium"
                >
                  {TYPE_LABELS[vendor.type] || vendor.type}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
      <EntityFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        table="vendors"
        title={editRecord ? 'Edit Vendor' : 'Add New Vendor'}
        description={editRecord ? 'Update vendor information' : 'Register a new vendor in the system'}
        fields={vendorFields}
        editId={editRecord?.id}
        onSuccess={refetch}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table="vendors"
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.name || 'Vendor'}
        onSuccess={refetch}
      />
    </div>
  );
}
