'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { appointmentFormSchema } from '@/lib/calendar/types';
import type {
  AppointmentFormData,
  SelectionContext,
} from '@/lib/calendar/types';
import { handleCalendarInteraction } from '@/lib/calendar/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  CalendarContainer,
  FormLoader,
  CalendarSpinner,
  getChatFunctions,
} from './ui-components';

interface AppointmentFormProps {
  date: string;
  timeSlot: string;
  onSubmit: (data: AppointmentFormData, context?: SelectionContext) => void;
  applicationContext?: any; // Optional context from previous steps
  autoAdvance?: boolean; // Whether to automatically advance to the next step
  className?: string;
  loading?: boolean; // Add loading prop
  chatOptions?: {
    setInput?: (text: string) => void;
    submit?: () => void;
  };
}

export function AppointmentForm({
  date,
  timeSlot,
  onSubmit,
  applicationContext,
  autoAdvance = false,
  className,
  loading = false,
  chatOptions,
}: AppointmentFormProps) {
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      notes: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const handleSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    setError(undefined);

    try {
      console.debug('AppointmentForm: Form submitted with data:', data);

      // Create context with auto-advance flag
      const selectionContext: SelectionContext = {
        autoAdvance: true,
        previousSelections: applicationContext,
      };

      // Use the chat functions from ui-components
      const chatFunctions = chatOptions || getChatFunctions();

      // Add a small delay to ensure state is properly updated before submission
      setTimeout(() => {
        // Use calendar interaction handler for form submission
        const success = handleCalendarInteraction(
          'form',
          {
            date,
            timeSlot,
            ...data,
          },
          selectionContext,
          {
            setInput: chatFunctions.setInput,
            submit: chatFunctions.submit,
          },
        );

        // Only run the original callback if the direct handler wasn't successful
        if (!success && onSubmit) {
          onSubmit(data, selectionContext);
        }

        // Ensure we reset the submitting state after a reasonable delay
        setTimeout(() => {
          setIsSubmitting(false);
        }, 1500);
      }, 100);
    } catch (error) {
      console.error('AppointmentForm: Error during form submission:', error);
      setError(
        'There was an error submitting your appointment. Please try again.',
      );
      setIsSubmitting(false);
    }
  };

  // Format appointment details for subtitle
  const subtitle =
    date && timeSlot
      ? `Appointment on ${format(new Date(date), 'MMMM d, yyyy')} at ${timeSlot}`
      : `Please provide your information to complete the booking`;

  // If loading, show the FormLoader component within container
  if (loading) {
    return (
      <CalendarContainer
        title="Complete Your Booking"
        subtitle={subtitle}
        className={className}
        dataComponent="AppointmentForm"
        loading={true}
      >
        <FormLoader />
      </CalendarContainer>
    );
  }

  return (
    <CalendarContainer
      title="Complete Your Booking"
      subtitle={subtitle}
      className={className}
      dataComponent="AppointmentForm"
      error={error}
    >
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
          data-appointment-form
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#f4e9dc]">Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    {...field}
                    className="bg-[#1450ef]/20 border-[#1450ef]/30 text-[#f4e9dc] placeholder:text-[#f4e9dc]/60"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#f4e9dc]">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="john@example.com"
                    {...field}
                    className="bg-[#1450ef]/20 border-[#1450ef]/30 text-[#f4e9dc] placeholder:text-[#f4e9dc]/60"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#f4e9dc]">Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(123) 456-7890"
                    {...field}
                    className="bg-[#1450ef]/20 border-[#1450ef]/30 text-[#f4e9dc] placeholder:text-[#f4e9dc]/60"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#f4e9dc]">
                  Notes (Optional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional information..."
                    className="resize-none bg-[#1450ef]/20 border-[#1450ef]/30 text-[#f4e9dc] placeholder:text-[#f4e9dc]/60"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-[#f4e9dc]/80">
                  Please include any special requests or information that might
                  be helpful.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 bg-[#1450ef] hover:bg-[#1450ef]/80 text-[#f4e9dc]"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <CalendarSpinner size="sm" className="mr-2" />
                Booking Appointment...
              </span>
            ) : (
              'Book Appointment'
            )}
          </Button>
        </form>
      </Form>
    </CalendarContainer>
  );
}
