'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Info, Clock, MessageSquare, Paperclip, History,
  Calendar, IndianRupee, Building2, User, MapPin, Tag,
  Upload, FileText, Image as ImageIcon, AlertCircle,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import {
  cn, formatCurrency, formatDate, formatDateTime, timeAgo, getStatusColor,
} from '@/lib/utils';
import { useAuditLogs } from '@/lib/hooks';
import type { WorkflowLog } from '@/lib/types';

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { Comments } from '@/components/comments';
import { ActivityLog } from '@/components/activity-log';

interface TimelineDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
  entityTitle: string;
}

interface WorkflowLogRow extends WorkflowLog {
  changed_by_name?: string | null;
}

interface EntityDetails {
  title?: string;
  name?: string;
  type?: string;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  event_date?: string | null;
  installation_date?: string | null;
  budget?: number;
  final_cost?: number;
  spent?: number;
  vendor_id?: string | null;
  school_id?: string | null;
  created_by?: string | null;
  owner_name?: string | null;
  vendor_name?: string | null;
  school_name?: string | null;
  location?: string | null;
  venue?: string | null;
}

const INFO_FIELDS: Array<{
  key: string;
  label: string;
  icon: typeof Tag;
  format?: (v: any) => string;
}> = [
  { key: 'type', label: 'Type', icon: Tag },
  { key: 'status', label: 'Status', icon: Info },
  { key: 'start_date', label: 'Start Date', icon: Calendar, format: formatDate },
  { key: 'end_date', label: 'End Date', icon: Calendar, format: formatDate },
  { key: 'event_date', label: 'Event Date', icon: Calendar, format: formatDate },
  { key: 'installation_date', label: 'Installation Date', icon: Calendar, format: formatDate },
  { key: 'budget', label: 'Budget', icon: IndianRupee, format: (v) => formatCurrency(Number(v) || 0) },
  { key: 'final_cost', label: 'Final Cost', icon: IndianRupee, format: (v) => formatCurrency(Number(v) || 0) },
  { key: 'spent', label: 'Spent', icon: IndianRupee, format: (v) => formatCurrency(Number(v) || 0) },
  { key: 'vendor_name', label: 'Vendor', icon: Building2 },
  { key: 'school_name', label: 'School', icon: Building2 },
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'venue', label: 'Venue', icon: MapPin },
  { key: 'owner_name', label: 'Owner', icon: User },
];

