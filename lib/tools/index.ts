import type { ToolDefinition } from '@/lib/tools/types';
import {
  checkCalendarAvailability,
  createCalendarEvent,
  getCurrentDateTime,
} from './google-calendar';

// Register all tools here
export const tools: ToolDefinition[] = [
  checkCalendarAvailability,
  createCalendarEvent,
  getCurrentDateTime,
];
