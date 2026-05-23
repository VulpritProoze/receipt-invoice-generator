/**
 * Report Service Layer
 *
 * Orchestrates report generation by:
 * 1. Loading required data from database
 * 2. Validating ownership and completeness
 * 3. Calling PDF generators
 *
 * Security requirements enforced:
 * - User must own the invoice/receipt being generated
 * - Company config must be complete (onboarding done)
 * - Receipt generation requires valid invoice from database
 */

import { getInvoiceByID } from '@/lib/db/invoices';
import { getReceipt } from '@/lib/db/receipts';
import { getCompanyConfig } from '@/lib/db/company';
import { getBillingUser } from '@/modules/billingUsers/billingUserService';
import { generateInvoicePDF } from './invoicePDF';
import { generateReceiptPDF } from './receiptPDF';

/**
 * Generate an invoice PDF for a user
 *
 * @param userID - The user requesting the invoice
 * @param invoiceID - The invoice to generate
 * @returns PDF as a Buffer
 * @throws Error if invoice not found, user doesn't own it, or company config incomplete
 */
export async function generateInvoiceReport(
  userID: string,
  invoiceID: string
): Promise<Buffer> {
  // Load company config
  const companyConfig = await getCompanyConfig(userID);
  if (!companyConfig) {
    throw new Error(
      'Company configuration not found. Please complete onboarding first.'
    );
  }

  // Validate company config is complete (all required fields present)
  if (
    !companyConfig.brandName ||
    !companyConfig.companyName ||
    !companyConfig.companyUrl ||
    !companyConfig.addressLine ||
    !companyConfig.postalAddress ||
    !companyConfig.country
  ) {
    throw new Error(
      'Company configuration incomplete. Please complete onboarding first.'
    );
  }

  // Load invoice from database
  const invoice = await getInvoiceByID(invoiceID);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Fetch the billing user to resolve companyID
  const billingUser = await getBillingUser(invoice.billingUserID);
  if (!billingUser) {
    throw new Error('Billing user not found');
  }

  // Verify ownership (the billing user's companyID must match companyConfig's companyID)
  if (billingUser.companyID !== companyConfig.companyID) {
    throw new Error('Unauthorized: Invoice does not belong to this user');
  }

  // Generate PDF
  return generateInvoicePDF(invoice, companyConfig, billingUser);
}

/**
 * Generate a receipt PDF for a user
 *
 * Security requirement: Receipt generation MUST load the invoice from database,
 * not accept invoice data from request body. This ensures the receipt reflects
 * the actual stored invoice data.
 *
 * @param userID - The user requesting the receipt
 * @param receiptID - The receipt to generate
 * @returns PDF as a Buffer
 * @throws Error if receipt not found, invoice not found, user doesn't own them, or company config incomplete
 */
export async function generateReceiptReport(
  userID: string,
  receiptID: string
): Promise<Buffer> {
  // Load company config
  const companyConfig = await getCompanyConfig(userID);
  if (!companyConfig) {
    throw new Error(
      'Company configuration not found. Please complete onboarding first.'
    );
  }

  // Validate company config is complete
  if (
    !companyConfig.brandName ||
    !companyConfig.companyName ||
    !companyConfig.companyUrl ||
    !companyConfig.addressLine ||
    !companyConfig.postalAddress ||
    !companyConfig.country
  ) {
    throw new Error(
      'Company configuration incomplete. Please complete onboarding first.'
    );
  }

  // Load receipt from database
  const receipt = await getReceipt(userID, receiptID);
  if (!receipt) {
    throw new Error('Receipt not found');
  }

  // Verify ownership
  if (receipt.userID !== userID) {
    throw new Error('Unauthorized: Receipt does not belong to this user');
  }

  // Load the related invoice from database (security requirement)
  const invoice = await getInvoiceByID(receipt.invoiceID);
  if (!invoice) {
    throw new Error('Related invoice not found');
  }

  // Fetch billing user of invoice
  const billingUser = await getBillingUser(invoice.billingUserID);
  if (!billingUser) {
    throw new Error('Billing user not found');
  }

  // Verify invoice ownership matches receipt ownership
  if (billingUser.companyID !== companyConfig.companyID) {
    throw new Error('Unauthorized: Invoice does not belong to this user');
  }

  // Generate PDF
  return generateReceiptPDF(receipt, invoice, companyConfig);
}
