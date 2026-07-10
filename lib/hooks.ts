'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type {
  School, User, Vendor, Campaign, ATLCampaign, BTLCampaign, EventItem,
  Task, CreativeRequest, Budget, Expense, Invoice, Savings, TravelPlan,
  Lead, DocumentItem, Notification, Activity, Asset,
  Department, Employee, SchoolDetails, LeadStats, AdmissionStats,
  EmployeeLeadStats, WorkflowLog
} from './types';

export function useSupabaseQuery<T>(
  table: string,
  select: string = '*',
  filters?: Record<string, any>,
  order?: { column: string; ascending: boolean }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase.from(table).select(select);
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      }
    }
    if (order) {
      query = query.order(order.column, { ascending: order.ascending });
    }
    const { data: result, error: err } = await query;
    if (err) {
      setError(err.message);
      setData([]);
    } else {
      setData((result || []) as T[]);
      setError(null);
    }
    setLoading(false);
  }, [table, select, JSON.stringify(filters), order?.column, order?.ascending]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useSchools() {
  return useSupabaseQuery<School>('schools', '*', undefined, { column: 'name', ascending: true });
}

export function useUsers() {
  return useSupabaseQuery<User>('users', '*', undefined, { column: 'name', ascending: true });
}

export function useVendors() {
  return useSupabaseQuery<Vendor>('vendors', '*', undefined, { column: 'name', ascending: true });
}

export function useCampaigns() {
  return useSupabaseQuery<Campaign>('campaigns', '*', undefined, { column: 'created_at', ascending: false });
}

export function useATLCampaigns() {
  return useSupabaseQuery<ATLCampaign>('atl_campaigns', '*', undefined, { column: 'created_at', ascending: false });
}

export function useBTLCampaigns() {
  return useSupabaseQuery<BTLCampaign>('btl_campaigns', '*', undefined, { column: 'created_at', ascending: false });
}

export function useEvents() {
  return useSupabaseQuery<EventItem>('events', '*', undefined, { column: 'created_at', ascending: false });
}

export function useTasks() {
  return useSupabaseQuery<Task>('tasks', '*', undefined, { column: 'created_at', ascending: false });
}

export function useCreativeRequests() {
  return useSupabaseQuery<CreativeRequest>('creative_requests', '*', undefined, { column: 'created_at', ascending: false });
}

export function useBudgets() {
  return useSupabaseQuery<Budget>('budgets', '*', undefined, { column: 'created_at', ascending: false });
}

export function useExpenses() {
  return useSupabaseQuery<Expense>('expenses', '*', undefined, { column: 'created_at', ascending: false });
}

export function useInvoices() {
  return useSupabaseQuery<Invoice>('invoices', '*', undefined, { column: 'created_at', ascending: false });
}

export function useSavings() {
  return useSupabaseQuery<Savings>('savings', '*', undefined, { column: 'created_at', ascending: false });
}

export function useTravelPlans() {
  return useSupabaseQuery<TravelPlan>('travel_plans', '*', undefined, { column: 'created_at', ascending: false });
}

export function useLeads() {
  return useSupabaseQuery<Lead>('leads', '*', undefined, { column: 'created_at', ascending: false });
}

export function useDocuments() {
  return useSupabaseQuery<DocumentItem>('documents', '*', undefined, { column: 'created_at', ascending: false });
}

export function useNotifications() {
  return useSupabaseQuery<Notification>('notifications', '*', undefined, { column: 'created_at', ascending: false });
}

export function useActivities() {
  return useSupabaseQuery<Activity>('activities', '*', undefined, { column: 'created_at', ascending: false });
}

export function useAssets() {
  return useSupabaseQuery<Asset>('assets', '*', undefined, { column: 'created_at', ascending: false });
}

export function useDepartments() {
  return useSupabaseQuery<Department>('departments', '*', undefined, { column: 'name', ascending: true });
}

export function useEmployees() {
  return useSupabaseQuery<Employee>('employees', '*', undefined, { column: 'full_name', ascending: true });
}

export function useSchoolDetails() {
  return useSupabaseQuery<SchoolDetails>('school_details', '*', undefined, { column: 'school_id', ascending: true });
}

export function useLeadStats() {
  return useSupabaseQuery<LeadStats>('lead_stats', '*', undefined, { column: 'total_leads', ascending: false });
}

export function useAdmissionStats() {
  return useSupabaseQuery<AdmissionStats>('admission_stats', '*', undefined, { column: 'school_id', ascending: true });
}

export function useEmployeeLeadStats() {
  return useSupabaseQuery<EmployeeLeadStats>('employee_lead_stats', '*', undefined, { column: 'total_leads', ascending: false });
}

export function useWorkflowLogs(entityType?: string, entityId?: string) {
  const filters: Record<string, any> = {};
  if (entityType) filters.entity_type = entityType;
  if (entityId) filters.entity_id = entityId;
  return useSupabaseQuery<WorkflowLog>('workflow_logs', '*', Object.keys(filters).length > 0 ? filters : undefined, { column: 'created_at', ascending: false });
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export function useAuditLogs(entityType?: string, entityId?: string, limit?: number) {
  const [data, setData] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('audit_logs').select('*');
    if (entityType) query = query.eq('entity_type', entityType);
    if (entityId) query = query.eq('entity_id', entityId);
    query = query.order('created_at', { ascending: false });
    if (limit) query = query.limit(limit);
    const { data: result, error: err } = await query;
    if (err) {
      setError(err.message);
      setData([]);
    } else {
      setData((result || []) as AuditLog[]);
      setError(null);
    }
    setLoading(false);
  }, [entityType, entityId, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export async function insertRecord(table: string, record: Record<string, any>) {
  const { data, error } = await supabase.from(table).insert(record).select().single();
  return { data, error };
}

export async function updateRecord(table: string, id: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from(table).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return { data, error };
}

export async function deleteRecord(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  return { error };
}
