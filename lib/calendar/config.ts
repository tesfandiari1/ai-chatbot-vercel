/**
 * Calendar Feature Configuration
 * 
 * This file provides centralized configuration for calendar features,
 * including feature flags and environment-specific settings.
 */

// FEATURE FLAGS
export const CALENDAR_CONFIG = {
  // Whether to use real calendar API or mock implementations
  useRealCalendar: process.env.USE_REAL_CALENDAR === 'true',
  
  // Whether to enable debug mode
  debugMode: process.env.ENABLE_CALENDAR_DEBUG === 'true',
  
  // Default appointment duration in minutes
  defaultAppointmentDuration: 30,
  
  // Default appointment type if none is specified
  defaultAppointmentType: 'consultation',
  
  // API client timeouts (ms)
  apiTimeouts: {
    getAvailability: 5000,
    getTimeSlots: 5000,
    bookAppointment: 8000,
    cancelAppointment: 5000,
    searchEvents: 5000,
  },
};

// Service Configuration
export const SERVICE_CONFIG = {
  // Company calendar ID (not user's primary)
  calendarId: process.env.COMPANY_CALENDAR_ID || 'company-calendar@example.com',
  
  // Integration provider IDs (for Composio)
  composioConnectionId: process.env.COMPOSIO_CONNECTION_ID || '45c1d6cd-c8ed-409b-afed-d9c03c0fff75',
  
  // Default timezone for calendar operations
  timezone: 'America/New_York',
};

// Check if all required environment variables are set
export function validateCalendarConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (CALENDAR_CONFIG.useRealCalendar) {
    // Only validate these if we're using real calendar integration
    if (!process.env.COMPOSIO_API_KEY) {
      errors.push('COMPOSIO_API_KEY is required when USE_REAL_CALENDAR is true');
    }
    
    if (!process.env.COMPOSIO_CONNECTION_ID) {
      errors.push('COMPOSIO_CONNECTION_ID is required when USE_REAL_CALENDAR is true');
    }
    
    if (!process.env.COMPANY_CALENDAR_ID) {
      errors.push('COMPANY_CALENDAR_ID is required when USE_REAL_CALENDAR is true');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}