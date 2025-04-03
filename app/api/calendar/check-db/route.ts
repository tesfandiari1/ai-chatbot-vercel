import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if POSTGRES_URL is set
    if (!process.env.POSTGRES_URL) {
      console.log('POSTGRES_URL is not set in environment variables');
      return NextResponse.json(
        {
          status: 'disconnected',
          error: 'POSTGRES_URL environment variable is not set',
          help: 'Make sure to copy values from .env.example to .env.local',
          details: {
            missingEnv: true,
            requiredVar: 'POSTGRES_URL',
          },
        },
        { status: 500 },
      );
    }

    // Simple query to check DB connection
    const result = await sql`SELECT NOW()`;
    return NextResponse.json({
      status: 'connected',
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    // Ensure error is logged properly
    console.error(
      'Database connection check failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );

    // Check for specific error codes
    const errMessage =
      error instanceof Error ? error.message : 'Unknown database error';
    const errCode = (error as any).code || 'unknown';

    // Create a more detailed error object
    const errorDetails = {
      status: 'disconnected',
      error: errMessage,
      code: errCode,
      help: 'Check your POSTGRES_URL environment variable in .env.local',
      details: {
        connectionFailed: true,
        suggestion:
          'Make sure your database is running and the connection string is correct',
      },
    };

    return NextResponse.json(errorDetails, { status: 500 });
  }
}
