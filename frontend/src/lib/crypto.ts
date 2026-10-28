import { ethers } from "ethers";

/**
 * Computes canonical SHA-256 hash formatted as 0x-prefixed bytes32 for MST smart contract.
 */
export function canonicalSha256(text: string): string {
  return ethers.sha256(ethers.toUtf8Bytes(text));
}

/**
 * Computes canonical budget hash from line items table.
 */
export function computeBudgetHash(
  lineItems: Array<{ id: number | string; name: string; amount: number; quantity: string }>
): string {
  const canonicalData = lineItems
    .map((item, idx) => `${idx}:${item.name.trim().toLowerCase()}:${item.amount}:${item.quantity.trim().toLowerCase()}`)
    .sort()
    .join("|");
  return canonicalSha256(`BUDGET_ROOT:${canonicalData}`);
}

/**
 * Computes canonical donation receipt hash.
 */
export function computeDonationReceiptHash(data: {
  campaignId: number;
  paymentGatewayId: string;
  donorName: string;
  amount: number;
  timestamp: number;
}): string {
  const canonical = `DONATION:${data.campaignId}:${data.paymentGatewayId.trim()}:${data.amount}:${data.timestamp}`;
  return canonicalSha256(canonical);
}

/**
 * Computes dual-proof expense hash:
 * Combines vendor invoice number, GSTIN, amount, bill image SHA-256, and delivery photo SHA-256.
 */
export function computeExpenseHash(data: {
  campaignId: number;
  lineItemId: number;
  invoiceNo: string;
  vendorGstin: string;
  amount: number;
  billHash: string;
  deliveryPhotoHash: string;
}): string {
  const canonical = [
    `EXPENSE_BUNDLE`,
    `campaign:${data.campaignId}`,
    `item:${data.lineItemId}`,
    `inv:${data.invoiceNo.trim().toUpperCase()}`,
    `gstin:${data.vendorGstin.trim().toUpperCase()}`,
    `amt:${data.amount}`,
    `bill:${data.billHash}`,
    `delivery:${data.deliveryPhotoHash}`,
  ].join("|");
  return canonicalSha256(canonical);
}

/**
 * Compares computed hash with on-chain hash (case-insensitive hex match)
 */
export function verifyHashMatch(computedHash: string, onChainHash: string): boolean {
  if (!computedHash || !onChainHash) return false;
  return computedHash.toLowerCase().trim() === onChainHash.toLowerCase().trim();
}
