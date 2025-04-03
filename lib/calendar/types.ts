import { z } from 'zod';

/**
 * Appointment types and their durations in minutes
 */
export const APPOINTMENT_TYPES = {
  consultation: 30,
  demo: 45,
  support: 60,
} as const;

export type AppointmentType = keyof typeof APPOINTMENT_TYPES;

/**
 * Schema for appointment form validation
 */
export const appointmentFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().min(10, {
    message: 'Please enter a valid phone number.',
  }),
  notes: z.string().optional(),
});

/**
 * Appointment form data
 */
export type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

/**
 * Complete appointment data
 */
export interface AppointmentData extends AppointmentFormData {
  date: string | null;
  timeSlot: string | null;
  appointmentType: AppointmentType;
}

/**
 * Steps in the booking process
 */
export type BookingStep =
  | 'date'
  | 'time'
  | 'details'
  | 'confirmation'
  | 'search';

/**
 * Availability request parameters
 */
export interface AvailabilityRequest {
  date: string;
  appointmentType: AppointmentType;
}

/**
 * Availability response format
 */
export interface AvailabilityResponse {
  date: string;
  availableSlots: string[];
  appointmentType: AppointmentType;
  error?: string;
  userInstructions?: string;
  nextAction?: string;
}

/**
 * Booking response format
 */
export interface BookingResponse {
  success: boolean;
  appointment?: AppointmentData;
  error?: string;
  userInstructions?: string;
  nextAction?: string;
}

/**
 * Configuration for the calendar service
 */
export interface CalendarConfig {
  companyCalendarId: string;
  serviceAccountEmail?: string;
}

/**
 * Calendar application context
 * This is used to preserve state between tool calls in the multi-step interface
 */
export interface CalendarContext {
  /**
   * Current step in the booking process
   */
  currentStep: BookingStep;

  /**
   * Selected date in YYYY-MM-DD format
   */
  selectedDate: string | null;

  /**
   * Selected time slot (e.g., "2:00pm")
   */
  selectedTimeSlot: string | null;

  /**
   * Type of appointment
   */
  appointmentType: AppointmentType;

  /**
   * Form data if collected
   */
  formData?: AppointmentFormData;

  /**
   * Whether to automatically advance to the next step
   */
  autoAdvance?: boolean;

  /**
   * Error message if any occurred
   */
  error?: string;
}

/**
 * Tool execution context
 * This is passed to each tool when called by the LLM
 */
export interface ToolContext {
  /**
   * Application state containing preserved context
   */
  applicationState?: {
    /**
     * Previous selections and context from prior steps
     */
    previousSelections?: CalendarContext;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Selection context for UI components
 * This is passed when a user makes a selection in a UI component
 */
export interface SelectionContext {
  /**
   * Whether to automatically advance to the next step
   */
  autoAdvance?: boolean;

  /**
   * Previous selections from prior steps
   */
  previousSelections?: CalendarContext;
}

/**
 * Enhanced availability response with context
 */
export interface ContextAwareAvailabilityResponse extends AvailabilityResponse {
  /**
   * Available dates for selection (used by the date picker)
   */
  availableDates?: string[];

  /**
   * Formatted date for display
   */
  formattedDate?: string;

  /**
   * Duration of the appointment in minutes
   */
  durationMinutes?: number;

  /**
   * Application context to preserve state between steps
   */
  applicationContext?: CalendarContext;

  /**
   * Name of the next tool to call if auto-advancing
   */
  nextTool?: string;
}

/**
 * Next tool determination parameters
 */
export interface NextToolParams {
  currentStep: BookingStep;
  hasDate?: boolean;
  hasTime?: boolean;
  hasForm?: boolean;
}

export interface ToolParameters {
  // Common parameters
  date?: string;
  timeSlot?: string;
  appointmentType?: AppointmentType;

  // Form specific parameters
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;

  // Search specific parameters
  query?: string;
  startDate?: string;
  endDate?: string;
  maxResults?: number;

  // Cancel specific parameters
  eventId?: string;
}

export interface ToolResponse {
  success?: boolean;
  error?: string;
  userInstructions?: string;
  nextAction?: string;
  nextTool?: string;
  applicationContext?: CalendarContext;
  toolParameters?: ToolParameters;

  // Other common response properties
  [key: string]: any;
}
