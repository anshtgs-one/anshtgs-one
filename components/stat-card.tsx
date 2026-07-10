'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; positive: boolean };
  className?: string;
  accent?: 'primary' | 'success' | 'warning' | 'info' | 'destructive';
}

const accentClasses = {
  primary: 'text-primary bg-primary/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  info: 'text-info bg-info/10',
  destructive: 'text-destructive bg-destructive/10',
};

export function StatCard({ label, value, icon, trend, className, accent = 'primary' }: StatCardProps) {
  return (
    <Card className={cn('p-5 hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p className={cn('text-xs font-medium', trend.positive ? 'text-success' : 'text-destructive')}>
              {trend.positive ? '+' : ''}{trend.value}% vs last month
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', accentClasses[accent])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
