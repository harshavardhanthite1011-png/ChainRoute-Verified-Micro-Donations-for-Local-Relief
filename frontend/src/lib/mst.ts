import { ethers } from "ethers";
import Artifact from "../contracts/ChainRouteLedgerArtifact.json";
import { MST_TESTNET, MST_MAINNET } from "./constants";
import { walletManager, getMSTChainConfig } from "./wallet";

export function getContractAddress(isMainnet = false): string {
  if (typeof window !== "undefined") {
    const storageKey = isMainnet
      ? "chainroute_contract_mainnet"
      : "chainroute_contract_testnet";
    const stored = localStorage.getItem(storageKey);
    if (stored && stored.startsWith("0x") && stored.length === 42) {
      return stored;
    }
  }
  return isMainnet
    ? process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET || ""
    : process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET || "";
}

export function setContractAddress(address: string, isMainnet = false) {
  if (typeof window !== "undefined") {
    const storageKey = isMainnet
      ? "chainroute_contract_mainnet"
      : "chainroute_contract_testnet";
    localStorage.setItem(storageKey, address);
  }
}

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
  return new ethers.Contract(contractAddress, Artifact.abi, provider);
}

/**
 * Deploys the ChainRouteLedger contract directly from the connected BridgeKey wallet.
 */
export async function deployLedgerViaBridgeKey(isMainnet = false): Promise<{
  contractAddress: string;
  txHash: string;
  blockNumber: number;
}> {
  const targetConfig = getMSTChainConfig(isMainnet);
  const provider = await walletManager.getBridgeKeyProvider();
  if (!provider) {
    throw new Error("BridgeKey wallet extension is not active.");
  }

  const currentChainIdHex = await provider.request({ method: "eth_chainId" });
  if (currentChainIdHex.toLowerCase() !== targetConfig.chainIdHex.toLowerCase()) {
    await walletManager.switchOrAddNetwork(provider, isMainnet);
  }

  const signer = await walletManager.getBrowserSigner(provider);
  const factory = new ethers.ContractFactory(Artifact.abi, Artifact.bytecode, signer);

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  const txHash = deployTx ? deployTx.hash : "";

  const receipt = await deployTx?.wait();

  // Persist locally
  setContractAddress(contractAddress, isMainnet);

  return {
    contractAddress,
    txHash,
    blockNumber: receipt?.blockNumber || 0,
  };
}

/**
 * Record a verified donation directly through the user's BridgeKey wallet.
 */
export async function recordDonationViaBridgeKey(
  contractAddress: string,
  campaignId: number,
  receiptHash: string,
  amount: number,
  isMainnet = false,
  onStatusChange?: (status: "AWAITING_APPROVAL" | "SUBMITTED" | "CONFIRMING" | "CONFIRMED", data?: any) => void
): Promise<{
  txHash: string;
  blockNumber: number;
  explorerUrl: string;
}> {
  const targetConfig = getMSTChainConfig(isMainnet);
  const provider = await walletManager.getBridgeKeyProvider();
  if (!provider) {
    throw new Error("BridgeKey wallet extension is not active. Please install BridgeKey.");
  }

  const currentChainIdHex = await provider.request({ method: "eth_chainId" });
  if (currentChainIdHex.toLowerCase() !== targetConfig.chainIdHex.toLowerCase()) {
    await walletManager.switchOrAddNetwork(provider, isMainnet);
  }

  const signer = await walletManager.getBrowserSigner(provider);
  const contract = new ethers.Contract(contractAddress, Artifact.abi, signer);

  onStatusChange?.("AWAITING_APPROVAL");

  const tx = await contract.recordDonation(campaignId, receiptHash, amount);

  onStatusChange?.("SUBMITTED", { txHash: tx.hash });
  onStatusChange?.("CONFIRMING", { txHash: tx.hash });

  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error(`Transaction reverted on-chain. Status: ${receipt?.status}`);
  }

  const explorerUrl = `${targetConfig.blockExplorerUrl}/tx/${tx.hash}`;
  onStatusChange?.("CONFIRMED", {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    explorerUrl,
  });

  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    explorerUrl,
  };
}

/**
 * Record a verified expense directly through the user's BridgeKey wallet.
 */
export async function recordExpenseViaBridgeKey(
  contractAddress: string,
  campaignId: number,
  lineItemId: number,
  expenseHash: string,
  amount: number,
  isMainnet = false,
  onStatusChange?: (status: "AWAITING_APPROVAL" | "SUBMITTED" | "CONFIRMING" | "CONFIRMED", data?: any) => void
): Promise<{
  txHash: string;
  blockNumber: number;
  explorerUrl: string;
}> {
  const targetConfig = getMSTChainConfig(isMainnet);
  const provider = await walletManager.getBridgeKeyProvider();
  if (!provider) {
    throw new Error("BridgeKey wallet extension is not active. Please install BridgeKey.");
  }

  const currentChainIdHex = await provider.request({ method: "eth_chainId" });
  if (currentChainIdHex.toLowerCase() !== targetConfig.chainIdHex.toLowerCase()) {
    await walletManager.switchOrAddNetwork(provider, isMainnet);
  }

  const signer = await walletManager.getBrowserSigner(provider);
  const contract = new ethers.Contract(contractAddress, Artifact.abi, signer);

  onStatusChange?.("AWAITING_APPROVAL");

  const tx = await contract.recordExpense(campaignId, lineItemId, expenseHash, amount);

  onStatusChange?.("SUBMITTED", { txHash: tx.hash });
  onStatusChange?.("CONFIRMING", { txHash: tx.hash });

  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error(`Transaction reverted on-chain. Status: ${receipt?.status}`);
  }

  const explorerUrl = `${targetConfig.blockExplorerUrl}/tx/${tx.hash}`;
  onStatusChange?.("CONFIRMED", {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    explorerUrl,
  });

  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    explorerUrl,
  };
}

/**
 * Reads campaign totals directly from the MST Blockchain node.
 */
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
