'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Building2, Wallet, Calendar, CheckCircle2,
  Circle, Clock, Camera, FileText, Truck, CheckSquare, MessageSquare,
  Image as ImageIcon, Navigation, Eye
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useATLCampaigns, useSchools, useVendors, useCampaigns, updateRecord } from '@/lib/hooks';
import { ATL_TYPE_LABELS, ATL_STATUS_LABELS, ATL_WORKFLOW_STEPS, type ATLStatus } from '@/lib/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useAuth, getInitials } from '@/lib/auth-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ROLE_COLORS } from '@/lib/types';
import { toast } from 'sonner';
import { Timeline } from '@/components/timeline';
import { TimelineDrawer } from '@/components/timeline-drawer';

export default function ATLDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: atlCampaigns, loading } = useATLCampaigns();
  const { data: schools } = useSchools();
  const { data: vendors } = useVendors();
  const { data: campaigns } = useCampaigns();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('workflow');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const atl = atlCampaigns.find(a => a.id === id);
  const school = schools.find(s => s.id === atl?.school_id);
  const vendor = vendors.find(v => v.id === atl?.vendor_id);
  const campaign = campaigns.find(c => c.id === atl?.campaign_id);

  const currentStepIndex = useMemo(() => {
    if (!atl) return 0;
    return ATL_WORKFLOW_STEPS.indexOf(atl.status);
  }, [atl]);

  const advanceStep = async () => {
    if (!atl) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < ATL_WORKFLOW_STEPS.length) {
      const nextStatus = ATL_WORKFLOW_STEPS[nextIndex];
      const { error } = await updateRecord('atl_campaigns', atl.id, { status: nextStatus });
      if (error) {
        toast.error('Failed to update status');
      } else {
        toast.success(`Status updated to ${ATL_STATUS_LABELS[nextStatus]}`);
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-pulse text-muted-foreground">Loading ATL campaign...</div></div>;
  }

  if (!atl) {
    return <div className="flex flex-col items-center justify-center h-96 gap-4">
      <p className="text-muted-foreground">ATL campaign not found</p>
      <Button onClick={() => router.push('/atl')}>Back to ATL</Button>
    </div>;
  }

  return (
    <div className="animate-fade-in-up">
      <Button variant="ghost" size="sm" onClick={() => router.push('/atl')} className="mb-3">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to ATL
      </Button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{ATL_TYPE_LABELS[atl.type]}</Badge>
            <StatusBadge status={atl.status} label={ATL_STATUS_LABELS[atl.status]} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{atl.title}</h1>
          {atl.location && <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {atl.location}</p>}
        </div>
        <Button onClick={advanceStep} disabled={atl.status === 'completed'}>
          Advance to Next Step
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Budget</p>
          <p className="text-lg font-bold">{formatCurrency(atl.budget)}</p>
          {atl.final_cost > 0 && <p className="text-xs text-success mt-1">Final: {formatCurrency(atl.final_cost)}</p>}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Dimensions</p>
          <p className="text-lg font-bold">{atl.width && atl.height ? `${atl.width}×${atl.height}` : '-'}</p>
          {atl.area_sqft && <p className="text-xs text-muted-foreground mt-1">{atl.area_sqft} sqft</p>}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">School</p>
          <p className="text-sm font-bold truncate">{school?.name || '-'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Vendor</p>
          <p className="text-sm font-bold truncate">{vendor?.name || 'Not assigned'}</p>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="workflow">Recce Workflow</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">ATL Lifecycle Workflow</h3>
              <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
                <Eye className="mr-1.5 h-4 w-4" /> Details
              </Button>
            </div>
            <Timeline
              entityType="atl"
              entityId={atl.id}
              currentStatus={atl.status}
              steps={ATL_WORKFLOW_STEPS}
              onAdvance={(nextStep) => {
                const nextStatus = nextStep as ATLStatus;
                updateRecord('atl_campaigns', atl.id, { status: nextStatus }).then(({ error }) => {
                  if (error) {
                    toast.error('Failed to update status');
                  } else {
                    toast.success(`Status updated to ${ATL_STATUS_LABELS[nextStatus]}`);
                  }
                });
              }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-semibold mb-4">Campaign Details</h3>
              <div className="space-y-3">
                {[
                  { label: 'Type', value: ATL_TYPE_LABELS[atl.type] },
                  { label: 'Location', value: atl.location || '-' },
                  { label: 'GPS Coordinates', value: atl.latitude && atl.longitude ? `${atl.latitude}, ${atl.longitude}` : 'Not captured' },
                  { label: 'Width', value: atl.width ? `${atl.width} ft` : '-' },
                  { label: 'Height', value: atl.height ? `${atl.height} ft` : '-' },
                  { label: 'Total Area', value: atl.area_sqft ? `${atl.area_sqft} sqft` : '-' },
                  { label: 'Budget', value: formatCurrency(atl.budget) },
                  { label: 'Final Cost', value: atl.final_cost > 0 ? formatCurrency(atl.final_cost) : '-' },
                  { label: 'Installation Date', value: formatDate(atl.installation_date) },
                  { label: 'Campaign', value: campaign?.name || '-' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold mb-4">Vendor & Approvals</h3>
              {vendor ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{vendor.type}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Contact</span><span>{vendor.contact_person || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{vendor.phone || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span>{vendor.rating}/5</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No vendor assigned yet</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setDrawerOpen(true)}>View Details</Button>
                </div>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Approval Chain</h4>
                <div className="space-y-2">
                  {['SIG Approval', 'Central Marketing', 'Finance Approval'].map((approval, i) => {
                    const approvalStatus = currentStepIndex > ATL_WORKFLOW_STEPS.indexOf('finance_approval') ? 'approved' :
                      currentStepIndex >= ATL_WORKFLOW_STEPS.indexOf('sig_approval') + i ? 'approved' : 'pending';
                    return (
                      <div key={approval} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                        <span className="text-sm">{approval}</span>
                        <StatusBadge status={approvalStatus} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photos">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Photo Gallery</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {['Before Photos', 'After Photos', 'Maintenance Photos'].map(category => (
                <div key={category} className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/30 transition-colors cursor-pointer">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">{category}</p>
                  <p className="text-xs text-muted-foreground mt-1">Click to upload</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Documents</h3>
            <div className="space-y-2">
              {['Quotation', 'Work Order', 'Invoice', 'Recce Report', 'Installation Report'].map(doc => (
                <div key={doc} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{doc}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(true)}>Upload</Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Status History</h3>
            <div className="space-y-4">
              {ATL_WORKFLOW_STEPS.slice(0, currentStepIndex + 1).map((step, i) => (
                <div key={step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-success-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    {i < currentStepIndex && <div className="w-px h-12 bg-border" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium">{ATL_STATUS_LABELS[step]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {i === currentStepIndex ? 'In progress' : `Completed on ${formatDate(atl.updated_at)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <TimelineDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entityType="atl"
        entityId={atl.id}
        entityTitle={atl.title}
      />
    </div>
  );
}
