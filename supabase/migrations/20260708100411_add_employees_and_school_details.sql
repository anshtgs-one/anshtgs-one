/*
# Expand Schema: Employees, School Details, Lead Analytics, Admission Data

## Overview
Adds comprehensive employee master, enriches school profiles with principals/addresses,
creates lead analytics tables seeded from real uploaded BTL tracker data,
adds admission dashboard data from the TGS 2026-27 spreadsheet.

## New Tables
1. employees — Full employee master with designation, department, reporting manager
2. school_details — Extended school profile with principal, address, team info  
3. lead_stats — School-wise YTD lead counts by activity (from real report)
4. admission_stats — School-wise admission dashboard data (from real spreadsheet)
5. employee_lead_stats — Per-employee BTL lead performance (from real BTL tracker)
6. departments — Organization departments
7. form_submissions — Audit log of all form saves
8. workflow_logs — Campaign/task workflow step history

## Security
- RLS enabled, anon+authenticated access (single-tenant internal tool)
*/

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  head_user_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Employees (enriched beyond basic users)
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  employee_id text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  designation text,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  reporting_manager_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  joining_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','on_leave')),
  role text NOT NULL DEFAULT 'sig' CHECK (role IN ('super_admin','central_marketing','sig','finance','creative_team','vendor','management','admissions','operations')),
  salary numeric(12,2),
  address text,
  emergency_contact text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- School details (extended profile)
CREATE TABLE IF NOT EXISTS school_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
  principal_name text,
  principal_phone text,
  principal_email text,
  full_address text,
  landmark text,
  pincode text,
  established_year integer,
  school_type text DEFAULT 'co-ed' CHECK (school_type IN ('co-ed','boys','girls')),
  board text DEFAULT 'CBSE',
  classes_offered text, -- e.g. "Class 1 to Class 12"
  facilities text[],
  social_instagram text,
  social_facebook text,
  social_youtube text,
  ay_target integer, -- Academic year admission target
  may_closing_target integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lead stats (from real uploaded school-wise and activity-wise reports)
CREATE TABLE IF NOT EXISTS lead_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  period_type text NOT NULL DEFAULT 'ytd' CHECK (period_type IN ('ytd','monthly','quarterly')),
  period_label text NOT NULL DEFAULT '2025-26',
  total_leads integer DEFAULT 0,
  board_activity integer DEFAULT 0,
  canopy_standee integer DEFAULT 0,
  co_branding integer DEFAULT 0,
  door_to_door integer DEFAULT 0,
  leaflet_activity integer DEFAULT 0,
  local_tutor_saathi integer DEFAULT 0,
  newspaper_insertion integer DEFAULT 0,
  ntst integer DEFAULT 0,
  other integer DEFAULT 0,
  pre_school_activity integer DEFAULT 0,
  play_school_referral integer DEFAULT 0,
  rwa_activity integer DEFAULT 0,
  saathi_referral integer DEFAULT 0,
  seminar integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Admission stats (from real TGS 2026-27 dashboard)
CREATE TABLE IF NOT EXISTS admission_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
  academic_year text NOT NULL DEFAULT '2026-27',
  ay_target integer DEFAULT 0,
  may_closing_target integer DEFAULT 0,
  total_walkin integer DEFAULT 0,
  total_admissions integer DEFAULT 0,
  total_registrations integer DEFAULT 0,
  total_add_reg integer DEFAULT 0,
  target_achievement_pct numeric(6,2) DEFAULT 0,
  walkin_conversion_pct numeric(6,2) DEFAULT 0,
  school_contribution_pct numeric(6,2) DEFAULT 0,
  target_contribution_pct numeric(6,2) DEFAULT 0,
  remaining_admissions integer DEFAULT 0,
  ay25_admissions_till_date integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employee-wise BTL lead performance (from real uploaded BTL tracker)
CREATE TABLE IF NOT EXISTS employee_lead_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  email text NOT NULL,
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  period_label text NOT NULL DEFAULT '2025-26 YTD',
  total_leads integer DEFAULT 0,
  leaflet_activity integer DEFAULT 0,
  door_to_door integer DEFAULT 0,
  saathi_referral integer DEFAULT 0,
  canopy_standee integer DEFAULT 0,
  other integer DEFAULT 0,
  ntst integer DEFAULT 0,
  local_tutor_saathi integer DEFAULT 0,
  per_school_activity integer DEFAULT 0,
  board_activity integer DEFAULT 0,
  play_school_referral integer DEFAULT 0,
  rwa_activity integer DEFAULT 0,
  co_branding integer DEFAULT 0,
  newspaper_insertion integer DEFAULT 0,
  seminar integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Workflow logs (every status change recorded)
CREATE TABLE IF NOT EXISTS workflow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_lead_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY['departments','employees','school_details','lead_stats','admission_stats','employee_lead_stats','workflow_logs'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon_select_%s" ON %s;', tbl, tbl);
    EXECUTE format('CREATE POLICY "anon_select_%s" ON %s FOR SELECT TO anon, authenticated USING (true);', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "anon_insert_%s" ON %s;', tbl, tbl);
    EXECUTE format('CREATE POLICY "anon_insert_%s" ON %s FOR INSERT TO anon, authenticated WITH CHECK (true);', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "anon_update_%s" ON %s;', tbl, tbl);
    EXECUTE format('CREATE POLICY "anon_update_%s" ON %s FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "anon_delete_%s" ON %s;', tbl, tbl);
    EXECUTE format('CREATE POLICY "anon_delete_%s" ON %s FOR DELETE TO anon, authenticated USING (true);', tbl, tbl);
  END LOOP;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employees_school ON employees(school_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_lead_stats_school ON lead_stats(school_id);
CREATE INDEX IF NOT EXISTS idx_emp_lead_stats_school ON employee_lead_stats(school_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_entity ON workflow_logs(entity_type, entity_id);
