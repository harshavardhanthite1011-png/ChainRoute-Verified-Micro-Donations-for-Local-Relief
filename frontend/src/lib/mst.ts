import { ethers } from "ethers";
import ABI from "../contracts/ChainRouteLedgerABI.json";
import { MST_TESTNET, MST_MAINNET } from "./constants";
import { walletManager, getMSTChainConfig } from "./wallet";

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

/**
 * Connects directly through the BridgeKey wallet extension via EIP-6963.
 * Eliminates generic window.ethereum routing to prevent MetaMask interception.
 */
export async function requestBridgeKeyWallet(isMainnet = false) {
  return walletManager.connectBridgeKey(isMainnet);
}

/**
 * Switches to or adds the MST network on the selected BridgeKey provider.
 */
export async function switchOrAddMSTNetwork(isMainnet = false) {
  const provider = await walletManager.getBridgeKeyProvider();
  if (!provider) {
    throw new Error("BridgeKey wallet extension is not active.");
  }
  return walletManager.switchOrAddNetwork(provider, isMainnet);
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
