/**
 * Import API route handler
 * Handles CSV and XLSX file uploads for billing history import
 * See DEC-006 for security requirements and file validation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateFileType,
  validateFileSize,
  sanitizeFilename,
  getFileType,
} from '@/modules/import/fileValidator';
import { importBillingHistory } from '@/modules/import/importService';

// Maximum file size: 5MB (see DEC-006 for rationale)
const MAX_FILE_SIZE_MB = 5;

/**
 * POST /api/import
 * Accepts multipart/form-data file upload
 * Required fields:
 * - file: CSV or XLSX file
 * - userID: User ID to associate imported items with
 *
 * Returns:
 * - 200: { imported: number, skipped: number, errors: string[] }
 * - 400: Invalid file type, missing fields, or validation errors
 * - 413: File too large
 * - 500: Server error during import
 */
export async function POST(req: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await req.formData();

    // Extract userID
    const userID = formData.get('userID');
    if (!userID || typeof userID !== 'string') {
      return NextResponse.json(
        { error: 'userID is required' },
        { status: 400 },
      );
    }

    // Extract file
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'file is required and must be a File' },
        { status: 400 },
      );
    }

    // Sanitize filename for logging
    const sanitizedFilename = sanitizeFilename(file.name);

    // Validate file size
    if (!validateFileSize(file.size, MAX_FILE_SIZE_MB)) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`,
          filename: sanitizedFilename,
        },
        { status: 413 },
      );
    }

    // Validate file type (MIME type + extension)
    if (!validateFileType(file.name, file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only CSV and XLSX files are accepted',
          filename: sanitizedFilename,
          receivedType: file.type,
        },
        { status: 400 },
      );
    }

    // Determine file type from extension
    const fileType = getFileType(file.name);
    if (!fileType) {
      return NextResponse.json(
        {
          error: 'Could not determine file type from extension',
          filename: sanitizedFilename,
        },
        { status: 400 },
      );
    }

    // Read file content
    let fileContent: string | Buffer;
    if (fileType === 'csv') {
      // CSV files are read as text
      fileContent = await file.text();
    } else {
      // XLSX files are read as binary
      const arrayBuffer = await file.arrayBuffer();
      fileContent = Buffer.from(arrayBuffer);
    }

    // Import billing history
    const result = await importBillingHistory(
      userID,
      fileContent,
      fileType,
    );

    // Log import summary (server-side)
    console.log(
      `Import completed for user ${userID}: ${result.imported} imported, ${result.skipped} skipped`,
    );

    // Return success response
    return NextResponse.json(
      {
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors,
        filename: sanitizedFilename,
      },
      { status: 200 },
    );
  } catch (error) {
    // Log error server-side (don't expose details to client)
    console.error('Import error:', error);

    // Return safe error message to client
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Import failed',
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}

// Made with Bob
