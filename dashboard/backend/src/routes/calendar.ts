/**
 * Calendar & Work Assignment Routes
 * 
 * Handles:
 * - Google Calendar event syncing
 * - Work assignment to employees
 * - Employee service routes
 * - Internal notes
 */

import { Router, Request, Response } from 'express';
import { db, calendarEvents, workAssignments, employees, internalNotes, timeEntries } from '../db/index.js';
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = Router();

// ================================
// CALENDAR EVENTS
// ================================

/**
 * GET /api/calendar/events
 * Get all calendar events (optionally filtered by date range)
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, calendar_id } = req.query;

    let query = db.select().from(calendarEvents);

    // Apply filters
    if (start_date && end_date) {
      query = query.where(
        and(
          gte(calendarEvents.start_time, new Date(start_date as string)),
          lte(calendarEvents.start_time, new Date(end_date as string))
        )
      ) as any;
    }

    if (calendar_id) {
      query = query.where(eq(calendarEvents.google_calendar_id, calendar_id as string)) as any;
    }

    const events = await query.orderBy(asc(calendarEvents.start_time));

    res.json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    logger.error('Error fetching calendar events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar events',
      error: error.message,
    });
  }
});

/**
 * GET /api/calendar/events/today
 * Get all events for today (unassigned or all)
 */
router.get('/events/today', async (req: Request, res: Response) => {
  try {
    const { include_assigned } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's events
    const events = await db.query.calendarEvents.findMany({
      where: and(
        gte(calendarEvents.start_time, today),
        lte(calendarEvents.start_time, tomorrow),
        eq(calendarEvents.cancelled, false)
      ),
      with: {
        assignments: {
          with: {
            employee: true,
          },
        },
      },
      orderBy: asc(calendarEvents.start_time),
    });

    // Filter out assigned events if requested
    let filteredEvents = events;
    if (include_assigned !== 'true') {
      filteredEvents = events.filter(event => event.assignments.length === 0);
    }

    res.json({
      success: true,
      data: filteredEvents,
    });
  } catch (error: any) {
    logger.error('Error fetching today\'s events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s events',
      error: error.message,
    });
  }
});

// ================================
// WORK ASSIGNMENTS (Admin)
// ================================

/**
 * POST /api/assignments
 * Assign a calendar event to an employee
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { calendar_event_id, employee_id, sequence_order, admin_notes } = req.body;
    const assigned_by = req.user?.id || 1; // From auth middleware

    if (!calendar_event_id || !employee_id) {
      return res.status(400).json({
        success: false,
        message: 'calendar_event_id and employee_id are required',
      });
    }

    // Create assignment
    const [assignment] = await db
      .insert(workAssignments)
      .values({
        calendar_event_id: parseInt(calendar_event_id),
        employee_id: parseInt(employee_id),
        assigned_by: parseInt(assigned_by as string),
        sequence_order: sequence_order ? parseInt(sequence_order) : null,
        admin_notes,
        status: 'assigned',
      })
      .returning();

    // TODO: Append assignment info to Google Calendar event description
    // This will happen in the Google Calendar service

    logger.info(`Work assigned: Event ${calendar_event_id} → Employee ${employee_id}`);

    res.json({
      success: true,
      data: assignment,
      message: 'Work assigned successfully',
    });
  } catch (error: any) {
    logger.error('Error creating work assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign work',
      error: error.message,
    });
  }
});

/**
 * PUT /api/assignments/:id
 * Update work assignment (reorder, reassign, update status)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { employee_id, sequence_order, status, admin_notes, employee_notes } = req.body;

    const updateData: any = { updated_at: new Date() };
    
    if (employee_id) updateData.employee_id = parseInt(employee_id);
    if (sequence_order !== undefined) updateData.sequence_order = parseInt(sequence_order);
    if (status) updateData.status = status;
    if (admin_notes) updateData.admin_notes = admin_notes;
    if (employee_notes) updateData.employee_notes = employee_notes;

    // Update status timestamps
    if (status === 'in_progress' && !updateData.started_at) {
      updateData.started_at = new Date();
    }
    if (status === 'completed' && !updateData.completed_at) {
      updateData.completed_at = new Date();
    }

    const [updated] = await db
      .update(workAssignments)
      .set(updateData)
      .where(eq(workAssignments.id, parseInt(id)))
      .returning();

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    res.json({
      success: true,
      data: updated,
      message: 'Assignment updated successfully',
    });
  } catch (error: any) {
    logger.error('Error updating work assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/assignments/:id
 * Remove a work assignment
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [deleted] = await db
      .delete(workAssignments)
      .where(eq(workAssignments.id, parseInt(id)))
      .returning();

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    res.json({
      success: true,
      message: 'Assignment removed successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting work assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assignment',
      error: error.message,
    });
  }
});

/**
 * GET /api/assignments/employee/:employeeId
 * Get all assignments for a specific employee
 */
