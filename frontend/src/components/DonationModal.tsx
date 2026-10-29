"use client";

import React, { useState } from "react";
import {
  X,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CampaignData, DonationRecord } from "../lib/store";
import { computeDonationReceiptHash } from "../lib/crypto";
import { MST_TESTNET, CONTRACT_ADDRESS_TESTNET } from "../lib/constants";
import { recordDonationViaBridgeKey } from "../lib/mst";
import { walletManager } from "../lib/wallet";

interface DonationModalProps {
  campaign: CampaignData;
  isOpen: boolean;
  onClose: () => void;
  onDonationSuccess: (donation: DonationRecord) => void;
}

export function DonationModal({
  campaign,
  isOpen,
  onClose,
  onDonationSuccess,
}: DonationModalProps) {
  const [amount, setAmount] = useState<number>(1000);
  const [donorName, setDonorName] = useState<string>("Anonymous Donor");
  const [donorEmail, setDonorEmail] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD">("UPI");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{
    receiptHash: string;
    txHash: string;
    explorerUrl: string;
  } | null>(null);

  if (!isOpen) return null;

  const quickAmounts = [500, 1000, 2500, 5000];

  const handlePayAndRecord = async () => {
    if (amount <= 0) return;
    setIsProcessing(true);

    try {
      // 1. Simulate Payment Gateway confirmation in test mode
      const gatewayTxnId = `pay_MST_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
      const timestamp = Date.now();

      // 2. Cryptographic SHA-256 fingerprint generation
      const receiptHash = computeDonationReceiptHash({
        campaignId: campaign.id,
        paymentGatewayId: gatewayTxnId,
        donorName: donorName || "Anonymous Donor",
        amount,
        timestamp,
      });

      // 3. Submit real on-chain transaction via BridgeKey wallet or backend relayer
      let onChainTxHash = "";
      let explorerUrl = "";

      // Check if BridgeKey wallet is available
      const bridgeKeyProvider = await walletManager.getBridgeKeyProvider().catch(() => null);
      if (bridgeKeyProvider) {
        try {
          const contractAddress = CONTRACT_ADDRESS_TESTNET || "";
          const result = await recordDonationViaBridgeKey(
            contractAddress,
            campaign.id,
            receiptHash,
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
            action: "recordDonation",
            payload: {
              campaignId: campaign.id,
              receiptHash,
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
              "Could not record transaction on MST Blockchain. Please connect your BridgeKey wallet or ensure relayer has tMSTC gas funds."
          );
        }
      }

      // Record to store
      const record: DonationRecord = {
        id: `DON-${Date.now().toString().slice(-4)}`,
        campaignId: campaign.id,
        donorName: donorName || "Anonymous Donor",
        donorEmail,
        amount,
        timestamp,
        paymentGatewayTxnId: gatewayTxnId,
        receiptHash,
        onChainTxHash,
        status: "RECORDED_ON_CHAIN",
      };

      onDonationSuccess(record);

      setSuccessData({
        receiptHash,
        txHash: onChainTxHash,
        explorerUrl,
      });

      // Trigger Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      alert("Donation processing failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Verified Donation</h3>
              <p className="text-xs text-slate-400">Fingerprinted directly on MST Testnet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {successData ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-xl font-bold text-white">Donation Appended On-Chain!</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Thank you! Your donation of <strong className="text-emerald-400">₹{amount.toLocaleString("en-IN")}</strong> has been converted into an immutable SHA-256 receipt fingerprint on MST Blockchain.
              </p>

              {/* Hashes Box */}
              <div className="bg-slate-900/90 rounded-xl p-4 text-left border border-white/10 space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">SHA-256 Receipt Hash:</span>
                  <span className="text-emerald-300 break-all">{successData.receiptHash}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">MST Blockchain Tx Hash:</span>
                  <span className="text-cyan-300 break-all">{successData.txHash}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <a
                  href={successData.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all"
                >
                  <span>Verify on MSTScan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Target Campaign summary */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <div className="text-[11px] text-slate-400">Contributing to:</div>
                <div className="text-sm font-semibold text-white truncate">{campaign.title}</div>
              </div>

              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Select Donation Amount (INR)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        amount === val
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm"
                          : "bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>

                <div className="mt-3 relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-mono">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="Custom amount"
                  />
                </div>
              </div>

              {/* Donor info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your Name / Alias
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Rahul S."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email for Receipt
                  </label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="optional"
                  />
                </div>
              </div>

              {/* Gateway Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Payment Mode (Razorpay / UPI Test Mode)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-2 cursor-pointer ${
                      paymentMethod === "UPI"
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                        : "bg-slate-900/60 border-white/10 text-slate-400"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Instant UPI (Test)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARD")}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-2 cursor-pointer ${
                      paymentMethod === "CARD"
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                        : "bg-slate-900/60 border-white/10 text-slate-400"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Debit / Credit Card</span>
                  </button>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 flex items-start gap-2 text-[11px] text-slate-300">
                <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  Every donation triggers automated SHA-256 fingerprinting on the MST Blockchain append-only ledger. You will receive an on-chain receipt hash to track your funds.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handlePayAndRecord}
                disabled={isProcessing || amount <= 0}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Recording to MST Blockchain...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Record ₹{amount.toLocaleString("en-IN")} On-Chain</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
