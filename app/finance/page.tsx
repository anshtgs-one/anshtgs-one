'use client';

import { useMemo, useState } from 'react';
import { useBudgets, useExpenses, useInvoices, useSchools, useVendors } from '@/lib/hooks';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { DataTable, type Column } from '@/components/data-table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Wallet, TrendingUp, FileText, Receipt, Plus, Pencil, Trash2, Download } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { exportCSV } from '@/lib/export';
import type { Budget, Expense, Invoice } from '@/lib/types';

export default function FinancePage() {
  const { data: budgets, refetch: refetchBudgets } = useBudgets();
  const { data: expenses, refetch: refetchExpenses } = useExpenses();
  const { data: invoices, refetch: refetchInvoices } = useInvoices();
  const { data: schools } = useSchools();
  const { data: vendors } = useVendors();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  const expenseFields: FormField[] = [
    { key: 'description', label: 'Description', type: 'text', required: true, placeholder: 'Printing cost for hoarding' },
    { key: 'category', label: 'Category', type: 'select', required: true, defaultValue: 'atl', options: [
      { value: 'atl', label: 'ATL' },
      { value: 'btl', label: 'BTL' },
      { value: 'event', label: 'Event' },
      { value: 'creative', label: 'Creative' },
      { value: 'travel', label: 'Travel' },
      { value: 'vendor', label: 'Vendor' },
      { value: 'misc', label: 'Misc' },
    ] },
    { key: 'amount', label: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    { key: 'school_id', label: 'School', type: 'select', options: schools.map(s => ({ value: s.id, label: s.name })) },
    { key: 'vendor_id', label: 'Vendor', type: 'select', options: vendors.map(v => ({ value: v.id, label: v.name })) },
    { key: 'expense_date', label: 'Expense Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'pending', options: [
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'paid', label: 'Paid' },
    ] },
  ];

  const invoiceFields: FormField[] = [
    { key: 'invoice_number', label: 'Invoice Number', type: 'text', required: true, placeholder: 'INV-2026-001' },
    { key: 'vendor_id', label: 'Vendor', type: 'select', options: vendors.map(v => ({ value: v.id, label: v.name })) },
    { key: 'school_id', label: 'School', type: 'select', options: schools.map(s => ({ value: s.id, label: s.name })) },
    { key: 'amount', label: 'Amount', type: 'number', required: true, min: 0, step: 0.01 },
    { key: 'tax_amount', label: 'Tax Amount', type: 'number', defaultValue: 0, min: 0, step: 0.01 },
    { key: 'invoice_date', label: 'Invoice Date', type: 'date' },
    { key: 'due_date', label: 'Due Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'pending', options: [
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'paid', label: 'Paid' },
      { value: 'rejected', label: 'Rejected' },
    ] },
  ];

  const schoolMap = useMemo(() => {
    const map = new Map<string, string>();
    schools.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [schools]);

  const vendorMap = useMemo(() => {
    const map = new Map<string, string>();
    vendors.forEach((v) => map.set(v.id, v.name));
    return map;
  }, [vendors]);

  const totalAllocated = useMemo(
    () => budgets.reduce((sum, b) => sum + b.allocated, 0),
    [budgets],
  );
  const totalSpent = useMemo(
    () => budgets.reduce((sum, b) => sum + b.spent, 0),
    [budgets],
  );
  const pendingApprovals = useMemo(
    () => expenses.filter((e) => e.status === 'pending').length,
    [expenses],
  );
  const totalInvoices = useMemo(
    () => invoices.reduce((sum, i) => sum + i.total_amount, 0),
    [invoices],
  );

  const budgetColumns: Column<Budget>[] = [
    {
      key: 'school',
      header: 'School',
      sortable: true,
      render: (r) => (
        <span className="font-medium">{schoolMap.get(r.school_id) || '—'}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (r) => (
        <Badge variant="outline" className="uppercase">
          {r.category}
        </Badge>
      ),
    },
    {
      key: 'fiscal_year',
      header: 'Fiscal Year',
      sortable: true,
      render: (r) => <span className="text-sm">{r.fiscal_year}</span>,
    },
    {
      key: 'quarter',
      header: 'Quarter',
      sortable: true,
      render: (r) => (
        <Badge variant="outline" className="capitalize">
          {r.quarter || '—'}
        </Badge>
      ),
    },
    {
      key: 'allocated',
      header: 'Allocated',
      sortable: true,
      render: (r) => (
        <span className="font-medium text-foreground">{formatCurrency(r.allocated)}</span>
      ),
    },
    {
      key: 'spent',
      header: 'Spent',
      sortable: true,
      render: (r) => (
        <span className="font-medium text-muted-foreground">{formatCurrency(r.spent)}</span>
      ),
    },
    {
      key: 'utilization',
      header: 'Utilization',
      render: (r) => {
        const pct = r.allocated > 0 ? Math.min((r.spent / r.allocated) * 100, 100) : 0;
        const tone =
          pct >= 90 ? 'text-destructive' : pct >= 70 ? 'text-warning' : 'text-success';
        return (
          <div className="flex items-center gap-2 min-w-[140px]">
            <Progress value={pct} className="h-2 flex-1" />
            <span className={cn('text-xs font-semibold tabular-nums w-10 text-right', tone)}>
              {pct.toFixed(0)}%
            </span>
          </div>
        );
      },
    },
  ];

  const expenseColumns: Column<Expense>[] = [
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium">{r.description}</p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">{r.category}</p>
        </div>
      ),
    },
    {
      key: 'school',
      header: 'School',
      sortable: true,
      render: (r) => (
        <span className="text-sm">{(r.school_id && schoolMap.get(r.school_id)) || '—'}</span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (r) => (
        <Badge variant="outline" className="capitalize">
          {r.category}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (r) => (
        <span className="font-medium text-foreground">{formatCurrency(r.amount)}</span>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (r) => (
        <span className="text-sm">{(r.vendor_id && vendorMap.get(r.vendor_id)) || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'expense_date',
      header: 'Date',
      sortable: true,
      render: (r) => formatDate(r.expense_date),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditRecord(r); setShowExpenseForm(true); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteRecord(r)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const invoiceColumns: Column<Invoice>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      sortable: true,
      render: (r) => <span className="font-mono text-sm font-medium">{r.invoice_number}</span>,
    },
    {
      key: 'vendor',
      header: 'Vendor',
      sortable: true,
      render: (r) => (
        <span className="text-sm">{(r.vendor_id && vendorMap.get(r.vendor_id)) || '—'}</span>
      ),
    },
    {
      key: 'school',
      header: 'School',
      sortable: true,
      render: (r) => (
        <span className="text-sm">{(r.school_id && schoolMap.get(r.school_id)) || '—'}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (r) => (
        <span className="font-medium text-foreground">{formatCurrency(r.amount)}</span>
      ),
    },
    {
      key: 'tax_amount',
      header: 'Tax',
      sortable: true,
      render: (r) => (
        <span className="text-muted-foreground">{formatCurrency(r.tax_amount)}</span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total',
      sortable: true,
      render: (r) => (
        <span className="font-semibold text-foreground">{formatCurrency(r.total_amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (r) => formatDate(r.due_date),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditRecord(r); setShowInvoiceForm(true); }}>
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
        title="Budget & Finance"
        description="Budget allocation, expense tracking, and invoice management"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowInvoiceForm(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New Invoice
            </Button>
            <Button size="sm" onClick={() => { setEditRecord(null); setShowExpenseForm(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> New Expense
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Allocated"
          value={formatCurrency(totalAllocated)}
          icon={<Wallet className="h-5 w-5" />}
          accent="primary"
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="warning"
        />
        <StatCard
          label="Pending Approvals"
          value={pendingApprovals}
          icon={<Receipt className="h-5 w-5" />}
          accent="info"
        />
        <StatCard
          label="Total Invoices"
          value={formatCurrency(totalInvoices)}
          icon={<FileText className="h-5 w-5" />}
          accent="success"
        />
      </div>

      <Tabs defaultValue="budget" className="space-y-4">
        <TabsList>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <Card className="p-5">
            <DataTable
              data={budgets}
              columns={budgetColumns}
              searchKeys={['fiscal_year', 'category']}
              searchPlaceholder="Search budgets..."
              emptyMessage="No budget allocations found"
            />
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="mb-4 flex items-center justify-end">
            <Button size="sm" variant="outline" onClick={() => exportCSV(expenses, 'expenses')}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
          </div>
          {selectedExpenseIds.length > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
              <span className="text-sm font-medium">{selectedExpenseIds.length} selected</span>
              <Button size="sm" variant="destructive" onClick={() => { setDeleteRecord({ id: selectedExpenseIds[0], name: `${selectedExpenseIds.length} expenses`, bulkIds: selectedExpenseIds }); }}>
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete Selected
              </Button>
            </div>
          )}
          <Card className="p-5">
            <DataTable
              data={expenses}
              columns={expenseColumns}
              searchKeys={['description', 'category']}
              searchPlaceholder="Search expenses..."
              emptyMessage="No expenses recorded"
              selectable
              selectedIds={selectedExpenseIds}
              onSelectionChange={setSelectedExpenseIds}
            />
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <div className="mb-4 flex items-center justify-end">
            <Button size="sm" variant="outline" onClick={() => exportCSV(invoices, 'invoices')}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
          </div>
          {selectedInvoiceIds.length > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
              <span className="text-sm font-medium">{selectedInvoiceIds.length} selected</span>
              <Button size="sm" variant="destructive" onClick={() => { setDeleteRecord({ id: selectedInvoiceIds[0], name: `${selectedInvoiceIds.length} invoices`, bulkIds: selectedInvoiceIds }); }}>
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete Selected
              </Button>
            </div>
          )}
          <Card className="p-5">
            <DataTable
              data={invoices}
              columns={invoiceColumns}
              searchKeys={['invoice_number']}
              searchPlaceholder="Search invoices..."
              emptyMessage="No invoices found"
              selectable
              selectedIds={selectedInvoiceIds}
              onSelectionChange={setSelectedInvoiceIds}
            />
          </Card>
        </TabsContent>
      </Tabs>

      <EntityFormDialog
        open={showExpenseForm}
        onOpenChange={(o) => { setShowExpenseForm(o); if (!o) setEditRecord(null); }}
        table="expenses"
        title={editRecord ? 'Edit Expense' : 'New Expense'}
        description={editRecord ? 'Update expense' : 'Record a new expense'}
        fields={expenseFields}
        editId={editRecord?.id}
        onSuccess={refetchExpenses}
      />
      <EntityFormDialog
        open={showInvoiceForm}
        onOpenChange={(o) => { setShowInvoiceForm(o); if (!o) setEditRecord(null); }}
        table="invoices"
        title={editRecord ? 'Edit Invoice' : 'New Invoice'}
        description={editRecord ? 'Update invoice' : 'Record a new invoice'}
        fields={invoiceFields}
        editId={editRecord?.id}
        onSuccess={refetchInvoices}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table={deleteRecord?.invoice_number ? 'invoices' : 'expenses'}
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.description || deleteRecord?.invoice_number || 'Record'}
        onSuccess={() => { refetchExpenses(); refetchInvoices(); setSelectedExpenseIds([]); setSelectedInvoiceIds([]); }}
      />
    </div>
  );
}
