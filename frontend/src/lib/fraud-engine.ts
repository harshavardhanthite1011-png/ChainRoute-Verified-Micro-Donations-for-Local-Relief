import { APPROVED_VENDORS, ApprovedVendor } from "./constants";

export interface FraudCheckResult {
  passed: boolean;
  gate: string;
  name: string;
  status: "PASSED" | "FAILED" | "WARNING";
  details: string;
}

export interface PreFlightCheckReport {
  overallPassed: boolean;
  vendor?: ApprovedVendor;
  checks: FraudCheckResult[];
  rejectionReason?: string;
  confidenceScore: number;
}

/**
 * Validates Indian GSTIN format using standard 15-character regex pattern.
 * Structure: 2 digits (State) + 5 chars (PAN) + 4 digits + 1 char + 1 entity num + 'Z' + 1 checksum char.
 */
export function validateGstinFormat(gstin: string): boolean {
  if (!gstin) return false;
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.trim().toUpperCase());
}

/**
 * Pipeline that executes all 5 P5 automated anti-fraud checks before an expense
 * can be recorded or fingerprinted on the MST Blockchain.
 */
export function runAutomatedPreFlightChecks(params: {
  invoiceNo: string;
  gstin: string;
  amount: number;
  receiverAccount: string;
  lineItemName: string;
  lineItemAllocated: number;
  lineItemSpent: number;
  existingInvoiceNumbers: string[];
  existingPaymentIds: string[];
  paymentId: string;
}): PreFlightCheckReport {
  const checks: FraudCheckResult[] = [];
  let overallPassed = true;
  let rejectionReason: string | undefined = undefined;

  // -------------------------------------------------------------
  // GATE 1: GSTIN Structure & Lookup
  // -------------------------------------------------------------
  const isGstinValid = validateGstinFormat(params.gstin);
  if (!isGstinValid) {
    overallPassed = false;
    rejectionReason = "Invalid GSTIN format. Must be a valid 15-character Indian GSTIN.";
    checks.push({
      passed: false,
      gate: "GATE 1",
      name: "GSTIN Format Verification",
      status: "FAILED",
      details: `Supplied GSTIN "${params.gstin}" does not match Indian Tax Authority standard format.`,
    });
  } else {
    checks.push({
      passed: true,
      gate: "GATE 1",
      name: "GSTIN Format Verification",
      status: "PASSED",
      details: `GSTIN "${params.gstin.toUpperCase()}" matches verified 15-character structure.`,
    });
  }

  // -------------------------------------------------------------
  // GATE 2: Approved Vendor Registry Lookup
  // -------------------------------------------------------------
  const cleanGstin = params.gstin.trim().toUpperCase();
  const matchedVendor = APPROVED_VENDORS.find(
    (v) => v.gstin.toUpperCase() === cleanGstin && v.status === "ACTIVE"
  );

  if (!matchedVendor) {
    overallPassed = false;
    if (!rejectionReason) {
      rejectionReason = `Vendor with GSTIN ${params.gstin} is NOT on the authorized relief supplier list.`;
    }
    checks.push({
      passed: false,
      gate: "GATE 2",
      name: "Vendor Registry Authorization",
      status: "FAILED",
      details: `Vendor is unregistered or unverified. Disasters prohibit payments to unwhitelisted personal accounts.`,
    });
  } else {
    checks.push({
      passed: true,
      gate: "GATE 2",
      name: "Vendor Registry Authorization",
      status: "PASSED",
      details: `Authorized Supplier: "${matchedVendor.name}" (${matchedVendor.category}) is active.`,
    });
  }

  // -------------------------------------------------------------
  // GATE 3: Invoice Number Uniqueness (Double Billing Prevention)
  // -------------------------------------------------------------
  const cleanInv = params.invoiceNo.trim().toUpperCase();
  const isDuplicateInvoice = params.existingInvoiceNumbers
    .map((x) => x.trim().toUpperCase())
    .includes(cleanInv);

  if (isDuplicateInvoice) {
    overallPassed = false;
    if (!rejectionReason) {
      rejectionReason = `Duplicate Invoice: ${params.invoiceNo} has already been claimed on-chain!`;
    }
    checks.push({
      passed: false,
      gate: "GATE 3",
      name: "Invoice Uniqueness Check",
      status: "FAILED",
      details: `Critical Alert: Invoice ${params.invoiceNo} is already recorded in the audit trail. Double billing rejected.`,
    });
  } else {
    checks.push({
      passed: true,
      gate: "GATE 3",
      name: "Invoice Uniqueness Check",
      status: "PASSED",
      details: `Invoice ${cleanInv} is unique across all active and past campaigns.`,
    });
  }

  // -------------------------------------------------------------
  // GATE 4: Budget Allocation & Tolerance Check (Max 5% Overrun)
  // -------------------------------------------------------------
  const remainingBudget = params.lineItemAllocated - params.lineItemSpent;
  const maxAllowedWithTolerance = remainingBudget * 1.05; // 5% tolerance

  if (params.amount > maxAllowedWithTolerance) {
    overallPassed = false;
    if (!rejectionReason) {
      rejectionReason = `Expense amount ₹${params.amount.toLocaleString()} exceeds allocated line-item budget for "${params.lineItemName}".`;
    }
    checks.push({
      passed: false,
      gate: "GATE 4",
      name: "Line Item Budget Tolerance",
      status: "FAILED",
      details: `Claim ₹${params.amount} exceeds remaining ₹${remainingBudget} (Allowed max with 5% tolerance: ₹${Math.round(maxAllowedWithTolerance)}).`,
    });
  } else if (params.amount > remainingBudget) {
    checks.push({
      passed: true,
      gate: "GATE 4",
      name: "Line Item Budget Tolerance",
      status: "WARNING",
      details: `Claim ₹${params.amount} is within emergency 5% tolerance buffer of ₹${Math.round(maxAllowedWithTolerance)}.`,
    });
  } else {
    checks.push({
      passed: true,
      gate: "GATE 4",
      name: "Line Item Budget Tolerance",
      status: "PASSED",
      details: `Claim ₹${params.amount} is strictly within allocated remaining balance ₹${remainingBudget}.`,
    });
  }

  // -------------------------------------------------------------
  // GATE 5: Payment Receiver Account Verification
  // -------------------------------------------------------------
  const receiverClaim = params.receiverAccount.trim();
  const receiverValid =
    matchedVendor &&
    (matchedVendor.accountNumberMasked.endsWith(receiverClaim.slice(-4)) ||
      receiverClaim.includes(matchedVendor.accountNumberMasked.replace("•••• ", "")));

  if (matchedVendor && !receiverValid) {
    overallPassed = false;
    if (!rejectionReason) {
      rejectionReason = `Payment receiver bank account does NOT match verified vendor registered account.`;
    }
    checks.push({
      passed: false,
      gate: "GATE 5",
      name: "Payment Account Matching",
      status: "FAILED",
      details: `Bank statement shows beneficiary account ending in ...${receiverClaim.slice(-4)}, but registered account ends in ${matchedVendor.accountNumberMasked}. Fund diversion blocked.`,
    });
  } else {
    checks.push({
      passed: true,
      gate: "GATE 5",
      name: "Payment Account Matching",
      status: "PASSED",
      details: `Payment beneficiary account verified against vendor registration records.`,
    });
  }

  const passedCount = checks.filter((c) => c.status === "PASSED" || c.status === "WARNING").length;
  const confidenceScore = Math.round((passedCount / checks.length) * 100);

  return {
    overallPassed,
    vendor: matchedVendor,
    checks,
    rejectionReason,
    confidenceScore,
  };
}
