'use client';

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  useMemo,
  useEffect,
} from 'react';
import type {
  AppointmentType,
  BookingStep,
  CalendarContext as CalendarContextType,
  AppointmentFormData,
} from './types';

// Define action types
export type CalendarAction =
  | { type: 'SET_DATE'; date: string | null }
  | { type: 'SET_TIME_SLOT'; timeSlot: string | null }
  | { type: 'SET_APPOINTMENT_TYPE'; appointmentType: AppointmentType }
  | { type: 'SET_FORM_DATA'; formData: AppointmentFormData }
  | { type: 'SET_STEP'; step: BookingStep }
  | { type: 'SET_AUTO_ADVANCE'; autoAdvance: boolean }
  | { type: 'SET_ERROR'; error: string | undefined }
  | { type: 'RESET' };

// Define the context shape
interface CalendarContextValue {
  state: CalendarContextType;
  dispatch: React.Dispatch<CalendarAction>;
}

// Create context with a default value
const CalendarContext = createContext<CalendarContextValue | undefined>(
  undefined,
);

// Define initial state
const initialState: CalendarContextType = {
  currentStep: 'date',
  selectedDate: null,
  selectedTimeSlot: null,
  appointmentType: 'consultation',
  autoAdvance: false,
  error: undefined,
};

// Reducer function
function calendarReducer(
  state: CalendarContextType,
  action: CalendarAction,
): CalendarContextType {
  switch (action.type) {
    case 'SET_DATE':
      return {
        ...state,
        selectedDate: action.date,
        // When setting a date, clear time slot since it depends on the date
        selectedTimeSlot: null,
      };
    case 'SET_TIME_SLOT':
      return {
        ...state,
        selectedTimeSlot: action.timeSlot,
      };
    case 'SET_APPOINTMENT_TYPE':
      return {
        ...state,
        appointmentType: action.appointmentType,
      };
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: action.formData,
      };
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.step,
      };
    case 'SET_AUTO_ADVANCE':
      return {
        ...state,
        autoAdvance: action.autoAdvance,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
      };
    case 'RESET':
      return initialState;
    default:
      console.warn('Unknown action type in calendar reducer');
      return state;
  }
}

// Provider component
export function CalendarProvider({
  children,
  initialData,
}: { children: ReactNode; initialData?: Partial<CalendarContextType> }) {
  // Merge default state with any initial data
  const mergedInitialState = { ...initialState, ...initialData };

  // Create reducer
  const [state, dispatch] = useReducer(calendarReducer, mergedInitialState);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ state, dispatch }), [state]);

  // Store context in sessionStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('calendarContext', JSON.stringify(state));
      } catch (error) {
        console.error('Error storing calendar context:', error);
      }
    }
  }, [state]);

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
}

// Custom hook for using the calendar context
export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error(
      'useCalendarContext must be used within a CalendarProvider',
    );
  }
  return context;
}

// Utility functions for common calendar operations
export function useCalendarActions() {
  const { dispatch } = useCalendarContext();

  return {
    setDate: (date: string | null) => dispatch({ type: 'SET_DATE', date }),
    setTimeSlot: (timeSlot: string | null) =>
      dispatch({ type: 'SET_TIME_SLOT', timeSlot }),
    setAppointmentType: (appointmentType: AppointmentType) =>
      dispatch({ type: 'SET_APPOINTMENT_TYPE', appointmentType }),
    setFormData: (formData: AppointmentFormData) =>
      dispatch({ type: 'SET_FORM_DATA', formData }),
    setStep: (step: BookingStep) => dispatch({ type: 'SET_STEP', step }),
    setAutoAdvance: (autoAdvance: boolean) =>
      dispatch({ type: 'SET_AUTO_ADVANCE', autoAdvance }),
    setError: (error: string | undefined) =>
      dispatch({ type: 'SET_ERROR', error }),
    reset: () => dispatch({ type: 'RESET' }),
  };
}

// Helper function to convert context to selection context format
export function createSelectionContext(state: CalendarContextType) {
  return {
    autoAdvance: state.autoAdvance,
    previousSelections: state,
  };
}

// Helper to initialize context from session storage
export function getStoredCalendarContext(): Partial<CalendarContextType> {
  if (typeof window === 'undefined') return {};

  try {
    const storedContext = sessionStorage.getItem('calendarContext');
    if (storedContext) {
      return JSON.parse(storedContext);
    }
  } catch (error) {
    console.error('Error retrieving calendar context:', error);
  }

  return {};
}

/**
 * Convenience wrapper component that ensures calendar components always have access to context
 */
export function WithCalendarProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: Partial<CalendarContextType>;
}) {
  return (
    <CalendarProvider initialData={initialData}>{children}</CalendarProvider>
  );
}
