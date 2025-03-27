'use client';

import { Button } from '@/components/ui/button';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  meetingTypeId: string;
}

interface TimePickerProps {
  availableTimeSlots: Array<TimeSlot>;
  selectedTimeSlot: string | null;
  onTimeSlotSelect: (
    timeSlot: string,
    meetingType: string,
    duration: number,
  ) => void;
}

export function TimePicker({
  availableTimeSlots,
  selectedTimeSlot,
  onTimeSlotSelect,
}: TimePickerProps) {
  return (
    <div className="space-y-4">
      <div className="pb-2 border-b">
        <h3 className="text-lg font-medium">Select a time</h3>
        <p className="text-sm text-muted-foreground">
          Available time slots for your meeting
        </p>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button variant="outline" size="sm" className="text-xs">
          Morning
        </Button>
        <Button variant="outline" size="sm" className="text-xs">
          Afternoon
        </Button>
        <Button variant="outline" size="sm" className="text-xs">
          Evening
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableTimeSlots.map((slot) => {
          const isSelected = selectedTimeSlot === slot.startTime;
          const duration = slot.meetingTypeId === '30min' ? 30 : 60;

          return (
            <Button
              key={`${slot.startTime}-${slot.meetingTypeId}`}
              variant={isSelected ? 'default' : 'outline'}
              className="p-3 h-auto"
              onClick={() =>
                onTimeSlotSelect(slot.startTime, slot.meetingTypeId, duration)
              }
            >
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium">{slot.startTime}</span>
                <span className="text-xs text-muted-foreground">
                  {duration} min
                </span>
              </div>
            </Button>
          );
        })}
      </div>

      {availableTimeSlots.length === 0 && (
        <div className="p-4 text-center border rounded-md">
          <p className="text-muted-foreground">
            No available time slots for this date
          </p>
        </div>
      )}
    </div>
  );
}
