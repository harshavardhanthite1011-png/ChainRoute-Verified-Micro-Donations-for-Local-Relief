"use client";

import React from "react";
import {
  ShieldAlert,
  FileCheck2,
  Lock,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
} from "lucide-react";

interface HeroProps {
  onExplore: () => void;
  onOpenVerifier: () => void;
  onOpenFraudEngine: () => void;
  totalRaised: number;
  totalSpent: number;
}

export function Hero({
  onExplore,
  onOpenVerifier,
  onOpenFraudEngine,
  totalRaised,
  totalSpent,
}: HeroProps) {
  const remaining = totalRaised > totalSpent ? totalRaised - totalSpent : 0;

  return (
    <section className="relative pt-12 pb-16 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-emerald-500/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Buildathon round tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300 mb-6 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>MST Buildathon 2.0 • Round 2 MVP • Team Blockers</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Every Rupee Verified. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Every Delivery Cryptographically Proved.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Opaque charity relief is broken. ChainRoute enforces fixed line-item budgets,
          AI bill extraction, and independent volunteer delivery photos fingerprinted
          append-only on the <strong>MST Layer 1 Blockchain</strong>.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onExplore}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <span>Explore Relief Campaigns</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenFraudEngine}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-slate-900/90 text-slate-200 border border-slate-700/80 hover:bg-slate-800 hover:border-emerald-500/40 active:scale-95 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Test P5 Anti-Fraud Engine</span>
          </button>

          <button
            onClick={onOpenVerifier}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>On-Chain Verifier</span>
          </button>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Total Raised (Tracked)</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              ₹{totalRaised.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>100% Gate Receipts Hashed</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Verified Disbursed</span>
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              ₹{totalSpent.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-cyan-400/80 mt-1">
              Dual-Proof Verified
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Remaining Relief Pool</span>
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300 font-mono">
              ₹{remaining.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Protected in Treasury
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>On-Chain Security</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">
              MST Testnet
            </div>
            <div className="text-[11px] text-purple-300/80 mt-1">
              Append-Only Ledger
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
