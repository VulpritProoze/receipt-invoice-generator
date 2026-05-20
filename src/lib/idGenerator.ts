/**
 * ID generation utilities for invoices and receipts.
 * These functions generate unique identifiers matching the required formats.
 */

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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    randomValues = new Uint8Array(length);
    nodeCrypto.randomFillSync(randomValues);
  }
  
  let result = 'CH_';
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}

// Made with Bob
