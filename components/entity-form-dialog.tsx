'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { insertRecord, updateRecord, deleteRecord } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'tel' | 'email';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string | number;
  min?: number;
  step?: number;
}

interface EntityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: string;
  title: string;
  description?: string;
  fields: FormField[];
  editId?: string | null;
  onSuccess?: () => void;
}

export function EntityFormDialog({
  open,
  onOpenChange,
  table,
  title,
  description,
  fields,
  editId,
  onSuccess,
}: EntityFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});
  const { logAudit } = useAuth();

  useEffect(() => {
    if (open && editId) {
      (async () => {
        const { data, error } = await supabase.from(table).select('*').eq('id', editId).maybeSingle();
        if (data && !error) setValues(data);
      })();
    } else if (open) {
      setValues({});
    }
  }, [open, editId, table]);

  const handleChange = useCallback((key: string, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async () => {
    const missing = fields.filter(f => f.required && !values[f.key] && !f.defaultValue);
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map(f => f.label).join(', ')}`);
      return;
    }

    setSaving(true);
    const record: Record<string, any> = {};
    fields.forEach(f => {
      const val = values[f.key] ?? f.defaultValue;
      if (val !== undefined && val !== '') {
        if (f.type === 'number') {
          record[f.key] = Number(val);
        } else {
          record[f.key] = val;
        }
      }
    });

    try {
      if (editId) {
        const { data, error } = await updateRecord(table, editId, record);
        if (error) throw error;
        await logAudit('update', table, editId, `Updated ${table} record`);
        toast.success('Updated successfully');
      } else {
        const { data, error } = await insertRecord(table, record);
        if (error) throw error;
        await logAudit('create', table, data?.id || '', `Created ${table} record`);
        toast.success('Created successfully');
      }
      setValues({});
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {fields.map((field) => (
            <div key={field.key} className="grid gap-2">
              <Label htmlFor={field.key} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.key}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? field.defaultValue ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={3}
                />
              ) : field.type === 'select' ? (
                <Select
                  value={values[field.key] ?? field.defaultValue ?? ''}
                  onValueChange={(v) => handleChange(field.key, v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.key}
                  type={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? field.defaultValue ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  min={field.min}
                  step={field.step}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
