-- ==============================================================================
-- OpsDesk - Multi-Department Ticketing & Operations Portal
-- Database Schema for MySQL 8.0+ (Hostinger Compatible)
-- Engine: InnoDB, Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Table: departments
-- Core departments: Surveillance, Security, Administration, HVAC
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `departments` (
  `id` VARCHAR(50) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: regions
-- Regional operational divisions (Central, Headquarters, Ideas Cafe, North, South)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `regions` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: locations (Master Branches)
-- Master data for 95+ branches across regions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `locations` (
  `id` VARCHAR(50) NOT NULL,
  `branch_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `region_id` VARCHAR(50) NOT NULL,
  `region_name` VARCHAR(100) NOT NULL,
  `physical_address` TEXT NULL,
  `contact_person` VARCHAR(100) NULL,
  `phone` VARCHAR(50) NULL,
  `notification_email` VARCHAR(150) NULL,
  `camera_zones` INT NOT NULL DEFAULT 1,
  `areas_details` VARCHAR(255) NULL,
  `status` ENUM('Active', 'Inactive', 'Maintenance') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_locations_region` (`region_id`),
  KEY `idx_locations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: users
-- Portal operators, technicians, supervisors, and super admins
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `department_id` VARCHAR(50) NOT NULL,
  `department_name` VARCHAR(100) NOT NULL,
  `role` ENUM('SUPER_ADMIN', 'SUPERVISOR', 'TECHNICIAN', 'OPERATOR') NOT NULL DEFAULT 'TECHNICIAN',
  `status` ENUM('Active', 'Inactive', 'Blocked') NOT NULL DEFAULT 'Active',
  `avatar_initials` VARCHAR(10) NULL,
  `workload_status` ENUM('Idle', 'On-Field', 'Busy') NOT NULL DEFAULT 'Idle',
  `granular_rights` JSON NULL,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_dept` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: sla_rules
-- Configurable SLA matrix policies
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sla_rules` (
  `id` VARCHAR(50) NOT NULL,
  `priority_tier` ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') NOT NULL,
  `category_domain` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `response_sla_minutes` INT NOT NULL DEFAULT 60,
  `resolution_sla_hours` INT NOT NULL DEFAULT 24,
  `escalation_trigger_hours` INT NOT NULL DEFAULT 18,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: tickets (Observations & Incidents)
-- Main ticketing entity for all departments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` VARCHAR(50) NOT NULL,
  `ticket_number` VARCHAR(50) NOT NULL UNIQUE,
  `record_type` ENUM('OBSERVATION', 'TECHNICAL') NOT NULL DEFAULT 'OBSERVATION',
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `department_id` VARCHAR(50) NOT NULL,
  `department_name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'GENERAL',
  `priority` ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
  `status` ENUM('NEW', 'OPEN', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'NEW',
  `assigned_technician_id` VARCHAR(50) NULL,
  `assigned_technician_name` VARCHAR(100) NULL,
  `location_id` VARCHAR(50) NOT NULL,
  `location_name` VARCHAR(150) NOT NULL,
  `region_name` VARCHAR(100) NOT NULL,
  `sla_deadline` TIMESTAMP NULL,
  `sla_status` ENUM('ON TRACK', 'AT RISK', 'BREACHED', 'COMPLETED') NOT NULL DEFAULT 'ON TRACK',
  `sla_remaining_hours` DECIMAL(5,1) NOT NULL DEFAULT 24.0,
  `evidence_images` JSON NULL,
  `created_by_user_id` VARCHAR(50) NOT NULL,
  `created_by_name` VARCHAR(100) NOT NULL,
  `resolved_at` TIMESTAMP NULL,
  `closed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tickets_dept` (`department_id`),
  KEY `idx_tickets_status` (`status`),
  KEY `idx_tickets_priority` (`priority`),
  KEY `idx_tickets_technician` (`assigned_technician_id`),
  KEY `idx_tickets_location` (`location_id`),
  KEY `idx_tickets_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table: ticket_comments
-- Incident progress notes, diagnostic details, and attachments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ticket_comments` (
  `id` VARCHAR(50) NOT NULL,
  `ticket_id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `comment` MEDIUMTEXT NOT NULL,
  `attachments` JSON NULL,
  `is_internal` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comments_ticket` (`ticket_id`),
  CONSTRAINT `fk_comment_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Table: audit_logs
-- Immutable compliance ledger (Write-Once Audit Trail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(50) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `scope_category` VARCHAR(50) NOT NULL, -- 'Ticket Ops', 'User Governance', 'Ticket Assignment', 'System & Config', 'Admin Activities'
  `administrator` VARCHAR(100) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `setting_changed` VARCHAR(150) NOT NULL,
  `target_entity` VARCHAR(150) NOT NULL,
  `action_code` VARCHAR(50) NOT NULL, -- e.g. TICKET_CREATED, STATUS_CHANGED, ASSIGNMENT_UPDATED
  `action_narrative` TEXT NOT NULL,
  `previous_value` TEXT NULL,
  `new_value` TEXT NULL,
  `ip_session` VARCHAR(100) NOT NULL DEFAULT '127.0.0.1 (Authenticated Session)',
  `raw_json` JSON NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_scope` (`scope_category`),
  KEY `idx_audit_time` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Table: system_settings
-- System identity, logo manager, SMTP delivery, RBAC matrix, evidence size limits
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` JSON NOT NULL,
  `updated_by` VARCHAR(100) NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
