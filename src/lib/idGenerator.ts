/**
 * ID generation utilities for invoices, receipts, and other entities.
 * These functions generate unique identifiers matching the required formats.
 */

import crypto from 'crypto';

/**
 * Generates a generic ID with a prefix and random alphanumeric suffix.
 * @param prefix - The prefix for the ID (e.g., "COMP", "BU", "IIM", "BH")
 * @param length - Length of the random suffix (default: 12)
 * @returns ID string (e.g., "COMP-A3K9MXQP2T7V")
 */
export function generateID(prefix: string, length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let randomValues: Uint8Array;

  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    // Browser environment
    randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
  } else {
    // Node.js environment
    randomValues = new Uint8Array(length);
    crypto.randomFillSync(randomValues);
  }

  let suffix = '';
  for (let i = 0; i < length; i++) {
    suffix += chars[randomValues[i] % chars.length];
  }

  return `${prefix}-${suffix}`;
}

/**
 * Generates an invoice ID in the format INV + 9-digit zero-padded number.
 * @param sequenceNumber - The sequence number (1-999999999)
 * @returns Invoice ID string (e.g., "INV000000001")
 * @throws Error if sequenceNumber is out of valid range
 */
export function generateInvoiceID(sequenceNumber: number): string {
  if (!Number.isInteger(sequenceNumber)) {
    throw new Error('Sequence number must be an integer');
  }
  if (sequenceNumber < 1 || sequenceNumber > 999999999) {
    throw new Error('Sequence number must be between 1 and 999999999');
  }

  const paddedNumber = sequenceNumber.toString().padStart(9, '0');
  return `INV${paddedNumber}`;
}

/**
 * Generates a receipt ID in the format CH_ + 17 uppercase alphanumeric characters.
 * Uses cryptographically secure random generation.
 * @returns Receipt ID string (e.g., "CH_A3K9MXQP2T7VWRJN")
 */
export function generateReceiptID(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 17;

  // Use crypto for secure random generation
  // In Node.js, use the crypto module; in browser, use Web Crypto API
  let randomValues: Uint8Array;

  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    // Browser environment
    randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
  } else {
    // Node.js environment
    randomValues = new Uint8Array(length);
    crypto.randomFillSync(randomValues);
  }

  let result = 'CH_';
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}

// Made with Bob
