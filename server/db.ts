import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  is_primary: boolean;
  status: 'active' | 'inactive';
  created_at?: string;
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
  password_hash: string;
  department_id: string;
  department_name: string;
  role: 'SUPER_ADMIN' | 'SUPERVISOR' | 'TECHNICIAN' | 'OPERATOR';
  status: 'Active' | 'Inactive' | 'Blocked';
  avatar_initials: string;
  workload_status: 'Idle' | 'On-Field' | 'Busy';
  granular_rights: string[];
  last_login?: string;
  assigned_count?: number;
  pending_count?: number;
  in_process_count?: number;
  closed_count?: number;
  delayed_count?: number;
  compliance_percent?: number;
}

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

export interface Ticket {
  id: string;
  ticket_number: string;
  record_type?: 'OBSERVATION' | 'TECHNICAL';
  subject: string;
  description: string;
  department_id: string;
  department_name: string;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'NEW' | 'OPEN' | 'IN PROGRESS' | 'RESOLVED';
  assigned_technician_id: string | null;
  assigned_technician_name: string;
  location_id: string;
  location_name: string;
  region_name: string;
  sla_deadline: string;
  sla_status: 'ON TRACK' | 'AT RISK' | 'BREACHED' | 'COMPLETED';
  sla_remaining_hours: number;
  evidence_images: string[];
  created_by_user_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  closed_at?: string | null;
  comments?: TicketComment[];
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

// Master Initial Datasets
const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept_surveillance',
    code: 'SEC',
    name: 'Security Operations & Surveillance',
    description: 'Centralized 24/7 surveillance monitoring, dispatch, and physical security management.',
    is_primary: true,
    status: 'active'
  },
  {
    id: 'dept_security',
    code: 'SECURITY',
    name: 'Physical Security & Access Control',
    description: 'On-site perimeter security, emergency lockdown protocols, and access badge authorization.',
    is_primary: false,
    status: 'active'
  },
  {
    id: 'dept_admin',
    code: 'ADMIN',
    name: 'Administration & Facility Governance',
    description: 'Administrative support, branch compliance, vendor oversight, and store executive operations.',
    is_primary: false,
    status: 'active'
  },
  {
    id: 'dept_hvac',
    code: 'HVAC',
    name: 'HVAC & Environmental Maintenance',
    description: 'Air conditioning chillers, ventilation airflow telemetry, thermostat zones, and emergency power backup.',
    is_primary: false,
    status: 'active'
  }
];

const INITIAL_REGIONS: Region[] = [
  { id: 'reg_central', name: 'Central Region', code: 'CENTRAL', status: 'ACTIVE', branches_count: 37 },
  { id: 'reg_hq', name: 'Headquarters Region', code: 'HQ', status: 'ACTIVE', branches_count: 0 },
  { id: 'reg_cafe', name: 'Ideas Cafe Region', code: 'CAFE', status: 'ACTIVE', branches_count: 2 },
  { id: 'reg_north', name: 'North Region', code: 'NORTH', status: 'ACTIVE', branches_count: 27 },
  { id: 'reg_south', name: 'South Region', code: 'SOUTH', status: 'ACTIVE', branches_count: 29 },
];

// Generate 95 full operational branches
function generateInitialLocations(): Location[] {
  const branches: Location[] = [
    {
      id: 'loc_001',
      branch_code: 'AG001',
      name: 'Agency Jaranwala',
      region_id: 'reg_central',
      region_name: 'Central',
      physical_address: 'Circular Road, Near City Chowk, Jaranwala',
      contact_person: 'Muhammad Tariq',
      phone: '+92 300 1234567',
      notification_email: 'agency.jaranwala@ideas.com.pk',
      camera_zones: 1,
      areas_details: 'Main Showroom',
      status: 'Active',
      tickets_count: 1
    },
    {
      id: 'loc_002',
      branch_code: 'AG002',
      name: 'Agency Quetta',
      region_id: 'reg_south',
      region_name: 'South',
      physical_address: 'Liaquat Bazaar, Opposite GPO, Quetta',
      contact_person: 'Rehmat Khan',
      phone: '+92 333 7654321',
      notification_email: 'agency.quetta@ideas.com.pk',
      camera_zones: 1,
      areas_details: 'Main Showroom',
      status: 'Active',
      tickets_count: 0
    },
    {
      id: 'loc_003',
      branch_code: 'CF001',
      name: 'Cafe DMC',
      region_id: 'reg_cafe',
      region_name: 'Ideas Cafe',
      physical_address: 'DMC Campus Concourse, Karachi',
      contact_person: 'Farhan Zaidi',
      phone: '+92 321 9876543',
      notification_email: 'cafe.dmc@ideas.com.pk',
      camera_zones: 1,
      areas_details: 'Cafe Dining & Espresso Bar',
      status: 'Active',
      tickets_count: 0
    },
    {
      id: 'loc_004',
      branch_code: 'CF002',
      name: 'Cafe Shahbaz',
      region_id: 'reg_cafe',
      region_name: 'Ideas Cafe',
      physical_address: 'Shahbaz Commercial Area, Phase 6 DHA, Karachi',
      contact_person: 'Adnan Siddiqui',
      phone: '+92 345 1122334',
      notification_email: 'cafe.shahbaz@ideas.com.pk',
      camera_zones: 1,
      areas_details: 'Terrace & Kitchen',
      status: 'Active',
      tickets_count: 0
    },
    {
      id: 'loc_005',
      branch_code: 'FB001',
      name: 'Fabric Store Burewala',
      region_id: 'reg_central',
      region_name: 'Central',
      physical_address: 'Multan Road, Main Commercial Market, Burewala',
      contact_person: 'Nasir Mehmood',
      phone: '+92 301 4455667',
      notification_email: 'fabric.burewala@ideas.com.pk',
      camera_zones: 1,
      areas_details: 'Fabric Display & Stockroom',
      status: 'Active',
      tickets_count: 0
    },
    {
      id: 'loc_006',
      branch_code: 'FB002',
      name: 'Fabric Store Chakwal',
      region_id: 'reg_north',
      region_name: 'North',
      physical_address: 'Talagang Road, Near Hospital Square, Chakwal',
      contact_person: 'Khurram Shehzad',
      phone: '+92 312 8899001',
      notification_email: 'fabric.chakwal@ideas.com.pk',
      camera_zones: 1,
      areas_details: 'Retail Floor',
      status: 'Active',
      tickets_count: 0
    }
  ];

  // Fill up to 95 distinct realistic branches across the 5 regions matching the screenshot's "95 branches"
  const cityNames = [
    { city: 'Lahore Gulberg', reg: 'reg_central', regName: 'Central' },
    { city: 'Lahore DHA Phase 5', reg: 'reg_central', regName: 'Central' },
    { city: 'Lahore Mall of Lahore', reg: 'reg_central', regName: 'Central' },
    { city: 'Lahore Emporium', reg: 'reg_central', regName: 'Central' },
    { city: 'Faisalabad D-Ground', reg: 'reg_central', regName: 'Central' },
    { city: 'Faisalabad Kohinoor', reg: 'reg_central', regName: 'Central' },
    { city: 'Sialkot Cantt', reg: 'reg_central', regName: 'Central' },
    { city: 'Gujranwala Model Town', reg: 'reg_central', regName: 'Central' },
    { city: 'Multan Bosan Road', reg: 'reg_central', regName: 'Central' },
    { city: 'Sahiwal High Street', reg: 'reg_central', regName: 'Central' },
    { city: 'Bahawalpur Circular Rd', reg: 'reg_central', regName: 'Central' },
    { city: 'Okara Mandi Road', reg: 'reg_central', regName: 'Central' },
    { city: 'Sargodha University Rd', reg: 'reg_central', regName: 'Central' },
    { city: 'Sheikhupura Stadium Rd', reg: 'reg_central', regName: 'Central' },
    { city: 'Islamabad F-7 Markaz', reg: 'reg_north', regName: 'North' },
    { city: 'Islamabad F-10 Markaz', reg: 'reg_north', regName: 'North' },
    { city: 'Islamabad Centaurus', reg: 'reg_north', regName: 'North' },
    { city: 'Islamabad Giga Mall', reg: 'reg_north', regName: 'North' },
    { city: 'Rawalpindi Saddar', reg: 'reg_north', regName: 'North' },
    { city: 'Rawalpindi Bahria Town', reg: 'reg_north', regName: 'North' },
    { city: 'Peshawar University Rd', reg: 'reg_north', regName: 'North' },
    { city: 'Peshawar Deans Complex', reg: 'reg_north', regName: 'North' },
    { city: 'Abbottabad Mansehra Rd', reg: 'reg_north', regName: 'North' },
    { city: 'Mardan Mall', reg: 'reg_north', regName: 'North' },
    { city: 'Karachi Dolmen Clifton', reg: 'reg_south', regName: 'South' },
    { city: 'Karachi LuckyOne', reg: 'reg_south', regName: 'South' },
    { city: 'Karachi Tariq Road', reg: 'reg_south', regName: 'South' },
    { city: 'Karachi Ocean Mall', reg: 'reg_south', regName: 'South' },
    { city: 'Karachi Atrium Saddar', reg: 'reg_south', regName: 'South' },
    { city: 'Karachi Hyderi North Nazimabad', reg: 'reg_south', regName: 'South' },
    { city: 'Hyderabad Auto Bhan', reg: 'reg_south', regName: 'South' },
    { city: 'Sukkur Military Road', reg: 'reg_south', regName: 'South' },
    { city: 'Larkana Station Road', reg: 'reg_south', regName: 'South' },
    { city: 'Nawabshah Katchery Rd', reg: 'reg_south', regName: 'South' },
    { city: 'Mirpurkhas Main Bazaar', reg: 'reg_south', regName: 'South' },
    { city: 'Gwadar Port Commercial', reg: 'reg_south', regName: 'South' }
  ];

  let currentCount = branches.length;
  while (currentCount < 95) {
    const idx = currentCount - 6;
    const base = cityNames[idx % cityNames.length];
    const seq = currentCount + 1;
    const branchCode = `ST${seq.toString().padStart(3, '0')}`;
    const name = `Ideas ${base.city} Outlet #${seq}`;
    branches.push({
      id: `loc_${seq.toString().padStart(3, '0')}`,
      branch_code: branchCode,
      name,
      region_id: base.reg,
      region_name: base.regName,
      physical_address: `Plot ${seq * 3 + 12}, Commercial Boulevard, ${base.city}`,
      contact_person: `Manager Area ${seq}`,
      phone: `+92 300 9${seq.toString().padStart(5, '0')}`,
      notification_email: `branch.${branchCode.toLowerCase()}@ideas.com.pk`,
      camera_zones: Math.floor(Math.random() * 4) + 1,
      areas_details: 'Customer Sales Floor, Storage & Cash Counter',
      status: 'Active',
      tickets_count: 0
    });
    currentCount++;
  }

  return branches;
}

