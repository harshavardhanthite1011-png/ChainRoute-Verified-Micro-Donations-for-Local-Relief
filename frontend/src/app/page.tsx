"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { CampaignCard } from "../components/CampaignCard";
import { DonationModal } from "../components/DonationModal";
import { ExpenseUpload } from "../components/ExpenseUpload";
import { ExpenseTimeline } from "../components/ExpenseTimeline";
import { FraudDemo } from "../components/FraudDemo";
import {
  INITIAL_CAMPAIGNS,
  INITIAL_DONATIONS,
  INITIAL_EXPENSES,
  CampaignData,
  DonationRecord,
  ExpenseRecord,
} from "../lib/store";
import { MST_TESTNET, MST_MAINNET, BRIDGEKEY_CONFIG } from "../lib/constants";
import {
  ShieldCheck,
  ExternalLink,
  Coins,
  Layers,
  Sparkles,
  Lock,
} from "lucide-react";
import { WalletProvider } from "../lib/wallet-context";

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("campaigns");
  const [isMainnet, setIsMainnet] = useState<boolean>(false);

  // App State
  const [campaigns, setCampaigns] = useState<CampaignData[]>(INITIAL_CAMPAIGNS);
  const [donations, setDonations] = useState<DonationRecord[]>(INITIAL_DONATIONS);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);

  // Donation Modal
  const [selectedDonationCampaign, setSelectedDonationCampaign] =
    useState<CampaignData | null>(null);

  // Totals
  const totalRaised = campaigns.reduce((acc, c) => acc + c.totalRaised, 0);
  const totalSpent = campaigns.reduce((acc, c) => acc + c.totalSpent, 0);

  const handleDonationSuccess = (newDonation: DonationRecord) => {
    setDonations((prev) => [newDonation, ...prev]);

    // Update campaign raised total
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === newDonation.campaignId) {
          return {
            ...c,
            totalRaised: c.totalRaised + newDonation.amount,
          };
        }
        return c;
      })
    );
  };

  const handleExpenseCreated = (newExpense: ExpenseRecord) => {
    setExpenses((prev) => [newExpense, ...prev]);

    // Update campaign spent total and line item spent
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === newExpense.campaignId) {
          const updatedLineItems = c.lineItems.map((item) => {
            if (item.id === newExpense.lineItemId) {
              return {
                ...item,
                spentAmount: item.spentAmount + newExpense.amount,
              };
            }
            return item;
          });

          return {
            ...c,
            totalSpent: c.totalSpent + newExpense.amount,
            lineItems: updatedLineItems,
          };
        }
        return c;
      })
    );
  };

  return (
    <WalletProvider isMainnet={isMainnet}>
      <div className="min-h-screen flex flex-col selection:bg-emerald-500 selection:text-slate-950">
        {/* Navigation */}
      <Navbar
        activeSection={activeSection}
        onNavigate={(sec) => setActiveSection(sec)}
        isMainnet={isMainnet}
        setIsMainnet={setIsMainnet}
      />

      {/* Hero Header */}
      <Hero
        onExplore={() => setActiveSection("campaigns")}
        onOpenVerifier={() => setActiveSection("expenses")}
        onOpenFraudEngine={() => setActiveSection("fraud-demo")}
        totalRaised={totalRaised}
        totalSpent={totalSpent}
      />

      {/* Main Content Sections */}
      <main className="flex-1 pb-20">
        {activeSection === "campaigns" && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>On-Chain Verified Relief Drives</span>
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  Active Emergency Relief Campaigns
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Each campaign publishes fixed line-item budgets hashed on MST Blockchain.
                  Disbursements require dual-volunteer proof.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSection("expenses")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-200 border border-slate-700/80 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Submit / Audit Expense
                </button>
              </div>
            </div>

            {/* Campaign Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {campaigns.map((camp) => (
                <CampaignCard
                  key={camp.id}
                  campaign={camp}
                  onDonate={(c) => setSelectedDonationCampaign(c)}
                  onViewExpenses={() => setActiveSection("expenses")}
                />
              ))}
            </div>
          </section>
        )}

        {activeSection === "expenses" && (
          <div className="space-y-12">
            <ExpenseUpload
              campaigns={campaigns}
              existingExpenses={expenses}
              onExpenseCreated={handleExpenseCreated}
            />

            <ExpenseTimeline campaigns={campaigns} expenses={expenses} />
          </div>
        )}

        {activeSection === "fraud-demo" && <FraudDemo />}

        {activeSection === "verify" && (
          <section className="py-8">
            <ExpenseTimeline campaigns={campaigns} expenses={expenses} />
          </section>
        )}
      </main>

      {/* Donation Modal */}
      {selectedDonationCampaign && (
        <DonationModal
          campaign={selectedDonationCampaign}
          isOpen={!!selectedDonationCampaign}
          onClose={() => setSelectedDonationCampaign(null)}
          onDonationSuccess={handleDonationSuccess}
        />
      )}

      {/* Footer */}
      <footer className="glass-panel border-t border-white/10 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-base font-bold text-white">ChainRoute</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Verified Micro-Donations for Local Relief. Built by Team Blockers for MST
              Blockchain Buildathon 2.0.
            </p>
            <div className="text-[11px] text-slate-500">
              Contract is append-only: zero mutation or deletion of history.
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              MST Blockchain (Layer 1)
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={MST_TESTNET.blockExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <span>MST Testnet Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={MST_MAINNET.blockExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <span>MST Mainnet Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={MST_TESTNET.faucetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <span>Official Faucet (tMSTC)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Tools & Wallets
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={BRIDGEKEY_CONFIG.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <span>BridgeKey Official Wallet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={BRIDGEKEY_CONFIG.chromeExtension}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <span>BridgeKey Chrome Extension</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="font-mono text-slate-400">
                  Chain ID: 91562037 (Testnet)
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Evaluation & Docs
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveSection("fraud-demo")}
                  className="hover:text-emerald-400 text-left cursor-pointer"
                >
                  P5 Fraud Detection Simulator
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection("verify")}
                  className="hover:text-emerald-400 text-left cursor-pointer"
                >
                  SHA-256 On-Chain Verifier
                </button>
              </li>
              <li>
                <span className="text-slate-500">Built for Round 2 Buildathon MVP</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            ChainRoute • Team Blockers • MST Blockchain Buildathon 2.0 (Round 2 MVP)
          </div>
          <div className="flex items-center gap-4">
            <span>Non-custodial Ledger</span>
            <span>•</span>
            <span>Cryptographic Dual-Proof</span>
            <span>•</span>
            <span>Append-Only</span>
          </div>
        </div>
      </footer>
    </div>
  </WalletProvider>
);
}
