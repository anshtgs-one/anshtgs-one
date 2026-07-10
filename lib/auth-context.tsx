'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useRouter } from 'next/navigation';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  employee_id: string | null;
  designation: string | null;
  department: string | null;
  role: string;
  school_id: string | null;
  city: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: string;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role: string;
  menu_access: string[];
  page_access: string[];
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_view: boolean;
  can_approve: boolean;
  financial_limit: number;
  school_access: string[];
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  permissions: RolePermission | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  logAudit: (action: string, entityType: string, entityId: string, description: string, metadata?: Record<string, any>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const ROLE_DASHBOARD_MAP: Record<string, string> = {
  super_admin: '/dashboard',
  central_marketing: '/dashboard',
  sig: '/schools',
  finance: '/finance',
  creative_team: '/creative',
  vendor: '/vendors',
  management: '/reports',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<RolePermission | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  }, []);

  const fetchPermissions = useCallback(async (role: string) => {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', role)
      .maybeSingle();

    if (error) {
      console.error('Error fetching permissions:', error);
      return null;
    }
    return data as RolePermission | null;
  }, []);

  const logAudit = useCallback(async (
    action: string,
    entityType: string,
    entityId: string,
    description: string,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_name: profile?.full_name || user.email,
        user_email: user.email,
        action,
        entity_type: entityType,
        entity_id: entityId,
        description,
        metadata: metadata || {},
      });
    } catch (e) {
      // Non-blocking — audit log failure shouldn't break the action
    }
  }, [user, profile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    if (p) {
      setProfile(p);
      const perms = await fetchPermissions(p.role);
      setPermissions(perms);
    }
  }, [user, fetchProfile, fetchPermissions]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        if (p && mounted) {
          setProfile(p);
          const perms = await fetchPermissions(p.role);
          if (mounted) setPermissions(perms);

          // Update last_login
          await supabase.from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', session.user.id);
        }
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          (async () => {
            const p = await fetchProfile(session.user.id);
            if (p && mounted) {
              setProfile(p);
              const perms = await fetchPermissions(p.role);
              if (mounted) setPermissions(perms);
              await supabase.from('profiles')
                .update({ last_login: new Date().toISOString() })
                .eq('id', session.user.id);
            }
            if (mounted) setLoading(false);
          })();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setPermissions(null);
          if (mounted) setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };

    // Create profile if user was created
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'sig',
        status: 'active',
      });
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (user && profile) {
      await logAudit('logout', 'auth', user.id, `${profile.full_name} logged out`);
    }
    await supabase.auth.signOut();
    setProfile(null);
    setPermissions(null);
    router.push('/login');
  }, [user, profile, logAudit, router]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider value={{
      session, user, profile, permissions, loading,
      signIn, signInWithGoogle, signUp, signOut,
      resetPassword, updatePassword, refreshProfile, logAudit,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