const INITIAL_USERS: User[] = [
  {
    id: 'admin-super',
    name: 'Super Admin',
    email: 'admin@ideas.com.pk',
    password_hash: '@dm!n#+390++--',
    department_id: 'dept_surveillance',
    department_name: 'Security Operations & Surveillance',
    role: 'SUPER_ADMIN',
    status: 'Active',
    avatar_initials: 'AD',
    workload_status: 'Idle',
    granular_rights: ['Tickets', 'Resolve', 'Live Feeds', 'Users', 'Settings', 'Audit', 'Delete'],
    assigned_count: 0,
    pending_count: 0,
    in_process_count: 0,
    closed_count: 0,
    delayed_count: 0,
    compliance_percent: 100
  },
  {
    id: 'admin-surveillance',
    name: 'Surveillance Super Admin',
    email: 'admin.surveillance@ideas.com.pk',
    password_hash: '@dm!n#+390++--',
    department_id: 'dept_surveillance',
    department_name: 'Security Operations & Surveillance',
    role: 'SUPER_ADMIN',
    status: 'Active',
    avatar_initials: 'SA',
    workload_status: 'Idle',
    granular_rights: ['Tickets', 'Resolve', 'Live Feeds', 'Users', 'Settings', 'Audit', 'Delete'],
    assigned_count: 0,
    pending_count: 0,
    in_process_count: 0,
    closed_count: 0,
    delayed_count: 0,
    compliance_percent: 100
  },
  {
    id: 'admin-general',
    name: 'Administrator',
    email: 'administrator@ideas.com.pk',
    password_hash: 'Password123!',
    department_id: 'dept_admin',
    department_name: 'Administration & Facility Governance',
    role: 'SUPER_ADMIN',
    status: 'Active',
    avatar_initials: 'AD',
    workload_status: 'Idle',
    granular_rights: ['Tickets', 'Resolve', 'Live Feeds', 'Users', 'Settings'],
    assigned_count: 0,
    pending_count: 0,
    in_process_count: 0,
    closed_count: 0,
    delayed_count: 0,
    compliance_percent: 100
  },
  {
    id: 'sec-lead',
    name: 'Security Supervisor Lead',
    email: 'supervisor.security@ideas.com.pk',
    password_hash: 'Password123!',
    department_id: 'dept_security',
    department_name: 'Security Operations & Surveillance',
    role: 'SUPERVISOR',
    status: 'Active',
    avatar_initials: 'SE',
    workload_status: 'Idle',
    granular_rights: ['Tickets', 'Resolve', 'Live Feeds'],
    assigned_count: 0,
    pending_count: 0,
    in_process_count: 0,
    closed_count: 0,
    delayed_count: 0,
    compliance_percent: 100
  },
  {
    id: 'ops-sup',
    name: 'Operations Supervisor',
    email: 'supervisor.ops@ideas.com.pk',
    password_hash: 'Password123!',
    department_id: 'dept_surveillance',
    department_name: 'Security Operations & Surveillance',
    role: 'SUPERVISOR',
    status: 'Active',
    avatar_initials: 'OP',
    workload_status: 'Idle',
    granular_rights: ['Tickets', 'Resolve', 'Live Feeds'],
    assigned_count: 0,
    pending_count: 0,
    in_process_count: 0,
    closed_count: 0,
    delayed_count: 0,
    compliance_percent: 100
  },
  {
    id: 'sup-three',
    name: 'Supervisor Three',
    email: 'supervisor3@ideas.com.pk',
    password_hash: 'Password123!',
    department_id: 'dept_surveillance',
    department_name: 'Security Operations & Surveillance',
    role: 'SUPERVISOR',
    status: 'Active',
    avatar_initials: 'SU',
    workload_status: 'Idle',
    granular_rights: ['Tickets', 'Resolve'],
    assigned_count: 0,
    pending_count: 0,
    in_process_count: 0,
    closed_count: 0,
    delayed_count: 0,
    compliance_percent: 100
  },
  {
    id: 'sup-test',
    name: 'Supervisor Test',
    email: 'supervisor.test@ideas.com.pk',
    password_hash: 'Password123!',
    department_id: 'dept_surveillance',
    department_name: 'Security Operations & Surveillance',
    role: 'SUPERVISOR',
    status: 'Active',
    avatar_initials: 'SU',
    workload_status: 'Idle',
    granular_rights: ['Tickets', 'Resolve'],
    assigned_count: 0,
    pending_count: 0,
    in_process_count: 0,
    closed_count: 0,
    delayed_count: 0,
    compliance_percent: 100
  },
  {
    id: 'tech-hvac',
    name: 'HVAC Field Specialist',
    email: 'hvac.tech@ideas.com.pk',
    password_hash: 'Password123!',
    department_id: 'dept_hvac',
    department_name: 'HVAC & Environmental Maintenance',
    role: 'TECHNICIAN',
    status: 'Active',
    avatar_initials: 'HV',
    workload_status: 'Idle',
    granular_rights: ['Tickets', 'Resolve'],
    assigned_count: 0,
    pending_count: 0,
    in_process_count: 0,
    closed_count: 0,
    delayed_count: 0,
    compliance_percent: 100
  }
];

const INITIAL_SLA_RULES: SlaRule[] = [
  {
    id: 'sla_crit',
    priority_tier: 'CRITICAL',
    category_domain: 'Hardware / Camera',
    department: 'Surveillance Operations',
    response_sla_minutes: 15,
    resolution_sla_hours: 2,
    escalation_trigger_hours: 1,
    status: 'Active'
  },
  {
    id: 'sla_high',
    priority_tier: 'HIGH',
    category_domain: 'Network / Connectivity',
    department: 'IT Infrastructure',
    response_sla_minutes: 30,
    resolution_sla_hours: 4,
    escalation_trigger_hours: 3,
    status: 'Active'
  },
  {
    id: 'sla_med',
    priority_tier: 'MEDIUM',
    category_domain: 'Access Control',
    department: 'Security Management',
    response_sla_minutes: 120,
    resolution_sla_hours: 24,
    escalation_trigger_hours: 18,
    status: 'Active'
  },
  {
    id: 'sla_low',
    priority_tier: 'LOW',
    category_domain: 'General Inquiry',
    department: 'General Operations',
    response_sla_minutes: 480,
    resolution_sla_hours: 72,
    escalation_trigger_hours: 60,
    status: 'Active'
  }
];

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'ticket_531656',
    ticket_number: 'CMP-2026-531656',
    subject: 'TEST1',
    description: 'NVR video packet drop observed across Channel 04. Check switch RJ45 termination and PoE port budget.',
    department_id: 'dept_surveillance',
    department_name: 'Security Operations & Surveillance',
    category: 'GENERAL',
    priority: 'MEDIUM',
    status: 'NEW',
    assigned_technician_id: null,
    assigned_technician_name: 'Unassigned',
    location_id: 'loc_001',
    location_name: 'Agency Jaranwala',
    region_name: 'Central',
    sla_deadline: '2026-09-28T12:28:48.000Z',
    sla_status: 'ON TRACK',
    sla_remaining_hours: 21.2,
    evidence_images: [],
    created_by_user_id: 'admin-surveillance',
    created_by_name: 'Surveillance Super Admin',
    created_at: '2026-09-27T10:28:48.808Z',
    updated_at: '2026-09-27T10:28:48.808Z',
    comments: []
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'id-1790504928808-r9kfg',
    timestamp: '2026-09-27T10:28:48.808Z',
    scope_category: 'Ticket Ops',
    administrator: 'Surveillance Super Admin',
    user_id: 'admin-surveillance',
    user_role: 'SUPER_ADMIN',
    setting_changed: 'Ticket #CMP-2026-531656 Creation',
    target_entity: 'Ticket #CMP-2026-531656 Creation',
    action_code: 'TICKET_CREATED',
    action_narrative: 'Created observation incident #CMP-2026-531656: "TEST1" [Priority: MEDIUM]',
    previous_value: '— No previous value recorded / Newly initialized —',
    new_value: 'Priority: MEDIUM | Loc: Agency Jaranwala',
    ip_session: '127.0.0.1 (Authenticated Session)',
    raw_json: {
      timestamp: '2026-09-27T10:28:48.808Z',
      date: '2026-09-27T10:28:48.808Z',
      user: 'Surveillance Super Admin',
      admin_user: 'Surveillance Super Admin',
      userId: 'admin-surveillance',
      userRole: 'SUPER_ADMIN',
      action: 'TICKET_CREATED',
      ticketNumber: 'CMP-2026-531656',
      subject: 'TEST1',
      priority: 'MEDIUM',
      location: 'Agency Jaranwala'
    }
  },
  {
    id: 'id-1790504928807-g4p11',
    timestamp: '2026-09-27T10:22:03.000Z',
    scope_category: 'User Governance',
    administrator: 'admin.surveillance@ideas.com.pk',
    user_id: 'admin-surveillance',
    user_role: 'SUPER_ADMIN',
    setting_changed: 'system_configuration',
    target_entity: 'System Configuration',
    action_code: 'CONFIG_SAVED',
    action_narrative: 'Updated visual branding settings and responsive viewport layout.',
    previous_value: '—',
    new_value: '—',
    ip_session: '182.189.96.202',
    raw_json: {
      timestamp: '2026-09-27T10:22:03.000Z',
      user: 'admin.surveillance@ideas.com.pk',
      action: 'CONFIG_SAVED'
    }
  },
  {
    id: 'id-1790504928806-k8m92',
    timestamp: '2026-09-27T00:21:44.000Z',
    scope_category: 'User Governance',
    administrator: 'admin@ideas.com.pk',
    user_id: 'admin-super',
    user_role: 'SUPER_ADMIN',
    setting_changed: 'System Setting',
    target_entity: 'Hostinger MySQL Database',
    action_code: 'DB_SYNCED',
    action_narrative: 'Verified Hostinger MySQL connection and schema synchronization.',
    previous_value: '—',
    new_value: '—',
    ip_session: '182.189.96.202',
    raw_json: {
      timestamp: '2026-09-27T00:21:44.000Z',
      user: 'admin@ideas.com.pk',
      action: 'DB_SYNCED'
    }
  },
  {
    id: 'id-1790504928805-j3b44',
    timestamp: '2026-09-26T23:38:07.000Z',
    scope_category: 'User Governance',
    administrator: 'Surveillance Super Admin',
    user_id: 'admin-surveillance',
    user_role: 'SUPER_ADMIN',
    setting_changed: 'User Account: admin@ideas.com.pk',
    target_entity: 'User: admin@ideas.com.pk',
    action_code: 'ROLE_ASSIGNED',
    action_narrative: 'Assigned role SUPER_ADMIN to user admin@ideas.com.pk with full privilege matrix.',
    previous_value: '—',
    new_value: 'Role: SUPER_ADMIN',
    ip_session: '127.0.0.1 (Authenticated Session)',
    raw_json: {
      timestamp: '2026-09-26T23:38:07.000Z',
      user: 'Surveillance Super Admin',
      action: 'ROLE_ASSIGNED',
      target: 'admin@ideas.com.pk',
      role: 'SUPER_ADMIN'
    }
  }
];

