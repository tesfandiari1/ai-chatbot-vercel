import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { appointmentFormSchema } from '@/lib/calendar/types';
import { auth } from '@/lib/auth';

// Extend the appointment schema with date and time
const appointmentSchema = appointmentFormSchema.extend({
  date: z.string(),
  timeSlot: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received appointment data:', body);

    const data = appointmentSchema.parse(body);
    console.log('Validated appointment data:', data);

    // Insert appointment into database using the correct schema
    await sql`
      INSERT INTO "Appointment" ("date", "timeSlot", "name", "email", "phone", "notes", "userId", "createdAt")
      VALUES (${data.date}, ${data.timeSlot}, ${data.name}, ${data.email}, ${data.phone}, ${data.notes || ''}, ${session.user.id}, NOW())
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating appointment:', error);

    // Check if it's a validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    // Check if it's a database error
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create appointment',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 },
      );
    }

    // Get booked appointments for the date using the correct schema
    const result = await sql`
      SELECT "timeSlot"
      FROM "Appointment"
      WHERE "date" = ${date}
    `;

    const bookedSlots = result.rows.map((row) => row.timeSlot);

    return NextResponse.json({ bookedSlots });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 },
    );
  }
}
