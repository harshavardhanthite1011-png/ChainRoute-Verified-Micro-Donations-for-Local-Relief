import { ethers } from "ethers";

const NETWORKS: Record<string, { name: string; rpcUrl: string; chainId: number; explorer: string }> = {
  testnet: {
    name: "MST Testnet",
    rpcUrl: process.env.MST_TESTNET_RPC || "https://testnetrpc.mstblockchain.com",
    chainId: 91562037,
    explorer: "https://testnet.mstscan.com",
  },
  mainnet: {
    name: "MST Mainnet",
    rpcUrl: process.env.MST_MAINNET_RPC || "https://mariorpc.mstblockchain.com/",
    chainId: 4646,
    explorer: "https://mstscan.com",
  },
};

async function main() {
  const args = process.argv.slice(2);
  const txHash = args[0];
  const networkArg = (args[1] || "testnet").toLowerCase();

  if (!txHash) {
    console.error("Usage: npx ts-node scripts/verify-tx.ts <txHash> [testnet|mainnet]");
    process.exit(1);
  }

  const netConfig = NETWORKS[networkArg] || NETWORKS.testnet;

  console.log("==================================================");
  console.log("🔍 MST Blockchain Transaction Verifier");
  console.log(`Network:   ${netConfig.name} (Chain ID: ${netConfig.chainId})`);
  console.log(`RPC URL:   ${netConfig.rpcUrl}`);
  console.log(`Query Tx:  ${txHash}`);
  console.log("==================================================");

  const provider = new ethers.JsonRpcProvider(netConfig.rpcUrl, {
    chainId: netConfig.chainId,
    name: netConfig.name,
  });

  try {
    const tx = await provider.getTransaction(txHash);

    if (!tx) {
      console.log("❌ Transaction NOT FOUND on RPC node.");
      console.log(`Result: null (tx has never been broadcast, was dropped from mempool, or sent to a different network).`);
      console.log(`Explorer Link: ${netConfig.explorer}/tx/${txHash}`);
      process.exit(2);
    }

    console.log("✅ Transaction Found in Node Mempool/Block!");
    console.log(`From:         ${tx.from}`);
    console.log(`To:           ${tx.to || "Contract Creation"}`);
    console.log(`Value:        ${ethers.formatEther(tx.value)} tokens`);
    console.log(`Nonce:        ${tx.nonce}`);
    console.log(`Gas Limit:    ${tx.gasLimit.toString()}`);
    console.log(`Gas Price:    ${tx.gasPrice ? ethers.formatUnits(tx.gasPrice, "gwei") + " gwei" : "N/A"}`);

    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      console.log("\n⏳ Transaction is PENDING (not yet mined into a block).");
      process.exit(0);
    }

    console.log("\n==================================================");
    console.log(`Block Number: ${receipt.blockNumber}`);
    console.log(`Status:       ${receipt.status === 1 ? "✅ SUCCESS (status: 1)" : "❌ REVERTED (status: 0)"}`);
    console.log(`Gas Used:     ${receipt.gasUsed.toString()}`);
    if (receipt.contractAddress) {
      console.log(`Contract:     ${receipt.contractAddress}`);
    }
    console.log(`Explorer:     ${netConfig.explorer}/tx/${txHash}`);
    console.log("==================================================");
  } catch (err: any) {
    console.error("Verification failed with error:", err.message);
    process.exit(1);
  }
}

main();
