import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer signer found. Please check PRIVATE_KEY in your .env");
  }

  const networkInfo = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("==================================================");
  console.log("🚀 Deploying ChainRouteLedger on MST Blockchain");
  console.log(`Network Name:  ${network.name}`);
  console.log(`Chain ID:      ${networkInfo.chainId.toString()}`);
  console.log(`Deployer:      ${deployer.address}`);
  console.log(`Balance:       ${ethers.formatEther(balance)} tokens`);
  console.log("==================================================");

  if (balance === 0n && network.name !== "hardhat") {
    console.error("❌ ERROR: Deployer wallet has 0 balance!");
    console.error("Please fund your wallet using the MST Faucet at https://faucet.mstblockchain.com");
    process.exit(1);
  }

  const LedgerFactory = await ethers.getContractFactory("ChainRouteLedger");
  const ledger = await LedgerFactory.deploy();
  await ledger.waitForDeployment();

  const contractAddress = await ledger.getAddress();
  const deployTx = ledger.deploymentTransaction();
  const txHash = deployTx ? deployTx.hash : "N/A";

  console.log("==================================================");
  console.log("✅ Contract Deployed Successfully!");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Transaction Hash: ${txHash}`);
  
  let explorerUrl = "";
  if (networkInfo.chainId === 91562037n) {
    explorerUrl = `https://testnet.mstscan.com/address/${contractAddress}`;
    console.log(`Testnet Explorer: ${explorerUrl}`);
  } else if (networkInfo.chainId === 4646n) {
    explorerUrl = `https://mstscan.com/address/${contractAddress}`;
    console.log(`Mainnet Explorer: ${explorerUrl}`);
  }
  console.log("==================================================");

  // Record deployment into JSON artifact
  const deploymentsDir = path.resolve(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentData = {
    network: network.name,
    chainId: networkInfo.chainId.toString(),
    contractAddress,
    deployer: deployer.address,
    transactionHash: txHash,
    explorerUrl,
    deployedAt: new Date().toISOString(),
  };

  const deploymentFilePath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentData, null, 2));
  console.log(`Saved deployment info to: ${deploymentFilePath}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
