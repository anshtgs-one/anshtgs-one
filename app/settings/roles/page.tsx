'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Copy, Trash2, Edit, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ALL_MENUS = ['Overview', 'Marketing', 'Operations', 'Finance', 'Insights', 'System'];
const ALL_PAGES = [
  '/dashboard', '/schools', '/atl', '/btl', '/campaigns', '/events', '/creative',
  '/tasks', '/vendors', '/assets', '/travel', '/admissions',
  '/finance', '/savings', '/documents', '/reports',
  '/calendar', '/maps', '/notifications', '/settings',
  '/settings/users', '/settings/roles',
];

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'central_marketing', label: 'Central Marketing' },
  { value: 'sig', label: 'SIG' },
  { value: 'finance', label: 'Finance' },
  { value: 'creative_team', label: 'Creative Team' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'management', label: 'Management' },
];

interface RolePermission {
  id: string;
  role: string;
  menu_access: string[];
  page_access: string[];
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_view: boolean;
  can_approve: boolean;
  financial_limit: number;
  school_access: string[];
}

export default function AccessControlPage() {
  const { logAudit } = useAuth();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<RolePermission | null>(null);
  const [form, setForm] = useState({
    role: 'sig',
    menu_access: [] as string[],
    page_access: [] as string[],
    can_create: false,
    can_edit: false,
    can_delete: false,
    can_view: true,
    can_approve: false,
    financial_limit: 0,
    school_access: [] as string[],
  });

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('role_permissions').select('*').order('role');
    if (data) setPermissions(data as RolePermission[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const toggleArrayItem = (arr: string[], item: string): string[] => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from('role_permissions').update({
          menu_access: form.menu_access,
          page_access: form.page_access,
          can_create: form.can_create,
          can_edit: form.can_edit,
          can_delete: form.can_delete,
          can_view: form.can_view,
          can_approve: form.can_approve,
          financial_limit: Number(form.financial_limit),
          school_access: form.school_access,
        }).eq('id', editing.id);
        if (error) throw error;
        toast.success('Role permissions updated');
        await logAudit('update', 'role_permissions', editing.id, `Updated permissions for ${editing.role}`);
      } else {
        const { error } = await supabase.from('role_permissions').insert({
          role: form.role,
          menu_access: form.menu_access,
          page_access: form.page_access,
          can_create: form.can_create,
          can_edit: form.can_edit,
          can_delete: form.can_delete,
          can_view: form.can_view,
          can_approve: form.can_approve,
          financial_limit: Number(form.financial_limit),
          school_access: form.school_access,
        });
        if (error) throw error;
        toast.success('Role created');
        await logAudit('create', 'role_permissions', form.role, `Created role ${form.role}`);
      }
      setShowEdit(false);
      setShowCreate(false);
      setEditing(null);
      fetchPermissions();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const [saving, setSaving] = useState(false);

  const handleDuplicate = async (perm: RolePermission) => {
    const newRole = `${perm.role}_copy_${Date.now()}`;
    try {
      const { error } = await supabase.from('role_permissions').insert({
        role: newRole,
        menu_access: perm.menu_access,
        page_access: perm.page_access,
        can_create: perm.can_create,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete,
        can_view: perm.can_view,
        can_approve: perm.can_approve,
        financial_limit: perm.financial_limit,
        school_access: perm.school_access,
      });
      if (error) throw error;
      toast.success('Role duplicated');
      fetchPermissions();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (perm: RolePermission) => {
    if (['super_admin', 'central_marketing', 'sig', 'finance', 'creative_team', 'vendor', 'management'].includes(perm.role)) {
      toast.error('Cannot delete a system role');
      return;
    }
    const { error } = await supabase.from('role_permissions').delete().eq('id', perm.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Role deleted');
      fetchPermissions();
    }
  };

  const openEdit = (perm: RolePermission) => {
    setEditing(perm);
    setForm({
      role: perm.role,
      menu_access: perm.menu_access,
      page_access: perm.page_access,
      can_create: perm.can_create,
      can_edit: perm.can_edit,
      can_delete: perm.can_delete,
      can_view: perm.can_view,
      can_approve: perm.can_approve,
      financial_limit: perm.financial_limit,
      school_access: perm.school_access,
    });
    setShowEdit(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      role: 'sig',
      menu_access: [],
      page_access: [],
      can_create: false,
      can_edit: false,
      can_delete: false,
      can_view: true,
      can_approve: false,
      financial_limit: 0,
      school_access: [],
    });
    setShowCreate(true);
  };

  const renderForm = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-xs">Role Name</Label>
        {editing ? (
          <Input value={ROLE_OPTIONS.find(r => r.value === editing.role)?.label || editing.role} readOnly />
        ) : (
          <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ROLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      <div>
        <Label className="text-xs mb-2 block">Menu Access</Label>
        <div className="flex flex-wrap gap-2">
          {ALL_MENUS.map(menu => (
            <button
              key={menu}
              onClick={() => setForm(f => ({ ...f, menu_access: toggleArrayItem(f.menu_access, menu) }))}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                form.menu_access.includes(menu) ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'
              )}
            >
              {menu}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs mb-2 block">Page Access</Label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {ALL_PAGES.map(page => (
            <button
              key={page}
              onClick={() => setForm(f => ({ ...f, page_access: toggleArrayItem(f.page_access, page) }))}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-colors',
                form.page_access.includes(page) ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'
              )}
            >
              {page}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'can_view', label: 'Can View' },
          { key: 'can_create', label: 'Can Create' },
          { key: 'can_edit', label: 'Can Edit' },
          { key: 'can_delete', label: 'Can Delete' },
          { key: 'can_approve', label: 'Can Approve' },
        ].map(perm => (
          <div key={perm.key} className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label className="text-xs">{perm.label}</Label>
            <Switch
              checked={(form as any)[perm.key]}
              onCheckedChange={(v) => setForm(f => ({ ...f, [perm.key]: v }))}
            />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Financial Approval Limit (₹)</Label>
        <Input
          type="number"
          value={form.financial_limit}
          onChange={e => setForm(f => ({ ...f, financial_limit: Number(e.target.value) }))}
          placeholder="0"
          min={0}
        />
      </div>

      <div>
        <Label className="text-xs mb-2 block">School Access</Label>
        <div className="flex flex-wrap gap-2">
          {['all', 'assigned'].map(s => (
            <button
              key={s}
              onClick={() => setForm(f => ({ ...f, school_access: toggleArrayItem(f.school_access, s) }))}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                form.school_access.includes(s) ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'
              )}
            >
              {s === 'all' ? 'All Schools' : 'Assigned Only'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Access Control Center"
        description="Manage role-based permissions, menu access, and CRUD rights for each role"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Role
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {permissions.map(perm => {
          const roleLabel = ROLE_OPTIONS.find(r => r.value === perm.role)?.label || perm.role;
          return (
            <Card key={perm.id} className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{roleLabel}</h3>
                    <p className="text-[10px] text-muted-foreground">{perm.role}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEdit(perm)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleDuplicate(perm)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  {!['super_admin', 'central_marketing', 'sig', 'finance', 'creative_team', 'vendor', 'management'].includes(perm.role) && (
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => handleDelete(perm)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-1.5">MENU ACCESS</p>
                  <div className="flex flex-wrap gap-1">
                    {perm.menu_access.length > 0 ? perm.menu_access.map(m => (
                      <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
                    )) : <span className="text-xs text-muted-foreground">None</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'can_view', label: 'View', value: perm.can_view },
                    { key: 'can_create', label: 'Create', value: perm.can_create },
                    { key: 'can_edit', label: 'Edit', value: perm.can_edit },
                    { key: 'can_delete', label: 'Delete', value: perm.can_delete },
                    { key: 'can_approve', label: 'Approve', value: perm.can_approve },
                  ].map(p => (
                    <div key={p.key} className={cn('flex items-center gap-1 rounded px-2 py-0.5 text-[10px]', p.value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400')}>
                      {p.value ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                      {p.label}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Financial Limit</span>
                  <span className="font-medium">₹{perm.financial_limit.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">School Access</span>
                  <span className="font-medium">{perm.school_access.includes('all') ? 'All Schools' : perm.school_access.length > 0 ? 'Assigned Only' : 'None'}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={showEdit || showCreate} onOpenChange={(v) => { setShowEdit(v); setShowCreate(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit Role: ${ROLE_OPTIONS.find(r => r.value === editing.role)?.label || editing.role}` : 'Add New Role'}</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEdit(false); setShowCreate(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
