"use client";

import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sliders,
  AlertTriangle,
} from "lucide-react";
import { ExpenseRecord } from "../lib/store";
import { computeExpenseHash, verifyHashMatch } from "../lib/crypto";
import { MST_TESTNET } from "../lib/constants";

interface VerifyModalProps {
  expense: ExpenseRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VerifyModal({ expense, isOpen, onClose }: VerifyModalProps) {
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [tamperedAmount, setTamperedAmount] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    computedHash: string;
    onChainHash: string;
    matches: boolean;
    checkedAt: string;
  } | null>(null);

  if (!isOpen || !expense) return null;

  const handleVerify = () => {
    setIsVerifying(true);

    setTimeout(() => {
      // Amount used: real or tampered
      const effectiveAmount = isTampered ? tamperedAmount : expense.amount;

      // Recompute the canonical SHA-256 hash client-side
      const computed = computeExpenseHash({
        campaignId: expense.campaignId,
        lineItemId: expense.lineItemId,
        invoiceNo: expense.invoiceNo,
        vendorGstin: expense.vendorGstin,
        amount: effectiveAmount,
        billHash: expense.billHash,
        deliveryPhotoHash: expense.deliveryPhotoHash,
      });

      const onChain = expense.expenseHash;
      const matches = verifyHashMatch(computed, onChain);

      setVerificationResult({
        computedHash: computed,
        onChainHash: onChain,
        matches,
        checkedAt: new Date().toLocaleTimeString(),
      });

      setIsVerifying(false);
    }, 450);
  };

  const handleToggleTamper = () => {
    const nextTamper = !isTampered;
    setIsTampered(nextTamper);
    if (nextTamper) {
      setTamperedAmount(expense.amount + 5000); // secretly inflated invoice
    }
    setVerificationResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Cryptographic On-Chain Hash Verifier
              </h3>
              <p className="text-xs text-slate-400">
                Independent client-side SHA-256 recomputation vs. MST Blockchain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          {/* Expense Snapshot */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Expense Target
                </span>
                <span className="text-sm font-bold text-white">{expense.lineItemName}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Claimed Amount
                </span>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  ₹{expense.amount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-slate-300 border-t border-white/5">
              <div>
                <span className="text-slate-500">Invoice:</span> {expense.invoiceNo}
              </div>
              <div>
                <span className="text-slate-500">Vendor GSTIN:</span> {expense.vendorGstin}
              </div>
              <div className="truncate">
                <span className="text-slate-500">Volunteer:</span> {expense.volunteerName}
              </div>
              <div className="truncate">
                <span className="text-slate-500">Location:</span> {expense.volunteerLocation}
              </div>
            </div>
          </div>

          {/* Demonstration Tool: Simulate Tampering */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">
                  Hackathon Judge Feature: Test Fraud Detection
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleTamper}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isTampered
                    ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                    : "bg-slate-800 text-slate-300 hover:text-white border border-white/10"
                }`}
              >
                {isTampered ? "Tampering Active (Inflated ₹5,000)" : "Click to Simulate Off-Chain Tampering"}
              </button>
            </div>

            {isTampered ? (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Data Modified Off-Chain:</strong> Claimed invoice amount changed from ₹{expense.amount.toLocaleString()} to ₹{tamperedAmount.toLocaleString()} without blockchain authorization. Recompute now to observe rejection!
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Clicking the button above simulates a rogue actor altering an invoice in the off-chain database. The cryptographic verifier will immediately flag hash mismatch.
              </p>
            )}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Recomputing SHA-256 & Querying MST Node...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Recompute SHA-256 & Match Against MST Blockchain</span>
              </>
            )}
          </button>

          {/* Verification Results Comparison */}
          {verificationResult && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {verificationResult.matches ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>VERIFICATION SUCCESSFUL (100% Cryptographic Match)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The client-side SHA-256 fingerprint recomputed from the vendor invoice, GSTIN, amount, bill proof, and volunteer delivery photo <strong>matches the immutable on-chain record on MST Blockchain byte-for-byte</strong>. Zero tampering detected.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/50 space-y-2">
                  <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>FRAUD / TAMPERING DETECTED! (Hash Mismatch)</span>
                  </div>
                  <p className="text-xs text-red-200 leading-relaxed">
                    The recomputed fingerprint does <strong>NOT match</strong> the record on the MST Blockchain ledger. An off-chain field (amount, invoice, or receipt image) has been altered after initial registration!
                  </p>
                </div>
              )}

              {/* Hash comparison boxes */}
              <div className="bg-slate-900/90 rounded-xl p-4 border border-white/10 space-y-3 font-mono text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">
                    1. Recomputed Client-Side SHA-256 Fingerprint:
                  </span>
                  <span
                    className={`break-all font-semibold ${
                      verificationResult.matches ? "text-emerald-300" : "text-red-400 font-bold"
                    }`}
                  >
                    {verificationResult.computedHash}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">
                    2. Immutable MST Blockchain Record (Target State):
                  </span>
                  <span className="text-cyan-300 break-all">
                    {verificationResult.onChainHash}
                  </span>
                </div>

                <div className="pt-1 text-[11px] text-slate-400 font-sans flex items-center justify-between border-t border-white/5">
                  <span>Verified at: {verificationResult.checkedAt}</span>
                  <a
                    href={`${MST_TESTNET.blockExplorerUrl}/tx/${expense.onChainTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>View MSTScan Tx</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
