"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Lock,
  AlertTriangle,
  Wallet,
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

type TxStage = "IDLE" | "AWAITING_SIGNATURE" | "SUBMITTED" | "CONFIRMING" | "CONFIRMED" | "FAILED";

interface RelayStatus {
  enabled: boolean;
  relayerAddress?: string;
  balance?: string;
  reason?: string;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Status and stages
  const [txStage, setTxStage] = useState<TxStage>("IDLE");
  const [stageMessage, setStageMessage] = useState<string>("");
  const [submittedTxHash, setSubmittedTxHash] = useState<string>("");

  // Relayer status from /api/relay/status
  const [relayStatus, setRelayStatus] = useState<RelayStatus | null>(null);
  const [isCheckingRelay, setIsCheckingRelay] = useState<boolean>(true);

  // Connected BridgeKey account
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);

  const [successData, setSuccessData] = useState<{
    receiptHash: string;
    txHash: string;
    explorerUrl: string;
    blockNumber?: number;
  } | null>(null);

  // Fetch relayer status and auto-detect wallet when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setErrorMessage(null);
    setTxStage("IDLE");
    setSubmittedTxHash("");

    async function checkStatus() {
      setIsCheckingRelay(true);
      try {
        const res = await fetch("/api/relay/status");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setRelayStatus(data);
        } else {
          if (isMounted) setRelayStatus({ enabled: false, reason: "Relayer status offline" });
        }
      } catch {
        if (isMounted) setRelayStatus({ enabled: false, reason: "Failed to connect to relayer service" });
      } finally {
        if (isMounted) setIsCheckingRelay(false);
      }

      // Check BridgeKey connection
      try {
        const conn = await walletManager.autoReconnect(false);
        if (conn && isMounted) {
          setConnectedAccount(conn.account);
        }
      } catch {
        // Silent catch
      }
    }

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const quickAmounts = [500, 1000, 2500, 5000];

  const handleConnectWallet = async () => {
    setErrorMessage(null);
    try {
      const conn = await walletManager.connectBridgeKey(false);
      setConnectedAccount(conn.account);
    } catch (err: any) {
      if (err.message === "BRIDGEKEY_NOT_INSTALLED") {
        setErrorMessage("BridgeKey extension is not detected. Please install BridgeKey from https://bridgekey.io or the Chrome Web Store.");
      } else {
        setErrorMessage("Wallet connection failed: " + (err?.message || "User cancelled"));
      }
    }
  };

  const handlePayAndRecord = async () => {
    if (amount <= 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setTxStage("IDLE");
    setSubmittedTxHash("");

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

      let onChainTxHash = "";
      let explorerUrl = "";
      let blockNumber: number | undefined;

      // 3. Flow determination: Relayer vs Direct BridgeKey
      if (relayStatus?.enabled) {
        // Preferred path: Use hardened server relayer
        setTxStage("SUBMITTED");
        setStageMessage("Broadcasting sponsored transaction to MST Testnet...");

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
          blockNumber = relayJson.data.blockNumber;
          setSubmittedTxHash(onChainTxHash);
          setTxStage("CONFIRMED");
          setStageMessage(`Confirmed in block #${blockNumber}`);
        } else {
          throw new Error(
            relayJson.error ||
              "Could not record transaction on MST Blockchain. Please verify relayer gas balance."
          );
        }
      } else {
        // Relayer is disabled: Must use BridgeKey
        if (!connectedAccount) {
          throw new Error("Server relayer is disabled. Please connect your BridgeKey wallet to sign directly.");
        }

        setTxStage("AWAITING_SIGNATURE");
        setStageMessage("Please approve transaction in BridgeKey extension...");

        const contractAddress = CONTRACT_ADDRESS_TESTNET || "";
        const result = await recordDonationViaBridgeKey(
          contractAddress,
          campaign.id,
          receiptHash,
          amount,
          false,
          (status, data) => {
            if (status === "AWAITING_APPROVAL") {
              setTxStage("AWAITING_SIGNATURE");
              setStageMessage("Awaiting BridgeKey approval...");
            } else if (status === "SUBMITTED") {
              setTxStage("SUBMITTED");
              setSubmittedTxHash(data?.txHash || "");
              setStageMessage("Transaction broadcast! Awaiting block confirmation...");
            } else if (status === "CONFIRMING") {
              setTxStage("CONFIRMING");
              setStageMessage("Confirming block on MST Blockchain...");
            } else if (status === "CONFIRMED") {
              setTxStage("CONFIRMED");
              setStageMessage(`Mined in block #${data?.blockNumber}`);
            }
          }
        );

        onChainTxHash = result.txHash;
        explorerUrl = result.explorerUrl;
        blockNumber = result.blockNumber;
      }

      // Record to local store
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
        blockNumber,
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setTxStage("FAILED");
      const rawMsg = err?.message || String(err);
      if (rawMsg.includes("caller is not authorized to write")) {
        setErrorMessage(
          "Transaction reverted on-chain: The smart contract restricts writes to authorized addresses. For public donor access, the server relayer must be enabled."
        );
      } else if (rawMsg.includes("user rejected") || rawMsg.includes("ACTION_REJECTED")) {
        setErrorMessage("Transaction was cancelled in your wallet.");
      } else {
        setErrorMessage(rawMsg);
      }
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
              <p className="text-xs text-slate-400">Fingerprinted directly on MST Testnet (Chain ID: 91562037)</p>
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
          {/* Inline Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start justify-between gap-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-rose-200 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
                {successData.blockNumber && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Block Number:</span>
                    <span className="text-slate-200">{successData.blockNumber}</span>
                  </div>
                )}
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

              {/* Relayer & Wallet Execution Info */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-white/10 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>On-Chain Execution Route:</span>
                  </span>
                  {isCheckingRelay ? (
                    <span className="text-slate-500">Checking relayer...</span>
                  ) : relayStatus?.enabled ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Automated Gas Relayer (Zero-Gas)</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold">
                      Direct Wallet Signing (BridgeKey)
                    </span>
                  )}
                </div>

                {!relayStatus?.enabled && !isCheckingRelay && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {connectedAccount ? (
                      <>Signing directly via connected BridgeKey: <span className="font-mono text-cyan-300">{connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}</span></>
                    ) : (
                      <>Relayer is disabled. Please connect your BridgeKey wallet to record your donation on-chain.</>
                    )}
                  </p>
                )}
              </div>

              {/* Live Tx Stage Banner */}
              {isProcessing && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <div className="font-semibold">{stageMessage || "Processing transaction..."}</div>
                    {submittedTxHash && (
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs">
                        Tx: {submittedTxHash}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!relayStatus?.enabled && !connectedAccount && !isCheckingRelay ? (
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-500 text-white hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect BridgeKey to Donate</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePayAndRecord}
                  disabled={isProcessing || amount <= 0}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Recording to MST Blockchain...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Record ₹{amount.toLocaleString("en-IN")} On-Chain</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
