/*
# Marketing Operating System - Core Schema

## Overview
Creates the complete database schema for The Gurukulam School Marketing OS.
This is a single-tenant internal tool (no external sign-in) — all policies
allow anon + authenticated access since the app uses the anon key.

## Tables Created
1. schools — The 12 TGS/THS school locations
2. users — Internal team members with roles
3. vendors — External vendor companies
4. campaigns — Marketing campaigns spanning schools
5. atl_campaigns — Above-the-line campaigns (hoardings, GSB, etc.)
6. btl_campaigns — Below-the-line campaigns (events, workshops, etc.)
7. events — Standalone events as workspaces
8. tasks — Task management (kanban, priority, assignments)
9. creative_requests — Creative hub requests
10. budgets — Budget allocations per school/campaign
11. expenses — Expense entries
12. invoices — Vendor invoices
13. savings — Savings tracker entries
14. travel_plans — Travel planner entries
15. leads — Admissions support leads
16. documents — Document management
17. approvals — Approval engine records
18. notifications — User notifications
19. activities — Activity feed / audit log
20. assets — Marketing assets for map display

## Security
- RLS enabled on all tables
- All policies use TO anon, authenticated (single-tenant internal tool)
- Data is intentionally shared across the internal team
*/

-- Schools
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  city text NOT NULL,
  state text NOT NULL,
  address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  sig_name text,
  sig_phone text,
  sig_email text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','planning')),
  opened_date date,
  capacity integer,
  current_strength integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users (internal team)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  role text NOT NULL CHECK (role IN ('super_admin','central_marketing','sig','finance','creative_team','vendor','management')),
  avatar_url text,
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz DEFAULT now()
);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('printing','installation','fabrication','digital','outdoor','event','creative','transport','other')),
  contact_person text,
  phone text,
  email text,
  address text,
  city text,
  gst_number text,
  rating numeric(2,1) DEFAULT 0,
  total_orders integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','blacklisted')),
  created_at timestamptz DEFAULT now()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('atl','btl','mixed')),
  objective text,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','completed','on_hold','cancelled')),
  budget numeric(12,2) DEFAULT 0,
  spent numeric(12,2) DEFAULT 0,
  school_ids uuid[] DEFAULT '{}',
  assigned_user_ids uuid[] DEFAULT '{}',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ATL Campaigns
CREATE TABLE IF NOT EXISTS atl_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('hoarding','gsb','gate_branding','pole_kiosk','wall_wrap','metro_branding','lift_branding','newspaper','auto_branding','bus_branding','mall_branding')),
  title text NOT NULL,
  location text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  width numeric(8,2),
  height numeric(8,2),
  area_sqft numeric(10,2),
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  budget numeric(12,2) DEFAULT 0,
  final_cost numeric(12,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','recce_assigned','site_visit','gps_captured','measurement_taken','photos_uploaded','quotation_received','quotation_comparison','vendor_finalized','sig_approval','central_approval','finance_approval','printing','dispatch','installation','live','maintenance','completed')),
  installation_date date,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- BTL Campaigns
CREATE TABLE IF NOT EXISTS btl_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('society_event','open_house','workshop','education_tour','community_event','rwa','school_activation','principal_meet','influencer_meet','mall_activation','corporate_activation','summer_camp')),
  title text NOT NULL,
  venue text,
  event_date date,
  end_date date,
  expected_attendance integer DEFAULT 0,
  actual_attendance integer DEFAULT 0,
  walk_ins integer DEFAULT 0,
  admissions integer DEFAULT 0,
  budget numeric(12,2) DEFAULT 0,
  spent numeric(12,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','completed','cancelled')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('society_event','open_house','workshop','education_tour','community_event','rwa','school_activation','principal_meet','influencer_meet','mall_activation','corporate_activation','summer_camp','other')),
  venue text,
  start_date date,
  end_date date,
  expected_attendance integer DEFAULT 0,
  actual_attendance integer DEFAULT 0,
  budget numeric(12,2) DEFAULT 0,
  spent numeric(12,2) DEFAULT 0,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','completed','cancelled')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('general','campaign','atl','btl','event','creative','vendor','finance','travel','document')),
  related_id uuid,
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done','blocked')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  due_date date,
  checklist jsonb DEFAULT '[]',
  comments jsonb DEFAULT '[]',
  attachments jsonb DEFAULT '[]',
  tags text[] DEFAULT '{}',
  is_recurring boolean DEFAULT false,
  recurrence_pattern text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Creative Requests
CREATE TABLE IF NOT EXISTS creative_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('poster','standee','leaflet','brochure','video','social_media','content_request','other')),
  description text,
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','in_review','approved','in_progress','delivered','rejected')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  delivery_date date,
  dimensions text,
  file_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('atl','btl','event','creative','travel','vendor','misc')),
  allocated numeric(12,2) NOT NULL DEFAULT 0,
  spent numeric(12,2) DEFAULT 0,
  fiscal_year text NOT NULL,
  quarter text CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('atl','btl','event','creative','travel','vendor','misc')),
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  invoice_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
  submitted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  expense_date date,
  created_at timestamptz DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  tax_amount numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  invoice_date date,
  due_date date,
  paid_date date,
  file_url text,
  created_at timestamptz DEFAULT now()
);