const INITIAL_SETTINGS = {
  general: {
    appName: 'ideas - Surveillance Operations Command System',
    maintenanceMode: false,
    slaEngineEnabled: true,
    maxPictureSizeMb: 2,
    autoCompress: true,
    strictToastWarning: true
  },
  smtp: {
    fromEmail: 'cctv.alert@ideas.com.pk',
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpUser: 'cctv.alert@ideas.com.pk'
  },
  branding: {
    heroTitle: 'Surveillance Operations',
    heroSubtitle: 'Monitor. Detect. Respond. Keep Your Environment Safe.',
    subtextDescription: 'Centralized CCTV health telemetry, real-time ticket escalation, and multi-department facility security operations.',
    badgeText: 'SURVEILLANCE OPERATIONS',
    heroHeight: 44,
    formHeight: 44,
    sidebarHeight: 36,
    activeViewport: 'DESKTOP'
  },
  rbac: {
    rbacEnabled: true,
    matrix: {
      'Can Create Tickets': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: true, TECHNICIAN: true },
      'Can Resolve Tickets': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: true, TECHNICIAN: true },
      'Can Assign Tickets': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: false, TECHNICIAN: false },
      'Can Comment': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: true, TECHNICIAN: true },
      'Can Delete Tickets': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: false, TECHNICIAN: false },
      'Can View Live Feeds': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: true, TECHNICIAN: true },
      'Can Flag Security': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: false, TECHNICIAN: false },
      'Can Manage Users': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: false, TECHNICIAN: false },
      'Can Export Reports': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: false, TECHNICIAN: false },
      'Can Manage System': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: false, TECHNICIAN: false }
    }
  },
  mysql: {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT) || 3306,
    user: process.env.MYSQL_USER || process.env.DB_USER || 'u123456789_opsdesk',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'u123456789_ticketing',
    ssl: process.env.MYSQL_SSL === 'true'
  }
};

class DatabaseManager {
  private pool: mysql.Pool | null = null;
  private isConnectedToMySQL = false;
  private connectionError: string | null = null;
  private latencyMs = 44;

  // In-memory persistent state (mirrored to MySQL when connected)
  private departments: Department[] = [...INITIAL_DEPARTMENTS];
  private regions: Region[] = [...INITIAL_REGIONS];
  private locations: Location[] = generateInitialLocations();
  private users: User[] = INITIAL_USERS.map(u => ({
    ...u,
    password_hash:
      u.password_hash.startsWith('$2a$') ||
      u.password_hash.startsWith('$2b$') ||
      u.password_hash.startsWith('$2y$')
        ? u.password_hash
        : bcrypt.hashSync(u.password_hash || '@dm!n#+390++--', 12)
  }));
  private slaRules: SlaRule[] = [...INITIAL_SLA_RULES];
  private tickets: Ticket[] = [...INITIAL_TICKETS];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  private settings: any = JSON.parse(JSON.stringify(INITIAL_SETTINGS));

  constructor() {
    this.initMySQL();
  }

  private async runImportQuery(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool || !this.isConnectedToMySQL) {
      throw new Error('MySQL database is not connected');
    }

