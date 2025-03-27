'use client';

import { format } from 'date-fns';
import type { CalendarMetadata } from '../types';
import { calculateEndTime } from '../utils';
import { CalendarIcon, CheckCircleIcon } from './CalendarIcons';

interface ConfirmationProps {
  metadata: CalendarMetadata;
}

export function Confirmation({ metadata }: ConfirmationProps) {
  const selectedDate = metadata.selectedDate
    ? new Date(metadata.selectedDate)
    : null;

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircleIcon className="h-12 w-12 text-green-500" />
      </div>

      <div>
        <h2 className="text-xl font-medium">Meeting Scheduled</h2>
        <p className="text-muted-foreground mt-1">
          A calendar invitation has been sent to your email
        </p>
      </div>

      <div className="bg-muted p-4 rounded-md text-left">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Meeting</span>
            <span>{metadata.meetingTitle}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Date</span>
            <span>
              {selectedDate
                ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                : 'Date not selected'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Time</span>
            <span>
              {metadata.selectedTimeSlot} –{' '}
              {calculateEndTime(metadata.selectedTimeSlot, metadata.duration)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Attendee</span>
            <span>{metadata.attendeeName}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Email</span>
            <span>{metadata.attendeeEmail}</span>
          </div>

          {metadata.notes && (
            <div className="pt-2 border-t mt-2">
              <p className="font-medium mb-1">Notes</p>
              <p className="text-sm text-muted-foreground">{metadata.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <span>Added to your Google Calendar</span>
        </div>
      </div>
    </div>
  );
}
