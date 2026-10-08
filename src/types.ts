export interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  is_primary: boolean;
  status: 'active' | 'inactive';
}

export interface Region {
  id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  branches_count?: number;
}

export interface Location {
  id: string;
  branch_code: string;
  name: string;
  region_id: string;
  region_name: string;
  physical_address: string;
  contact_person: string;
  phone: string;
  notification_email: string;
  camera_zones: number;
  areas_details: string;
  status: 'Active' | 'Inactive' | 'Maintenance';
  tickets_count?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  password_hash?: string;
  department_id: string;
  department_name: string;
  role: 'SUPER_ADMIN' | 'SUPERVISOR' | 'TECHNICIAN' | 'OPERATOR';
  status: 'Active' | 'Inactive' | 'Blocked';
  avatar_initials: string;
  workload_status: 'Idle' | 'On-Field' | 'Busy';
  granular_rights: string[];
  assigned_count?: number;
  pending_count?: number;
  in_process_count?: number;
  closed_count?: number;
  delayed_count?: number;
  compliance_percent?: number;
}

export type TicketStatus =
  | 'NEW'
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN PROGRESS'
  | 'RESOLVED';

export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  comment: string;
  attachments?: string[];
  is_internal?: boolean;
  created_at: string;
}

export interface TicketHistoryItem {
  id: string;
  ticket_id: string;
  action: string;
  performed_by: string;
  performed_by_id?: string;
  performed_by_role?: string;
  previous_value?: string;
  new_value?: string;
  reason?: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  record_type?: 'OBSERVATION' | 'TECHNICAL';
  subject: string;
  description: string;
  department_id: string;
  department_name: string;
  region_id?: string;
  region_name: string;
  location_id: string;
  location_name: string;
  category: string;
  subcategory?: string;
  priority: TicketPriority;
  severity?: TicketSeverity;
  status: TicketStatus;
  source?: string;
  assigned_team?: string;
  assigned_technician_id: string | null;
  assigned_technician_name: string;
  requester_email?: string;
  requester_phone?: string;
  initial_observation?: string;

  // Lifecycle Resolution & Closure Fields
  resolution_description?: string;
  root_cause?: string;
  corrective_action?: string;
  resolution_category?: string;
  resolved_by?: string | null;
  resolved_at?: string | null;

  verification_notes?: string;
  closed_by?: string | null;
  closed_at?: string | null;

  reopened_by?: string | null;
  reopened_reason?: string | null;
  reopened_at?: string | null;

  first_response_at?: string | null;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;

  sla_deadline: string;
  sla_status: 'ON TRACK' | 'AT RISK' | 'BREACHED' | 'COMPLETED';
  sla_remaining_hours: number;
  evidence_images: string[];
  attachments?: string[];

  created_by_user_id: string;
  created_by_name: string;
  created_by?: string;
  reporter_id?: string;
  created_at: string;
  updated_at: string;

  comments?: TicketComment[];
  history?: TicketHistoryItem[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  scope_category: 'Ticket Ops' | 'User Governance' | 'Ticket Assignment' | 'System & Config' | 'Admin Activities';
  administrator: string;
  user_id: string;
  user_role: string;
  setting_changed: string;
  target_entity: string;
  action_code: string;
  action_narrative: string;
  previous_value: string;
  new_value: string;
  ip_session: string;
  raw_json: any;
}

export interface SlaRule {
  id: string;
  priority_tier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category_domain: string;
  department: string;
  response_sla_minutes: number;
  resolution_sla_hours: number;
  escalation_trigger_hours: number;
  status: 'Active' | 'Inactive';
}

export interface SystemSettings {
  general: {
    appName: string;
    maintenanceMode: boolean;
    slaEngineEnabled: boolean;
    maxPictureSizeMb: number;
    autoCompress: boolean;
    strictToastWarning: boolean;
  };
  smtp: {
    fromEmail: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass?: string;
  };
  branding: {
    heroTitle: string;
    heroSubtitle: string;
    subtextDescription: string;
    badgeText: string;
    heroHeight: number;
    formHeight: number;
    sidebarHeight: number;
    activeViewport?: string;
  };
  rbac: {
    rbacEnabled: boolean;
    matrix: Record<string, Record<string, boolean>>;
  };
  mysql: {
    host: string;
    port: number;
    user: string;
    password?: string;
    database: string;
    ssl: boolean;
  };
}

export interface DbStatus {
  connected: boolean;
  engine: string;
  host: string;
  database: string;
  user: string;
  port: number;
  ping: string;
  uptime: string;
  infrastructureHealth: string;
  error?: string | null;
  records: {
    tickets: number;
    users: number;
    locations: number;
    auditLogs: number;
    departments: number;
  };
}
