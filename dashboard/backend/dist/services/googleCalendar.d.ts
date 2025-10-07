/**
 * Google Calendar Integration Service
 *
 * Handles:
 * - Syncing events from multiple Google Calendars
 * - Creating/updating/deleting events
 * - Appending assignment metadata to event descriptions
 * - Two-way sync between Google Calendar and NeonDB
 */
/**
 * Sync events from a single Google Calendar
 */
export declare function syncCalendarEvents(calendarId: string): Promise<number>;
/**
 * Sync all configured Google Calendars
 */
export declare function syncAllCalendars(): Promise<{
    success: boolean;
    calendars_synced: number;
    events_synced: number;
}>;
/**
 * Append assignment info to Google Calendar event description
 */
export declare function appendAssignmentToGoogleEvent(googleEventId: string, googleCalendarId: string, employeeName: string, assignedByName: string): Promise<void>;
/**
 * Create a new event in Google Calendar
 */
export declare function createGoogleCalendarEvent(calendarId: string, eventData: {
    summary: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
}): Promise<string>;
/**
 * Update a Google Calendar event
 */
export declare function updateGoogleCalendarEvent(calendarId: string, eventId: string, updates: {
    summary?: string;
    description?: string;
    location?: string;
    start?: Date;
    end?: Date;
}): Promise<void>;
/**
 * Delete a Google Calendar event
 */
export declare function deleteGoogleCalendarEvent(calendarId: string, eventId: string): Promise<void>;
//# sourceMappingURL=googleCalendar.d.ts.map