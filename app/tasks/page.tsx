'use client';

import { useState, useMemo } from 'react';
import {
  Plus, CheckSquare, Calendar as CalendarIcon, Table as TableIcon,
  Columns3, AlertCircle, Clock, CheckCircle2, Circle, Filter, Pencil, Trash2, Download
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { DataTable, type Column } from '@/components/data-table';
import { useTasks, useSchools, useUsers, updateRecord } from '@/lib/hooks';
import { formatDate, cn } from '@/lib/utils';
import { useAuth, getInitials } from '@/lib/auth-context';
import { ROLE_COLORS } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { EntityFormDialog, type FormField } from '@/components/entity-form-dialog';
import { DeleteDialog } from '@/components/delete-dialog';
import { exportCSV } from '@/lib/export';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'bg-muted text-muted-foreground' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-info text-info-foreground' },
  { key: 'review', label: 'Review', color: 'bg-warning text-warning-foreground' },
  { key: 'done', label: 'Done', color: 'bg-success text-success-foreground' },
  { key: 'blocked', label: 'Blocked', color: 'bg-destructive text-destructive-foreground' },
];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'border-l-destructive',
  high: 'border-l-warning',
  medium: 'border-l-info',
  low: 'border-l-muted-foreground',
};

export default function TasksPage() {
  const { data: tasks, loading, refetch } = useTasks();
  const { data: schools } = useSchools();
  const { data: users } = useUsers();
  const { profile } = useAuth();
  const [view, setView] = useState<'kanban' | 'table' | 'calendar'>('kanban');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);

  const taskFields: FormField[] = [
    { key: 'title', label: 'Task Title', type: 'text', required: true, placeholder: 'Design admission flyer' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Task details' },
    { key: 'type', label: 'Type', type: 'text', defaultValue: 'general', placeholder: 'e.g. design, follow-up, recce' },
    { key: 'priority', label: 'Priority', type: 'select', defaultValue: 'medium', options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' },
    ] },
    { key: 'due_date', label: 'Due Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', defaultValue: 'todo', options: [
      { value: 'todo', label: 'To Do' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'review', label: 'Review' },
      { value: 'done', label: 'Done' },
      { value: 'blocked', label: 'Blocked' },
    ] },
  ];

  const filtered = useMemo(() => {
    return priorityFilter === 'all' ? tasks : tasks.filter(t => t.priority === priorityFilter);
  }, [tasks, priorityFilter]);

  const moveTask = async (taskId: string, newStatus: string) => {
    const { error } = await updateRecord('tasks', taskId, { status: newStatus });
    if (error) {
      toast.error('Failed to update task');
    } else {
      toast.success('Task moved');
      refetch();
    }
  };

  const tableColumns: Column<any>[] = [
    {
      key: 'title',
      header: 'Task',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium">{r.title}</p>
          {r.description && <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{r.description}</p>}
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (r) => <Badge variant="outline" className="capitalize">{r.priority}</Badge>,
    },
    {
      key: 'assigned_to',
      header: 'Assigned',
      render: (r) => {
        const user = users.find(u => u.id === r.assigned_to);
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className={cn('text-[10px] font-semibold', (ROLE_COLORS as any)[user.role] || 'bg-muted')}>
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{user.name}</span>
          </div>
        ) : <span className="text-xs text-muted-foreground">Unassigned</span>;
      },
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (r) => formatDate(r.due_date),
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
        title="Tasks"
        description="Manage and track all marketing tasks across the team"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportCSV(filtered, 'tasks')}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => { setEditRecord(null); setShowForm(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> New Task
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {[
            { key: 'kanban', icon: Columns3, label: 'Kanban' },
            { key: 'table', icon: TableIcon, label: 'Table' },
            { key: 'calendar', icon: CalendarIcon, label: 'Calendar' },
          ].map(v => {
            const Icon = v.icon;
            return (
              <button
                key={v.key}
                onClick={() => setView(v.key as any)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  view === v.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" /> {v.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {view === 'kanban' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', col.color.split(' ')[0])} />
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{colTasks.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {colTasks.map(task => {
                    const user = users.find(u => u.id === task.assigned_to);
                    return (
                      <Card
                        key={task.id}
                        className={cn('p-3 cursor-pointer hover:shadow-md transition-all border-l-4', PRIORITY_COLORS[task.priority])}
                        draggable
                        onDragEnd={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium leading-snug">{task.title}</p>
                          <div className="flex gap-0.5">
                            <button onClick={() => { setEditRecord(task); setShowForm(true); }} className="text-muted-foreground hover:text-foreground">
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button onClick={() => setDeleteRecord(task)} className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {task.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] capitalize">{task.priority}</Badge>
                            {task.due_date && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" /> {formatDate(task.due_date)}
                              </span>
                            )}
                          </div>
                          {user && (
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className={cn('text-[8px] font-semibold', (ROLE_COLORS as any)[user.role] || 'bg-muted')}>
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          {COLUMNS.map(c => (
                            <button
                              key={c.key}
                              onClick={() => moveTask(task.id, c.key)}
                              className={cn(
                                'flex-1 rounded text-[9px] font-medium py-0.5 transition-colors',
                                task.status === c.key ? c.color : 'bg-muted/30 text-muted-foreground hover:bg-muted'
                              )}
                            >
                              {c.label.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                      <p className="text-xs text-muted-foreground">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'table' && (
        <Card className="p-5">
          <DataTable
            data={filtered}
            columns={tableColumns}
            searchKeys={['title', 'description']}
            searchPlaceholder="Search tasks..."
          />
        </Card>
      )}

      {view === 'calendar' && (
        <Card className="p-5">
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">{day}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + i - 7);
              const dayTasks = filtered.filter(t => {
                if (!t.due_date) return false;
                const taskDate = new Date(t.due_date);
                return taskDate.toDateString() === date.toDateString();
              });
              return (
                <div key={i} className="min-h-[80px] rounded-lg border border-border p-1.5">
                  <p className="text-xs text-muted-foreground mb-1">{date.getDate()}</p>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map(task => (
                      <div key={task.id} className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium truncate', PRIORITY_COLORS[task.priority].replace('border-l-', 'bg-'))}>
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && <p className="text-[10px] text-muted-foreground">+{dayTasks.length - 2} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      <EntityFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditRecord(null); }}
        table="tasks"
        title={editRecord ? 'Edit Task' : 'New Task'}
        description={editRecord ? 'Update task information' : 'Create a new task'}
        fields={taskFields}
        editId={editRecord?.id}
        onSuccess={refetch}
      />
      <DeleteDialog
        open={!!deleteRecord}
        onOpenChange={(o) => { if (!o) setDeleteRecord(null); }}
        table="tasks"
        recordId={deleteRecord?.id || ''}
        recordName={deleteRecord?.title || 'Task'}
        onSuccess={refetch}
      />
    </div>
  );
}
