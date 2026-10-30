import { ethers } from "hardhat";

async function main() {
  const relayerAddress = "0x7AdcbDF99843B20AAadC650b51C8547f3410Df8D";
  const amount = "1.0"; // 1 tMSTC

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
