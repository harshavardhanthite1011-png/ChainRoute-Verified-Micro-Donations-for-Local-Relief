"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Wallet,
  ExternalLink,
  ChevronDown,
  Copy,
  Check,
  RefreshCw,
  Coins,
} from "lucide-react";
import {
  MST_TESTNET,
  MST_MAINNET,
  BRIDGEKEY_CONFIG,
} from "../lib/constants";
import { walletManager, getMSTChainConfig } from "../lib/wallet";

interface NavbarProps {
  onNavigate?: (section: string) => void;
  activeSection?: string;
  isMainnet?: boolean;
  setIsMainnet?: (val: boolean) => void;
}

export function Navbar({
  onNavigate,
  activeSection = "campaigns",
  isMainnet = false,
  setIsMainnet,
}: NavbarProps) {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<string>("");
  const [installPrompt, setInstallPrompt] = useState<boolean>(false);

  useEffect(() => {
    // Setup provider change callbacks
    walletManager.setCallbacks(
      (accounts) => {
        setWalletAddress(accounts && accounts.length > 0 ? accounts[0] : "");
      },
      (chainId) => {
        setCurrentChainId(chainId);
      }
    );

    // Silent auto-reconnect if BridgeKey was previously connected
    walletManager
      .autoReconnect(isMainnet)
      .then((res) => {
        if (res) {
          setWalletAddress(res.account);
          setCurrentChainId(res.chainIdHex);
        }
      })
      .catch(() => {});
  }, [isMainnet]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setInstallPrompt(false);
    try {
      const res = await walletManager.connectBridgeKey(isMainnet);
      setWalletAddress(res.account);
      setCurrentChainId(res.chainIdHex);
    } catch (err: any) {
      if (err.message === "BRIDGEKEY_NOT_INSTALLED") {
        setInstallPrompt(true);
      } else if (err.code === 4001) {
        // User rejected the connection request in popup
        console.log("User rejected connection request.");
      } else {
        alert(err.message || "Failed to connect to BridgeKey.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeNetwork = getMSTChainConfig(isMainnet);
  const isRightChain =
    currentChainId.toLowerCase() === activeNetwork.chainIdHex.toLowerCase();

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate?.("campaigns")}
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-400/40 transition-all">
            <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                ChainRoute
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MST Layer 1
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Verified Micro-Donations for Local Relief
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { id: "campaigns", label: "Relief Campaigns" },
            { id: "expenses", label: "Dual-Proof Expenses" },
            { id: "fraud-demo", label: "P5 Fraud Engine" },
            { id: "verify", label: "On-Chain Verifier" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                activeSection === item.id
                  ? "bg-white/10 text-white shadow-sm border border-white/10"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Action: Network & Wallet */}
        <div className="flex items-center gap-3">
          {/* Faucet Link */}
          <a
            href={MST_TESTNET.faucetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
            title="Claim free testnet MSTC coins from official faucet"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Faucet</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Network Badge & Switcher */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 border border-slate-700/60 shadow-inner">
            <span
              className={`w-2 h-2 rounded-full ${
                isRightChain
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-amber-400 animate-bounce"
              }`}
            />
            <span className="text-slate-200">{activeNetwork.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({activeNetwork.chainId})
            </span>
          </div>

          {/* Connect / Wallet button */}
          {walletAddress ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-emerald-500/30 text-xs text-slate-200">
              <span className="font-mono text-emerald-400 font-medium">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 hover:text-white transition-colors cursor-pointer"
                title="Copy Address"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </div>
          ) : installPrompt ? (
            <a
              href={BRIDGEKEY_CONFIG.chromeExtension}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Install BridgeKey</span>
            </a>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              <span>Connect with BridgeKey</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
