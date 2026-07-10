'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { deleteRecord } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: string;
  recordId: string;
  recordName: string;
  onSuccess?: () => void;
}

export function DeleteDialog({ open, onOpenChange, table, recordId, recordName, onSuccess }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const { logAudit } = useAuth();

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await deleteRecord(table, recordId);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
    } else {
      await logAudit('delete', table, recordId, `Deleted ${table}: ${recordName}`);
      toast.success(`${recordName} deleted successfully`);
      onOpenChange(false);
      onSuccess?.();
    }
    setDeleting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete {recordName}?</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">
          This action cannot be undone. The record will be permanently removed from the database.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
