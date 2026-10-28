import { ethers } from "ethers";
import ABI from "../contracts/ChainRouteLedgerABI.json";
import { MST_TESTNET, MST_MAINNET } from "./constants";

export function getMstProvider(isMainnet = false) {
  const config = isMainnet ? MST_MAINNET : MST_TESTNET;
  return new ethers.JsonRpcProvider(config.rpcUrl, {
    chainId: config.chainId,
    name: config.name,
  });
}

export function getLedgerContract(
  contractAddress: string,
  runner?: ethers.ContractRunner
) {
  const provider = runner || getMstProvider(false);
  return new ethers.Contract(contractAddress, ABI, provider);
}

export async function requestBridgeKeyWallet() {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error(
      "No Web3 wallet found. Please install the BridgeKey Extension (https://bridgekey.io) or MetaMask."
    );
  }

  const ethereum = (window as any).ethereum;
  const accounts: string[] = await ethereum.request({
    method: "eth_requestAccounts",
  });

  const chainIdHex: string = await ethereum.request({
    method: "eth_chainId",
  });

  return {
    account: accounts[0],
    chainIdHex,
    ethereum,
  };
}

export async function switchOrAddMSTNetwork(isMainnet = false) {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No Web3 wallet injected.");
  }

  const ethereum = (window as any).ethereum;
  const target = isMainnet ? MST_MAINNET : MST_TESTNET;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: target.chainIdHex }],
    });
  } catch (switchError: any) {
    // 4902 code indicates chain is not yet added to wallet
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: target.chainIdHex,
            chainName: target.name,
            rpcUrls: [target.rpcUrl],
            nativeCurrency: {
              name: target.currencySymbol,
              symbol: target.currencySymbol,
              decimals: target.decimals,
            },
            blockExplorerUrls: [target.blockExplorerUrl],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

export async function readCampaignTotalsFromChain(
  contractAddress: string,
  campaignId: number,
  isMainnet = false
) {
  if (!contractAddress) return null;
  const contract = getLedgerContract(contractAddress, getMstProvider(isMainnet));
  try {
    const totals = await contract.getCampaignTotals(campaignId);
    return {
      totalRaised: Number(totals.totalRaised),
      totalSpent: Number(totals.totalSpent),
      remaining: Number(totals.remaining),
      goal: Number(totals.goal),
    };
  } catch (err) {
    console.warn("Could not read totals from chain:", err);
    return null;
  }
}
