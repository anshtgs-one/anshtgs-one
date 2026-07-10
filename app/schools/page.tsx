'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Users, Plus, Search, GraduationCap, Target, Phone, Mail, Pencil, Trash2, Download } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/status-badge';
import { useSchools, useLeads, useATLCampaigns, useBTLCampaigns, useSchoolDetails, useAdmissionStats } from '@/lib/hooks';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { formatCurrency, cn } from '@/lib/utils';
import { exportCSV } from '@/lib/export';

export default function SchoolsPage() {
  const { data: schools, loading } = useSchools();
  const { data: leads } = useLeads();
  const { data: atlCampaigns } = useATLCampaigns();
  const { data: btlCampaigns } = useBTLCampaigns();
  const { data: schoolDetails } = useSchoolDetails();
  const { data: admissionStats } = useAdmissionStats();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);
  const { refetch } = useSchools();

  const schoolFields: FormField[] = [
    { key: 'name', label: 'School Name', type: 'text', required: true, placeholder: 'TGS New School' },
    { key: 'code', label: 'School Code', type: 'text', required: true, placeholder: 'TGS-XXX' },
    { key: 'city', label: 'City', type: 'text', required: true, placeholder: 'City name' },
    { key: 'state', label: 'State', type: 'text', required: true, placeholder: 'State name' },
    { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Full address' },
    { key: 'sig_name', label: 'SIG Name', type: 'text', placeholder: 'SIG person name' },
    { key: 'sig_phone', label: 'SIG Phone', type: 'tel', placeholder: 'Phone number' },
    { key: 'sig_email', label: 'SIG Email', type: 'email', placeholder: 'email@example.com' },
    { key: 'capacity', label: 'Capacity', type: 'number', placeholder: '0', min: 0 },
    { key: 'current_strength', label: 'Current Strength', type: 'number', placeholder: '0', min: 0 },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'planning', options: [
      { value: 'active', label: 'Active' },
      { value: 'planning', label: 'Planning' },
      { value: 'inactive', label: 'Inactive' },
    ] },
  ];

  const filtered = useMemo(() => {
    return schools.filter(s => {
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.city.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [schools, search, statusFilter]);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Schools"
        description="Manage all TGS and THS school locations, profiles, and admission targets"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, 'schools')}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => { setEditRecord(null); setShowForm(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Add School
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'planning', 'inactive'].map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-56 animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((school) => {
            const schoolLeads = leads.filter(l => l.school_id === school.id);
            const schoolATL = atlCampaigns.filter(a => a.school_id === school.id);
            const schoolBTL = btlCampaigns.filter(b => b.school_id === school.id);
            const admissions = schoolLeads.filter(l => l.status === 'admitted').length;
            const utilization = school.capacity && school.current_strength
              ? (school.current_strength / school.capacity) * 100
              : 0;
            const details = schoolDetails.find(d => d.school_id === school.id);
            const admStat = admissionStats.find(a => a.school_id === school.id);
            const achievementPct = admStat?.target_achievement_pct || 0;

            return (
              <div key={school.id} className="relative">
                <Link href={`/schools/${school.id}`}>
                <Card className="group p-5 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{school.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {school.city}, {school.state}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={school.status} />
                  </div>

                  {details?.principal_name && (
                    <div className="mb-3 rounded-lg bg-muted/30 p-2.5">
                      <p className="text-xs font-medium text-foreground">{details.principal_name}</p>
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                        {details.principal_phone && (
                          <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{details.principal_phone}</span>
                        )}
                        {details.board && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{details.board}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                      <p className="text-lg font-bold">{schoolATL.length}</p>
                      <p className="text-[10px] text-muted-foreground">ATL</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                      <p className="text-lg font-bold">{schoolBTL.length}</p>
                      <p className="text-[10px] text-muted-foreground">BTL</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                      <p className="text-lg font-bold text-success">{admissions}</p>
                      <p className="text-[10px] text-muted-foreground">Admissions</p>
                    </div>
                  </div>

                  {admStat && (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" /> AY Target
                        </span>
                        <span className="font-medium">{admStat.total_admissions} / {admStat.ay_target}</span>
                      </div>
                      <Progress value={achievementPct} className="h-1.5" />
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{achievementPct.toFixed(1)}% achieved</span>
                        <span>{admStat.remaining_admissions} remaining</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> Strength
                      </span>
                      <span className="font-medium">{school.current_strength || 0} / {school.capacity || 0}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">SIG: <span className="font-medium text-foreground">{school.sig_name || 'Not assigned'}</span></p>
                  </div>
                </Card>
                </Link>
                <div className="absolute right-2 top-2 flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditRecord(school); setShowForm(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteRecord(school); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <EntityFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        table="schools"
        title={editRecord ? 'Edit School' : 'Add New School'}
        description={editRecord ? 'Update school information' : 'Create a new school location in the system'}
        fields={schoolFields}
        editId={editRecord?.id}
        onSuccess={refetch}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table="schools"
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.name || 'School'}
        onSuccess={refetch}
      />
    </div>
  );
}
