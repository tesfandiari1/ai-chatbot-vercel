'use client';

import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { AppointmentData } from '@/lib/calendar/types';
import { Skeleton } from '@/components/ui/skeleton';

interface ConfirmationProps {
  appointment: AppointmentData;
  className?: string;
  loading?: boolean;
}

// Define mock skeleton items with proper keys to avoid using index
const SKELETON_ITEMS = [
  { id: 'date-skeleton', label: 'Date' },
  { id: 'time-skeleton', label: 'Time' },
  { id: 'type-skeleton', label: 'Type' },
  { id: 'name-skeleton', label: 'Name' },
  { id: 'contact-skeleton', label: 'Contact' },
];

export function Confirmation({
  appointment,
  className,
  loading = false,
}: ConfirmationProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'flex flex-col gap-4 rounded-2xl p-4 max-w-[500px] bg-[#140556] border border-[#1450ef]',
          className,
        )}
        data-component="Confirmation"
      >
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Skeleton className="rounded-full size-12 bg-[#1450ef]/30" />
          </div>
          <div>
            <Skeleton className="h-7 w-[220px] mx-auto bg-[#1450ef]/30" />
            <Skeleton className="h-5 w-[280px] mx-auto mt-1 bg-[#1450ef]/30" />
          </div>
        </div>

        <div className="space-y-3">
          {SKELETON_ITEMS.map((item, i) => (
            <div key={item.id}>
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-[80px] bg-[#1450ef]/30" />
                <Skeleton className="h-5 w-[120px] bg-[#1450ef]/30" />
              </div>
              {i < SKELETON_ITEMS.length - 1 && (
                <Separator className="my-3 bg-[#1450ef]/50" />
              )}
            </div>
          ))}
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
      data-component="Confirmation"
    >
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="bg-[#1450ef]/80 rounded-full flex items-center justify-center size-12 mr-4">
            <div className="text-[#f4e9dc] text-xl">✓</div>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-medium text-[#f4e9dc]">
            Appointment Scheduled
          </h2>
          <p className="text-sm text-[#f4e9dc]/80">
            A confirmation email has been sent to {appointment.email}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-medium text-[#f4e9dc]">Date</span>
          <span className="text-[#f4e9dc]/80">
            {appointment.date &&
              format(new Date(appointment.date), 'MMMM d, yyyy')}
          </span>
        </div>

        <Separator className="bg-[#1450ef]/50" />

        <div className="flex justify-between items-center">
          <span className="font-medium text-[#f4e9dc]">Time</span>
          <span className="text-[#f4e9dc]/80">{appointment.timeSlot}</span>
        </div>

        <Separator className="bg-[#1450ef]/50" />

        <div className="flex justify-between items-center">
          <span className="font-medium text-[#f4e9dc]">Type</span>
          <span className="text-[#f4e9dc]/80">
            {appointment.appointmentType}
          </span>
        </div>

        <Separator className="bg-[#1450ef]/50" />

        <div className="flex justify-between items-center">
          <span className="font-medium text-[#f4e9dc]">Name</span>
          <span className="text-[#f4e9dc]/80">{appointment.name}</span>
        </div>

        <Separator className="bg-[#1450ef]/50" />

        <div className="flex justify-between items-center">
          <span className="font-medium text-[#f4e9dc]">Contact</span>
          <span className="text-right text-[#f4e9dc]/80">
            {appointment.email}
            <br />
            {appointment.phone}
          </span>
        </div>

        {appointment.notes && (
          <>
            <Separator className="bg-[#1450ef]/50" />
            <div className="space-y-1.5">
              <span className="font-medium text-[#f4e9dc]">Notes</span>
              <p className="text-sm text-[#f4e9dc]/80">{appointment.notes}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
