import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatCurrencyFull(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    active: 'bg-success/15 text-success border-success/20',
    live: 'bg-success/15 text-success border-success/20',
    completed: 'bg-primary/15 text-primary border-primary/20',
    planning: 'bg-info/15 text-info border-info/20',
    pending: 'bg-warning/15 text-warning border-warning/20',
    approved: 'bg-success/15 text-success border-success/20',
    paid: 'bg-success/15 text-success border-success/20',
    rejected: 'bg-destructive/15 text-destructive border-destructive/20',
    cancelled: 'bg-destructive/15 text-destructive border-destructive/20',
    lost: 'bg-destructive/15 text-destructive border-destructive/20',
    on_hold: 'bg-warning/15 text-warning border-warning/20',
    inactive: 'bg-muted text-muted-foreground border-border',
    blacklisted: 'bg-destructive/15 text-destructive border-destructive/20',
    new: 'bg-info/15 text-info border-info/20',
    contacted: 'bg-chart-6/15 text-chart-6 border-chart-6/20',
    counselling_done: 'bg-chart-4/15 text-chart-4 border-chart-4/20',
    visited: 'bg-chart-3/15 text-chart-3 border-chart-3/20',
    application_submitted: 'bg-warning/15 text-warning border-warning/20',
    admitted: 'bg-success/15 text-success border-success/20',
    todo: 'bg-muted text-muted-foreground border-border',
    in_progress: 'bg-info/15 text-info border-info/20',
    review: 'bg-warning/15 text-warning border-warning/20',
    done: 'bg-success/15 text-success border-success/20',
    blocked: 'bg-destructive/15 text-destructive border-destructive/20',
    requested: 'bg-info/15 text-info border-info/20',
    in_review: 'bg-warning/15 text-warning border-warning/20',
    delivered: 'bg-success/15 text-success border-success/20',
    created: 'bg-muted text-muted-foreground border-border',
    recce_assigned: 'bg-info/15 text-info border-info/20',
    site_visit: 'bg-info/15 text-info border-info/20',
    gps_captured: 'bg-info/15 text-info border-info/20',
    measurement_taken: 'bg-chart-6/15 text-chart-6 border-chart-6/20',
    photos_uploaded: 'bg-chart-6/15 text-chart-6 border-chart-6/20',
    quotation_received: 'bg-chart-3/15 text-chart-3 border-chart-3/20',
    quotation_comparison: 'bg-chart-3/15 text-chart-3 border-chart-3/20',
    vendor_finalized: 'bg-chart-4/15 text-chart-4 border-chart-4/20',
    sig_approval: 'bg-warning/15 text-warning border-warning/20',
    central_approval: 'bg-warning/15 text-warning border-warning/20',
    finance_approval: 'bg-warning/15 text-warning border-warning/20',
    printing: 'bg-chart-5/15 text-chart-5 border-chart-5/20',
    dispatch: 'bg-chart-5/15 text-chart-5 border-chart-5/20',
    installation: 'bg-primary/15 text-primary border-primary/20',
    maintenance: 'bg-chart-6/15 text-chart-6 border-chart-6/20',
  };
  return colorMap[status] || 'bg-muted text-muted-foreground border-border';
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    urgent: 'bg-destructive text-destructive-foreground',
    high: 'bg-warning text-warning-foreground',
    medium: 'bg-info text-info-foreground',
    low: 'bg-muted text-muted-foreground',
  };
  return map[priority] || 'bg-muted text-muted-foreground';
}

export function getRatingStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}