export function TimelineDrawer({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityTitle,
}: TimelineDrawerProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [entity, setEntity] = useState<EntityDetails | null>(null);
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLogRow[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loadingEntity, setLoadingEntity] = useState(false);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);

  // Map entity type to the table it lives in
  const tableForType = (type: string): string | null => {
    const map: Record<string, string> = {
      atl: 'atl_campaigns',
      btl: 'btl_campaigns',
      event: 'events',
      campaign: 'campaigns',
      task: 'tasks',
      creative: 'creative_requests',
      expense: 'expenses',
      invoice: 'invoices',
      travel: 'travel_plans',
      lead: 'leads',
      vendor: 'vendors',
      school: 'schools',
    };
    return map[type] || null;
  };

  const fetchEntity = useCallback(async () => {
    const table = tableForType(entityType);
    if (!table) {
      setEntity({ title: entityTitle });
      return;
    }
    setLoadingEntity(true);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', entityId)
      .maybeSingle();

    if (error || !data) {
      setEntity({ title: entityTitle });
      setLoadingEntity(false);
      return;
    }

    const base: EntityDetails = { ...data, title: data.title || data.name || entityTitle };

    // Enrich with vendor name
    if (data.vendor_id) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('name')
        .eq('id', data.vendor_id)
        .maybeSingle();
      base.vendor_name = vendor?.name || null;
    }

    // Enrich with school name
    if (data.school_id) {
      const { data: school } = await supabase
        .from('schools')
        .select('name')
        .eq('id', data.school_id)
        .maybeSingle();
      base.school_name = school?.name || null;
    }

    // Enrich with owner name
    if (data.created_by || data.assigned_to) {
      const ownerId = data.assigned_to || data.created_by;
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', ownerId)
        .maybeSingle();
      base.owner_name = prof?.full_name || null;
    }

    setEntity(base);
    setLoadingEntity(false);
  }, [entityType, entityId, entityTitle]);

  const fetchWorkflowLogs = useCallback(async () => {
    setLoadingWorkflow(true);
    const { data, error } = await supabase
      .from('workflow_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: true });

    if (error) {
      setWorkflowLogs([]);
    } else {
      // Enrich with changed_by name
      const logs = (data || []) as WorkflowLogRow[];
      const userIds = Array.from(
        new Set(logs.map((l) => l.changed_by).filter(Boolean) as string[])
      );
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
        logs.forEach((l) => {
          l.changed_by_name = l.changed_by ? nameMap.get(l.changed_by) || null : null;
        });
      }
      setWorkflowLogs(logs);
    }
    setLoadingWorkflow(false);
  }, [entityType, entityId]);

  const fetchFiles = useCallback(async () => {
    // Fetch documents that match this entity — try entity_type/entity_id first,
    // fall back to campaign_id for backward compat.
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .or(`entity_type.eq.${entityType},campaign_id.eq.${entityId}`)
      .order('created_at', { ascending: false });
    if (!error) setFiles(data || []);
  }, [entityType, entityId]);

  useEffect(() => {
    if (open && entityType && entityId) {
      fetchEntity();
      fetchWorkflowLogs();
      fetchFiles();
    }
  }, [open, entityType, entityId, fetchEntity, fetchWorkflowLogs, fetchFiles]);

  const [storageAvailable, setStorageAvailable] = useState<boolean | null>(null);

  // Check if Supabase Storage is configured by attempting to list buckets
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.storage.listBuckets();
        setStorageAvailable(!error && data && data.length > 0);
      } catch {
        setStorageAvailable(false);
      }
    })();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!profile) {
      toast.error('You must be signed in to upload files');
      return;
    }

    // Check storage availability
    if (storageAvailable === false) {
      toast.error('Storage not configured. See the configuration notice below.');
      return;
    }

    toast.success(`Uploading "${file.name}"...`);
    const filePath = `${entityType}/${entityId}/${Date.now()}-${file.name}`;

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      await supabase.from('documents').insert({
        title: file.name,
        category: file.type?.startsWith('image/') ? 'photos' : 'creative',
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: profile.id,
        entity_type: entityType,
        entity_id: entityId,
      });

      toast.success(`"${file.name}" uploaded`);
      fetchFiles();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-2 border-b border-border">
          <SheetTitle className="truncate">{entityTitle}</SheetTitle>
          <SheetDescription className="truncate">
            {entityType.replace(/_/g, ' ')} · {entityId.slice(0, 8)}
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-6 py-2 border-b border-border">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview" className="text-xs">
                <Info className="h-3.5 w-3.5 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">
                <Clock className="h-3.5 w-3.5 mr-1" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="comments" className="text-xs">
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="files" className="text-xs">
                <Paperclip className="h-3.5 w-3.5 mr-1" />
                Files
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                <History className="h-3.5 w-3.5 mr-1" />
                Activity
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview */}
          <TabsContent value="overview" className="flex-1 mt-0 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {loadingEntity ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {entity?.title || entityTitle}
                      </h3>
                      {entity?.status && (
                        <Badge
                          variant="outline"
                          className={cn('mt-1 capitalize', getStatusColor(entity.status))}
                        >
                          {entity.status.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      {INFO_FIELDS.map((field) => {
                        const value = (entity as any)?.[field.key];
                        if (value === null || value === undefined || value === '') return null;
                        const Icon = field.icon;
                        const display = field.format ? field.format(value) : String(value);
                        return (
                          <div
                            key={field.key}
                            className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-2.5"
                          >
                            <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                {field.label}
                              </p>
                              <p className="text-sm text-foreground truncate">{display}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline" className="flex-1 mt-0 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-6">
                {loadingWorkflow ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : workflowLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      No workflow history yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status changes will be tracked here.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    {workflowLogs.map((log, index) => {
                      const isLast = index === workflowLogs.length - 1;
                      return (
                        <div key={log.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/15 text-info">
                              <Clock className="h-4 w-4" />
                            </div>
                            {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
                          </div>
                          <div className="flex-1 min-w-0 pb-6">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="capitalize text-xs"
                              >
                                {log.to_status.replace(/_/g, ' ')}
                              </Badge>
                              {log.from_status && (
                                <>
                                  <span className="text-xs text-muted-foreground">from</span>
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {log.from_status.replace(/_/g, ' ')}
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDateTime(log.created_at)} · {timeAgo(log.created_at)}
                            </p>
                            {log.changed_by_name && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                by {log.changed_by_name}
                              </p>
                            )}
                            {log.comments && (
                              <p className="mt-1 text-sm text-foreground/90 rounded-md border border-border bg-muted/30 p-2">
                                {log.comments}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Comments */}
          <TabsContent value="comments" className="flex-1 mt-0 min-h-0 p-6">
            <Comments entityType={entityType} entityId={entityId} />
          </TabsContent>

          {/* Files */}
          <TabsContent value="files" className="flex-1 mt-0 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Uploaded Files</h3>
                  <label>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button size="sm" asChild>
                      <span>
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        Upload
                      </span>
                    </Button>
                  </label>
                </div>

                {storageAvailable === false && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-xs text-amber-800 dark:text-amber-200">
                        <p className="font-semibold mb-1">Storage Not Configured</p>
                        <p className="mb-2">File uploads require a Supabase Storage bucket named <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900">documents</code>.</p>
                        <p className="font-medium">To enable:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-0.5">
                          <li>Open Supabase Dashboard &gt; Storage</li>
                          <li>Click &quot;New bucket&quot;</li>
                          <li>Name it <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900">documents</code></li>
                          <li>Set it to Public (or configure RLS policies)</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Paperclip className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No files uploaded</p>
                    <p className="text-xs text-muted-foreground">
                      Upload photos, documents, or attach drive links.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {files.map((file) => {
                      const isImage = file.file_type?.startsWith('image') ||
                        file.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      return (
                        <div
                          key={file.id}
                          className="rounded-md border border-border bg-muted/20 p-3"
                        >
                          <div className="flex items-start gap-2">
                            {isImage ? (
                              <ImageIcon className="h-5 w-5 text-info shrink-0" />
                            ) : (
                              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {file.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {file.category || 'file'}
                              </p>
                              {file.created_at && (
                                <p className="text-xs text-muted-foreground">
                                  {timeAgo(file.created_at)}
                                </p>
                              )}
                            </div>
                          </div>
                          {file.drive_link && (
                            <a
                              href={file.drive_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block text-xs text-primary hover:underline"
                            >
                              Open link →
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Activity Log */}
          <TabsContent value="activity" className="flex-1 mt-0 min-h-0 p-6">
            <ActivityLog entityType={entityType} entityId={entityId} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export default TimelineDrawer;
