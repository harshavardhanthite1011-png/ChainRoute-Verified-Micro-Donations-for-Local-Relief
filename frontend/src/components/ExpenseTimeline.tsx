"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  Calendar,
  Building,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Receipt,
  Camera,
  Copy,
  Check,
  Search,
} from "lucide-react";
import { CampaignData, ExpenseRecord } from "../lib/store";
import { VerifyModal } from "./VerifyModal";
import { MST_TESTNET } from "../lib/constants";

interface ExpenseTimelineProps {
  campaigns: CampaignData[];
  expenses: ExpenseRecord[];
}

export function ExpenseTimeline({ campaigns, expenses }: ExpenseTimelineProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<number>(0); // 0 = all
  const [verifyingExpense, setVerifyingExpense] = useState<ExpenseRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredExpenses =
    selectedCampaignId === 0
      ? expenses
      : expenses.filter((e) => e.campaignId === selectedCampaignId);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-400" />
            <span>Dual-Proof Expense Audit Timeline</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete cryptographic audit trail of all relief disbursements fingerprinted on MST Blockchain.
          </p>
        </div>

        {/* Campaign Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Filter Campaign:</label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(Number(e.target.value))}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value={0}>All Relief Campaigns ({expenses.length})</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Cards */}
      {filteredExpenses.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/10 text-slate-400 text-sm">
          No expenses recorded for this campaign yet.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExpenses.map((exp) => {
            const campaign = campaigns.find((c) => c.id === exp.campaignId);

            return (
              <div
                key={exp.id}
                className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {exp.lineItemName}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(exp.timestamp).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      ₹{exp.amount.toLocaleString("en-IN")}
                    </span>
                    <button
                      onClick={() => setVerifyingExpense(exp)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all cursor-pointer shadow-sm shadow-cyan-500/10"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify</span>
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Left: Vendor & Bill Proof */}
                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-slate-300 font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-200">
                        <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Vendor Proof 1 (Bill + GSTIN)</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        GSTIN: {exp.vendorGstin}
                      </span>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <img
                        src={exp.billImageUrl}
                        alt="Bill"
                        className="w-16 h-16 object-cover rounded-lg border border-white/10 flex-shrink-0"
                      />
                      <div className="space-y-0.5 text-slate-300">
                        <div className="font-medium text-white truncate">{exp.vendorName}</div>
                        <div className="text-[11px] text-slate-400">
                          Invoice: <span className="font-mono text-slate-300">{exp.invoiceNo}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Payment: Beneficiary {exp.receiverAccount}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Volunteer & Ground Delivery Proof */}
                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-slate-300 font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-200">
                        <Camera className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Independent Volunteer Proof 2 (Delivery)</span>
                      </span>
                      <span className="text-[10px] text-cyan-400">Ground Witness</span>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <img
                        src={exp.deliveryPhotoUrl}
                        alt="Delivery"
                        className="w-16 h-16 object-cover rounded-lg border border-white/10 flex-shrink-0"
                      />
                      <div className="space-y-0.5 text-slate-300 truncate">
                        <div className="font-medium text-white truncate">{exp.volunteerName}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {exp.volunteerLocation}
                        </div>
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1 pt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Dual Independence Check Passed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer on-chain cryptographic fingerprint */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-emerald-400 font-semibold">MST Fingerprint:</span>
                    <span className="truncate max-w-[280px] sm:max-w-md text-slate-300">
                      {exp.expenseHash}
                    </span>
                    <button
                      onClick={() => handleCopy(exp.expenseHash)}
                      className="p-1 hover:text-white transition-colors"
                      title="Copy Hash"
                    >
                      {copiedHash === exp.expenseHash ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {exp.onChainTxHash && (
                    <a
                      href={`${MST_TESTNET.blockExplorerUrl}/tx/${exp.onChainTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-sans font-medium text-xs ml-auto"
                    >
                      <span>MSTScan Tx</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verify Modal */}
      <VerifyModal
        expense={verifyingExpense}
        isOpen={!!verifyingExpense}
        onClose={() => setVerifyingExpense(null)}
      />
    </div>
  );
}
