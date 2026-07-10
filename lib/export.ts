import { toast } from 'sonner';

export function exportCSV(data: any[], filename: string) {
  if (!data.length) {
    toast.error('No data to export');
    return;
  }
  const headers = Object.keys(data[0]).filter(k => k !== 'id' && !k.includes('_at'));
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          if (Array.isArray(val)) return `"${val.join(';')}"`;
          if (typeof val === 'string' && val.includes(',')) return `"${val.replace(/"/g, '""')}"`;
          return String(val);
        })
        .join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Exported successfully');
}
