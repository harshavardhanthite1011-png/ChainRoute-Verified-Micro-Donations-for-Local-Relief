import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [signer] = await ethers.getSigners();
  if (!signer) {
    throw new Error("No signer found. Check PRIVATE_KEY in .env");
  }

  const networkInfo = await ethers.provider.getNetwork();
  console.log("==================================================");
  console.log("⚡ ChainRoute Testnet Transaction Runner");
  console.log(`Network: ${network.name} (Chain ID: ${networkInfo.chainId.toString()})`);
  console.log(`Signer:  ${signer.address}`);
  console.log("==================================================");

  // Load deployed contract address
  const deploymentFile = path.resolve(__dirname, `../deployments/${network.name}.json`);
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found at ${deploymentFile}. Run deploy script first.`);
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  const contractAddress = deploymentData.contractAddress;
  console.log(`Target Contract: ${contractAddress}`);

  const ledger = await ethers.getContractAt("ChainRouteLedger", contractAddress, signer);

  // 1. Transaction 1: Create Campaign
  console.log("\n[1/3] Executing createCampaign...");
  const budgetData = "Line Items: Rice (500kg, ₹15,000), First-Aid Medicine (100 kits, ₹20,000), Transport (₹5,000)";
  const budgetHash = ethers.keccak256(ethers.toUtf8Bytes(budgetData));
  const goal = 40000;
  const itemsCount = 3;

  const tx1 = await ledger.createCampaign(budgetHash, goal, itemsCount);
  console.log(`Tx 1 Sent: ${tx1.hash}`);
  const receipt1 = await tx1.wait();
  console.log(`Tx 1 Confirmed in block: ${receipt1?.blockNumber}`);

  const campaignId = await ledger.campaignCount();
  console.log(`Created Campaign ID: ${campaignId.toString()}`);

  // 2. Transaction 2: Record Donation
  console.log("\n[2/3] Executing recordDonation...");
  const donationReceiptData = `Receipt: Gateway-Txn-898234-Donor-Blockers-Amount-10000-Time-${Date.now()}`;
  const receiptHash = ethers.keccak256(ethers.toUtf8Bytes(donationReceiptData));
  const donationAmount = 10000;

  const tx2 = await ledger.recordDonation(campaignId, receiptHash, donationAmount);
  console.log(`Tx 2 Sent: ${tx2.hash}`);
  const receipt2 = await tx2.wait();
  console.log(`Tx 2 Confirmed in block: ${receipt2?.blockNumber}`);

  // 3. Transaction 3: Record Verified Expense
  console.log("\n[3/3] Executing recordExpense...");
  const lineItemId = 0; // Rice
  const expenseBundleData = `Bill: INV-2026-9921-Vendor-OmGrains-₹6000-DeliveryPhotoVerified-${Date.now()}`;
  const expenseHash = ethers.keccak256(ethers.toUtf8Bytes(expenseBundleData));
  const expenseAmount = 6000;

  const tx3 = await ledger.recordExpense(campaignId, lineItemId, expenseHash, expenseAmount);
  console.log(`Tx 3 Sent: ${tx3.hash}`);
  const receipt3 = await tx3.wait();
  console.log(`Tx 3 Confirmed in block: ${receipt3?.blockNumber}`);

  // Fetch updated totals
  const totals = await ledger.getCampaignTotals(campaignId);
  console.log("\n==================================================");
  console.log("📊 Final Verified Campaign On-Chain Totals:");
  console.log(`Goal:         ₹${totals.goal.toString()}`);
  console.log(`Total Raised: ₹${totals.totalRaised.toString()}`);
  console.log(`Total Spent:  ₹${totals.totalSpent.toString()}`);
  console.log(`Remaining:    ₹${totals.remaining.toString()}`);
  console.log("==================================================");

  const explorerBase = networkInfo.chainId === 91562037n 
    ? "https://testnet.mstscan.com/tx/" 
    : "https://mstscan.com/tx/";

  console.log("\n🔗 Transaction Explorer Links:");
  console.log(`1. createCampaign: ${explorerBase}${tx1.hash}`);
  console.log(`2. recordDonation: ${explorerBase}${tx2.hash}`);
  console.log(`3. recordExpense:  ${explorerBase}${tx3.hash}`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Execution error:", error);
  process.exitCode = 1;
});
