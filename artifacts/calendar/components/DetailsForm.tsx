'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import type { CalendarMetadata } from '../types';
import { calculateEndTime } from '../utils';
import { CalendarIcon, ClockIcon, GlobeIcon, VideoIcon } from './CalendarIcons';

interface DetailsFormProps {
  metadata: CalendarMetadata;
  onChange: (field: string, value: string) => void;
}

export function DetailsForm({ metadata, onChange }: DetailsFormProps) {
  // Parse the selected date
  const selectedDate = metadata.selectedDate
    ? new Date(metadata.selectedDate)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col pb-4">
        <h2 className="text-xl font-medium">{metadata.duration} Min Meeting</h2>

        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <span>
              {selectedDate
                ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                : 'Date not selected'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4" />
            <span>
              {metadata.selectedTimeSlot} –{' '}
              {calculateEndTime(metadata.selectedTimeSlot, metadata.duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <GlobeIcon className="h-4 w-4" />
            <span>{metadata.timeZone}</span>
          </div>

          <div className="flex items-center space-x-2">
            <VideoIcon className="h-4 w-4" />
            <span>Google Meet</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="meetingTitle" className="text-sm">
            Meeting title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="meetingTitle"
            value={metadata.meetingTitle || ''}
            onChange={(e) => onChange('meetingTitle', e.target.value)}
            placeholder="Strategy discussion"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="name" className="text-sm">
            Your name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={metadata.attendeeName || ''}
            onChange={(e) => onChange('attendeeName', e.target.value)}
            placeholder="John Doe"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm">
            Email address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={metadata.attendeeEmail || ''}
            onChange={(e) => onChange('attendeeEmail', e.target.value)}
            placeholder="john@example.com"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="notes" className="text-sm">
            Additional notes
          </Label>
          <Textarea
            id="notes"
            value={metadata.notes || ''}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="Please share anything that will help prepare for our meeting."
            rows={4}
            className="mt-1"
          />
        </div>

        <div className="text-xs text-muted-foreground">
          By proceeding, you agree to our{' '}
          <span className="underline cursor-pointer">Terms</span> and{' '}
          <span className="underline cursor-pointer">Privacy Policy</span>.
        </div>
      </div>
    </div>
  );
}
