import { ethers } from "hardhat";

async function main() {
  const args = process.argv.slice(2);
  const relayerAddress = args[0];

  if (!relayerAddress || !ethers.isAddress(relayerAddress)) {
    console.error("Usage: npx hardhat run scripts/authorize-writer.ts --network mstTestnet <relayerAddress>");
    process.exit(1);
  }

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET || "0x2B94E953B87ff4AA113350d8E3AEE335eAC80E45";
  console.log(`Authorizing relayer: ${relayerAddress} on contract ${contractAddress}`);

  const [signer] = await ethers.getSigners();
  console.log(`Executing from owner account: ${signer.address}`);

  const contract = await ethers.getContractAt("ChainRouteLedger", contractAddress);
  const tx = await contract.setAuthorizedWriter(relayerAddress, true);
  console.log(`Submitted tx: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`Confirmed in block: ${receipt?.blockNumber}`);

  const isAuth = await contract.authorizedWriters(relayerAddress);
  console.log(`Verification - Is ${relayerAddress} authorized writer? ${isAuth}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