    return await this.pool.execute(sql, params);
  }

  private async runQuery(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool || !this.isConnectedToMySQL) return null;
    try {
      return await this.pool.execute(sql, params);
    } catch (err: any) {
      console.warn(`[Database MySQL Query Note]: ${err.message}`);
      return null;
    }
  }

  public async initMySQL(customConfig?: any) {
    const config = customConfig || this.settings.mysql;
    
    // Only attempt real TCP MySQL connection if host is configured
    if (config.host && (config.password !== undefined)) {
      try {
        const startTime = Date.now();
        const testPool = mysql.createPool({
          host: config.host,
          port: Number(config.port) || 3306,
          user: config.user,
          password: config.password,
          database: config.database,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          connectTimeout: 5000,
          ssl: config.ssl ? { rejectUnauthorized: false } : undefined
        });

        // Test connection
        const conn = await testPool.getConnection();
        await conn.ping();
        conn.release();

        this.pool = testPool;
        this.isConnectedToMySQL = true;
        this.connectionError = null;
        this.latencyMs = Math.max(12, Date.now() - startTime);
        console.log(`[Database] Successfully connected to Hostinger MySQL (${config.host}:${config.port}/${config.database}) in ${this.latencyMs}ms`);

        // Ensure tables exist & sync data
        await this.ensureTables();
        await this.seedAndSync();
      } catch (err: any) {
        this.isConnectedToMySQL = false;
        this.connectionError = err.message || 'Connection failed';
        console.warn(`[Database] Remote Hostinger MySQL not reached (${err.message}). Seamless local failover active.`);
      }
    } else {
      this.isConnectedToMySQL = false;
      this.connectionError = 'MySQL credentials not fully configured in environment';
    }
  }

  private async ensureTables() {
    if (!this.pool) return;
    try {
      // Run quick check or table sync
      const [rows]: any = await this.pool.query("SHOW TABLES LIKE 'tickets'");
      if (!rows || rows.length === 0) {
        console.log('[Database] Initializing MySQL tables on Hostinger...');
        const schemaPath = path.resolve(process.cwd(), 'database/schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf8');
          const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
          for (const stmt of statements) {
            try {
              await this.pool.query(stmt);
            } catch {
              // ignore table exists or minor syntax notes
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('[Database] ensureTables notice:', e.message);
    }
  }

  public async seedAndSync() {
    if (!this.pool) return;
    try {
      // 1. Check if locations table is empty
      const [locRows]: any = await this.pool.query("SELECT COUNT(*) as count FROM locations");
      const locCount = locRows?.[0]?.count || 0;

      if (locCount === 0) {
        console.log('[Database] Hostinger MySQL tables are empty. Seeding initial master data...');
        // Insert departments
        for (const d of this.departments) {
          await this.runQuery(
            "INSERT IGNORE INTO departments (id, code, name, description, is_primary, status) VALUES (?, ?, ?, ?, ?, ?)",
            [d.id, d.code, d.name, d.description, d.is_primary ? 1 : 0, d.status]
          );
        }
        // Insert regions
        for (const r of this.regions) {
          await this.runQuery(
            "INSERT IGNORE INTO regions (id, name, code, status) VALUES (?, ?, ?, ?)",
            [r.id, r.name, r.code, r.status]
          );
        }
        // Insert locations
        for (const l of this.locations) {
          await this.runQuery(
            "INSERT IGNORE INTO locations (id, branch_code, name, region_id, region_name, physical_address, contact_person, phone, notification_email, camera_zones, areas_details, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [l.id, l.branch_code, l.name, l.region_id, l.region_name, l.physical_address, l.contact_person, l.phone, l.notification_email, l.camera_zones, l.areas_details, l.status]
          );
        }
        // Insert users
        for (const u of this.users) {
          await this.runQuery(
            "INSERT IGNORE INTO users (id, name, email, password_hash, department_id, department_name, role, status, avatar_initials, workload_status, granular_rights) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [u.id, u.name, u.email, u.password_hash, u.department_id, u.department_name, u.role, u.status, u.avatar_initials, u.workload_status, JSON.stringify(u.granular_rights)]
          );
        }
        // Insert SLA rules
        for (const s of this.slaRules) {
          await this.runQuery(
            "INSERT IGNORE INTO sla_rules (id, priority_tier, category_domain, department, response_sla_minutes, resolution_sla_hours, escalation_trigger_hours, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [s.id, s.priority_tier, s.category_domain, s.department, s.response_sla_minutes, s.resolution_sla_hours, s.escalation_trigger_hours, s.status]
          );
        }
        // Insert Tickets
        for (const t of this.tickets) {
          await this.runQuery(
            "INSERT IGNORE INTO tickets (id, ticket_number, record_type, subject, description, department_id, department_name, category, priority, status, assigned_technician_id, assigned_technician_name, location_id, location_name, region_name, sla_deadline, sla_status, sla_remaining_hours, evidence_images, created_by_user_id, created_by_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [t.id, t.ticket_number, t.record_type || 'OBSERVATION', t.subject, t.description, t.department_id, t.department_name, t.category, t.priority, t.status, t.assigned_technician_id, t.assigned_technician_name, t.location_id, t.location_name, t.region_name, t.sla_deadline ? new Date(t.sla_deadline) : null, t.sla_status, t.sla_remaining_hours, JSON.stringify(t.evidence_images || []), t.created_by_user_id, t.created_by_name]
          );
        }
        console.log('[Database] Hostinger MySQL initial seeding completed.');
      } else {
        // Load existing records from MySQL
        const [depts]: any = await this.pool.query("SELECT * FROM departments");
        if (depts && depts.length > 0) {
          this.departments = depts.map((d: any) => ({ ...d, is_primary: Boolean(d.is_primary) }));
        }

        const [regs]: any = await this.pool.query("SELECT * FROM regions");
        if (regs && regs.length > 0) {
          this.regions = regs;
        }

        const [locs]: any = await this.pool.query("SELECT * FROM locations");
        if (locs && locs.length > 0) {
          this.locations = locs;
        }

        const [usrs]: any = await this.pool.query(
  "SELECT * FROM users"
);

if (usrs && usrs.length > 0) {
  const migratedUsers: User[] = [];

  for (const u of usrs) {
    let passwordHash = String(u.password_hash || '');

    const isValidBcrypt =
      /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(passwordHash);

    if (!isValidBcrypt) {
      // Existing installation used plaintext passwords.
      // The default seeded password is @dm!n#+390++--.
      const passwordToHash =
        passwordHash.startsWith('$2')
          ? '@dm!n#+390++--'
          : (passwordHash || '@dm!n#+390++--');

      passwordHash = bcrypt.hashSync(passwordToHash, 12);

      await this.pool.query(
        "UPDATE users SET password_hash=? WHERE id=?",
        [passwordHash, u.id]
      );

      console.log(
        `[Database] Migrated password hash for user ${u.email}`
      );
    }

    migratedUsers.push({
      ...u,
      password_hash: passwordHash,
      granular_rights:
        typeof u.granular_rights === 'string'
          ? JSON.parse(u.granular_rights)
          : (u.granular_rights || [])
    });
  }

  this.users = migratedUsers;
}

        const [tix]: any = await this.pool.query("SELECT * FROM tickets");
        if (tix && tix.length > 0) {
          this.tickets = tix.map((t: any) => ({
            ...t,
            sla_remaining_hours: Number(t.sla_remaining_hours),
            evidence_images: typeof t.evidence_images === 'string' ? JSON.parse(t.evidence_images) : (t.evidence_images || [])
          }));
        }
      }
    } catch (err: any) {
      console.warn('[Database seedAndSync notice]:', err.message);
    }
  }

  public getStatus() {
    return {
      connected: this.isConnectedToMySQL,
      engine: this.isConnectedToMySQL ? 'Hostinger MySQL 8.0 (Live Connected)' : 'Hostinger MySQL Buffer & Storage Engine',
      host: this.settings.mysql.host,
      database: this.settings.mysql.database,
      user: this.settings.mysql.user,
      port: this.settings.mysql.port,
      ping: `${this.latencyMs}ms ping`,
      uptime: '99.98% uptime',
      infrastructureHealth: 'OPERATIONAL',
      error: this.connectionError,
      records: {
        tickets: this.tickets.length,
        users: this.users.length,
        locations: this.locations.length,
        auditLogs: this.auditLogs.length,
        departments: this.departments.length
      }
    };
  }

  // --- Departments ---
  public getDepartments(): Department[] {
    return this.departments;
  }

  public addDepartment(dept: Department): Department {
    this.departments.push(dept);
    this.runQuery(
      "INSERT INTO departments (id, code, name, description, is_primary, status) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)",
      [dept.id, dept.code, dept.name, dept.description || '', dept.is_primary ? 1 : 0, dept.status || 'active']
    );
    return dept;
  }

  public updateDepartment(id: string, updates: Partial<Department>): Department | null {
    const idx = this.departments.findIndex(d => d.id === id);
    if (idx === -1) return null;
    this.departments[idx] = { ...this.departments[idx], ...updates };
    this.runQuery(
      "UPDATE departments SET name=COALESCE(?, name), description=COALESCE(?, description), status=COALESCE(?, status) WHERE id=?",
      [updates.name || null, updates.description || null, updates.status || null, id]
    );
    return this.departments[idx];
  }

  public deleteDepartment(id: string): boolean {
    const initialLen = this.departments.length;
    this.departments = this.departments.filter(d => d.id !== id);
    this.runQuery("DELETE FROM departments WHERE id=?", [id]);
    return this.departments.length < initialLen;
  }

  // --- Regions & Locations ---
  public getRegions(): Region[] {
    return this.regions.map(r => ({
      ...r,
      branches_count: this.locations.filter(l => l.region_id === r.id || l.region_name.toLowerCase().includes(r.name.toLowerCase().replace(' region', ''))).length
    }));
  }

  public addRegion(region: Region): Region {
    this.regions.push(region);
    this.runQuery(
      "INSERT INTO regions (id, name, code, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)",
      [region.id, region.name, region.code, region.status || 'ACTIVE']
    );
    return region;
  }

  public updateRegion(id: string, updates: Partial<Region>): Region | null {
    const idx = this.regions.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.regions[idx] = { ...this.regions[idx], ...updates };
    this.runQuery(
      "UPDATE regions SET name=COALESCE(?, name), status=COALESCE(?, status) WHERE id=?",
      [updates.name || null, updates.status || null, id]
    );
    return this.regions[idx];
  }

  public deleteRegion(id: string): boolean {
    const initialLen = this.regions.length;
    this.regions = this.regions.filter(r => r.id !== id);
    this.runQuery("DELETE FROM regions WHERE id=?", [id]);
    return this.regions.length < initialLen;
  }

  public getLocations(): Location[] {
    return this.locations.map(l => ({
      ...l,
      tickets_count: this.tickets.filter(t => t.location_id === l.id || t.location_name === l.name).length
    }));
  }

  public addLocation(loc: Location): Location {
    this.locations.unshift(loc);
    this.runQuery(
      "INSERT INTO locations (id, branch_code, name, region_id, region_name, physical_address, contact_person, phone, notification_email, camera_zones, areas_details, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)",
      [loc.id, loc.branch_code, loc.name, loc.region_id, loc.region_name, loc.physical_address, loc.contact_person, loc.phone, loc.notification_email, loc.camera_zones, loc.areas_details, loc.status]
    );
    return loc;
  }

  public updateLocation(id: string, updates: Partial<Location>): Location | null {
    const idx = this.locations.findIndex(l => l.id === id);
    if (idx === -1) return null;
    this.locations[idx] = { ...this.locations[idx], ...updates };
    this.runQuery(
      "UPDATE locations SET name=COALESCE(?, name), contact_person=COALESCE(?, contact_person), phone=COALESCE(?, phone), status=COALESCE(?, status) WHERE id=?",
      [updates.name || null, updates.contact_person || null, updates.phone || null, updates.status || null, id]
    );
    return this.locations[idx];
  }

  public deleteLocation(id: string): boolean {
    const initialLen = this.locations.length;
    this.locations = this.locations.filter(l => l.id !== id);
    this.runQuery("DELETE FROM locations WHERE id=?", [id]);
    return this.locations.length < initialLen;
  }

  // --- Users & Teams ---

  /**
   * Remove sensitive authentication data before returning users
   * to the frontend.
   */
  private sanitizeUser(user: User): any {
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  public getUsers(): any[] {
    return this.users.map(u => {
      const assigned = this.tickets.filter(
        t => t.assigned_technician_id === u.id
      );

      return {
        ...this.sanitizeUser(u),
        assigned_count: assigned.length,
        pending_count: assigned.filter(
          t => t.status === 'NEW' || t.status === 'OPEN'
        ).length,
        in_process_count: assigned.filter(
          t => t.status === 'IN PROGRESS'
        ).length,
        closed_count: assigned.filter(
          t => t.status === 'RESOLVED'
        ).length,
        delayed_count: assigned.filter(
          t => t.sla_status === 'BREACHED'
        ).length,
        compliance_percent: 100
      };
    });
  }

  /**
   * Internal authentication lookup.
   * Never expose this method directly through an API route.
   */
  public getUserByEmail(email: string): User | null {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    return (
      this.users.find(
        u => u.email.trim().toLowerCase() === normalizedEmail
      ) || null
    );
  }

  /**
   * Internal authenticated-user lookup.
   */
  public getUserById(id: string): User | null {
    return this.users.find(u => u.id === id) || null;
  }

  public updateLastLogin(id: string): void {
    const user = this.users.find(u => u.id === id);

    if (user) {
      user.last_login = new Date().toISOString();
    }

    this.runQuery(
      "UPDATE users SET last_login=CURRENT_TIMESTAMP WHERE id=?",
      [id]
    );
  }

  public async addUser(user: User): Promise<User> {
    const suppliedPassword = String(user.password_hash || '');

    const passwordHash =
      suppliedPassword.startsWith('$2a$') ||
      suppliedPassword.startsWith('$2b$') ||
      suppliedPassword.startsWith('$2y$')
        ? suppliedPassword
        : bcrypt.hashSync(
            suppliedPassword || '@dm!n#+390++--',
            12
          );

    const storedUser: User = {
      ...user,
      password_hash: passwordHash
    };

    await this.runQuery(
      "INSERT INTO users (id, name, email, password_hash, department_id, department_name, role, status, avatar_initials, workload_status, granular_rights) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)",
      [
        storedUser.id,
        storedUser.name,
        storedUser.email,
        storedUser.password_hash,
        storedUser.department_id,
        storedUser.department_name,
        storedUser.role,
        storedUser.status,
        storedUser.avatar_initials,
        storedUser.workload_status,
        JSON.stringify(storedUser.granular_rights)
      ]
    );

    this.users.push(storedUser);

    return storedUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.users.findIndex(u => u.id === id);

    if (idx === -1) return null;

    const nextUser: User = {
      ...this.users[idx],
      ...updates
    };

    let passwordHash = this.users[idx].password_hash;

    if (updates.password_hash) {
      const suppliedPassword = String(updates.password_hash);

      passwordHash =
        suppliedPassword.startsWith('$2a$') ||
        suppliedPassword.startsWith('$2b$') ||
        suppliedPassword.startsWith('$2y$')
          ? suppliedPassword
          : bcrypt.hashSync(suppliedPassword, 12);

      nextUser.password_hash = passwordHash;
    }

    this.users[idx] = nextUser;

    this.runQuery(
      "UPDATE users SET name=COALESCE(?, name), role=COALESCE(?, role), status=COALESCE(?, status), password_hash=COALESCE(?, password_hash) WHERE id=?",
      [
        updates.name || null,
        updates.role || null,
        updates.status || null,
        updates.password_hash ? passwordHash : null,
        id
      ]
    );

    return nextUser;
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.users.length;

    this.users = this.users.filter(u => u.id !== id);

    this.runQuery("DELETE FROM users WHERE id=?", [id]);

    return this.users.length < initialLen;
  }

  // --- SLA Policies ---
  public getSlaRules(): SlaRule[] {
    return this.slaRules;
  }

  public updateSlaRule(id: string, updates: Partial<SlaRule>): SlaRule | null {
    const idx = this.slaRules.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.slaRules[idx] = { ...this.slaRules[idx], ...updates };
    this.runQuery(
      "UPDATE sla_rules SET response_sla_minutes=COALESCE(?, response_sla_minutes), resolution_sla_hours=COALESCE(?, resolution_sla_hours), status=COALESCE(?, status) WHERE id=?",
      [updates.response_sla_minutes ?? null, updates.resolution_sla_hours ?? null, updates.status || null, id]
    );
    return this.slaRules[idx];
  }

  // --- Tickets ---
  public getTickets(departmentId?: string): Ticket[] {
    let list = this.tickets;
    if (departmentId && departmentId !== 'all') {
      list = list.filter(t => t.department_id === departmentId);
    }
    return list;
  }

  public getTicketById(id: string): Ticket | null {
    return this.tickets.find(t => t.id === id || t.ticket_number === id) || null;
  }

  public createTicket(data: Partial<Ticket>): Ticket {
    const now = new Date();
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const ticketNumber = data.ticket_number || `CMP-2026-${randomCode}`;
    const id = data.id || `ticket_${Date.now()}`;

    // SLA calculation based on priority
    let resolutionHours = 24;
    if (data.priority === 'CRITICAL') resolutionHours = 2;
    else if (data.priority === 'HIGH') resolutionHours = 4;
    else if (data.priority === 'LOW') resolutionHours = 72;

    const deadline = new Date(now.getTime() + resolutionHours * 60 * 60 * 1000).toISOString();

    const newTicket: Ticket = {
      id,
      ticket_number: ticketNumber,
      record_type: data.record_type || 'OBSERVATION',
      subject: data.subject || 'Observation Incident',
      description: data.description || '',
      department_id: data.department_id || 'dept_surveillance',
      department_name: data.department_name || 'Security Operations & Surveillance',
      category: data.category || 'GENERAL',
      priority: data.priority || 'MEDIUM',
      status: data.status || 'NEW',
      assigned_technician_id: data.assigned_technician_id || null,
      assigned_technician_name: data.assigned_technician_name || 'Unassigned',
      location_id: data.location_id || 'loc_001',
      location_name: data.location_name || 'Agency Jaranwala',
      region_name: data.region_name || 'Central',
      sla_deadline: deadline,
      sla_status: 'ON TRACK',
      sla_remaining_hours: resolutionHours,
      evidence_images: data.evidence_images || [],
      created_by_user_id: data.created_by_user_id || 'admin-surveillance',
      created_by_name: data.created_by_name || 'Surveillance Super Admin',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      comments: []
    };

    this.tickets.unshift(newTicket);

    // Persist to MySQL
    this.runQuery(
      "INSERT INTO tickets (id, ticket_number, record_type, subject, description, department_id, department_name, category, priority, status, assigned_technician_id, assigned_technician_name, location_id, location_name, region_name, sla_deadline, sla_status, sla_remaining_hours, evidence_images, created_by_user_id, created_by_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        newTicket.id, newTicket.ticket_number, newTicket.record_type, newTicket.subject, newTicket.description,
        newTicket.department_id, newTicket.department_name, newTicket.category, newTicket.priority,
        newTicket.status, newTicket.assigned_technician_id, newTicket.assigned_technician_name,
        newTicket.location_id, newTicket.location_name, newTicket.region_name,
        new Date(newTicket.sla_deadline), newTicket.sla_status, newTicket.sla_remaining_hours,
        JSON.stringify(newTicket.evidence_images || []), newTicket.created_by_user_id, newTicket.created_by_name
      ]
    );

    // Persist any initial comments (including future voice notes) to ticket_comments.
    // addComment() generates the final comment ID and keeps memory + MySQL in sync.
    if (Array.isArray(data.comments)) {
      for (const comment of data.comments) {
        this.addComment(newTicket.id, {
          ...comment,
          ticket_id: newTicket.id
        });
      }
    }

    // Automatically record in immutable audit log
    this.addAuditLog({
      id: `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      scope_category: 'Ticket Ops',
      administrator: newTicket.created_by_name,
      user_id: newTicket.created_by_user_id,
      user_role: 'SUPER_ADMIN',
      setting_changed: `Ticket #${newTicket.ticket_number} Creation`,
      target_entity: `Ticket #${newTicket.ticket_number} Creation`,
      action_code: 'TICKET_CREATED',
      action_narrative: `Created observation incident #${newTicket.ticket_number}: "${newTicket.subject}" [Priority: ${newTicket.priority}]`,
      previous_value: '— No previous value recorded / Newly initialized —',
      new_value: `Priority: ${newTicket.priority} | Loc: ${newTicket.location_name}`,
      ip_session: '127.0.0.1 (Authenticated Session)',
      raw_json: {
        timestamp: now.toISOString(),
        date: now.toISOString(),
        user: newTicket.created_by_name,
        admin_user: newTicket.created_by_name,
        userId: newTicket.created_by_user_id,
        userRole: 'SUPER_ADMIN',
        action: 'TICKET_CREATED',
        ticketNumber: newTicket.ticket_number,
        subject: newTicket.subject,
        priority: newTicket.priority,
        location: newTicket.location_name,
        department: newTicket.department_name
      }
    });

    return newTicket;
  }

  public updateTicket(id: string, updates: Partial<Ticket>, adminUser?: { name: string; id: string; role: string }): Ticket | null {
    const idx = this.tickets.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const oldTicket = this.tickets[idx];
    const updatedTicket: Ticket = {
      ...oldTicket,
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.status === 'RESOLVED' && !oldTicket.resolved_at) {
      updatedTicket.resolved_at = new Date().toISOString();
      updatedTicket.sla_status = 'COMPLETED';
    }
    this.tickets[idx] = updatedTicket;

    // Persist ticket update to MySQL
    this.runQuery(
      "UPDATE tickets SET subject=COALESCE(?, subject), record_type=COALESCE(?, record_type), status=COALESCE(?, status), priority=COALESCE(?, priority), assigned_technician_id=?, assigned_technician_name=?, sla_status=COALESCE(?, sla_status), resolved_at=?, closed_at=?, updated_at=NOW() WHERE id=?",
      [
        updatedTicket.subject, updatedTicket.record_type || null, updatedTicket.status, updatedTicket.priority,
        updatedTicket.assigned_technician_id, updatedTicket.assigned_technician_name,
        updatedTicket.sla_status,
        updatedTicket.resolved_at ? new Date(updatedTicket.resolved_at) : null,
        updatedTicket.closed_at ? new Date(updatedTicket.closed_at) : null,
        id
      ]
    );

    // Log status or assignment changes
    if (updates.status && updates.status !== oldTicket.status) {
      this.addAuditLog({
        id: `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        scope_category: 'Ticket Ops',
        administrator: adminUser?.name || 'Surveillance Super Admin',
        user_id: adminUser?.id || 'admin-surveillance',
        user_role: adminUser?.role || 'SUPER_ADMIN',
        setting_changed: `Ticket #${oldTicket.ticket_number} Status`,
        target_entity: `Ticket #${oldTicket.ticket_number}`,
        action_code: 'STATUS_UPDATED',
        action_narrative: `Changed ticket #${oldTicket.ticket_number} status from ${oldTicket.status} to ${updates.status}`,
        previous_value: `Status: ${oldTicket.status}`,
        new_value: `Status: ${updates.status}`,
        ip_session: '127.0.0.1 (Authenticated Session)',
        raw_json: { oldStatus: oldTicket.status, newStatus: updates.status, ticket: oldTicket.ticket_number }
      });
    }

    if (updates.assigned_technician_name && updates.assigned_technician_name !== oldTicket.assigned_technician_name) {
      this.addAuditLog({
        id: `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        scope_category: 'Ticket Assignment',
        administrator: adminUser?.name || 'Surveillance Super Admin',
        user_id: adminUser?.id || 'admin-surveillance',
        user_role: adminUser?.role || 'SUPER_ADMIN',
        setting_changed: `Ticket #${oldTicket.ticket_number} Assignment`,
        target_entity: `Ticket #${oldTicket.ticket_number}`,
        action_code: 'ASSIGNMENT_UPDATED',
        action_narrative: `Assigned ticket #${oldTicket.ticket_number} to ${updates.assigned_technician_name}`,
        previous_value: `Technician: ${oldTicket.assigned_technician_name}`,
        new_value: `Technician: ${updates.assigned_technician_name}`,
        ip_session: '127.0.0.1 (Authenticated Session)',
        raw_json: { oldAssignee: oldTicket.assigned_technician_name, newAssignee: updates.assigned_technician_name }
      });
    }

    return updatedTicket;
  }

  public deleteTicket(id: string, adminUser?: { name: string; id: string; role: string }): boolean {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket) return false;

    this.tickets = this.tickets.filter(t => t.id !== id);
    this.runQuery("DELETE FROM tickets WHERE id=?", [id]);

    this.addAuditLog({
      id: `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      scope_category: 'Ticket Ops',
      administrator: adminUser?.name || 'Surveillance Super Admin',
      user_id: adminUser?.id || 'admin-surveillance',
      user_role: adminUser?.role || 'SUPER_ADMIN',
      setting_changed: `Ticket #${ticket.ticket_number} Purge`,
      target_entity: `Ticket #${ticket.ticket_number}`,
      action_code: 'TICKET_DELETED',
      action_narrative: `Permanently deleted ticket #${ticket.ticket_number} ("${ticket.subject}")`,
      previous_value: `Ticket: ${ticket.ticket_number}`,
      new_value: 'DELETED',
      ip_session: '127.0.0.1 (Authenticated Session)',
      raw_json: { ticketNumber: ticket.ticket_number, subject: ticket.subject }
    });

    return true;
  }

  public addComment(ticketId: string, commentData: Partial<TicketComment>): TicketComment | null {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return null;

    const newComment: TicketComment = {
      id: `cmt_${Date.now()}`,
      ticket_id: ticketId,
      user_id: commentData.user_id || 'admin-surveillance',
      user_name: commentData.user_name || 'Surveillance Super Admin',
      user_role: commentData.user_role || 'SUPER_ADMIN',
      comment: commentData.comment || '',
      attachments: commentData.attachments || [],
      is_internal: commentData.is_internal || false,
      created_at: new Date().toISOString()
    };

    if (!ticket.comments) ticket.comments = [];
    ticket.comments.push(newComment);

    this.runQuery(
      "INSERT INTO ticket_comments (id, ticket_id, user_id, user_name, user_role, comment, attachments, is_internal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        newComment.id, newComment.ticket_id, newComment.user_id, newComment.user_name, newComment.user_role,
        newComment.comment, JSON.stringify(newComment.attachments || []), newComment.is_internal ? 1 : 0,
        new Date(newComment.created_at)
      ]
    );

    return newComment;
  }

  // --- Audit Trail ---
  public getAuditLogs(scope?: string): AuditLog[] {
    if (!scope || scope === 'All Events') return this.auditLogs;
    return this.auditLogs.filter(log => log.scope_category.toLowerCase() === scope.toLowerCase());
  }

  public addAuditLog(entry: AuditLog): AuditLog {
    this.auditLogs.unshift(entry);
    this.runQuery(
      "INSERT INTO audit_logs (id, timestamp, scope_category, administrator, user_id, user_role, setting_changed, target_entity, action_code, action_narrative, previous_value, new_value, ip_session, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        entry.id, entry.timestamp ? new Date(entry.timestamp) : new Date(), entry.scope_category,
        entry.administrator, entry.user_id, entry.user_role, entry.setting_changed,
        entry.target_entity, entry.action_code, entry.action_narrative, entry.previous_value,
        entry.new_value, entry.ip_session, JSON.stringify(entry.raw_json)
      ]
    );
    return entry;
  }

  // --- Settings ---
  public getSettings() {
    return this.settings;
  }

  public updateSettings(section: string, data: any, adminName = 'Surveillance Super Admin') {
    this.settings[section] = {
      ...this.settings[section],
      ...data
    };

    this.runQuery(
      "INSERT INTO system_settings (setting_key, setting_value, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value), updated_by=VALUES(updated_by)",
      [section, JSON.stringify(this.settings[section]), adminName]
    );

    this.addAuditLog({
      id: `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      scope_category: 'System & Config',
      administrator: adminName,
      user_id: 'admin-surveillance',
      user_role: 'SUPER_ADMIN',
      setting_changed: `Section: ${section}`,
      target_entity: `System Settings (${section})`,
      action_code: 'SETTINGS_UPDATED',
      action_narrative: `Updated governance configuration for [${section}] module`,
      previous_value: '—',
      new_value: JSON.stringify(data).substring(0, 100),
      ip_session: '127.0.0.1 (Authenticated Session)',
      raw_json: { section, updated: data }
    });

    return this.settings[section];
  }

  // Database Import
  // Production-safe JSON import: merge/upsert only.
  // Destructive "replace" imports are intentionally disabled.
  public async importData(
    target: string,
    payload: any,
    mode: 'merge' | 'replace' = 'merge',
    adminName = 'Surveillance Super Admin'
  ): Promise<{
    success: boolean;
    target: string;
    count: number;
    created: number;
    updated: number;
    message: string;
  }> {
    if (mode === 'replace') {
      throw new Error(
        'Replace mode is disabled in production. Please use merge mode.'
      );
    }

    let parsedPayload = payload;

    if (typeof payload === 'string') {
      try {
        parsedPayload = JSON.parse(payload);
      } catch (err: any) {
        throw new Error(`Invalid JSON format: ${err.message}`);
      }
    }

    let rawItems: any[] = [];
    let detectedTarget = String(target || 'auto').toLowerCase();

    if (
      parsedPayload &&
      typeof parsedPayload === 'object' &&
      !Array.isArray(parsedPayload)
    ) {
      if (
        Array.isArray(parsedPayload.users) ||
        Array.isArray(parsedPayload.locations) ||
        Array.isArray(parsedPayload.tickets)
      ) {
        detectedTarget = 'all';
      } else if (Array.isArray(parsedPayload.data)) {
        rawItems = parsedPayload.data;
      } else if (Array.isArray(parsedPayload.records)) {
        rawItems = parsedPayload.records;
      } else if (Array.isArray(parsedPayload.items)) {
        rawItems = parsedPayload.items;
      }
    } else if (Array.isArray(parsedPayload)) {
      rawItems = parsedPayload;
    }

    let createdCount = 0;
    let updatedCount = 0;

    if (
      detectedTarget === 'all' ||
      (
        parsedPayload &&
        (
          Array.isArray(parsedPayload.users) ||
          Array.isArray(parsedPayload.locations) ||
          Array.isArray(parsedPayload.tickets)
        )
      )
    ) {
      if (Array.isArray(parsedPayload.users)) {
        const result = await this.importUsers(parsedPayload.users);
        createdCount += result.created;
        updatedCount += result.updated;
      }

      if (Array.isArray(parsedPayload.locations)) {
        const result = await this.importLocations(parsedPayload.locations);
        createdCount += result.created;
        updatedCount += result.updated;
      }

      if (Array.isArray(parsedPayload.tickets)) {
        const result = await this.importTickets(parsedPayload.tickets);
        createdCount += result.created;
        updatedCount += result.updated;
      }

      this.addAuditLog({
        id: `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        scope_category: 'Admin Activities',
        administrator: adminName,
        user_id: 'admin-surveillance',
        user_role: 'SUPER_ADMIN',
        setting_changed: 'Full JSON Database Import',
        target_entity: 'Users, Locations & Tickets',
        action_code: 'DATABASE_JSON_IMPORT',
        action_narrative: `Imported ${createdCount + updatedCount} records from JSON database snapshot.`,
        previous_value: '—',
        new_value: JSON.stringify({
          created: createdCount,
          updated: updatedCount
        }),
        ip_session: '127.0.0.1 (Authenticated Session)',
        raw_json: {
          target: 'all',
          created: createdCount,
          updated: updatedCount
        }
      });

      return {
        success: true,
        target: 'all',
        count: createdCount + updatedCount,
        created: createdCount,
        updated: updatedCount,
        message: `Successfully imported ${createdCount + updatedCount} records (${createdCount} created, ${updatedCount} updated).`
      };
    }

    if (detectedTarget === 'users' || detectedTarget.includes('user')) {
      const result = await this.importUsers(rawItems);

      this.addAuditLog({
        id: `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        scope_category: 'User Governance',
        administrator: adminName,
        user_id: 'admin-surveillance',
        user_role: 'SUPER_ADMIN',
        setting_changed: 'Users JSON Upload',
        target_entity: 'Users',
        action_code: 'DATABASE_JSON_IMPORT',
        action_narrative: `Imported ${result.created + result.updated} user records from JSON.`,
        previous_value: '—',
        new_value: JSON.stringify(result),
        ip_session: '127.0.0.1 (Authenticated Session)',
        raw_json: {
          target: 'users',
          ...result
        }
      });

      return {
        success: true,
        target: 'users',
        count: result.created + result.updated,
        created: result.created,
        updated: result.updated,
        message: `Successfully imported ${result.created + result.updated} users (${result.created} created, ${result.updated} updated).`
      };
    }

    if (
      detectedTarget === 'locations' ||
      detectedTarget.includes('location')
    ) {
      const result = await this.importLocations(rawItems);

      this.addAuditLog({
        id: `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        scope_category: 'System & Config',
        administrator: adminName,
        user_id: 'admin-surveillance',
        user_role: 'SUPER_ADMIN',
        setting_changed: 'Locations JSON Upload',
        target_entity: 'Locations',
        action_code: 'DATABASE_JSON_IMPORT',
        action_narrative: `Imported ${result.created + result.updated} location records from JSON.`,
        previous_value: '—',
        new_value: JSON.stringify(result),
        ip_session: '127.0.0.1 (Authenticated Session)',
        raw_json: {
          target: 'locations',
          ...result
        }
      });

      return {
        success: true,
        target: 'locations',
        count: result.created + result.updated,
        created: result.created,
        updated: result.updated,
        message: `Successfully imported ${result.created + result.updated} locations (${result.created} created, ${result.updated} updated).`
      };
    }

    if (
      detectedTarget === 'tickets' ||
      detectedTarget.includes('ticket')
    ) {
      const result = await this.importTickets(rawItems);

      this.addAuditLog({
        id: `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        scope_category: 'Ticket Ops',
        administrator: adminName,
        user_id: 'admin-surveillance',
        user_role: 'SUPER_ADMIN',
        setting_changed: 'Tickets JSON Upload',
        target_entity: 'Tickets',
        action_code: 'DATABASE_JSON_IMPORT',
        action_narrative: `Imported ${result.created + result.updated} ticket records from JSON.`,
        previous_value: '—',
        new_value: JSON.stringify(result),
        ip_session: '127.0.0.1 (Authenticated Session)',
        raw_json: {
          target: 'tickets',
          ...result
        }
      });

      return {
        success: true,
        target: 'tickets',
        count: result.created + result.updated,
        created: result.created,
        updated: result.updated,
        message: `Successfully imported ${result.created + result.updated} tickets (${result.created} created, ${result.updated} updated).`
      };
    }

    if (rawItems.length > 0) {
      const sample = rawItems[0] || {};

      if (sample.email || sample.role) {
        return this.importData('users', payload, 'merge', adminName);
      }

      if (sample.branch_code || sample.camera_zones) {
        return this.importData('locations', payload, 'merge', adminName);
      }

      if (sample.ticket_number || sample.subject || sample.priority) {
        return this.importData('tickets', payload, 'merge', adminName);
      }
    }

    throw new Error(
      "Unable to determine target module for JSON data. Please select target explicitly ('users', 'locations', 'tickets', or 'all')."
    );
  }

  private async importUsers(
    rawUsers: any[]
  ): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const raw of rawUsers) {
      if (!raw || (!raw.id && !raw.email && !raw.name)) {
        continue;
      }

      const suppliedId = raw.id ? String(raw.id).trim() : '';
      const suppliedEmail = raw.email
        ? String(raw.email).toLowerCase().trim()
        : '';

      const existingByIdIdx = suppliedId
        ? this.users.findIndex(u => u.id === suppliedId)
        : -1;
      const existingByEmailIdx = suppliedEmail
        ? this.users.findIndex(
            u => u.email.toLowerCase() === suppliedEmail
          )
        : -1;

      if (
        existingByIdIdx >= 0 &&
        existingByEmailIdx >= 0 &&
        existingByIdIdx !== existingByEmailIdx
      ) {
        throw new Error(
          `User import conflict: id "${suppliedId}" and email "${suppliedEmail}" belong to different existing users.`
        );
      }

      const existingIdx =
        existingByIdIdx >= 0 ? existingByIdIdx : existingByEmailIdx;

      const existingUser =
        existingIdx >= 0 ? this.users[existingIdx] : undefined;

      const id =
        suppliedId ||
        existingUser?.id ||
        `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const email =
        suppliedEmail ||
        existingUser?.email ||
        `user_${id}@ideas.com.pk`;

      const hasPasswordField =
        raw.password_hash !== undefined ||
        raw.password !== undefined;

      let passwordHash = existingUser?.password_hash || '';

      if (hasPasswordField) {
        const rawPassword = String(
          raw.password_hash ?? raw.password ?? ''
        );

        if (
          rawPassword.startsWith('$2a$') ||
          rawPassword.startsWith('$2b$') ||
          rawPassword.startsWith('$2y$')
        ) {
          passwordHash = rawPassword;
        } else if (rawPassword) {
          passwordHash = bcrypt.hashSync(rawPassword, 12);
        } else if (!passwordHash) {
          throw new Error(
            `User "${email}" has an empty password. A password or bcrypt hash is required for a new user.`
          );
        }
      }

      if (!passwordHash) {
        throw new Error(
          `User "${email}" does not contain a password/password_hash and no existing password was found.`
        );
      }

      let granularRights: string[] =
        existingUser?.granular_rights || ['Tickets', 'Resolve'];

      if (Array.isArray(raw.granular_rights)) {
        granularRights = raw.granular_rights.map((v: any) => String(v));
      } else if (typeof raw.granular_rights === 'string') {
        try {
          const parsed = JSON.parse(raw.granular_rights);
          if (Array.isArray(parsed)) {
            granularRights = parsed.map((v: any) => String(v));
          }
        } catch {
          // Preserve existing/default rights when malformed.
        }
      }

      const userObj: User = {
        id,
        name: String(
          raw.name !== undefined
            ? raw.name
            : existingUser?.name || 'OpsDesk User'
        ),
        email,
        password_hash: passwordHash,
        department_id: String(
          raw.department_id !== undefined
            ? raw.department_id
            : existingUser?.department_id || 'dept_surveillance'
        ),
        department_name: String(
          raw.department_name !== undefined
            ? raw.department_name
            : existingUser?.department_name ||
              'Security Operations & Surveillance'
        ),
        role:
          raw.role !== undefined
            ? raw.role
            : existingUser?.role || 'TECHNICIAN',
        status:
          raw.status !== undefined
            ? raw.status
            : existingUser?.status || 'Active',
        avatar_initials: String(
          raw.avatar_initials !== undefined
            ? raw.avatar_initials
            : existingUser?.avatar_initials ||
              (raw.name
                ? String(raw.name).substring(0, 2).toUpperCase()
                : 'US')
        ),
        workload_status:
          raw.workload_status !== undefined
            ? raw.workload_status
            : existingUser?.workload_status || 'Idle',
        granular_rights: granularRights,
        last_login:
          raw.last_login !== undefined
            ? raw.last_login
            : existingUser?.last_login,
        assigned_count:
          raw.assigned_count !== undefined
            ? Number(raw.assigned_count)
            : existingUser?.assigned_count || 0,
        pending_count:
          raw.pending_count !== undefined
            ? Number(raw.pending_count)
            : existingUser?.pending_count || 0,
        in_process_count:
          raw.in_process_count !== undefined
            ? Number(raw.in_process_count)
            : existingUser?.in_process_count || 0,
        closed_count:
          raw.closed_count !== undefined
            ? Number(raw.closed_count)
            : existingUser?.closed_count || 0,
        delayed_count:
          raw.delayed_count !== undefined
            ? Number(raw.delayed_count)
            : existingUser?.delayed_count || 0,
        compliance_percent:
          raw.compliance_percent !== undefined
            ? Number(raw.compliance_percent)
            : existingUser?.compliance_percent || 100
      };

      /*
       * MySQL is updated before the in-memory array.
       *
       * For an existing user matched by email with a different imported ID,
       * preserve the existing database row ID to avoid a unique-key conflict.
       */
      if (existingUser) {
        await this.runImportQuery(
          `UPDATE users
           SET name=?,
               email=?,
               password_hash=?,
               department_id=?,
               department_name=?,
               role=?,
               status=?,
               avatar_initials=?,
               workload_status=?,
               granular_rights=?,
               last_login=?
           WHERE id=?`,
          [
            userObj.name,
            userObj.email,
            userObj.password_hash,
            userObj.department_id,
            userObj.department_name,
            userObj.role,
            userObj.status,
            userObj.avatar_initials,
            userObj.workload_status,
            JSON.stringify(userObj.granular_rights),
            userObj.last_login || null,
            existingUser.id
          ]
        );

        this.users[existingIdx] = {
          ...existingUser,
          ...userObj,
          id: existingUser.id
        };
        updated++;
      } else {
        await this.runImportQuery(
          `INSERT INTO users
            (id, name, email, password_hash, department_id, department_name,
             role, status, avatar_initials, workload_status, granular_rights,
             last_login)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userObj.id,
            userObj.name,
            userObj.email,
            userObj.password_hash,
            userObj.department_id,
            userObj.department_name,
            userObj.role,
            userObj.status,
            userObj.avatar_initials,
            userObj.workload_status,
            JSON.stringify(userObj.granular_rights),
            userObj.last_login || null
          ]
        );

        this.users.push(userObj);
        created++;
      }
    }

    return { created, updated };
  }

  private async importLocations(
    rawLocations: any[]
  ): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const raw of rawLocations) {
      if (!raw || (!raw.id && !raw.branch_code && !raw.name)) {
        continue;
      }

      const suppliedId = raw.id ? String(raw.id).trim() : '';
      const suppliedBranchCode = raw.branch_code
        ? String(raw.branch_code).trim()
        : '';

      const existingByIdIdx = suppliedId
        ? this.locations.findIndex(l => l.id === suppliedId)
        : -1;
      const existingByBranchCodeIdx = suppliedBranchCode
        ? this.locations.findIndex(
            l => l.branch_code === suppliedBranchCode
          )
        : -1;

      if (
        existingByIdIdx >= 0 &&
        existingByBranchCodeIdx >= 0 &&
        existingByIdIdx !== existingByBranchCodeIdx
      ) {
        throw new Error(
          `Location import conflict: id "${suppliedId}" and branch_code "${suppliedBranchCode}" belong to different existing locations.`
        );
      }

      const existingIdx =
        existingByIdIdx >= 0
          ? existingByIdIdx
          : existingByBranchCodeIdx;

      const existingLocation =
        existingIdx >= 0 ? this.locations[existingIdx] : undefined;

      const id =
        existingLocation?.id ||
        suppliedId ||
        `loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const branchCode =
        suppliedBranchCode ||
        existingLocation?.branch_code ||
        `BR${Math.floor(1000 + Math.random() * 9000)}`;

      const locObj: Location = {
        id,
        branch_code: branchCode,
        name: String(
          raw.name !== undefined
            ? raw.name
            : existingLocation?.name || 'Branch Location'
        ),
        region_id: String(
          raw.region_id !== undefined
            ? raw.region_id
            : existingLocation?.region_id || 'reg_central'
        ),
        region_name: String(
          raw.region_name !== undefined
            ? raw.region_name
            : existingLocation?.region_name || 'Central'
        ),
        physical_address: String(
          raw.physical_address !== undefined
            ? raw.physical_address
            : existingLocation?.physical_address ||
              'Commercial Market Area'
        ),
        contact_person: String(
          raw.contact_person !== undefined
            ? raw.contact_person
            : existingLocation?.contact_person || 'Branch Manager'
        ),
        phone: String(
          raw.phone !== undefined
            ? raw.phone
            : existingLocation?.phone || '+92 300 0000000'
        ),
        notification_email: String(
          raw.notification_email !== undefined
            ? raw.notification_email
            : existingLocation?.notification_email ||
              `branch.${branchCode.toLowerCase()}@ideas.com.pk`
        ),
        camera_zones:
          raw.camera_zones !== undefined
            ? Number(raw.camera_zones)
            : existingLocation?.camera_zones || 1,
        areas_details: String(
          raw.areas_details !== undefined
            ? raw.areas_details
            : existingLocation?.areas_details || 'Main Floor'
        ),
        status:
          raw.status !== undefined
            ? raw.status
            : existingLocation?.status || 'Active',
        tickets_count:
          raw.tickets_count !== undefined
            ? Number(raw.tickets_count)
            : existingLocation?.tickets_count || 0
      };

      if (existingLocation) {
        await this.runImportQuery(
          `UPDATE locations
           SET branch_code=?,
               name=?,
               region_id=?,
               region_name=?,
               physical_address=?,
               contact_person=?,
               phone=?,
               notification_email=?,
               camera_zones=?,
               areas_details=?,
               status=?
           WHERE id=?`,
          [
            locObj.branch_code,
            locObj.name,
            locObj.region_id,
            locObj.region_name,
            locObj.physical_address,
            locObj.contact_person,
            locObj.phone,
            locObj.notification_email,
            locObj.camera_zones,
            locObj.areas_details,
            locObj.status,
            existingLocation.id
          ]
        );

        this.locations[existingIdx] = {
          ...existingLocation,
          ...locObj,
          id: existingLocation.id
        };
        updated++;
      } else {
        await this.runImportQuery(
          `INSERT INTO locations
            (id, branch_code, name, region_id, region_name, physical_address,
             contact_person, phone, notification_email, camera_zones,
             areas_details, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            locObj.id,
            locObj.branch_code,
            locObj.name,
            locObj.region_id,
            locObj.region_name,
            locObj.physical_address,
            locObj.contact_person,
            locObj.phone,
            locObj.notification_email,
            locObj.camera_zones,
            locObj.areas_details,
            locObj.status
          ]
        );

        this.locations.push(locObj);
        created++;
      }
    }

    return { created, updated };
  }

  private async importTickets(
    rawTickets: any[]
  ): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const raw of rawTickets) {
      if (!raw || (!raw.id && !raw.ticket_number && !raw.subject)) {
        continue;
      }

      const suppliedId = raw.id ? String(raw.id).trim() : '';
      const suppliedTicketNumber = raw.ticket_number
        ? String(raw.ticket_number).trim()
        : '';

      const existingByIdIdx = suppliedId
        ? this.tickets.findIndex(t => t.id === suppliedId)
        : -1;
      const existingByTicketNumberIdx = suppliedTicketNumber
        ? this.tickets.findIndex(
            t => t.ticket_number === suppliedTicketNumber
          )
        : -1;

      if (
        existingByIdIdx >= 0 &&
        existingByTicketNumberIdx >= 0 &&
        existingByIdIdx !== existingByTicketNumberIdx
      ) {
        throw new Error(
          `Ticket import conflict: id "${suppliedId}" and ticket_number "${suppliedTicketNumber}" belong to different existing tickets.`
        );
      }

      const existingIdx =
        existingByIdIdx >= 0
          ? existingByIdIdx
          : existingByTicketNumberIdx;

      const existingTicket =
        existingIdx >= 0 ? this.tickets[existingIdx] : undefined;

      const id =
        existingTicket?.id ||
        suppliedId ||
        `tix_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const ticketNumber =
        suppliedTicketNumber ||
        existingTicket?.ticket_number ||
        `TICK-${Math.floor(10000 + Math.random() * 90000)}`;

      let evidenceImages: string[] =
        existingTicket?.evidence_images || [];

      if (Array.isArray(raw.evidence_images)) {
        evidenceImages = raw.evidence_images.map((v: any) =>
          String(v)
        );
      } else if (typeof raw.evidence_images === 'string') {
        try {
          const parsed = JSON.parse(raw.evidence_images);
          if (Array.isArray(parsed)) {
            evidenceImages = parsed.map((v: any) => String(v));
          }
        } catch {
          // Preserve existing evidence when malformed.
        }
      }

      const tixObj: Ticket = {
        id,
        ticket_number: ticketNumber,
        record_type:
          raw.record_type === 'TECHNICAL'
            ? 'TECHNICAL'
            : existingTicket?.record_type || 'OBSERVATION',
        subject: String(
          raw.subject !== undefined
            ? raw.subject
            : existingTicket?.subject ||
              'Surveillance Alert / Incident'
        ),
        description: String(
          raw.description !== undefined
            ? raw.description
            : existingTicket?.description ||
              'System generated or imported observation record.'
        ),
        department_id: String(
          raw.department_id !== undefined
            ? raw.department_id
            : existingTicket?.department_id ||
              'dept_surveillance'
        ),
        department_name: String(
          raw.department_name !== undefined
            ? raw.department_name
            : existingTicket?.department_name ||
              'Security Operations & Surveillance'
        ),
        category: String(
          raw.category !== undefined
            ? raw.category
            : existingTicket?.category ||
              'Surveillance Hardware'
        ),
        priority:
          raw.priority !== undefined
            ? raw.priority
            : existingTicket?.priority || 'MEDIUM',
        status:
          raw.status !== undefined
            ? raw.status
            : existingTicket?.status || 'NEW',
        assigned_technician_id:
          raw.assigned_technician_id !== undefined
            ? raw.assigned_technician_id
            : existingTicket?.assigned_technician_id || null,
        assigned_technician_name: String(
          raw.assigned_technician_name !== undefined
            ? raw.assigned_technician_name
            : existingTicket?.assigned_technician_name ||
              'Unassigned'
        ),
        location_id: String(
          raw.location_id !== undefined
            ? raw.location_id
            : existingTicket?.location_id || 'loc_001'
        ),
        location_name: String(
          raw.location_name !== undefined
            ? raw.location_name
            : existingTicket?.location_name ||
              'Agency Jaranwala'
        ),
        region_name: String(
          raw.region_name !== undefined
            ? raw.region_name
            : existingTicket?.region_name || 'Central'
        ),
        sla_deadline:
          raw.sla_deadline !== undefined
            ? raw.sla_deadline
            : existingTicket?.sla_deadline ||
              new Date(Date.now() + 86400000).toISOString(),
        sla_status:
          raw.sla_status !== undefined
            ? raw.sla_status
            : existingTicket?.sla_status || 'ON TRACK',
        sla_remaining_hours:
          raw.sla_remaining_hours !== undefined
            ? Number(raw.sla_remaining_hours)
            : existingTicket?.sla_remaining_hours || 24,
        evidence_images: evidenceImages,
        created_by_user_id: String(
          raw.created_by_user_id !== undefined
            ? raw.created_by_user_id
            : existingTicket?.created_by_user_id ||
              'admin-surveillance'
        ),
        created_by_name: String(
          raw.created_by_name !== undefined
            ? raw.created_by_name
            : existingTicket?.created_by_name ||
              'Surveillance Super Admin'
        ),
        created_at:
          raw.created_at !== undefined
            ? raw.created_at
            : existingTicket?.created_at ||
              new Date().toISOString(),
        updated_at:
          raw.updated_at !== undefined
            ? raw.updated_at
            : existingTicket?.updated_at ||
              new Date().toISOString(),
        resolved_at:
          raw.resolved_at !== undefined
            ? raw.resolved_at
            : existingTicket?.resolved_at || null,
        closed_at:
          raw.closed_at !== undefined
            ? raw.closed_at
            : existingTicket?.closed_at || null,
        comments:
          Array.isArray(raw.comments)
            ? raw.comments
            : existingTicket?.comments || []
      };

      if (existingTicket) {
        await this.runImportQuery(
          `UPDATE tickets
           SET ticket_number=?,
               record_type=?,
               subject=?,
               description=?,
               department_id=?,
               department_name=?,
               category=?,
               priority=?,
               status=?,
               assigned_technician_id=?,
               assigned_technician_name=?,
               location_id=?,
               location_name=?,
               region_name=?,
               sla_deadline=?,
               sla_status=?,
               sla_remaining_hours=?,
               evidence_images=?,
               created_by_user_id=?,
               created_by_name=?,
               resolved_at=?,
               closed_at=?,
               created_at=?,
               updated_at=?
           WHERE id=?`,
          [
            tixObj.ticket_number,
            tixObj.record_type,
            tixObj.subject,
            tixObj.description,
            tixObj.department_id,
            tixObj.department_name,
            tixObj.category,
            tixObj.priority,
            tixObj.status,
            tixObj.assigned_technician_id,
            tixObj.assigned_technician_name,
            tixObj.location_id,
            tixObj.location_name,
            tixObj.region_name,
            tixObj.sla_deadline
              ? new Date(tixObj.sla_deadline)
              : null,
            tixObj.sla_status,
            tixObj.sla_remaining_hours,
            JSON.stringify(tixObj.evidence_images),
            tixObj.created_by_user_id,
            tixObj.created_by_name,
            tixObj.resolved_at
              ? new Date(tixObj.resolved_at)
              : null,
            tixObj.closed_at
              ? new Date(tixObj.closed_at)
              : null,
            tixObj.created_at
              ? new Date(tixObj.created_at)
              : null,
            tixObj.updated_at
              ? new Date(tixObj.updated_at)
              : null,
            existingTicket.id
          ]
        );

        this.tickets[existingIdx] = {
          ...existingTicket,
          ...tixObj,
          id: existingTicket.id
        };
        updated++;
      } else {
        await this.runImportQuery(
          `INSERT INTO tickets
            (id, ticket_number, record_type, subject, description, department_id,
             department_name, category, priority, status,
             assigned_technician_id, assigned_technician_name, location_id,
             location_name, region_name, sla_deadline, sla_status,
             sla_remaining_hours, evidence_images, created_by_user_id,
             created_by_name, resolved_at, closed_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tixObj.id,
            tixObj.ticket_number,
            tixObj.record_type,
            tixObj.subject,
            tixObj.description,
            tixObj.department_id,
            tixObj.department_name,
            tixObj.category,
            tixObj.priority,
            tixObj.status,
            tixObj.assigned_technician_id,
            tixObj.assigned_technician_name,
            tixObj.location_id,
            tixObj.location_name,
            tixObj.region_name,
            tixObj.sla_deadline
              ? new Date(tixObj.sla_deadline)
              : null,
            tixObj.sla_status,
            tixObj.sla_remaining_hours,
            JSON.stringify(tixObj.evidence_images),
            tixObj.created_by_user_id,
            tixObj.created_by_name,
            tixObj.resolved_at
              ? new Date(tixObj.resolved_at)
              : null,
            tixObj.closed_at
              ? new Date(tixObj.closed_at)
              : null,
            tixObj.created_at
              ? new Date(tixObj.created_at)
              : null,
            tixObj.updated_at
              ? new Date(tixObj.updated_at)
              : null
          ]
        );

        this.tickets.push(tixObj);
        created++;
      }
    }

    return { created, updated };
  }

  // Database Export & Backup
  public exportData(target: string, format: 'json' | 'csv') {
    let dataset: any = null;
    if (target === 'all' || target === 'Complete System Backup') {
      dataset = {
        departments: this.departments,
        regions: this.regions,
        locations: this.locations,
        users: this.users,
        tickets: this.tickets,
        slaRules: this.slaRules,
        auditLogs: this.auditLogs,
        settings: this.settings,
        exportedAt: new Date().toISOString()
      };
    } else if (target === 'tickets' || target === 'Incident Tickets Database') {
      dataset = this.tickets;
    } else if (target === 'users' || target === 'Users & Team Directory') {
      dataset = this.users;
    } else if (target === 'locations' || target === 'Locations & Sites') {
      dataset = this.locations;
    } else if (target === 'audit' || target === 'Security Audit Logs') {
      dataset = this.auditLogs;
    }

    if (format === 'json') {
      return JSON.stringify(dataset, null, 2);
    } else {
      // CSV format
      if (Array.isArray(dataset) && dataset.length > 0) {
        const headers = Object.keys(dataset[0]).join(',');
        const rows = dataset.map((obj: any) =>
          Object.values(obj)
            .map(val => (typeof val === 'object' ? `"${JSON.stringify(val).replace(/"/g, '""')}"` : `"${String(val).replace(/"/g, '""')}"`))
            .join(',')
        );
        return [headers, ...rows].join('\n');
      }
      return 'No tabular records available for CSV serialization';
    }
  }
}

export const db = new DatabaseManager();
