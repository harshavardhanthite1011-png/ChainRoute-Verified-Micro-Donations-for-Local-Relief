"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { walletManager, getMSTChainConfig } from "./wallet";
import { CONTRACT_ADDRESS_TESTNET, MST_TESTNET } from "./constants";
import ABI from "../contracts/ChainRouteLedgerABI.json";

interface WalletContextType {
  account: string;
  chainId: string;
  isConnecting: boolean;
  isAuthorized: boolean;
  connect: (isMainnet?: boolean) => Promise<string | null>;
  disconnect: () => void;
  refreshAuthorization: () => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType>({
  account: "",
  chainId: "",
  isConnecting: false,
  isAuthorized: false,
  connect: async () => null,
  disconnect: () => {},
  refreshAuthorization: async () => false,
});

export function WalletProvider({ children, isMainnet = false }: { children: React.ReactNode; isMainnet?: boolean }) {
  const [account, setAccount] = useState<string>("");
  const [chainId, setChainId] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  const checkAuthorization = useCallback(async (address: string): Promise<boolean> => {
    if (!address || !ethers.isAddress(address)) {
      setIsAuthorized(false);
      return false;
    }

    try {
      const provider = new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl, {
        chainId: MST_TESTNET.chainId,
        name: MST_TESTNET.name,
      });
      const contract = new ethers.Contract(CONTRACT_ADDRESS_TESTNET, ABI, provider);

      const [owner, isWriter] = await Promise.all([
        contract.owner().catch(() => ""),
        contract.authorizedWriters(address).catch(() => false),
      ]);

      const auth = owner.toLowerCase() === address.toLowerCase() || isWriter === true;
      setIsAuthorized(auth);
      return auth;
    } catch (err) {
      console.warn("Could not query on-chain authorization for address:", address, err);
      setIsAuthorized(false);
      return false;
    }
  }, []);

  const refreshAuthorization = useCallback(async () => {
    return checkAuthorization(account);
  }, [account, checkAuthorization]);

  // Handle provider event callbacks
  useEffect(() => {
    walletManager.setCallbacks(
      (accounts) => {
        const nextAccount = accounts && accounts.length > 0 ? accounts[0] : "";
        setAccount(nextAccount);
        if (nextAccount) {
          checkAuthorization(nextAccount);
        } else {
          setIsAuthorized(false);
        }
      },
      (newChainId) => {
        setChainId(newChainId);
      }
    );

    // Auto reconnect on mount
    walletManager
      .autoReconnect(isMainnet)
      .then((res) => {
        if (res && res.account) {
          setAccount(res.account);
          setChainId(res.chainIdHex);
          checkAuthorization(res.account);
        }
      })
      .catch(() => {});
  }, [isMainnet, checkAuthorization]);

  const connect = async (mainnetMode = isMainnet) => {
    setIsConnecting(true);
    try {
      const res = await walletManager.connectBridgeKey(mainnetMode);
      setAccount(res.account);
      setChainId(res.chainIdHex);
      await checkAuthorization(res.account);
      return res.account;
    } catch (err: any) {
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount("");
    setChainId("");
    setIsAuthorized(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("chainroute_connected_rdns");
    }
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        isConnecting,
        isAuthorized,
        connect,
        disconnect,
        refreshAuthorization,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
