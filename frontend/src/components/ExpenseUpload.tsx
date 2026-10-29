"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Camera,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Building2,
  Receipt,
} from "lucide-react";
import { CampaignData, ExpenseRecord } from "../lib/store";
import { runAutomatedPreFlightChecks, PreFlightCheckReport } from "../lib/fraud-engine";
import { computeExpenseHash, canonicalSha256 } from "../lib/crypto";
import { MST_TESTNET, APPROVED_VENDORS, CONTRACT_ADDRESS_TESTNET } from "../lib/constants";
import { recordExpenseViaBridgeKey } from "../lib/mst";
import { walletManager } from "../lib/wallet";

interface ExpenseUploadProps {
  campaigns: CampaignData[];
  existingExpenses: ExpenseRecord[];
  onExpenseCreated: (expense: ExpenseRecord) => void;
}

export function ExpenseUpload({
  campaigns,
  existingExpenses,
  onExpenseCreated,
}: ExpenseUploadProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<number>(
    campaigns[0]?.id || 1
  );
  const [selectedLineItemId, setSelectedLineItemId] = useState<number>(0);

  // Form Fields
  const [invoiceNo, setInvoiceNo] = useState<string>("INV-2026-KA-9912");
  const [vendorName, setVendorName] = useState<string>("Kisan Agro Relief Supplies");
  const [vendorGstin, setVendorGstin] = useState<string>("27AABCK1234F1Z5");
  const [receiverAccount, setReceiverAccount] = useState<string>("•••• 4892");
  const [amount, setAmount] = useState<number>(35000);
  const [billImage, setBillImage] = useState<string>(
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"
  );

  // 2nd Volunteer Proof
  const [volunteerName, setVolunteerName] = useState<string>("Geetha Pillai (#VOL-62)");
  const [volunteerLocation, setVolunteerLocation] = useState<string>(
    "Meppadi Community Shelter, GPS: 11.5510° N, 76.1260° E"
  );
  const [deliveryPhoto, setDeliveryPhoto] = useState<string>(
    "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80"
  );

  // Pipeline State
  const [fraudReport, setFraudReport] = useState<PreFlightCheckReport | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSubmittingOnChain, setIsSubmittingOnChain] = useState<boolean>(false);
  const [submittedTx, setSubmittedTx] = useState<{
    expenseHash: string;
    txHash: string;
    explorerUrl: string;
  } | null>(null);

  const currentCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];
  const currentLineItem =
    currentCampaign?.lineItems.find((l) => l.id === selectedLineItemId) ||
    currentCampaign?.lineItems[0];

  // Presets for Hackathon Judges
  const loadPreset = (type: "valid" | "fake-gstin" | "duplicate-inv" | "overbudget" | "bad-account") => {
    setSubmittedTx(null);
    setFraudReport(null);

    if (type === "valid") {
      setVendorName("Kisan Agro Relief Supplies");
      setVendorGstin("27AABCK1234F1Z5");
      setInvoiceNo(`INV-${Date.now().toString().slice(-5)}`);
      setReceiverAccount("•••• 4892");
      setAmount(30000);
    } else if (type === "fake-gstin") {
      setVendorName("Shady Relief Traders");
      setVendorGstin("INVALID_GSTIN_999");
      setInvoiceNo(`INV-FAKE-${Date.now().toString().slice(-4)}`);
      setReceiverAccount("•••• 0000");
      setAmount(25000);
    } else if (type === "duplicate-inv") {
      // Re-use an existing invoice number already stored
      const existingInv = existingExpenses[0]?.invoiceNo || "INV-2026-KA-4412";
      setVendorName("Kisan Agro Relief Supplies");
      setVendorGstin("27AABCK1234F1Z5");
      setInvoiceNo(existingInv);
      setReceiverAccount("•••• 4892");
      setAmount(85000);
    } else if (type === "overbudget") {
      setVendorName("Aashray Shelter & Tarp Mills");
      setVendorGstin("27AAZCA1122D1Z4");
      setInvoiceNo(`INV-OVER-${Date.now().toString().slice(-4)}`);
      setReceiverAccount("•••• 7712");
      setAmount(500000); // Exceeds budget!
    } else if (type === "bad-account") {
      setVendorName("Sanjivani Lifecare Pharma");
      setVendorGstin("27AAGCS9876Q1Z2");
      setInvoiceNo(`INV-DIVERT-${Date.now().toString().slice(-4)}`);
      setReceiverAccount("•••• 9999"); // Diverted account!
      setAmount(20000);
    }
  };

  const handleRunFraudChecks = () => {
    setIsVerifying(true);
    setSubmittedTx(null);

    setTimeout(() => {
      const existingInvoices = existingExpenses.map((e) => e.invoiceNo);
      const existingPaymentIds = existingExpenses.map((e) => e.id);

      const report = runAutomatedPreFlightChecks({
        invoiceNo,
        gstin: vendorGstin,
        amount,
        receiverAccount,
        lineItemName: currentLineItem?.name || "General Line Item",
        lineItemAllocated: currentLineItem?.allocatedAmount || 100000,
        lineItemSpent: currentLineItem?.spentAmount || 0,
        existingInvoiceNumbers: existingInvoices,
        existingPaymentIds: existingPaymentIds,
        paymentId: `PAY-${Date.now()}`,
      });

      setFraudReport(report);
      setIsVerifying(false);
    }, 400);
  };

  const handleSubmitOnChain = async () => {
    if (!fraudReport || !fraudReport.overallPassed) {
      alert("Cannot submit to blockchain: expense failed pre-flight fraud verification.");
      return;
    }

    setIsSubmittingOnChain(true);

    try {
      const billHash = canonicalSha256(billImage + invoiceNo + vendorGstin);
      const deliveryPhotoHash = canonicalSha256(deliveryPhoto + volunteerLocation);

      // Compute final composite SHA-256 expense bundle fingerprint
      const expenseHash = computeExpenseHash({
        campaignId: currentCampaign.id,
        lineItemId: currentLineItem.id,
        invoiceNo,
        vendorGstin,
        amount,
        billHash,
        deliveryPhotoHash,
      });

      // Submit on-chain via BridgeKey wallet or backend relayer
      let onChainTxHash = "";
      let explorerUrl = "";

      // Check if BridgeKey wallet is available
      const bridgeKeyProvider = await walletManager.getBridgeKeyProvider().catch(() => null);
      if (bridgeKeyProvider) {
        try {
          const contractAddress = CONTRACT_ADDRESS_TESTNET || "";
          const result = await recordExpenseViaBridgeKey(
            contractAddress,
            currentCampaign.id,
            currentLineItem.id,
            expenseHash,
            amount
          );
          onChainTxHash = result.txHash;
          explorerUrl = result.explorerUrl;
        } catch (bkErr: any) {
          console.warn("BridgeKey signing deferred to relayer:", bkErr);
        }
      }

      // If BridgeKey not used or yielded no txHash, call backend relayer
      if (!onChainTxHash) {
        const relayRes = await fetch("/api/relay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "recordExpense",
            payload: {
              campaignId: currentCampaign.id,
              lineItemId: currentLineItem.id,
              expenseHash,
              amount,
            },
          }),
        });

        const relayJson = await relayRes.json();
        if (relayJson.success && relayJson.data?.txHash) {
          onChainTxHash = relayJson.data.txHash;
          explorerUrl = relayJson.data.explorerUrl;
        } else {
          throw new Error(
            relayJson.error ||
              "Could not record expense on MST Blockchain. Please connect your BridgeKey wallet or ensure relayer has tMSTC gas funds."
          );
        }
      }

      const newExpenseRecord: ExpenseRecord = {
        id: `EXP-${Date.now().toString().slice(-4)}`,
        campaignId: currentCampaign.id,
        lineItemId: currentLineItem.id,
        lineItemName: currentLineItem.name,
        amount,
        invoiceNo,
        vendorName,
        vendorGstin,
        receiverAccount,
        billImageUrl: billImage,
        billHash,
        deliveryPhotoUrl: deliveryPhoto,
        deliveryPhotoHash,
        volunteerName,
        volunteerLocation,
        timestamp: Date.now(),
        expenseHash,
        onChainTxHash,
        status: "RECORDED_ON_CHAIN",
        fraudReport,
      };

      onExpenseCreated(newExpenseRecord);

      setSubmittedTx({
        expenseHash,
        txHash: onChainTxHash,
        explorerUrl,
      });
    } catch (err: any) {
      alert("Submission error: " + err.message);
    } finally {
      setIsSubmittingOnChain(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-400 mb-3">
          <ShieldAlert className="w-4 h-4" />
          <span>P3 & P5 Dual-Proof Verification Pipeline</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Expense Audit & On-Chain Stamping
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Every expense requires a verified bill from an approved vendor AND ground delivery photo
          proof by an independent volunteer before being recorded on the MST Blockchain ledger.
        </p>
      </div>

      {/* Judge Quick Demonstration Presets */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Judge Demonstration Quick Presets (Evaluate P5 Fraud Rejections):
          </span>
          <span className="text-[11px] text-slate-400">1-click simulation test bench</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => loadPreset("valid")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer"
          >
            🟢 Preset 1: Valid Supplier (Pass All 5 Gates)
          </button>
          <button
            onClick={() => loadPreset("fake-gstin")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all cursor-pointer"
          >
            🔴 Preset 2: Fake/Unregistered GSTIN
          </button>
          <button
            onClick={() => loadPreset("duplicate-inv")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all cursor-pointer"
          >
            🔴 Preset 3: Duplicate Invoice Replay
          </button>
          <button
            onClick={() => loadPreset("overbudget")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all cursor-pointer"
          >
            🔴 Preset 4: Over-Budget Claim
          </button>
          <button
            onClick={() => loadPreset("bad-account")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all cursor-pointer"
          >
            🔴 Preset 5: Diverted Receiver Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input Proofs Form */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span>Step 1: Organizer Bill & Payment Proof</span>
          </h3>

          {/* Campaign & Line Item Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Campaign
              </label>
              <select
                value={selectedCampaignId}
                onChange={(e) => {
                  setSelectedCampaignId(Number(e.target.value));
                  setSelectedLineItemId(0);
                }}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Line Item Allocation
              </label>
              <select
                value={selectedLineItemId}
                onChange={(e) => setSelectedLineItemId(Number(e.target.value))}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {currentCampaign.lineItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Rem: ₹{(item.allocatedAmount - item.spentAmount).toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Supplier Vendor Name
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Vendor GSTIN (Tax ID)
              </label>
              <input
                type="text"
                value={vendorGstin}
                onChange={(e) => setVendorGstin(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Invoice No & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Claimed Amount (INR)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Receiver Account */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Beneficiary Bank Account Masked
            </label>
            <input
              type="text"
              value={receiverAccount}
              onChange={(e) => setReceiverAccount(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Step 2: Independent 2nd Volunteer Delivery Proof */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-cyan-400" />
              <span>Step 2: 2nd Volunteer Ground Delivery Proof</span>
            </h3>
            <p className="text-xs text-slate-400">
              Must be signed by an independent ground volunteer with verifiable GPS location.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Volunteer Full Name & ID
                </label>
                <input
                  type="text"
                  value={volunteerName}
                  onChange={(e) => setVolunteerName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Delivery Camp & GPS Tag
                </label>
                <input
                  type="text"
                  value={volunteerLocation}
                  onChange={(e) => setVolunteerLocation(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Thumbnail Previews */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 h-28">
                <img
                  src={billImage}
                  alt="Bill proof"
                  className="w-full h-full object-cover opacity-80"
                />
                <span className="absolute bottom-1 left-2 text-[10px] font-semibold bg-slate-950/80 px-2 py-0.5 rounded text-slate-200">
                  Bill Image
                </span>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 h-28">
                <img
                  src={deliveryPhoto}
                  alt="Delivery photo"
                  className="w-full h-full object-cover opacity-80"
                />
                <span className="absolute bottom-1 left-2 text-[10px] font-semibold bg-slate-950/80 px-2 py-0.5 rounded text-cyan-300">
                  Delivery Photo
                </span>
              </div>
            </div>
          </div>

          {/* Trigger Pre-Flight Checks */}
          <button
            onClick={handleRunFraudChecks}
            disabled={isVerifying}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-slate-800 text-white border border-white/10 hover:bg-slate-700 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Running Automated Anti-Fraud Pipeline...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>Run Automated P5 Fraud Gates</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Pre-Flight Audit Report & On-Chain Submit */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Pre-Flight Verification Status</span>
              </h3>
              {fraudReport && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    fraudReport.overallPassed
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}
                >
                  {fraudReport.overallPassed ? "APPROVED FOR MST RECORD" : "REJECTED (FRAUD DETECTED)"}
                </span>
              )}
            </div>

            {fraudReport ? (
              <div className="mt-5 space-y-3">
                {fraudReport.checks.map((chk, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border transition-all ${
                      chk.status === "PASSED"
                        ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-300"
                        : chk.status === "WARNING"
                        ? "bg-amber-950/20 border-amber-500/20 text-amber-300"
                        : "bg-red-950/30 border-red-500/30 text-red-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {chk.status === "PASSED" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : chk.status === "WARNING" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        <span className="text-xs font-bold text-white">
                          {chk.gate}: {chk.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                        {chk.status}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-300 pl-6 leading-relaxed">
                      {chk.details}
                    </p>
                  </div>
                ))}

                {/* Rejection summary notice */}
                {!fraudReport.overallPassed && (
                  <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Expense Disallowed by Anti-Fraud Protocol:</strong>
                      <span>{fraudReport.rejectionReason}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 text-center py-12 px-4 rounded-xl bg-slate-900/40 border border-dashed border-white/10 space-y-3">
                <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Click <strong>"Run Automated P5 Fraud Gates"</strong> or select one of the
                  judge presets above to execute the 5-gate audit pipeline.
                </p>
              </div>
            )}
          </div>

          {/* Submission and Result Section */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            {submittedTx ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-300 font-bold font-sans">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Recorded to MST Blockchain Ledger!</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">SHA-256 Fingerprint:</span>
                  <span className="text-emerald-300 break-all">{submittedTx.expenseHash}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Transaction Hash:</span>
                  <span className="text-cyan-300 break-all">{submittedTx.txHash}</span>
                </div>
                <div className="pt-2">
                  <a
                    href={submittedTx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all font-sans"
                  >
                    <span>View on MSTScan Explorer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSubmitOnChain}
                disabled={!fraudReport?.overallPassed || isSubmittingOnChain}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmittingOnChain ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing & Recording on MST Blockchain...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Fingerprint & Append to MST Ledger</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
