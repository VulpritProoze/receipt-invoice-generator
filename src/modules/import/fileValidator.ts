/**
 * File validation utilities for import module
 * Validates file types, sizes, and sanitizes filenames
 * See DEC-006 for library choices and security rationale
 */

const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel', // Legacy .xls MIME type
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
] as const;

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx'] as const;

const FORBIDDEN_EXTENSIONS = [
  '.exe',
  '.sh',
  '.bat',
  '.cmd',
  '.com',
  '.scr',
  '.vbs',
  '.js',
  '.jar',
  '.app',
  '.deb',
  '.rpm',
  '.dmg',
  '.pkg',
  '.msi'
] as const;

/**
 * Validates file type by checking both MIME type and file extension
 * Both checks must pass to prevent MIME type spoofing
 * See security rule: never trust file extension alone
 *
 * @param filename - Original filename with extension
 * @param mimeType - MIME type from file upload
 * @returns true if file type is valid, false otherwise
 */
export function validateFileType(filename: string, mimeType: string): boolean {
  // Check MIME type
  const mimeValid = ALLOWED_MIME_TYPES.includes(
    mimeType as (typeof ALLOWED_MIME_TYPES)[number]
  );

  // Check file extension
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  const extensionValid = ALLOWED_EXTENSIONS.some((ext) => extension === ext);

  // Check for forbidden extensions (executable files)
  const isForbidden = FORBIDDEN_EXTENSIONS.some((ext) => extension === ext);

  // Both MIME type and extension must be valid, and extension must not be forbidden
  return mimeValid && extensionValid && !isForbidden;
}

/**
 * Validates file size against maximum allowed size
 * Prevents DoS attacks via memory exhaustion
 * See DEC-006 for 5MB limit rationale
 *
 * @param size - File size in bytes
 * @param maxSizeMB - Maximum allowed size in megabytes (default: 5MB)
 * @returns true if file size is within limit, false otherwise
 */
export function validateFileSize(size: number, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxSizeBytes;
}

/**
 * Sanitizes filename to prevent path traversal attacks
 * Removes directory separators and normalizes to safe characters
 *
 * @param filename - Original filename
 * @returns Sanitized filename safe for logging and storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators (both Unix and Windows)
  let sanitized = filename.replace(/[/\\]/g, '_');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove leading dots (hidden files on Unix)
  sanitized = sanitized.replace(/^\.+/, '');

  // Limit length to prevent buffer issues
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    const extension = sanitized.slice(sanitized.lastIndexOf('.'));
    const nameWithoutExt = sanitized.slice(0, sanitized.lastIndexOf('.'));
    sanitized =
      nameWithoutExt.slice(0, maxLength - extension.length) + extension;
  }

  // If sanitization resulted in empty string, use a default
  if (sanitized.length === 0) {
    sanitized = 'unnamed_file';
  }

  return sanitized;
}

/**
 * Determines file type from filename extension
 * Used to route to appropriate parser
 *
 * @param filename - Original filename with extension
 * @returns 'csv' | 'xlsx' | null if extension not recognized
 */
export function getFileType(filename: string): 'csv' | 'xlsx' | null {
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));

  if (extension === '.csv') {
    return 'csv';
  }

  if (extension === '.xlsx') {
    return 'xlsx';
  }

  return null;
}
