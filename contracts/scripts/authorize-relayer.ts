import { ethers } from "hardhat";

async function main() {
  const args = process.argv.slice(2);
  const relayerAddress = process.env.TARGET_ACCOUNT || args[0] || "0x7AdcbDF99843B20AAadC650b51C8547f3410Df8D";

  if (!ethers.isAddress(relayerAddress)) {
    console.error("Invalid relayer address provided:", relayerAddress);
    process.exit(1);
  }

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET || "0x2B94E953B87ff4AA113350d8E3AEE335eAC80E45";
  console.log("==================================================");
  console.log("🔗 MST Testnet - Authorize Relayer Writer");
  console.log(`Target Contract: ${contractAddress}`);
  console.log(`Relayer Address: ${relayerAddress}`);
  console.log("==================================================");

  const [ownerSigner] = await ethers.getSigners();
  console.log(`Owner Account:   ${ownerSigner.address}`);

  const contract = await ethers.getContractAt("ChainRouteLedger", contractAddress, ownerSigner);

  const alreadyAuth = await contract.authorizedWriters(relayerAddress);
  if (alreadyAuth) {
    console.log(`✅ Relayer ${relayerAddress} is ALREADY authorized on contract.`);
    process.exit(0);
  }

  console.log(`Submitting setAuthorizedWriter(${relayerAddress}, true)...`);
  const tx = await contract.setAuthorizedWriter(relayerAddress, true);
  console.log(`Transaction broadcast: ${tx.hash}`);
  console.log("Awaiting on-chain confirmation...");

  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) {
    console.error(`❌ Transaction failed or reverted with status: ${receipt?.status}`);
    process.exit(1);
  }

  console.log("==================================================");
  console.log(`✅ SUCCESS! Relayer Authorized in Block #${receipt.blockNumber}`);
  console.log(`Gas Used:     ${receipt.gasUsed.toString()}`);
  console.log(`Tx Hash:      ${tx.hash}`);
  console.log(`Explorer:     https://testnet.mstscan.com/tx/${tx.hash}`);
  console.log("==================================================");

  const isAuth = await contract.authorizedWriters(relayerAddress);
  console.log(`On-Chain Verification - authorizedWriters(${relayerAddress}) = ${isAuth}`);
}

main().catch((err) => {
  console.error("Authorization script error:", err?.message || err);
  process.exit(1);
});
