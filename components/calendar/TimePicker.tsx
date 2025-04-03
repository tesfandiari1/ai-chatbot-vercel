'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TimePickerProps {
  selectedDate: string;
  selectedTimeSlot: string | null;
  bookedSlots: string[];
  onTimeSlotSelect: (timeSlot: string) => void;
  className?: string;
}

const AVAILABLE_TIME_SLOTS = [
  '9:00am',
  '9:30am',
  '10:00am',
  '10:30am',
  '11:00am',
  '11:30am',
  '1:00pm',
  '1:30pm',
  '2:00pm',
  '2:30pm',
  '3:00pm',
  '3:30pm',
  '4:00pm',
  '4:30pm',
];

export function TimePicker({
  selectedDate,
  selectedTimeSlot,
  bookedSlots = [],
  onTimeSlotSelect,
  className,
}: TimePickerProps) {
  // Group time slots into morning and afternoon for better organization
  const morningSlots = AVAILABLE_TIME_SLOTS.filter((slot) =>
    slot.toLowerCase().includes('am'),
  );

  const afternoonSlots = AVAILABLE_TIME_SLOTS.filter((slot) =>
    slot.toLowerCase().includes('pm'),
  );

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <h2 className="text-xl font-medium">Select a Time</h2>
        <p className="text-sm text-muted-foreground">
          {selectedDate ? (
            <>
              Available times for{' '}
              {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </>
          ) : (
            <>Choose from available 30-minute slots</>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {morningSlots.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Morning</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-2">
                {morningSlots.map((timeSlot) => (
                  <Button
                    key={timeSlot}
                    variant={
                      selectedTimeSlot === timeSlot ? 'default' : 'outline'
                    }
                    onClick={() => onTimeSlotSelect(timeSlot)}
                    className="w-full justify-center py-6"
                    disabled={bookedSlots.includes(timeSlot)}
                  >
                    {timeSlot}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {afternoonSlots.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Afternoon</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-2">
                {afternoonSlots.map((timeSlot) => (
                  <Button
                    key={timeSlot}
                    variant={
                      selectedTimeSlot === timeSlot ? 'default' : 'outline'
                    }
                    onClick={() => onTimeSlotSelect(timeSlot)}
                    className="w-full justify-center py-6"
                    disabled={bookedSlots.includes(timeSlot)}
                  >
                    {timeSlot}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {AVAILABLE_TIME_SLOTS.length === 0 && (
            <div className="text-center p-4 text-muted-foreground">
              No time slots available for this date.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
