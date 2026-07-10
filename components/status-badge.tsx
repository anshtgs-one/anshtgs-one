'use client';

import { cn, getStatusColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium capitalize', getStatusColor(status), className)}
    >
      {label || status.replace(/_/g, ' ')}
    </Badge>
  );
}
