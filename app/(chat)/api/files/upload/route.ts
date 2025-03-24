import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';

// Define consistent runtime configuration
export const runtime = 'nodejs';

// Limit file size
export const maxDuration = 30;

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: 'File size should be less than 10MB',
    })
    // Expand allowed file types
    .refine(
      (file) =>
        [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ].includes(file.type),
      {
        message:
          'Unsupported file type. Supported types: JPEG, PNG, GIF, PDF, TXT, DOC, DOCX',
      },
    ),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (request.body === null) {
    return NextResponse.json(
      { error: 'Request body is empty' },
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json(
        { error: errorMessage },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Fix the type mismatch when getting filename
    let filename: string;
    const fileObj = formData.get('file');
    if (fileObj instanceof File) {
      filename = fileObj.name;
    } else {
      // Generate a unique filename for Blob objects without names
      const fileType = file.type.split('/')[1] || 'bin';
      filename = `upload-${Date.now()}.${fileType}`;
    }

    // Add a logging message for tracking uploads
    console.log(
      `Processing file upload: ${filename} (${file.size} bytes, ${file.type})`,
    );

    try {
      const fileBuffer = await file.arrayBuffer();
      const data = await put(`${filename}`, fileBuffer, {
        access: 'public',
      });

      // Log successful upload
      console.log(`File uploaded successfully: ${data.url}`);

      return NextResponse.json(data, {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('File upload to blob storage failed:', error);
      return NextResponse.json(
        {
          error: 'Upload failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  } catch (error) {
    console.error('Failed to process file upload request:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
