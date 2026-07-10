export type UserRole =
  | 'super_admin'
  | 'central_marketing'
  | 'sig'
  | 'finance'
  | 'creative_team'
  | 'vendor'
  | 'management';

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  central_marketing: 'Central Marketing',
  sig: 'SIG',
  finance: 'Finance',
  creative_team: 'Creative Team',
  vendor: 'Vendor',
  management: 'Management',
};

export const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-primary text-primary-foreground',
  central_marketing: 'bg-info text-info-foreground',
  sig: 'bg-success text-success-foreground',
  finance: 'bg-warning text-warning-foreground',
  creative_team: 'bg-chart-4 text-white',
  vendor: 'bg-chart-5 text-white',
  management: 'bg-foreground text-background',
};

export interface School {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  sig_name: string | null;
  sig_phone: string | null;
  sig_email: string | null;
  status: 'active' | 'inactive' | 'planning';
  opened_date: string | null;
  capacity: number | null;
  current_strength: number | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  school_id: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: 'printing' | 'installation' | 'fabrication' | 'digital' | 'outdoor' | 'event' | 'creative' | 'transport' | 'other';
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  gst_number: string | null;
  rating: number;
  total_orders: number;
  status: 'active' | 'inactive' | 'blacklisted';
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'atl' | 'btl' | 'mixed';
  objective: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'planning' | 'active' | 'completed' | 'on_hold' | 'cancelled';
  budget: number;
  spent: number;
  school_ids: string[];
  assigned_user_ids: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ATLType = 'hoarding' | 'gsb' | 'gate_branding' | 'pole_kiosk' | 'wall_wrap' | 'metro_branding' | 'lift_branding' | 'newspaper' | 'auto_branding' | 'bus_branding' | 'mall_branding';

export const ATL_TYPE_LABELS: Record<ATLType, string> = {
  hoarding: 'Hoarding',
  gsb: 'GSB',
  'gate_branding': 'Gate Branding',
  'pole_kiosk': 'Pole Kiosk',
  'wall_wrap': 'Wall Wrap',
  'metro_branding': 'Metro Branding',
  'lift_branding': 'Lift Branding',
  newspaper: 'Newspaper',
  'auto_branding': 'Auto Branding',
  'bus_branding': 'Bus Branding',
  'mall_branding': 'Mall Branding',
};

export type ATLStatus = 'created' | 'recce_assigned' | 'site_visit' | 'gps_captured' | 'measurement_taken' | 'photos_uploaded' | 'quotation_received' | 'quotation_comparison' | 'vendor_finalized' | 'sig_approval' | 'central_approval' | 'finance_approval' | 'printing' | 'dispatch' | 'installation' | 'live' | 'maintenance' | 'completed';

export const ATL_STATUS_LABELS: Record<ATLStatus, string> = {
  created: 'Created',
  recce_assigned: 'Recce Assigned',
  site_visit: 'Site Visit',
  gps_captured: 'GPS Captured',
  measurement_taken: 'Measurement Taken',
  photos_uploaded: 'Photos Uploaded',
  quotation_received: 'Quotation Received',
  quotation_comparison: 'Quotation Comparison',
  vendor_finalized: 'Vendor Finalized',
  sig_approval: 'SIG Approval',
  central_approval: 'Central Approval',
  finance_approval: 'Finance Approval',
  printing: 'Printing',
  dispatch: 'Dispatch',
  installation: 'Installation',
  live: 'Live',
  maintenance: 'Maintenance',
  completed: 'Completed',
};

export const ATL_WORKFLOW_STEPS: ATLStatus[] = [
  'created', 'recce_assigned', 'site_visit', 'gps_captured', 'measurement_taken',
  'photos_uploaded', 'quotation_received', 'quotation_comparison', 'vendor_finalized',
  'sig_approval', 'central_approval', 'finance_approval', 'printing', 'dispatch',
  'installation', 'live', 'maintenance', 'completed'
];

export interface ATLCampaign {
  id: string;
  campaign_id: string | null;
  school_id: string | null;
  type: ATLType;
  title: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  width: number | null;
  height: number | null;
  area_sqft: number | null;
  vendor_id: string | null;
  budget: number;
  final_cost: number;
  status: ATLStatus;
  installation_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type BTLType = 'society_event' | 'open_house' | 'workshop' | 'education_tour' | 'community_event' | 'rwa' | 'school_activation' | 'principal_meet' | 'influencer_meet' | 'mall_activation' | 'corporate_activation' | 'summer_camp';

export const BTL_TYPE_LABELS: Record<BTLType, string> = {
  society_event: 'Society Event',
  open_house: 'Open House',
  workshop: 'Workshop',
  education_tour: 'Education Tour',
  community_event: 'Community Event',
  rwa: 'RWA',
  school_activation: 'School Activation',
  principal_meet: 'Principal Meet',
  influencer_meet: 'Influencer Meet',
  mall_activation: 'Mall Activation',
  corporate_activation: 'Corporate Activation',
  summer_camp: 'Summer Camp',
};

export interface BTLCampaign {
  id: string;
  campaign_id: string | null;
  school_id: string | null;
  type: BTLType;
  title: string;
  venue: string | null;
  event_date: string | null;
  end_date: string | null;
  expected_attendance: number;
  actual_attendance: number;
  walk_ins: number;
  admissions: number;
  budget: number;
  spent: number;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventItem {
  id: string;
  school_id: string | null;
  campaign_id: string | null;
  title: string;
  type: string;
  venue: string | null;
  start_date: string | null;
  end_date: string | null;
  expected_attendance: number;
  actual_attendance: number;
  budget: number;
  spent: number;
  vendor_id: string | null;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  related_id: string | null;
  school_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  checklist: any[];
  comments: any[];
  attachments: any[];
  tags: string[];
  is_recurring: boolean;
  recurrence_pattern: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreativeRequest {
  id: string;
  title: string;
  type: 'poster' | 'standee' | 'leaflet' | 'brochure' | 'video' | 'social_media' | 'content_request' | 'other';
  description: string | null;
  school_id: string | null;
  campaign_id: string | null;
  requested_by: string | null;
  assigned_to: string | null;
  status: 'requested' | 'in_review' | 'approved' | 'in_progress' | 'delivered' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  delivery_date: string | null;
  dimensions: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  school_id: string;
  campaign_id: string;
  category: 'atl' | 'btl' | 'event' | 'creative' | 'travel' | 'vendor' | 'misc';
  allocated: number;
  spent: number;
  fiscal_year: string;
  quarter: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  school_id: string | null;
  campaign_id: string | null;
  category: string;
  description: string;
  amount: number;
  vendor_id: string | null;
  invoice_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  submitted_by: string | null;
  approved_by: string | null;
  expense_date: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  vendor_id: string | null;
  school_id: string | null;
  campaign_id: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  invoice_date: string | null;
  due_date: string | null;
  paid_date: string | null;
  file_url: string | null;
  created_at: string;
}

export interface Savings {
  id: string;
  school_id: string | null;
  campaign_id: string | null;
  atl_id: string | null;
  description: string;
  original_budget: number;
  pw_rate: number;
  vendor_a: number;
  vendor_b: number;
  vendor_c: number;
  vendor_d: number;
  approved_vendor: string | null;
  final_cost: number;
  money_saved: number;
  savings_percentage: number;
  savings_reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  created_at: string;
}

export interface TravelPlan {
  id: string;
  title: string;
  type: 'local_visit' | 'education_tour' | 'one_day_visit' | 'hotel' | 'transport' | 'cab' | 'train' | 'flight';
  school_id: string | null;
  traveler_id: string | null;
  departure_date: string | null;
  return_date: string | null;
  origin: string | null;
  destination: string | null;
  transport_mode: string | null;
  hotel_name: string | null;
  hotel_cost: number;
  transport_cost: number;
  misc_cost: number;
  total_budget: number;
  actual_cost: number;
  status: 'planning' | 'approved' | 'rejected' | 'completed';
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  school_id: string | null;
  campaign_id: string | null;
  student_name: string;
  parent_name: string | null;
  phone: string | null;
  email: string | null;
  class_applying_for: string | null;
  source: string;
  status: 'new' | 'contacted' | 'counselling_done' | 'visited' | 'application_submitted' | 'admitted' | 'lost';
  assigned_to: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export const LEAD_STATUS_LABELS: Record<Lead['status'], string> = {
  new: 'New',
  contacted: 'Contacted',
  counselling_done: 'Counselling Done',
  visited: 'Visited',
  application_submitted: 'Application Submitted',
  admitted: 'Admitted',
  lost: 'Lost',
};

export interface DocumentItem {
  id: string;
  title: string;
  category: 'creative' | 'photos' | 'videos' | 'ppt' | 'mom' | 'quotation' | 'invoice' | 'reports' | 'drive_link' | 'other';
  school_id: string | null;
  campaign_id: string | null;
  file_url: string | null;
  drive_link: string | null;
  file_type: string | null;
  file_size: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Approval {
  id: string;
  entity_type: string;
  entity_id: string;
  stage: string;
  approver_role: UserRole;
  approver_id: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  comments: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  school_id: string | null;
  metadata: any;
  created_at: string;
}

export interface Asset {
  id: string;
  atl_id: string;
  school_id: string | null;
  type: string;
  title: string;
  latitude: number;
  longitude: number;
  vendor_id: string | null;
  budget: number;
  status: 'planned' | 'live' | 'maintenance' | 'removed';
  installation_date: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  head_user_id: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  user_id: string | null;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department_id: string | null;
  reporting_manager_id: string | null;
  school_id: string | null;
  joining_date: string | null;
  status: 'active' | 'inactive' | 'on_leave';
  role: UserRole;
  salary: number | null;
  address: string | null;
  emergency_contact: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolDetails {
  id: string;
  school_id: string;
  principal_name: string | null;
  principal_phone: string | null;
  principal_email: string | null;
  full_address: string | null;
  landmark: string | null;
  pincode: string | null;
  established_year: number | null;
  school_type: 'co-ed' | 'boys' | 'girls';
  board: string;
  classes_offered: string | null;
  facilities: string[];
  social_instagram: string | null;
  social_facebook: string | null;
  social_youtube: string | null;
  ay_target: number | null;
  may_closing_target: number | null;
  created_at: string;
  updated_at: string;
}

export interface LeadStats {
  id: string;
  school_id: string | null;
  period_type: 'ytd' | 'monthly' | 'quarterly';
  period_label: string;
  total_leads: number;
  board_activity: number;
  canopy_standee: number;
  co_branding: number;
  door_to_door: number;
  leaflet_activity: number;
  local_tutor_saathi: number;
  newspaper_insertion: number;
  ntst: number;
  other: number;
  pre_school_activity: number;
  play_school_referral: number;
  rwa_activity: number;
  saathi_referral: number;
  seminar: number;
  created_at: string;
}

export interface AdmissionStats {
  id: string;
  school_id: string;
  academic_year: string;
  ay_target: number;
  may_closing_target: number;
  total_walkin: number;
  total_admissions: number;
  total_registrations: number;
  total_add_reg: number;
  target_achievement_pct: number;
  walkin_conversion_pct: number;
  school_contribution_pct: number;
  target_contribution_pct: number;
  remaining_admissions: number;
  ay25_admissions_till_date: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeLeadStats {
  id: string;
  employee_id: string | null;
  email: string;
  school_id: string | null;
  period_label: string;
  total_leads: number;
  leaflet_activity: number;
  door_to_door: number;
  saathi_referral: number;
  canopy_standee: number;
  other: number;
  ntst: number;
  local_tutor_saathi: number;
  per_school_activity: number;
  board_activity: number;
  play_school_referral: number;
  rwa_activity: number;
  co_branding: number;
  newspaper_insertion: number;
  seminar: number;
  created_at: string;
}

export interface WorkflowLog {
  id: string;
  entity_type: string;
  entity_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  comments: string | null;
  created_at: string;
}
