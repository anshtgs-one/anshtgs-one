'use client';

import { useState, useMemo } from 'react';
import { MapPin, Building2, Wallet, Calendar, Filter, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { useAssets, useSchools, useVendors } from '@/lib/hooks';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { ATL_TYPE_LABELS } from '@/lib/types';

const TYPE_COLORS: Record<string, string> = {
  hoarding: '#3b82f6',
  gsb: '#22c55e',
  'gate_branding': '#f59e0b',
  'pole_kiosk': '#a855f7',
  'wall_wrap': '#ef4444',
  'auto_branding': '#06b6d4',
  'metro_branding': '#8b5cf6',
  'lift_branding': '#ec4899',
  'bus_branding': '#14b8a6',
  'mall_branding': '#f97316',
  newspaper: '#64748b',
};

export default function MapsPage() {
  const { data: assets, loading } = useAssets();
  const { data: schools } = useSchools();
  const { data: vendors } = useVendors();
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    return typeFilter === 'all' ? assets : assets.filter(a => a.type === typeFilter);
  }, [assets, typeFilter]);

  const selected = assets.find(a => a.id === selectedAsset);
  const selectedSchool = schools.find(s => s.id === selected?.school_id);
  const selectedVendor = vendors.find(v => v.id === selected?.vendor_id);

  // Group assets by approximate location for display
  const assetsByLocation = useMemo(() => {
    const map: Record<string, typeof assets> = {};
    filtered.forEach(a => {
      const key = `${a.latitude.toFixed(2)}-${a.longitude.toFixed(2)}`;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [filtered]);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Marketing Asset Map"
        description="Geographic view of all ATL marketing assets across India"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Button variant={typeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter('all')}>All Types</Button>
        {Object.entries(ATL_TYPE_LABELS).map(([key, label]) => (
          <Button key={key} variant={typeFilter === key ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter(key)}>
            <div className="h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: TYPE_COLORS[key] }} />
            {label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="relative h-[600px] bg-gradient-to-br from-blue-50 to-green-50 dark:from-slate-900 dark:to-slate-800">
            {/* India map placeholder with positioned markers */}
            <div className="absolute inset-0 bg-grid opacity-30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-primary/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Interactive Map View</p>
                <p className="text-xs text-muted-foreground mt-1">{filtered.length} assets displayed</p>
              </div>
            </div>

            {/* Asset markers positioned by lat/lng */}
            {filtered.map(asset => {
              const school = schools.find(s => s.id === asset.school_id);
              if (!school || !school.latitude || !school.longitude) return null;
              // Map India coordinates to the container
              const x = ((school.longitude - 68) / (97 - 68)) * 100;
              const y = ((37 - school.latitude) / (37 - 8)) * 100;
              if (x < 0 || x > 100 || y < 0 || y > 100) return null;
              return (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div
                    className="h-4 w-4 rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-150"
                    style={{ backgroundColor: TYPE_COLORS[asset.type] || '#64748b' }}
                  />
                  <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-card px-2 py-0.5 text-[10px] font-medium opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                    {asset.title}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          {selected ? (
            <Card className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{selected.title}</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedAsset(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{ATL_TYPE_LABELS[selected.type as keyof typeof ATL_TYPE_LABELS]}</Badge>
                  <StatusBadge status={selected.status} />
                </div>
                {selectedSchool && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedSchool.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selected.latitude}, {selected.longitude}</span>
                </div>
                {selectedVendor && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedVendor.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span>{formatCurrency(selected.budget)}</span>
                </div>
                {selected.installation_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Installed: {formatDate(selected.installation_date)}</span>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Asset Summary</h3>
              <div className="space-y-2">
                {Object.entries(ATL_TYPE_LABELS).map(([key, label]) => {
                  const count = assets.filter(a => a.type === key).length;
                  if (count === 0) return null;
                  return (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[key] }} />
                        <span className="text-sm">{label}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-semibold mb-3">All Assets ({filtered.length})</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
              {filtered.map(asset => {
                const school = schools.find(s => s.id === asset.school_id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset.id)}
                    className={cn('flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors', selectedAsset === asset.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50')}
                  >
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[asset.type] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{asset.title}</p>
                      <p className="text-xs text-muted-foreground">{school?.name || '-'}</p>
                    </div>
                    <StatusBadge status={asset.status} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
