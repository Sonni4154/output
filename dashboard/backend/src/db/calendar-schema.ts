/**
 * Calendar & Work Assignment Schema
 * 
 * Integrates with Google Calendar to provide work assignment functionality
 * - Syncs calendar events from Google Calendar
 * - Allows admins to assign events to employees
 * - Tracks employee schedules and availability
 * - Provides employee-facing service routes
 */

import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  json,
  serial,
  index,
  pgEnum,
  doublePrecision
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ================================
// ENUMS
// ================================

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'cancelled'
]);

export const employeeRoleEnum = pgEnum('employee_role', [
  'admin',
  'manager',
  'technician',
  'trainee'
]);

// ================================
// EMPLOYEES
// ================================

export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  stack_user_id: varchar('stack_user_id', { length: 100 }).unique(), // Link to Stack Auth
  email: varchar('email', { length: 255 }).notNull().unique(),
  first_name: varchar('first_name', { length: 100 }).notNull(),
  last_name: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  role: employeeRoleEnum('role').default('technician').notNull(),
  active: boolean('active').default(true).notNull(),
  
  // Compensation
  hourly_rate: doublePrecision('hourly_rate').default(25.0).notNull(),
  
  // Availability
  default_start_time: varchar('default_start_time', { length: 10 }).default('09:00'), // "HH:MM" format
  default_end_time: varchar('default_end_time', { length: 10 }).default('17:00'),
  
  // Metadata
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('employee_email_idx').on(table.email),
  activeIdx: index('employee_active_idx').on(table.active),
}));

// ================================
// GOOGLE CALENDAR EVENTS (Synced)
// ================================

export const calendarEvents = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  google_event_id: varchar('google_event_id', { length: 255 }).notNull().unique(),
  google_calendar_id: varchar('google_calendar_id', { length: 255 }).notNull(),
  
  // Event details
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  location: text('location'),
  
  // Time
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time').notNull(),
  all_day: boolean('all_day').default(false),
  
  // Customer info (parsed from event)
  customer_name: varchar('customer_name', { length: 255 }),
  customer_phone: varchar('customer_phone', { length: 50 }),
  customer_email: varchar('customer_email', { length: 255 }),
  customer_address: text('customer_address'),
  
  // QuickBooks link (optional)
  qb_customer_id: integer('qb_customer_id'),
  
  // Service details
  service_type: varchar('service_type', { length: 100 }), // Insect Control, Rodent, Termite, etc.
  calendar_color: varchar('calendar_color', { length: 50 }),
  
  // Status
  status: varchar('status', { length: 50 }).default('scheduled'),
  cancelled: boolean('cancelled').default(false),
  
  // Sync metadata
  last_synced: timestamp('last_synced').defaultNow(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  googleEventIdx: index('calendar_google_event_idx').on(table.google_event_id),
  startTimeIdx: index('calendar_start_time_idx').on(table.start_time),
  serviceTypeIdx: index('calendar_service_type_idx').on(table.service_type),
}));

// ================================
// WORK ASSIGNMENTS
// ================================

export const workAssignments = pgTable('work_assignments', {
  id: serial('id').primaryKey(),
  calendar_event_id: integer('calendar_event_id').notNull(),
  employee_id: integer('employee_id').notNull(),
  
  // Assignment details
  assigned_by: integer('assigned_by'), // Employee ID of admin who assigned
  assigned_at: timestamp('assigned_at').defaultNow().notNull(),
  
  // Ordering (for service route)
  sequence_order: integer('sequence_order'), // 1, 2, 3... for the day
  
  // Status
  status: assignmentStatusEnum('status').default('assigned').notNull(),
  
  // Completion tracking
  started_at: timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  
  // Notes
  admin_notes: text('admin_notes'), // Notes from admin when assigning
  employee_notes: text('employee_notes'), // Notes from employee after completion
  
  // Metadata
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  eventIdx: index('assignment_event_idx').on(table.calendar_event_id),
  employeeIdx: index('assignment_employee_idx').on(table.employee_id),
  dateIdx: index('assignment_date_idx').on(table.assigned_at),
  statusIdx: index('assignment_status_idx').on(table.status),
}));

// ================================
// EMPLOYEE AVAILABILITY
// ================================

export const employeeAvailability = pgTable('employee_availability', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull(),
  
  // Date
  date: timestamp('date').notNull(), // Specific date
  
  // Time range
  start_time: varchar('start_time', { length: 10 }).notNull(), // "HH:MM"
  end_time: varchar('end_time', { length: 10 }).notNull(),
  
  // Status
  available: boolean('available').default(true),
  reason: text('reason'), // If unavailable: "PTO", "Sick", "Training", etc.
  
  // Metadata
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  employeeDateIdx: index('availability_employee_date_idx').on(table.employee_id, table.date),
}));

