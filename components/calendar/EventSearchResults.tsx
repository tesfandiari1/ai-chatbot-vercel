'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Trash2Icon } from 'lucide-react';
import { Trash2 } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  attendees?: string;
}

interface EventSearchResultsProps {
  events: Event[];
  query: string;
  totalEvents: number;
  onEventCancel?: (eventId: string) => void;
  onEventReschedule?: (eventId: string) => void;
  className?: string;
}

export function EventSearchResults({
  events,
  query,
  totalEvents,
  onEventCancel,
  onEventReschedule,
  className,
}: EventSearchResultsProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl p-4 max-w-[650px] bg-[#140556] border border-[#1450ef]',
        className,
      )}
    >
      <div className="flex flex-col space-y-1 pb-2">
        <h2 className="text-xl font-medium text-[#f4e9dc]">Search Results</h2>
        <p className="text-sm text-[#f4e9dc]/80">
          {totalEvents > 0
            ? `Found ${totalEvents} event${totalEvents !== 1 ? 's' : ''} matching "${query}"`
            : `No events found matching "${query}"`}
        </p>
      </div>

      {totalEvents === 0 ? (
        <div className="text-center py-6 text-[#f4e9dc]/80">
          No events found. Try modifying your search or checking a different
          date range.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-[#1450ef]/20 p-4 rounded-lg border border-[#1450ef]/30 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg text-[#f4e9dc]">
                    {event.title}
                  </h3>
                  <p className="text-[#f4e9dc]/80 mt-1">{event.date}</p>
                  <p className="text-[#f4e9dc]/80">{event.time}</p>
                  {event.attendees && (
                    <p className="text-sm text-[#f4e9dc]/70 mt-2">
                      Attendees: {event.attendees}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {onEventCancel && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onEventCancel(event.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Cancel
                    </Button>
                  )}
                  {onEventReschedule && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEventReschedule(event.id)}
                      className="border-[#1450ef]/30 text-[#f4e9dc] hover:bg-[#1450ef]/20"
                    >
                      Reschedule
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
