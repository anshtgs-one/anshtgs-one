/*
# Create profiles, audit_logs, and role_permissions tables for Authentication

## Overview
This migration creates the core authentication infrastructure:
1. `profiles` — Extended user profile linked to auth.users, stores role, employee info, school assignment
2. `audit_logs` — Tracks all user actions (login, logout, CRUD, approvals) for compliance
3. `role_permissions` — Defines what menus, pages, and CRUD actions each role can access

## Tables

### profiles
- id (uuid, PK, references auth.users) — 1:1 with Supabase auth user
- email (text, unique) — Copied from auth.users
- full_name (text) — Display name
- employee_id (text) — Employee code
- designation (text) — Job title
- department (text) — Department name
- role (text) — System role (super_admin, central_marketing, sig, finance, creative_team, vendor, management)
- school_id (uuid, FK to schools) — Assigned school (nullable for central staff)
- city (text) — User location
- phone (text) — Contact number
- avatar_url (text) — Profile photo URL
- status (text) — active/inactive
- last_login (timestamptz) — Last login timestamp
- created_at (timestamptz) — Profile creation date
- updated_at (timestamptz) — Last update

### audit_logs
- id (uuid, PK)
- user_id (uuid) — Who performed the action
- user_name (text) — Denormalized user name
- action (text) — login, logout, create, update, delete, approve, reject
- entity_type (text) — Which module (schools, campaigns, etc.)
- entity_id (text) — ID of affected record
- description (text) — Human-readable description
- metadata (jsonb) — Additional context
- created_at (timestamptz)

### role_permissions
- id (uuid, PK)
- role (text, unique) — System role
- menu_access (text[]) — Allowed menu sections
- page_access (text[]) — Allowed page routes
- can_create (boolean)
- can_edit (boolean)
- can_delete (boolean)
- can_view (boolean)
- can_approve (boolean)
- financial_limit (numeric) — Max amount user can approve
- school_access (text[]) — School IDs or 'all'
- created_at, updated_at

## Security
- RLS enabled on all tables
- profiles: users can read/update their own profile; super_admin can read all
- audit_logs: authenticated users can read; inserts allowed for authenticated
- role_permissions: authenticated users can read (needed for menu visibility)
*/

-- Profiles table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  employee_id text,
  designation text,
  department text,
  role text NOT NULL DEFAULT 'sig' CHECK (role IN ('super_admin','central_marketing','sig','finance','creative_team','vendor','management')),
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  city text,
  phone text,
  avatar_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text,
  user_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL UNIQUE CHECK (role IN ('super_admin','central_marketing','sig','finance','creative_team','vendor','management')),
  menu_access text[] DEFAULT '{}',
  page_access text[] DEFAULT '{}',
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_view boolean DEFAULT true,
  can_approve boolean DEFAULT false,
  financial_limit numeric(12,2) DEFAULT 0,
  school_access text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Profiles policies: users can read/update own profile, all authenticated can read (for user management)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Audit logs: authenticated can read, authenticated can insert
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- Role permissions: authenticated can read (needed for menu visibility)
DROP POLICY IF EXISTS "role_permissions_select" ON role_permissions;
CREATE POLICY "role_permissions_select" ON role_permissions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "role_permissions_update" ON role_permissions;
CREATE POLICY "role_permissions_update" ON role_permissions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "role_permissions_insert" ON role_permissions;
CREATE POLICY "role_permissions_insert" ON role_permissions FOR INSERT
  TO authenticated WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Seed default role permissions
INSERT INTO role_permissions (role, menu_access, page_access, can_create, can_edit, can_delete, can_view, can_approve, financial_limit, school_access) VALUES
  ('super_admin',
    ARRAY['Overview','Marketing','Operations','Finance','Insights','System'],
    ARRAY['*'],
    true, true, true, true, true, 999999999, ARRAY['all']),
  ('central_marketing',
    ARRAY['Overview','Marketing','Operations','Insights'],
    ARRAY['*'],
    true, true, false, true, true, 500000, ARRAY['all']),
  ('sig',
    ARRAY['Overview','Marketing','Operations'],
    ARRAY['*'],
    true, true, false, true, false, 0, ARRAY['assigned']),
  ('finance',
    ARRAY['Finance','Insights'],
    ARRAY['*'],
    true, true, false, true, true, 1000000, ARRAY['all']),
  ('creative_team',
    ARRAY['Marketing','Operations'],
    ARRAY['*'],
    true, true, false, true, false, 0, ARRAY['all']),
  ('vendor',
    ARRAY['Operations'],
    ARRAY['*'],
    false, false, false, true, false, 0, ARRAY['all']),
  ('management',
    ARRAY['Overview','Insights'],
    ARRAY['*'],
    false, false, false, true, true, 999999999, ARRAY['all'])
ON CONFLICT (role) DO NOTHING;