// ================================
// INTERNAL NOTES (Persistent)
// ================================

export const internalNotes = pgTable('internal_notes', {
  id: serial('id').primaryKey(),
  
  // What the note is about
  entity_type: varchar('entity_type', { length: 50 }).notNull(), // 'customer', 'job', 'employee', 'general'
  entity_id: varchar('entity_id', { length: 100 }), // ID of related entity (QB customer ID, employee ID, etc.)
  
  // Note content
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),
  
  // Categorization
  category: varchar('category', { length: 50 }), // 'important', 'followup', 'issue', 'general'
  priority: varchar('priority', { length: 20 }).default('normal'), // 'low', 'normal', 'high', 'urgent'
  
  // Pinning & visibility
  pinned: boolean('pinned').default(false),
  visible_to_all: boolean('visible_to_all').default(false), // If false, only admins see it
  
  // Author
  created_by: integer('created_by').notNull(), // Employee ID
  
  // Metadata
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  entityIdx: index('notes_entity_idx').on(table.entity_type, table.entity_id),
  categoryIdx: index('notes_category_idx').on(table.category),
  createdByIdx: index('notes_created_by_idx').on(table.created_by),
  pinnedIdx: index('notes_pinned_idx').on(table.pinned),
}));

// ================================
// TIME CLOCK ENTRIES
// ================================

export const timeEntries = pgTable('time_entries', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull(),
  
  // Clock in/out times
  clock_in: timestamp('clock_in').defaultNow().notNull(),
  clock_out: timestamp('clock_out'),
  
  // Duration (calculated on clock out)
  duration_minutes: integer('duration_minutes'),
  
  // Device/Location tracking
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  clock_in_location: text('clock_in_location'),
  clock_out_location: text('clock_out_location'),
  
  // Suspicious activity flagging (silent to employee)
  flagged: boolean('flagged').default(false),
  flag_reason: text('flag_reason'), // e.g., "Late night clock-in", "Duplicate IP"
  
  // Notes
  notes: text('notes'),
  
  // Approval (for payroll)
  approved: boolean('approved').default(false),
  approved_by: integer('approved_by'),
  approved_at: timestamp('approved_at'),
  
  // Metadata
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  employeeIdx: index('time_employee_idx').on(table.employee_id),
  clockInIdx: index('time_clock_in_idx').on(table.clock_in),
  flaggedIdx: index('time_flagged_idx').on(table.flagged),
  approvedIdx: index('time_approved_idx').on(table.approved),
}));

// ================================
// SUSPICIOUS ACTIVITY TERMS
// ================================

export const suspiciousTerms = pgTable('suspicious_terms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  active: boolean('active').default(true),
  
  // Rule configuration (JSON for flexibility)
  rule_config: json('rule_config'), // e.g., { "time_range": ["00:00", "04:00"], "type": "late_night" }
  
  // Metadata
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  activeIdx: index('suspicious_active_idx').on(table.active),
}));

// ================================
// RELATIONS
// ================================

export const employeesRelations = relations(employees, ({ many }) => ({
  workAssignments: many(workAssignments),
  availability: many(employeeAvailability),
  notesCreated: many(internalNotes),
  timeEntries: many(timeEntries),
  assignmentsMade: many(workAssignments, { relationName: 'assignedBy' }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ many }) => ({
  assignments: many(workAssignments),
}));

export const workAssignmentsRelations = relations(workAssignments, ({ one }) => ({
  calendarEvent: one(calendarEvents, {
    fields: [workAssignments.calendar_event_id],
    references: [calendarEvents.id],
  }),
  employee: one(employees, {
    fields: [workAssignments.employee_id],
    references: [employees.id],
  }),
  assignedByEmployee: one(employees, {
    fields: [workAssignments.assigned_by],
    references: [employees.id],
    relationName: 'assignedBy',
  }),
}));

export const employeeAvailabilityRelations = relations(employeeAvailability, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeAvailability.employee_id],
    references: [employees.id],
  }),
}));

export const internalNotesRelations = relations(internalNotes, ({ one }) => ({
  createdBy: one(employees, {
    fields: [internalNotes.created_by],
    references: [employees.id],
  }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [timeEntries.employee_id],
    references: [employees.id],
  }),
  approvedBy: one(employees, {
    fields: [timeEntries.approved_by],
    references: [employees.id],
  }),
}));

