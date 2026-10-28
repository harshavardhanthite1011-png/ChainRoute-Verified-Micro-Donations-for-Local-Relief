"use client";

import React, { useState } from "react";
import {
  MapPin,
  CheckCircle,
  Copy,
  Check,
  HeartHandshake,
  TrendingUp,
  FileText,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { CampaignData } from "../lib/store";
import { MST_TESTNET } from "../lib/constants";

interface CampaignCardProps {
  campaign: CampaignData;
  onDonate: (campaign: CampaignData) => void;
  onViewExpenses: (campaign: CampaignData) => void;
}

export function CampaignCard({
  campaign,
  onDonate,
  onViewExpenses,
}: CampaignCardProps) {
  const [copied, setCopied] = useState(false);

  const percentRaised = Math.min(
    100,
    Math.round((campaign.totalRaised / campaign.goal) * 100)
  );
  const percentSpent = Math.min(
    100,
    Math.round((campaign.totalSpent / campaign.goal) * 100)
  );

  const handleCopyHash = () => {
    navigator.clipboard.writeText(campaign.budgetHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between group">
      {/* Top Image & Category */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-slate-950 shadow-md">
            {campaign.category}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-900/80 text-slate-200 border border-white/10 flex items-center gap-1 backdrop-blur-md">
            <MapPin className="w-3 h-3 text-emerald-400" />
            {campaign.location}
          </span>
        </div>

        {campaign.organizerKycVerified && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 backdrop-blur-md">
            <CheckCircle className="w-3 h-3 text-cyan-400" />
            <span>KYC Verified Organizer</span>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
            {campaign.title}
          </h3>
          <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {campaign.description}
          </p>

          {/* Organizer Info */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span className="truncate max-w-[200px]">By {campaign.organizerName}</span>
            <span className="font-mono text-slate-500">{campaign.organizerPhoneMasked}</span>
          </div>

          {/* Financial Progress Bars */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-300 font-medium">Raised:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                ₹{campaign.totalRaised.toLocaleString("en-IN")}{" "}
                <span className="text-slate-400 text-xs font-normal">
                  / ₹{campaign.goal.toLocaleString("en-IN")}
                </span>
              </span>
            </div>

            {/* Double Bar: Raised (Emerald) and Spent (Cyan) */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden relative border border-white/5">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 absolute top-0 left-0"
                style={{ width: `${percentRaised}%` }}
              />
              <div
                className="bg-cyan-400/90 h-full rounded-full transition-all duration-500 absolute top-0 left-0 opacity-80"
                style={{ width: `${percentSpent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Raised ({percentRaised}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                <span>Spent Disbursed ({percentSpent}%)</span>
              </div>
              <div className="text-amber-300 font-medium">
                Remaining: ₹{(campaign.totalRaised - campaign.totalSpent).toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Line Item Allocations */}
          <div className="mt-5 bg-slate-900/60 rounded-xl p-3 border border-white/5 space-y-2">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Fixed Line-Item Budget Allocation:
            </div>
            {campaign.lineItems.map((item) => (
              <div
                key={item.id}
                className="text-xs flex items-center justify-between py-1 border-b border-white/5 last:border-0"
              >
                <div className="truncate pr-2">
                  <span className="text-slate-200 font-medium">{item.name}</span>
                  <span className="text-slate-500 text-[10px] block">
                    Target: {item.quantity}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-slate-200 font-mono text-xs">
                    ₹{item.spentAmount.toLocaleString("en-IN")} / ₹{item.allocatedAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* On-Chain Budget Hash */}
          <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/60 border border-white/5 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-emerald-400 font-medium">Budget SHA-256:</span>
              <span className="truncate max-w-[150px]">{campaign.budgetHash}</span>
            </div>
            <button
              onClick={handleCopyHash}
              className="p-1 hover:text-white transition-colors cursor-pointer"
              title="Copy Budget Hash"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => onDonate(campaign)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Donate Now</span>
          </button>

          <button
            onClick={() => onViewExpenses(campaign)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Audit Expenses</span>
          </button>
        </div>
      </div>
    </div>
  );
}
