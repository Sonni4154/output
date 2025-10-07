/**
 * Google Calendar Integration Service
 * 
 * Handles:
 * - Syncing events from multiple Google Calendars
 * - Creating/updating/deleting events
 * - Appending assignment metadata to event descriptions
 * - Two-way sync between Google Calendar and NeonDB
 */

import axios from 'axios';
import { db, calendarEvents } from '../db/index.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

/**
 * Get OAuth access token for Google Calendar
 */
async function getGoogleAccessToken(): Promise<string> {
  try {
    const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!refreshToken || !clientId || !clientSecret) {
      throw new Error('Google Calendar credentials not configured');
    }

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    return response.data.access_token;
  } catch (error: any) {
    logger.error('Failed to get Google access token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Parse customer info from event description
 * Expected format:
 *   Customer: John Doe
 *   Phone: (415) 555-1234
 *   Email: john@example.com
 *   Address: 123 Main St, San Rafael, CA 94901
 */
function parseEventDescription(description: string | null): {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
} {
  if (!description) return {};

  const result: any = {};

  const customerMatch = description.match(/Customer:\s*(.+?)(?:\n|$)/i);
  if (customerMatch) result.customer_name = customerMatch[1].trim();

  const phoneMatch = description.match(/Phone:\s*(.+?)(?:\n|$)/i);
  if (phoneMatch) result.customer_phone = phoneMatch[1].trim();

  const emailMatch = description.match(/Email:\s*(.+?)(?:\n|$)/i);
  if (emailMatch) result.customer_email = emailMatch[1].trim();

  const addressMatch = description.match(/Address:\s*(.+?)(?:\n|$)/i);
  if (addressMatch) result.customer_address = addressMatch[1].trim();

  return result;
}

/**
 * Determine service type from calendar ID or event title
 */
function determineServiceType(calendarId: string, title: string): string {
  const calendarMap: { [key: string]: string } = {
    '3fc1d11fe5330c3e1c4693570419393a1d74036ef1b4cb866dd337f8c8cc6c8e': 'Insect Control',
    '64a3c24910c43703e539ab1e9ac41df6591995c63c1e4f208f76575a50149610': 'Rodent Control',
    '529c43e689235b82258319c30e7449e97c8788cb01cd924e0f4d0b4c34305cdb': 'Termites',
    'c81f827b8eeec1453d1f3d90c7bca859a1d342953680c4a0448e6b0b96b8bb4a': 'Trap Check',
    '97180df5c9275973f1c51e234ec36de62c401860313b0b734704f070e5acf411': 'Inspections',
    // Add more as needed
  };

  return calendarMap[calendarId] || 'General';
}

/**
 * Sync events from a single Google Calendar
 */
export async function syncCalendarEvents(calendarId: string): Promise<number> {
  try {
    const accessToken = await getGoogleAccessToken();

    // Get events from the past 7 days to future 30 days
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 7);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);

    const response = await axios.get(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        params: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const events = response.data.items || [];
    let syncedCount = 0;

    for (const event of events) {
      // Skip if no start time
      if (!event.start || (!event.start.dateTime && !event.start.date)) {
        continue;
      }

      const startTime = new Date(event.start.dateTime || event.start.date);
      const endTime = new Date(event.end?.dateTime || event.end?.date || startTime);
      const isAllDay = !!event.start.date; // date (not dateTime) means all-day

      // Parse customer info from description
      const customerInfo = parseEventDescription(event.description);

      // Upsert event
      await db
        .insert(calendarEvents)
        .values({
          google_event_id: event.id,
          google_calendar_id: calendarId,
          title: event.summary || 'Untitled Event',
          description: event.description || null,
          location: event.location || null,
          start_time: startTime,
          end_time: endTime,
          all_day: isAllDay,
          customer_name: customerInfo.customer_name || null,
          customer_phone: customerInfo.customer_phone || null,
          customer_email: customerInfo.customer_email || null,
          customer_address: customerInfo.customer_address || null,
          service_type: determineServiceType(calendarId, event.summary || ''),
          calendar_color: event.colorId || null,
          status: event.status || 'scheduled',
          cancelled: event.status === 'cancelled',
          last_synced: new Date(),
        })
        .onConflictDoUpdate({
          target: calendarEvents.google_event_id,
          set: {
            title: event.summary || 'Untitled Event',
            description: event.description || null,
            location: event.location || null,
            start_time: startTime,
            end_time: endTime,
            all_day: isAllDay,
            customer_name: customerInfo.customer_name || null,
            customer_phone: customerInfo.customer_phone || null,
            customer_email: customerInfo.customer_email || null,
            customer_address: customerInfo.customer_address || null,
            service_type: determineServiceType(calendarId, event.summary || ''),
            calendar_color: event.colorId || null,
            status: event.status || 'scheduled',
            cancelled: event.status === 'cancelled',
            last_synced: new Date(),
            updated_at: new Date(),
          },
        });

      syncedCount++;
    }

    logger.info(`Synced ${syncedCount} events from calendar ${calendarId}`);
    return syncedCount;
  } catch (error: any) {
    logger.error(`Failed to sync calendar ${calendarId}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Sync all configured Google Calendars
 */
export async function syncAllCalendars(): Promise<{
  success: boolean;
  calendars_synced: number;
  events_synced: number;
}> {
  try {
    const calendarIds = JSON.parse(process.env.GOOGLE_CALENDAR_IDS || '[]');

    if (calendarIds.length === 0) {
      logger.warn('No Google Calendar IDs configured');
      return {
        success: false,
        calendars_synced: 0,
        events_synced: 0,
      };
    }

    let totalEvents = 0;

    for (const calendarId of calendarIds) {
      const eventCount = await syncCalendarEvents(calendarId);
      totalEvents += eventCount;
    }

    logger.info(`✅ Calendar sync complete: ${calendarIds.length} calendars, ${totalEvents} events`);

    return {
      success: true,
      calendars_synced: calendarIds.length,
      events_synced: totalEvents,
    };
  } catch (error: any) {
    logger.error('Failed to sync calendars:', error);
    return {
      success: false,
      calendars_synced: 0,
      events_synced: 0,
    };
  }
}

/**
 * Append assignment info to Google Calendar event description
 */
export async function appendAssignmentToGoogleEvent(
  googleEventId: string,
  googleCalendarId: string,
  employeeName: string,
  assignedByName: string
): Promise<void> {
  try {
    const accessToken = await getGoogleAccessToken();

    // Get the current event
    const eventResponse = await axios.get(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}/events/${googleEventId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const event = eventResponse.data;
    const currentDescription = event.description || '';
    const now = new Date().toLocaleString('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    // Append assignment info
    const assignmentNote = `\n\n--- ASSIGNED TO: ${employeeName} ---\nAssigned by ${assignedByName} on ${now}`;
    const updatedDescription = currentDescription + assignmentNote;

    // Update the event
    await axios.patch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(googleCalendarId)}/events/${googleEventId}`,
      {
        description: updatedDescription,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`✅ Appended assignment to Google Calendar event ${googleEventId}`);
  } catch (error: any) {
    logger.error('Failed to update Google Calendar event:', error.response?.data || error.message);
    // Don't throw - assignment is saved in our DB, Google Calendar update is optional
  }
}

/**
 * Create a new event in Google Calendar
 */
export async function createGoogleCalendarEvent(
  calendarId: string,
  eventData: {
    summary: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
  }
): Promise<string> {
  try {
    const accessToken = await getGoogleAccessToken();

    const response = await axios.post(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        summary: eventData.summary,
        description: eventData.description,
        location: eventData.location,
        start: {
          dateTime: eventData.start.toISOString(),
          timeZone: 'America/Los_Angeles',
        },
        end: {
          dateTime: eventData.end.toISOString(),
          timeZone: 'America/Los_Angeles',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`✅ Created Google Calendar event: ${response.data.id}`);
    return response.data.id;
  } catch (error: any) {
    logger.error('Failed to create Google Calendar event:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Update a Google Calendar event
 */
export async function updateGoogleCalendarEvent(
  calendarId: string,
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    location?: string;
    start?: Date;
    end?: Date;
  }
): Promise<void> {
  try {
    const accessToken = await getGoogleAccessToken();

    const updateData: any = {};
    if (updates.summary) updateData.summary = updates.summary;
    if (updates.description) updateData.description = updates.description;
    if (updates.location) updateData.location = updates.location;
    if (updates.start) {
      updateData.start = {
        dateTime: updates.start.toISOString(),
        timeZone: 'America/Los_Angeles',
      };
    }
    if (updates.end) {
      updateData.end = {
        dateTime: updates.end.toISOString(),
        timeZone: 'America/Los_Angeles',
      };
    }

    await axios.patch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`✅ Updated Google Calendar event: ${eventId}`);
  } catch (error: any) {
    logger.error('Failed to update Google Calendar event:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Delete a Google Calendar event
 */
export async function deleteGoogleCalendarEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  try {
    const accessToken = await getGoogleAccessToken();

    await axios.delete(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    logger.info(`✅ Deleted Google Calendar event: ${eventId}`);
  } catch (error: any) {
    logger.error('Failed to delete Google Calendar event:', error.response?.data || error.message);
    throw error;
  }
}

