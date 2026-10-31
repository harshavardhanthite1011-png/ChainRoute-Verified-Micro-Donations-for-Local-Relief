import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET || "0x2B94E953B87ff4AA113350d8E3AEE335eAC80E45";
  const [owner] = await ethers.getSigners();
  const contract = await ethers.getContractAt("ChainRouteLedger", contractAddress, owner);

  const count = await contract.campaignCount();
  console.log(`Current on-chain campaign count: ${count}`);

  if (count < 2n) {
    console.log("Creating Campaign 2: Assam Flood Response...");
    const budgetHash = "0x39a16fbd918ce20d41908bfcf2f20150d32e54148c772db5a7c29359e1903e1a";
    const goal = 350000;
    const itemsCount = 3;

    const tx = await contract.createCampaign(budgetHash, goal, itemsCount);
    console.log(`Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Campaign 2 created in block #${receipt?.blockNumber}!`);
  } else {
    console.log("Campaign 2 already exists on-chain.");
  }

  const finalCount = await contract.campaignCount();
  console.log(`Updated campaign count: ${finalCount}`);
}

main().catch((err) => {
  console.error("Failed to create seed campaign:", err);
  process.exit(1);
});
