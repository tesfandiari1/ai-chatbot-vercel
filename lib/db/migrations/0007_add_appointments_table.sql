CREATE TABLE IF NOT EXISTS "Appointment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "date" text NOT NULL,
  "timeSlot" text NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text NOT NULL,
  "notes" text,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "createdAt" timestamp NOT NULL
); 