router.get('/employee/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { date, status } = req.query;

    let whereConditions: any[] = [eq(workAssignments.employee_id, parseInt(employeeId))];

    if (status && typeof status === 'string') {
      whereConditions.push(sql`${workAssignments.status} = ${status}`);
    }

    // Get assignments with calendar event details
    const assignments = await db.query.workAssignments.findMany({
      where: and(...whereConditions),
      with: {
        calendarEvent: true,
        assignedByEmployee: {
          columns: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: asc(workAssignments.sequence_order),
    });

    // Filter by date if provided
    let filteredAssignments = assignments;
    if (date) {
      const filterDate = new Date(date as string);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filteredAssignments = assignments.filter(a => {
        const eventDate = new Date(a.calendarEvent.start_time);
        return eventDate >= filterDate && eventDate < nextDay;
      });
    }

    res.json({
      success: true,
      data: filteredAssignments,
    });
  } catch (error: any) {
    logger.error('Error fetching employee assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error.message,
    });
  }
});

/**
 * GET /api/assignments/today
 * Get all assignments for today (admin view)
 */
router.get('/today', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const assignments = await db.query.workAssignments.findMany({
      where: and(
        gte(workAssignments.assigned_at, today),
        lte(workAssignments.assigned_at, tomorrow)
      ),
      with: {
        calendarEvent: true,
        employee: true,
        assignedByEmployee: {
          columns: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: [asc(workAssignments.employee_id), asc(workAssignments.sequence_order)],
    });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error: any) {
    logger.error('Error fetching today\'s assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error.message,
    });
  }
});

// ================================
// EMPLOYEES
// ================================

/**
 * GET /api/employees
 * Get all employees
 */
router.get('/employees', async (req: Request, res: Response) => {
  try {
    const { active_only } = req.query;

    let query = db.select().from(employees);

    if (active_only === 'true') {
      query = query.where(eq(employees.active, true)) as any;
    }

    const allEmployees = await query.orderBy(asc(employees.last_name));

    res.json({
      success: true,
      data: allEmployees,
    });
  } catch (error: any) {
    logger.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message,
    });
  }
});

/**
 * GET /api/employees/working-today
 * Get employees working today (have assignments or default availability)
 */
router.get('/employees/working-today', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all active employees with their assignments for today
    const workingEmployees = await db.query.employees.findMany({
      where: eq(employees.active, true),
      with: {
        workAssignments: {
          where: and(
            gte(workAssignments.assigned_at, today),
            lte(workAssignments.assigned_at, tomorrow)
          ),
          with: {
            calendarEvent: true,
          },
          orderBy: asc(workAssignments.sequence_order),
        },
      },
      orderBy: asc(employees.last_name),
    });

    res.json({
      success: true,
      data: workingEmployees,
    });
  } catch (error: any) {
    logger.error('Error fetching working employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch working employees',
      error: error.message,
    });
  }
});

// ================================
// INTERNAL NOTES
// ================================

/**
 * GET /api/notes
 * Get internal notes (filtered by entity or category)
 */
router.get('/notes', async (req: Request, res: Response) => {
  try {
    const { entity_type, entity_id, category, pinned_only } = req.query;
    const userRole = req.user?.role || 'technician';

    let whereConditions: any[] = [];

    if (entity_type) whereConditions.push(eq(internalNotes.entity_type, entity_type as string));
    if (entity_id) whereConditions.push(eq(internalNotes.entity_id, entity_id as string));
    if (category) whereConditions.push(eq(internalNotes.category, category as string));
    if (pinned_only === 'true') whereConditions.push(eq(internalNotes.pinned, true));

    // Non-admins can only see notes visible to all
    if (userRole !== 'admin' && userRole !== 'manager') {
      whereConditions.push(eq(internalNotes.visible_to_all, true));
    }

    const notes = await db.query.internalNotes.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        createdBy: {
          columns: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: [desc(internalNotes.pinned), desc(internalNotes.created_at)],
    });

    res.json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    logger.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message,
    });
  }
});

/**
 * POST /api/notes
 * Create a new internal note
 */
router.post('/notes', async (req: Request, res: Response) => {
  try {
    const { entity_type, entity_id, title, content, category, priority, visible_to_all } = req.body;
    const created_by = req.user?.id || 1;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required',
      });
    }

    const [note] = await db
      .insert(internalNotes)
      .values({
        entity_type: entity_type || 'general',
        entity_id,
        title,
        content,
        category: category || 'general',
        priority: priority || 'normal',
        visible_to_all: visible_to_all !== undefined ? visible_to_all : false,
        created_by: parseInt(created_by as string),
      })
      .returning();

    res.json({
      success: true,
      data: note,
      message: 'Note created successfully',
    });
  } catch (error: any) {
    logger.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note',
      error: error.message,
    });
  }
});

/**
 * PUT /api/notes/:id
 * Update a note
 */
