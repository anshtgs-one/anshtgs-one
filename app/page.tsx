'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, ROLE_DASHBOARD_MAP } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (session && profile) {
      const dashboard = ROLE_DASHBOARD_MAP[profile.role] || '/dashboard';
      router.replace(dashboard);
    } else {
      router.replace('/login');
    }
  }, [session, profile, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
