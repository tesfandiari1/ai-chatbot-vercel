-- Check if the Appointment table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Appointment') THEN
        -- Create the Appointment table if it doesn't exist
        CREATE TABLE "Appointment" (
            "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "date" TEXT NOT NULL,
            "timeSlot" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "phone" TEXT NOT NULL,
            "notes" TEXT,
            "userId" UUID NOT NULL REFERENCES "User"("id"),
            "createdAt" TIMESTAMP NOT NULL
        );
        
        -- Add a unique constraint to prevent double bookings
        CREATE UNIQUE INDEX unique_date_time_slot ON "Appointment" ("date", "timeSlot");
        
        RAISE NOTICE 'Appointment table created';
    ELSE
        RAISE NOTICE 'Appointment table already exists';
    END IF;
END
$$; 