-- Savings Tracker
CREATE TABLE IF NOT EXISTS savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  atl_id uuid REFERENCES atl_campaigns(id) ON DELETE SET NULL,
  description text NOT NULL,
  original_budget numeric(12,2) NOT NULL DEFAULT 0,
  pw_rate numeric(12,2) DEFAULT 0,
  vendor_a numeric(12,2) DEFAULT 0,
  vendor_b numeric(12,2) DEFAULT 0,
  vendor_c numeric(12,2) DEFAULT 0,
  vendor_d numeric(12,2) DEFAULT 0,
  approved_vendor text,
  final_cost numeric(12,2) NOT NULL DEFAULT 0,
  money_saved numeric(12,2) DEFAULT 0,
  savings_percentage numeric(5,2) DEFAULT 0,
  savings_reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Travel Plans
CREATE TABLE IF NOT EXISTS travel_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('local_visit','education_tour','one_day_visit','hotel','transport','cab','train','flight')),
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  traveler_id uuid REFERENCES users(id) ON DELETE SET NULL,
  departure_date date,
  return_date date,
  origin text,
  destination text,
  transport_mode text CHECK (transport_mode IN ('cab','train','flight','bus','own_vehicle')),
  hotel_name text,
  hotel_cost numeric(12,2) DEFAULT 0,
  transport_cost numeric(12,2) DEFAULT 0,
  misc_cost numeric(12,2) DEFAULT 0,
  total_budget numeric(12,2) DEFAULT 0,
  actual_cost numeric(12,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','approved','rejected','completed')),
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  student_name text NOT NULL,
  parent_name text,
  phone text,
  email text,
  class_applying_for text,
  source text NOT NULL CHECK (source IN ('walk_in','hoarding','social_media','referral','event','rwa','society_event','open_house','workshop','influencer','other')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','counselling_done','visited','application_submitted','admitted','lost')),
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('creative','photos','videos','ppt','mom','quotation','invoice','reports','drive_link','other')),
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  file_url text,
  drive_link text,
  file_type text,
  file_size text,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Approvals
CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('campaign','atl','btl','event','task','creative','budget','expense','invoice','travel','savings')),
  entity_id uuid NOT NULL,
  stage text NOT NULL,
  approver_role text NOT NULL CHECK (approver_role IN ('sig','central_marketing','finance','vendor','management','super_admin')),
  approver_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','returned')),
  comments text,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('task_assigned','approval_pending','budget_approved','creative_delivered','vendor_updated','reminder','deadline','comment','mention','system')),
  title text NOT NULL,
  message text,
  entity_type text,
  entity_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Activities (audit log / feed)
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  description text NOT NULL,
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Marketing Assets (for map)
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atl_id uuid REFERENCES atl_campaigns(id) ON DELETE CASCADE,
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('hoarding','gsb','gate_branding','pole_kiosk','wall_wrap','auto_branding','metro_branding','lift_branding','bus_branding','mall_branding')),
  title text NOT NULL,
  latitude numeric(10,7) NOT NULL,
  longitude numeric(10,7) NOT NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  budget numeric(12,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','live','maintenance','removed')),
  installation_date date,
  photo_url text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_atl_school ON atl_campaigns(school_id);
CREATE INDEX IF NOT EXISTS idx_atl_status ON atl_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_btl_school ON btl_campaigns(school_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_leads_school ON leads(school_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(latitude, longitude);

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE atl_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE btl_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Policies: single-tenant internal tool, all data shared
-- Using a helper DO block to apply CRUD policies to all tables

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'schools','users','vendors','campaigns','atl_campaigns','btl_campaigns',
    'events','tasks','creative_requests','budgets','expenses','invoices',
    'savings','travel_plans','leads','documents','approvals','notifications',
    'activities','assets'
  ];
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
