"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  FileText,
  Building,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { runAutomatedPreFlightChecks, PreFlightCheckReport } from "../lib/fraud-engine";
import { APPROVED_VENDORS } from "../lib/constants";

export function FraudDemo() {
  const [activeScenario, setActiveScenario] = useState<
    "fake-gstin" | "duplicate-inv" | "over-budget" | "bad-receiver" | "valid-supplier"
  >("fake-gstin");
  const [report, setReport] = useState<PreFlightCheckReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const scenarios = [
    {
      id: "fake-gstin" as const,
      title: "Scenario A: Fake / Unregistered GSTIN",
      subtitle: "Demonstrating Gate 1 & Gate 2 Rejection",
      badge: "FRAUD ATTEMPT",
      color: "text-red-400 border-red-500/30 bg-red-500/10",
      description:
        "A rogue entity attempts to submit an invoice using an invalid or unwhitelisted GSTIN ('INVALID_GST_999'). The engine halts processing before blockchain write.",
      params: {
        invoiceNo: "INV-SHADY-9921",
        gstin: "INVALID_GST_999",
        amount: 45000,
        receiverAccount: "•••• 9999",
        lineItemName: "Medical Kits",
        lineItemAllocated: 100000,
        lineItemSpent: 20000,
        existingInvoiceNumbers: ["INV-2026-KA-4412"],
        existingPaymentIds: [],
        paymentId: "PAY-1",
      },
    },
    {
      id: "duplicate-inv" as const,
      title: "Scenario B: Duplicate Invoice Replay",
      subtitle: "Demonstrating Gate 3 Rejection (Double Billing)",
      badge: "REPLAY ATTACK",
      color: "text-red-400 border-red-500/30 bg-red-500/10",
      description:
        "An organizer attempts to resubmit an already paid invoice ('INV-2026-KA-4412') from a previous relief drive. Cross-referencing ledger state catches duplicate billing.",
      params: {
        invoiceNo: "INV-2026-KA-4412", // already in existingInvoices
        gstin: "27AABCK1234F1Z5",
        amount: 85000,
        receiverAccount: "•••• 4892",
        lineItemName: "Rice & Pulses",
        lineItemAllocated: 180000,
        lineItemSpent: 85000,
        existingInvoiceNumbers: ["INV-2026-KA-4412"],
        existingPaymentIds: [],
        paymentId: "PAY-2",
      },
    },
    {
      id: "over-budget" as const,
      title: "Scenario C: Budget Overrun (>5% Tolerance)",
      subtitle: "Demonstrating Gate 4 Line-Item Cap Enforcement",
      badge: "OVERRUN BLOCKED",
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      description:
        "The claimed bill amount (₹150,000) exceeds the remaining line-item allocation (₹35,000) even after applying the 5% emergency buffer. Rejected to prevent fund exhaustion.",
      params: {
        invoiceNo: "INV-AS-7712",
        gstin: "27AAZCA1122D1Z4",
        amount: 150000,
        receiverAccount: "•••• 7712",
        lineItemName: "Water Tarps",
        lineItemAllocated: 100000,
        lineItemSpent: 65000,
        existingInvoiceNumbers: ["INV-2026-KA-4412"],
        existingPaymentIds: [],
        paymentId: "PAY-3",
      },
    },
    {
      id: "bad-receiver" as const,
      title: "Scenario D: Diverted Bank Account",
      subtitle: "Demonstrating Gate 5 Beneficiary Account Check",
      badge: "FUND DIVERSION",
      color: "text-red-400 border-red-500/30 bg-red-500/10",
      description:
        "Supplier GSTIN is valid, but the bank transaction payment went to a personal account (ending in 8899) rather than the vendor's registered account (ending in 9104).",
      params: {
        invoiceNo: "INV-SL-3321",
        gstin: "27AAGCS9876Q1Z2",
        amount: 30000,
        receiverAccount: "•••• 8899", // mismatch!
        lineItemName: "Antibiotics",
        lineItemAllocated: 200000,
        lineItemSpent: 60000,
        existingInvoiceNumbers: ["INV-2026-KA-4412"],
        existingPaymentIds: [],
        paymentId: "PAY-4",
      },
    },
    {
      id: "valid-supplier" as const,
      title: "Scenario E: Genuine Approved Supplier",
      subtitle: "Demonstrating All 5 Gates Passing Cleanly",
      badge: "LEGITIMATE CLAIM",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      description:
        "Authentic invoice from Kisan Agro Relief Supplies with verified GSTIN, unique invoice number, within line item balance, and matching registered bank account.",
      params: {
        invoiceNo: `INV-KA-NEW-${Date.now().toString().slice(-4)}`,
        gstin: "27AABCK1234F1Z5",
        amount: 40000,
        receiverAccount: "•••• 4892",
        lineItemName: "Rice & Pulses",
        lineItemAllocated: 180000,
        lineItemSpent: 85000,
        existingInvoiceNumbers: ["INV-2026-KA-4412"],
        existingPaymentIds: [],
        paymentId: "PAY-5",
      },
    },
  ];

  const currentScenario = scenarios.find((s) => s.id === activeScenario)!;

  const handleRunTest = (sc: typeof currentScenario) => {
    setIsRunning(true);
    setReport(null);

    setTimeout(() => {
      const res = runAutomatedPreFlightChecks(sc.params);
      setReport(res);
      setIsRunning(false);
    }, 350);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 mb-3">
          <ShieldAlert className="w-4 h-4" />
          <span>Requirement P5: Automated Anti-Fraud Pipeline</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Interactive Fraud Detection Simulator
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Test the automated 5-gate anti-fraud protocol required by Buildathon rules.
          Every expense is rigorously checked before any transaction can be executed on MST.
        </p>
      </div>

      {/* Scenario Picker Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {scenarios.map((sc) => {
          const isSelected = activeScenario === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => {
                setActiveScenario(sc.id);
                handleRunTest(sc);
              }}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-500/10"
                  : "bg-slate-900/50 border-white/5 hover:bg-slate-800/50 text-slate-400"
              }`}
            >
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${sc.color}`}>
                  {sc.badge}
                </span>
                <h4 className="mt-2 text-xs font-bold text-white line-clamp-1">{sc.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{sc.subtitle}</p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                <span>Test Gate</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Inspection Chamber */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Claim Specs */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Expense Claim Details</h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${currentScenario.color}`}>
              {currentScenario.badge}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {currentScenario.description}
          </p>

          <div className="bg-slate-900/90 rounded-xl p-4 border border-white/10 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Invoice No:</span>
              <span className="text-white font-bold">{currentScenario.params.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">GSTIN Claimed:</span>
              <span className="text-emerald-400">{currentScenario.params.gstin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Claim Amount:</span>
              <span className="text-cyan-300 font-bold">
                ₹{currentScenario.params.amount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Line Item Target:</span>
              <span className="text-slate-200">{currentScenario.params.lineItemName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Beneficiary Bank Acc:</span>
              <span className="text-slate-200">{currentScenario.params.receiverAccount}</span>
            </div>
          </div>

          <button
            onClick={() => handleRunTest(currentScenario)}
            disabled={isRunning}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating 5 Gates...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Execute Anti-Fraud Evaluation</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Results Report */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <span>Multi-Gate Evaluation Report</span>
            </h3>
            {report && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  report.overallPassed
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}
              >
                {report.overallPassed ? "100% CLEAN • APPROVED" : "FLAGGED • RECORD BLOCKED"}
              </span>
            )}
          </div>

          {report ? (
            <div className="space-y-3">
              {report.checks.map((chk, idx) => (
                <div
                  key={idx}
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
                  <p className="mt-1 text-xs text-slate-300 pl-6 leading-relaxed">
                    {chk.details}
                  </p>
                </div>
              ))}

              {/* Bottom Verdict */}
              <div
                className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
                  report.overallPassed
                    ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-200"
                    : "bg-red-950/50 border-red-500/40 text-red-200"
                }`}
              >
                {report.overallPassed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Ready for MST Blockchain Append:</strong>
                      <span>
                        All 5 verification gates passed. SHA-256 fingerprint can be generated and written to `recordExpense` on-chain.
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Transaction Rejected:</strong>
                      <span>{report.rejectionReason}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a scenario or click "Execute Anti-Fraud Evaluation" to view gate breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
