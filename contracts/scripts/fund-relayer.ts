import { ethers } from "hardhat";

async function main() {
  const relayerAddress = process.env.TARGET_ACCOUNT || "0x882DeF92E1a9E7CB4c5d6A3Fbd7bF152E622Ad87";
  const amount = process.env.FUND_AMOUNT || "0.5"; // 0.5 tMSTC

  const [owner] = await ethers.getSigners();
  console.log(`Funding relayer ${relayerAddress} with ${amount} tMSTC from owner ${owner.address}...`);

  const tx = await owner.sendTransaction({
    to: relayerAddress,
    value: ethers.parseEther(amount),
  });

  console.log(`Funding transaction sent: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`Confirmed in block #${receipt?.blockNumber}`);

  const balance = await ethers.provider.getBalance(relayerAddress);
  console.log(`New Relayer Balance: ${ethers.formatEther(balance)} tMSTC`);
}

main().catch((err) => {
  console.error("Funding error:", err);
  process.exit(1);
});
