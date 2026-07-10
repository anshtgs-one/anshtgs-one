'use client';

import { useState, useMemo } from 'react';
import { FileText, Folder, ExternalLink, Upload, Search, Pencil, Trash2, Download } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDocuments, useSchools } from '@/lib/hooks';
import { formatDate, cn } from '@/lib/utils';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { exportCSV } from '@/lib/export';

const CATEGORIES = [
  { key: 'all', label: 'All Documents', icon: Folder },
  { key: 'creative', label: 'Creative', icon: FileText },
  { key: 'photos', label: 'Photos', icon: FileText },
  { key: 'videos', label: 'Videos', icon: FileText },
  { key: 'ppt', label: 'Presentations', icon: FileText },
  { key: 'mom', label: 'MOM', icon: FileText },
  { key: 'quotation', label: 'Quotations', icon: FileText },
  { key: 'invoice', label: 'Invoices', icon: FileText },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'drive_link', label: 'Drive Links', icon: ExternalLink },
];

export default function DocumentsPage() {
  const { data: documents, loading, refetch } = useDocuments();
  const { data: schools } = useSchools();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);

  const docFields: FormField[] = [
    { key: 'title', label: 'Document Title', type: 'text', required: true, placeholder: 'Admission Report Q1' },
    { key: 'category', label: 'Category', type: 'select', required: true, defaultValue: 'reports', options: [
      { value: 'creative', label: 'Creative' },
      { value: 'photos', label: 'Photos' },
      { value: 'videos', label: 'Videos' },
      { value: 'ppt', label: 'Presentations' },
      { value: 'mom', label: 'MOM' },
      { value: 'quotation', label: 'Quotations' },
      { value: 'invoice', label: 'Invoices' },
      { value: 'reports', label: 'Reports' },
      { value: 'drive_link', label: 'Drive Link' },
      { value: 'other', label: 'Other' },
    ] },
    { key: 'school_id', label: 'School', type: 'select', options: schools.map(s => ({ value: s.id, label: s.name })) },
    { key: 'drive_link', label: 'Drive Link', type: 'text', placeholder: 'https://drive.google.com/...' },
    { key: 'file_type', label: 'File Type', type: 'text', placeholder: 'e.g. PDF, JPG, MP4' },
    { key: 'file_size', label: 'File Size', type: 'text', placeholder: 'e.g. 2.5 MB' },
  ];

  const filtered = useMemo(() => {
    return documents.filter(d => {
      const matchCat = category === 'all' || d.category === category;
      const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [documents, category, search]);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Documents"
        description="Centralized document management with categories and drive links"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, 'documents')}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => { setEditRecord(null); setShowForm(true); }}>
              <Upload className="mr-1.5 h-4 w-4" /> Upload Document
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const count = cat.key === 'all' ? documents.length : documents.filter(d => d.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                category === cat.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'
              )}
            >
              <Icon className="h-4 w-4" />
              {cat.label}
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', category === cat.key ? 'bg-primary-foreground/20' : 'bg-muted')}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No documents found. Upload your first document to get started.</p>
          </Card>
        ) : (
          filtered.map(doc => {
            const school = schools.find(s => s.id === doc.school_id);
            return (
              <Card key={doc.id} className="group relative p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={() => { setEditRecord(doc); setShowForm(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 text-destructive"
                    onClick={() => setDeleteRecord(doc)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    {doc.category === 'drive_link' ? <ExternalLink className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] capitalize">{doc.category.replace(/_/g, ' ')}</Badge>
                      {school && <span className="text-[10px] text-muted-foreground">{school.code}</span>}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(doc.created_at)}</p>
                  </div>
                </div>
                {doc.drive_link && (
                  <a href={doc.drive_link} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> Open in Drive
                  </a>
                )}
              </Card>
            );
          })
        )}
      </div>

      <EntityFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        table="documents"
        title={editRecord ? 'Edit Document' : 'Add Document'}
        description={editRecord ? 'Update document information' : 'Add a document or drive link to the system'}
        fields={docFields}
        editId={editRecord?.id}
        onSuccess={refetch}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table="documents"
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.title || 'Document'}
        onSuccess={refetch}
      />
    </div>
  );
}
