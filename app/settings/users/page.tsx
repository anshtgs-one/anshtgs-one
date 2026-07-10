'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Users, UserCheck, UserX, Edit } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/data-table';
import { useAuth, getInitials } from '@/lib/auth-context';
import { useSchools } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'central_marketing', label: 'Central Marketing' },
  { value: 'sig', label: 'SIG' },
  { value: 'finance', label: 'Finance' },
  { value: 'creative_team', label: 'Creative Team' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'management', label: 'Management' },
];

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-blue-700 text-white',
  central_marketing: 'bg-blue-500 text-white',
  sig: 'bg-green-600 text-white',
  finance: 'bg-amber-500 text-white',
  creative_team: 'bg-purple-500 text-white',
  vendor: 'bg-orange-500 text-white',
  management: 'bg-gray-800 text-white',
};

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  employee_id: string | null;
  designation: string | null;
  department: string | null;
  role: string;
  school_id: string | null;
  city: string | null;
  phone: string | null;
  status: string;
  last_login: string | null;
  created_at: string;
}

export default function UserManagementPage() {
  const { profile: currentProfile, logAudit } = useAuth();
  const { data: schools } = useSchools();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    email: '', full_name: '', role: 'sig', designation: '', department: '',
    phone: '', city: '', school_id: '', employee_id: '', password: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('full_name');
    if (data) setUsers(data as UserProfile[]);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = useMemo(() =>
    users.filter(u =>
      !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
    ),
    [users, search]
  );

  const handleCreate = async () => {
    if (!form.email || !form.full_name || !form.password) {
      toast.error('Email, name, and password are required');
      return;
    }
    setSaving(true);
    try {
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name } }
      });
      if (signupError) throw signupError;

      if (signupData.user) {
        await supabase.from('profiles').upsert({
          id: signupData.user.id,
          email: form.email,
          full_name: form.full_name,
          role: form.role,
          designation: form.designation,
          department: form.department,
          phone: form.phone,
          city: form.city,
          school_id: form.school_id || null,
          employee_id: form.employee_id,
          status: 'active',
        });
      }

      toast.success('User created successfully');
      await logAudit('create', 'users', signupData.user?.id || '', `Created user ${form.email}`);
      setShowCreate(false);
      setForm({ email: '', full_name: '', role: 'sig', designation: '', department: '', phone: '', city: '', school_id: '', employee_id: '', password: '' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name,
        role: form.role,
        designation: form.designation,
        department: form.department,
        phone: form.phone,
        city: form.city,
        school_id: form.school_id || null,
        employee_id: form.employee_id,
      }).eq('id', selectedUser.id);
      if (error) throw error;
      toast.success('User updated successfully');
      await logAudit('update', 'users', selectedUser.id, `Updated user ${selectedUser.email}`);
      setShowEdit(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      await logAudit('update', 'users', user.id, `${newStatus === 'active' ? 'Activated' : 'Deactivated'} user ${user.email}`);
      fetchUsers();
    }
  };

  const openEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setForm({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      designation: user.designation || '',
      department: user.department || '',
      phone: user.phone || '',
      city: user.city || '',
      school_id: user.school_id || '',
      employee_id: user.employee_id || '',
      password: '',
    });
    setShowEdit(true);
  };

  const columns: Column<UserProfile>[] = [
    {
      key: 'full_name',
      header: 'User',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className={`text-xs font-semibold ${ROLE_COLORS[r.role] || 'bg-muted'}`}>
              {getInitials(r.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{r.full_name}</p>
            <p className="text-xs text-muted-foreground">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (r) => (
        <Badge className={`text-xs ${ROLE_COLORS[r.role] || ''}`}>
          {ROLE_OPTIONS.find(o => o.value === r.role)?.label || r.role}
        </Badge>
      ),
    },
    { key: 'designation', header: 'Designation', render: (r) => <span className="text-sm">{r.designation || '—'}</span> },
    { key: 'department', header: 'Department', render: (r) => <span className="text-sm">{r.department || '—'}</span> },
    {
      key: 'school_id',
      header: 'School',
      render: (r) => {
        const school = schools.find(s => s.id === r.school_id);
        return <span className="text-sm">{school?.name || '—'}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge variant={r.status === 'active' ? 'default' : 'secondary'} className={r.status === 'active' ? 'bg-green-100 text-green-700' : ''}>
          {r.status}
        </Badge>
      ),
    },
    { key: 'last_login', header: 'Last Login', render: (r) => <span className="text-xs text-muted-foreground">{r.last_login ? formatDate(r.last_login) : 'Never'}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEdit(r)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 ${r.status === 'active' ? 'text-destructive' : 'text-success'}`}
            onClick={() => handleToggleStatus(r)}
          >
            {r.status === 'active' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
          </Button>
        </div>
      ),
    },
  ];

  const formFields = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {!showEdit && (
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Email *</Label>
          <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@thegurukulam.in" type="email" />
        </div>
      )}
      {!showEdit && (
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Password *</Label>
          <Input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" type="password" />
        </div>
      )}
      <div className="space-y-1 col-span-2">
        <Label className="text-xs">Full Name *</Label>
        <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Role *</Label>
        <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{ROLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">School</Label>
        <Select value={form.school_id} onValueChange={v => setForm(f => ({ ...f, school_id: v }))}>
          <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">— None —</SelectItem>
            {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Designation</Label>
        <Input value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="Job title" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Department</Label>
        <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Department" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Phone</Label>
        <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">City</Label>
        <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Employee ID</Label>
        <Input value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} placeholder="EMP001" />
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="User Management"
        description="Create, edit, and manage system users and their role assignments"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add User
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>{users.filter(u => u.status === 'active').length} active</span>
          <span>/</span>
          <span>{users.length} total</span>
        </div>
      </div>

      <Card className="p-5">
        <DataTable
          data={filtered}
          columns={columns}
          searchKeys={['full_name', 'email', 'role']}
          searchPlaceholder="Filter users..."
        />
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create User'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
