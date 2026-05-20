/**
 * Credit card masking utility.
 * Masks credit card numbers for secure storage and display.
 */

/**
 * Masks a credit card number, showing only the last 4 digits.
 * @param cardNumber - The raw credit card number (digits only or with spaces/dashes)
 * @returns Masked credit card number in format "**** **** **** 1234"
 * @throws Error if cardNumber is invalid
 */
export function maskCreditCard(cardNumber: string): string {
  if (!cardNumber || typeof cardNumber !== 'string') {
    throw new Error('Credit card number must be a non-empty string');
  }

  // Remove all non-digit characters
  const digitsOnly = cardNumber.replace(/\D/g, '');

  // Validate length (most credit cards are 13-19 digits, but we'll accept 13-19)
  if (digitsOnly.length < 13 || digitsOnly.length > 19) {
    throw new Error(
      'Credit card number must contain between 13 and 19 digits'
    );
  }

  // Extract last 4 digits
  const lastFour = digitsOnly.slice(-4);

  // Return masked format
  return `**** **** **** ${lastFour}`;
}

// Made with Bob
