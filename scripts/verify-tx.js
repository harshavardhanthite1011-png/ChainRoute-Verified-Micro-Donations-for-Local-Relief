#!/usr/bin/env node

/**
 * CLI Tool to verify any transaction on MST Blockchain (Testnet or Mainnet)
 * Usage: node scripts/verify-tx.js <txHash> [testnet|mainnet]
 */

const https = require("https");
const http = require("http");

const NETWORKS = {
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

function rpcCall(url, method, params) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: Date.now(),
    });

    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === "https:" ? https : http;

    const req = lib.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.error) {
              reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
            } else {
              resolve(parsed.result);
            }
          } catch (e) {
            reject(new Error("Invalid JSON RPC response: " + body));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  const txHash = args[0];
  const networkArg = (args[1] || "testnet").toLowerCase();

  if (!txHash) {
    console.error("Usage: node scripts/verify-tx.js <txHash> [testnet|mainnet]");
    process.exit(1);
  }

  const net = NETWORKS[networkArg] || NETWORKS.testnet;

  console.log("==================================================");
  console.log("🔍 MST Blockchain Transaction Verifier");
  console.log(`Network:   ${net.name} (Chain ID: ${net.chainId})`);
  console.log(`RPC URL:   ${net.rpcUrl}`);
  console.log(`Query Tx:  ${txHash}`);
  console.log("==================================================");

  try {
    const tx = await rpcCall(net.rpcUrl, "eth_getTransactionByHash", [txHash]);

    if (!tx) {
      console.log("❌ Transaction NOT FOUND on RPC node.");
      console.log("Result: null");
      console.log("Reason: Transaction was never broadcast, was dropped, or sent to a different chain.");
      console.log(`Explorer Link: ${net.explorer}/tx/${txHash}`);
      process.exit(2);
    }

    console.log("✅ Transaction Found on RPC Node!");
    console.log(`From:         ${tx.from}`);
    console.log(`To:           ${tx.to || "[Contract Creation]"}`);
    console.log(`Value (Wei):  ${BigInt(tx.value || "0x0").toString()}`);
    console.log(`Nonce:        ${parseInt(tx.nonce, 16)}`);
    console.log(`Gas Limit:    ${parseInt(tx.gas, 16)}`);
    console.log(`Gas Price:    ${parseInt(tx.gasPrice || "0x0", 16)} wei`);

    const receipt = await rpcCall(net.rpcUrl, "eth_getTransactionReceipt", [txHash]);

    if (!receipt) {
      console.log("\n⏳ Status: PENDING (In mempool, not yet mined into a block)");
      process.exit(0);
    }

    const statusInt = parseInt(receipt.status, 16);
    console.log("\n==================================================");
    console.log(`Block Number: ${parseInt(receipt.blockNumber, 16)}`);
    console.log(`Status:       ${statusInt === 1 ? "✅ SUCCESS (status: 1)" : "❌ REVERTED (status: 0)"}`);
    console.log(`Gas Used:     ${parseInt(receipt.gasUsed, 16)}`);
    if (receipt.contractAddress) {
      console.log(`Contract:     ${receipt.contractAddress}`);
    }
    console.log(`Explorer URL: ${net.explorer}/tx/${txHash}`);
    console.log("==================================================");
  } catch (err) {
    console.error("RPC Error:", err.message);
    process.exit(1);
  }
}

main();
