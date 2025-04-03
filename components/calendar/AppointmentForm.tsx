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
import { handleCalendarInteraction } from '@/lib/ai/utils/calendar-interface';
import { enhancedCalendarInteraction } from '@/lib/ai/utils/auto-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Simple Spinner component using Lucide icon
const Spinner = ({
  size = 'default',
  className = '',
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

interface AppointmentFormProps {
  date: string;
  timeSlot: string;
  onSubmit: (data: AppointmentFormData, context?: SelectionContext) => void;
  applicationContext?: any; // Optional context from previous steps
  autoAdvance?: boolean; // Whether to automatically advance to the next step
  className?: string;
  loading?: boolean; // Add loading prop
}

export function AppointmentForm({
  date,
  timeSlot,
  onSubmit,
  applicationContext,
  autoAdvance = false,
  className,
  loading = false,
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
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.debug('AppointmentForm: Form submitted with data:', data);

      // Create context with auto-advance flag
      const selectionContext: SelectionContext = {
        autoAdvance: true,
        previousSelections: applicationContext,
      };

      // Add a small delay to ensure state is properly updated before submission
      setTimeout(() => {
        // Use enhanced calendar interaction handler for more reliable submission
        const success = enhancedCalendarInteraction(
          'form',
          {
            date,
            timeSlot,
            ...data,
          },
          selectionContext,
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

  if (loading) {
    return (
      <div
        className={cn(
          'flex flex-col gap-4 rounded-2xl p-4 max-w-[500px] bg-[#140556] border border-[#1450ef]',
          className,
        )}
        data-component="AppointmentForm"
      >
        <div className="flex flex-col space-y-1 pb-2">
          <Skeleton className="h-7 w-[200px] bg-[#1450ef]/30" />
          <Skeleton className="h-5 w-[300px] bg-[#1450ef]/30" />
        </div>

        <div className="space-y-4">
          <div>
            <Skeleton className="h-5 w-[80px] mb-2 bg-[#1450ef]/30" />
            <Skeleton className="h-10 w-full bg-[#1450ef]/30" />
          </div>

          <div>
            <Skeleton className="h-5 w-[80px] mb-2 bg-[#1450ef]/30" />
            <Skeleton className="h-10 w-full bg-[#1450ef]/30" />
          </div>

          <div>
            <Skeleton className="h-5 w-[120px] mb-2 bg-[#1450ef]/30" />
            <Skeleton className="h-10 w-full bg-[#1450ef]/30" />
          </div>

          <div>
            <Skeleton className="h-5 w-[150px] mb-2 bg-[#1450ef]/30" />
            <Skeleton className="h-20 w-full bg-[#1450ef]/30" />
            <Skeleton className="h-4 w-[70%] mt-2 bg-[#1450ef]/30" />
          </div>

          <Skeleton className="h-10 w-full mt-6 bg-[#1450ef]/30" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl p-4 max-w-[500px] bg-[#140556] border border-[#1450ef]',
        className,
      )}
      data-component="AppointmentForm"
    >
      <div className="flex flex-col space-y-1 pb-2">
        <h2 className="text-xl font-medium text-[#f4e9dc]">
          Complete Your Booking
        </h2>
        <p className="text-sm text-[#f4e9dc]/80">
          {date && timeSlot ? (
            <>
              Appointment on {format(new Date(date), 'MMMM d, yyyy')} at{' '}
              {timeSlot}
            </>
          ) : (
            <>Please provide your information to complete the booking</>
          )}
        </p>
      </div>

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
                <Spinner size="sm" className="mr-2" />
                Booking Appointment...
              </span>
            ) : (
              'Book Appointment'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
