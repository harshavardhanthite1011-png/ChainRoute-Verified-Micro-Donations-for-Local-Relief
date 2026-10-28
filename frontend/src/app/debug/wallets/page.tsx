"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Wallet,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";

interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  providerFlags: Record<string, any>;
}

export default function DebugWalletsPage() {
  const [announcedProviders, setAnnouncedProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [windowEthereumInfo, setWindowEthereumInfo] = useState<any>(null);
  const [globalFlags, setGlobalFlags] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [testConnectLog, setTestConnectLog] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const scanWallets = () => {
    if (typeof window === "undefined") return;

    // 1. Scan window globals
    const globals: Record<string, any> = {};
    const candidateGlobals = [
      "ethereum",
      "bridgekey",
      "bridgeKey",
      "BridgeKey",
      "mst",
      "mstc",
      "web3",
    ];

    candidateGlobals.forEach((key) => {
      const val = (window as any)[key];
      globals[key] = {
        present: typeof val !== "undefined",
        type: typeof val,
        isObject: typeof val === "object" && val !== null,
        keys: typeof val === "object" && val !== null ? Object.keys(val).slice(0, 20) : [],
      };
    });
    setGlobalFlags(globals);

    // 2. Scan window.ethereum and providers array
    const eth = (window as any).ethereum;
    if (eth) {
      const flags: Record<string, any> = {};
      // Check typical EIP-1193 boolean flags
      Object.keys(eth).forEach((k) => {
        if (k.startsWith("is") || typeof eth[k] === "boolean") {
          flags[k] = eth[k];
        }
      });

      // Check providers array
      let providersSummary: any[] = [];
      if (Array.isArray(eth.providers)) {
        providersSummary = eth.providers.map((p: any, idx: number) => {
          const pFlags: Record<string, any> = {};
          Object.keys(p || {}).forEach((k) => {
            if (k.startsWith("is") || typeof p[k] === "boolean") {
              pFlags[k] = p[k];
            }
          });
          return {
            index: idx,
            flags: pFlags,
            keys: Object.keys(p || {}).slice(0, 15),
            constructorName: p?.constructor?.name,
          };
        });
      }

      setWindowEthereumInfo({
        present: true,
        flags,
        hasProvidersArray: Array.isArray(eth.providers),
        providersCount: Array.isArray(eth.providers) ? eth.providers.length : 0,
        providers: providersSummary,
        allKeys: Object.keys(eth),
      });
    } else {
      setWindowEthereumInfo({ present: false });
    }

    // 3. EIP-6963 listener
    const providersMap = new Map<string, EIP6963ProviderDetail>();

    const handleAnnounce = (event: any) => {
      if (!event.detail || !event.detail.info) return;
      const { info, provider } = event.detail;

      const pFlags: Record<string, any> = {};
      if (provider) {
        Object.keys(provider).forEach((k) => {
          if (k.startsWith("is") || typeof provider[k] === "boolean") {
            pFlags[k] = provider[k];
          }
        });
      }

      providersMap.set(info.uuid || info.rdns || info.name, {
        info: {
          uuid: info.uuid,
          name: info.name,
          icon: info.icon,
          rdns: info.rdns,
        },
        providerFlags: pFlags,
      });

      setAnnouncedProviders(Array.from(providersMap.values()));
    };

    window.addEventListener("eip6963:announceProvider", handleAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider", handleAnnounce);
    };
  };

  useEffect(() => {
    const cleanup = scanWallets();
    // Dispatch request again after small delay in case extensions injected late
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("eip6963:requestProvider"));
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, []);

  const fullDiagnosticPayload = {
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
    eip6963AnnouncedProviders: announcedProviders,
    windowEthereum: windowEthereumInfo,
    globals: globalFlags,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(fullDiagnosticPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testConnectRaw = async (providerName: string, providerObj: any) => {
    setIsConnecting(true);
    setTestConnectLog(`Calling eth_requestAccounts on [${providerName}]...`);
    try {
      const accounts = await providerObj.request({ method: "eth_requestAccounts" });
      const chainId = await providerObj.request({ method: "eth_chainId" });
      setTestConnectLog(
        `SUCCESS with [${providerName}]!\nConnected Accounts: ${JSON.stringify(
          accounts
        )}\nChain ID: ${chainId} (decimal: ${parseInt(chainId, 16)})`
      );
    } catch (err: any) {
      setTestConnectLog(
        `ERROR with [${providerName}]:\nCode: ${err.code}\nMessage: ${err.message}`
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 p-6 sm:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Diagnostic Tool • EIP-6963 & Injected Discovery</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Wallet Provider Inspector (`/debug/wallets`)
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Inspects BridgeKey vs. MetaMask announcement, RDNS, flags, and providers array.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={scanWallets}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 border border-white/10 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-scan</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Copied Diagnostics JSON!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-950" />
                  <span>Copy Diagnostic JSON</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 1: EIP-6963 Announced Providers */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>1. EIP-6963 Announced Providers (`eip6963:announceProvider`)</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Found: {announcedProviders.length}
            </span>
          </div>

          {announcedProviders.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-900/50 border border-dashed border-white/10 text-center text-xs text-slate-400">
              No providers responded to `eip6963:requestProvider` yet. (Make sure BridgeKey / MetaMask extension is active).
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcedProviders.map((p, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/80 p-4 rounded-xl border border-white/10 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {p.info.icon ? (
                      <img
                        src={p.info.icon}
                        alt={p.info.name}
                        className="w-10 h-10 rounded-lg p-1 bg-slate-950 border border-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        W
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-white">{p.info.name}</h3>
                      <div className="text-[11px] font-mono text-emerald-400">
                        RDNS: {p.info.rdns || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-300 space-y-1 bg-slate-950/70 p-3 rounded-lg border border-white/5">
                    <div>
                      <span className="text-slate-500">UUID:</span> {p.info.uuid}
                    </div>
                    <div>
                      <span className="text-slate-500">Flags:</span>{" "}
                      {JSON.stringify(p.providerFlags)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: window.ethereum & providers[] */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-400" />
              <span>2. Injected `window.ethereum` & `providers[]` Inspection</span>
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                windowEthereumInfo?.present
                  ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                  : "bg-red-500/10 text-red-300 border border-red-500/20"
              }`}
            >
              {windowEthereumInfo?.present ? "Injected (Active)" : "Not Found"}
            </span>
          </div>

          {windowEthereumInfo && (
            <div className="space-y-4 text-xs font-mono">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-white/10 space-y-2">
                <div className="text-slate-400 font-bold uppercase text-[10px]">
                  Root `window.ethereum` Boolean Flags:
                </div>
                <div className="text-emerald-300 break-all">
                  {JSON.stringify(windowEthereumInfo.flags, null, 2)}
                </div>
              </div>

              {windowEthereumInfo.hasProvidersArray ? (
                <div className="bg-slate-900/80 p-4 rounded-xl border border-white/10 space-y-3">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">
                    `window.ethereum.providers` array ({windowEthereumInfo.providersCount} entries):
                  </div>
                  {windowEthereumInfo.providers.map((p: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-950 p-3 rounded-lg border border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300">Provider #{idx}</span>
                        <button
                          onClick={() => {
                            const eth = (window as any).ethereum;
                            if (eth && eth.providers && eth.providers[idx]) {
                              testConnectRaw(`providers[${idx}]`, eth.providers[idx]);
                            }
                          }}
                          className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[10px] font-sans font-semibold cursor-pointer"
                        >
                          Test Connect #{idx}
                        </button>
                      </div>
                      <div className="text-slate-300">
                        <span className="text-slate-500">Flags:</span>{" "}
                        {JSON.stringify(p.flags)}
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        <span className="text-slate-500">Keys:</span> {p.keys.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5 text-slate-400">
                  `window.ethereum.providers` array is NOT present (single injected provider object).
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Global Window Namespaces */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>3. Global Window Namespaces (`window.bridgekey`, etc.)</span>
          </h2>
          <pre className="p-4 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono text-amber-300 overflow-x-auto">
            {JSON.stringify(globalFlags, null, 2)}
          </pre>
        </div>

        {/* Section 4: Live Test Output Log */}
        {testConnectLog && (
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 space-y-2">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Test Connection Output:
            </h3>
            <pre className="p-4 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-slate-200 whitespace-pre-wrap">
              {testConnectLog}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
