'use client';

import { format } from 'date-fns';
import { CheckCircleIcon } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { AppointmentData } from '@/lib/calendar/types';

interface ConfirmationProps {
  appointment: AppointmentData;
  className?: string;
}

export function Confirmation({ appointment, className }: ConfirmationProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="text-center space-y-3">
        <div className="flex justify-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-medium">Appointment Scheduled</h2>
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to {appointment.email}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Date</span>
            <span>
              {appointment.date &&
                format(new Date(appointment.date), 'MMMM d, yyyy')}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="font-medium">Time</span>
            <span>{appointment.timeSlot}</span>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="font-medium">Type</span>
            <span>{appointment.appointmentType}</span>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="font-medium">Name</span>
            <span>{appointment.name}</span>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="font-medium">Contact</span>
            <span className="text-right">
              {appointment.email}
              <br />
              {appointment.phone}
            </span>
          </div>

          {appointment.notes && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <span className="font-medium">Notes</span>
                <p className="text-sm text-muted-foreground">
                  {appointment.notes}
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
