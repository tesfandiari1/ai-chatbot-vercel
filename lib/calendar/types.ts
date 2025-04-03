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
export type BookingStep = 'date' | 'time' | 'details' | 'confirmation';

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
}

/**
 * Booking response format
 */
export interface BookingResponse {
  success: boolean;
  appointment?: AppointmentData;
  error?: string;
}

/**
 * Configuration for the calendar service
 */
export interface CalendarConfig {
  companyCalendarId: string;
  serviceAccountEmail?: string;
}
