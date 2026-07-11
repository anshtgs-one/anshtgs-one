'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Search, Building2, Megaphone, CheckSquare, FileText, Truck, Users } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import {
  useSchools, useCampaigns, useTasks, useVendors, useATLCampaigns, useBTLCampaigns
} from '@/lib/hooks';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  const { data: schools } = useSchools();
  const { data: campaigns } = useCampaigns();
  const { data: tasks } = useTasks();
  const { data: vendors } = useVendors();
  const { data: atlCampaigns } = useATLCampaigns();
  const { data: btlCampaigns } = useBTLCampaigns();

  const results = useMemo(() => {
    if (!query.trim()) return { schools: [], campaigns: [], tasks: [], vendors: [], atl: [], btl: [] };
    const q = query.toLowerCase();
    return {
      schools: schools.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)),
      campaigns: campaigns.filter(c => c.name.toLowerCase().includes(q) || c.objective?.toLowerCase().includes(q)),
      tasks: tasks.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)),
      vendors: vendors.filter(v => v.name.toLowerCase().includes(q) || v.city?.toLowerCase().includes(q)),
      atl: atlCampaigns.filter(a => a.title.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q)),
      btl: btlCampaigns.filter(b => b.title.toLowerCase().includes(q) || b.venue?.toLowerCase().includes(q)),
    };
  }, [query, schools, campaigns, tasks, vendors, atlCampaigns, btlCampaigns]);

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Global Search" description={`Search across all modules — ${totalResults} results`} />

      <div className="mb-6 relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search schools, campaigns, tasks, vendors..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-10"
          autoFocus
        />
      </div>

      <div className="space-y-6">
        {results.schools.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Building2 className="h-4 w-4" /> Schools ({results.schools.length})</h3>
            <div className="space-y-2">
              {results.schools.map(s => (
                <Link key={s.id} href={`/schools/${s.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.city}, {s.state}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </Link>
              ))}
            </div>
          </Card>
        )}

        {results.campaigns.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Megaphone className="h-4 w-4" /> Campaigns ({results.campaigns.length})</h3>
            <div className="space-y-2">
              {results.campaigns.map(c => (
                <Link key={c.id} href={`/campaigns/${c.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.objective}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          </Card>
        )}

        {results.atl.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Megaphone className="h-4 w-4" /> ATL Campaigns ({results.atl.length})</h3>
            <div className="space-y-2">
              {results.atl.map(a => (
                <Link key={a.id} href={`/atl/${a.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.location}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              ))}
            </div>
          </Card>
        )}

        {results.btl.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> BTL Campaigns ({results.btl.length})</h3>
            <div className="space-y-2">
              {results.btl.map(b => (
                <Link key={b.id} href={`/btl/${b.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.venue}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              ))}
            </div>
          </Card>
        )}

        {results.tasks.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Tasks ({results.tasks.length})</h3>
            <div className="space-y-2">
              {results.tasks.map(t => (
                <Link key={t.id} href="/tasks" className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{t.priority} priority</p>
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              ))}
            </div>
          </Card>
        )}

        {results.vendors.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Truck className="h-4 w-4" /> Vendors ({results.vendors.length})</h3>
            <div className="space-y-2">
              {results.vendors.map(v => (
                <Link key={v.id} href="/vendors" className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{v.type} • {v.city}</p>
                  </div>
                  <StatusBadge status={v.status} />
                </Link>
              ))}
            </div>
          </Card>
        )}

        {totalResults === 0 && query.trim() && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No results found for &quot;{query}&quot;</p>
          </Card>
        )}

        {!query.trim() && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Start typing to search across all modules</p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-pulse text-muted-foreground">Loading...</div></div>}>
      <SearchContent />
    </Suspense>
  );
}