router.put('/notes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category, priority, pinned, visible_to_all } = req.body;

    const updateData: any = { updated_at: new Date() };
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (pinned !== undefined) updateData.pinned = pinned;
    if (visible_to_all !== undefined) updateData.visible_to_all = visible_to_all;

    const [updated] = await db
      .update(internalNotes)
      .set(updateData)
      .where(eq(internalNotes.id, parseInt(id)))
      .returning();

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    res.json({
      success: true,
      data: updated,
      message: 'Note updated successfully',
    });
  } catch (error: any) {
    logger.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete('/notes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [deleted] = await db
      .delete(internalNotes)
      .where(eq(internalNotes.id, parseInt(id)))
      .returning();

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error.message,
    });
  }
});

// ================================
// TIME CLOCK
// ================================

/**
 * POST /api/clock/in
 * Clock in
 */
router.post('/clock/in', async (req: Request, res: Response) => {
  try {
    const employee_id = req.user?.id || req.body.employee_id;
    const { location } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
      });
    }

    // Check if already clocked in
    const [existingEntry] = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, parseInt(employee_id as string)),
          eq(timeEntries.clock_out, null as any)
        )
      )
      .limit(1);

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in',
        data: existingEntry,
      });
    }

    const [entry] = await db
      .insert(timeEntries)
      .values({
        employee_id: parseInt(employee_id as string),
        clock_in: new Date(),
        clock_in_location: location,
        ip_address: req.ip || req.socket.remoteAddress || null,
        user_agent: req.headers['user-agent'] || null,
      })
      .returning();

    res.json({
      success: true,
      data: entry,
      message: 'Clocked in successfully',
    });
  } catch (error: any) {
    logger.error('Error clocking in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock in',
      error: error.message,
    });
  }
});

/**
 * POST /api/clock/out
 * Clock out
 */
router.post('/clock/out', async (req: Request, res: Response) => {
  try {
    const employee_id = req.user?.id || req.body.employee_id;
    const { location, notes } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
      });
    }

    // Find active clock entry
    const [activeEntry] = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, parseInt(employee_id as string)),
          eq(timeEntries.clock_out, null as any)
        )
      )
      .limit(1);

    if (!activeEntry) {
      return res.status(400).json({
        success: false,
        message: 'Not currently clocked in',
      });
    }

    // Calculate duration in minutes
    const clockOutTime = new Date();
    const durationMinutes = Math.round((clockOutTime.getTime() - new Date(activeEntry.clock_in).getTime()) / 60000);

    const [updated] = await db
      .update(timeEntries)
      .set({
        clock_out: clockOutTime,
        clock_out_location: location,
        duration_minutes: durationMinutes,
        notes,
        updated_at: new Date(),
      })
      .where(eq(timeEntries.id, activeEntry.id))
      .returning();

    res.json({
      success: true,
      data: updated,
      message: 'Clocked out successfully',
    });
  } catch (error: any) {
    logger.error('Error clocking out:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock out',
      error: error.message,
    });
  }
});

/**
 * GET /api/clock/status
 * Get current clock status for employee
 */
router.get('/clock/status', async (req: Request, res: Response) => {
  try {
    const employee_id = req.user?.id || req.query.employee_id;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
      });
    }

    const [activeEntry] = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, parseInt(employee_id as string)),
          eq(timeEntries.clock_out, null as any)
        )
      )
      .limit(1);

    res.json({
      success: true,
      data: {
        is_clocked_in: !!activeEntry,
        active_entry: activeEntry || null,
      },
    });
  } catch (error: any) {
    logger.error('Error checking clock status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check clock status',
      error: error.message,
    });
  }
});

/**
 * GET /api/clock/entries
 * Get clock entries (with optional filters)
 */
router.get('/clock/entries', async (req: Request, res: Response) => {
  try {
    const { employee_id, start_date, end_date, approved } = req.query;

    let whereConditions: any[] = [];

    if (employee_id) {
      whereConditions.push(eq(timeEntries.employee_id, parseInt(employee_id as string)));
    }

    if (start_date) {
      whereConditions.push(gte(timeEntries.clock_in, new Date(start_date as string)));
    }

    if (end_date) {
      whereConditions.push(lte(timeEntries.clock_in, new Date(end_date as string)));
    }

    if (approved !== undefined) {
      whereConditions.push(eq(timeEntries.approved, approved === 'true'));
    }

    const entries = await db.query.timeEntries.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        employee: {
          columns: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: desc(timeEntries.clock_in),
    });

    res.json({
      success: true,
      data: entries,
    });
  } catch (error: any) {
    logger.error('Error fetching clock entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clock entries',
      error: error.message,
    });
  }
});

// ================================
// SYNC ENDPOINT (Trigger Google Calendar Sync)
// ================================

/**
 * POST /api/calendar/sync
 * Manually trigger Google Calendar sync
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    // TODO: Implement Google Calendar sync service
    logger.info('Calendar sync triggered');

    res.json({
      success: true,
      message: 'Calendar sync triggered (implementation pending)',
    });
  } catch (error: any) {
    logger.error('Error syncing calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync calendar',
      error: error.message,
    });
  }
});

export default router;

