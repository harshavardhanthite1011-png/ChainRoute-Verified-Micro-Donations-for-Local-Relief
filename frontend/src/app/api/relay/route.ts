import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import ABI from "../../../contracts/ChainRouteLedgerABI.json";
import { MST_TESTNET, CONTRACT_ADDRESS_TESTNET } from "../../../lib/constants";

// -----------------------------------------------------------------------------
// Security Controls: Rate Limiting & Origin Verification
// -----------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_BODY_BYTES = 16 * 1024; // 16 KB

const HEX_BYTES32_REGEX = /^0x[0-9a-fA-F]{64}$/;
const ETH_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const ALLOWED_ACTIONS = ["createCampaign", "recordDonation", "recordExpense"] as const;
type AllowedAction = (typeof ALLOWED_ACTIONS)[number];

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  entry.count += 1;
  return true;
}

function verifyOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) {
    // Direct or server-to-server calls within same domain
    return true;
  }
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Origin and Host Check
    if (!verifyOrigin(req)) {
      return NextResponse.json(
        { success: false, error: "Cross-origin relay requests are forbidden" },
        { status: 403 }
      );
    }

    // 2. Per-IP Rate Limiting
    const clientIp = getClientIp(req);
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please try again later or use BridgeKey wallet directly." },
        { status: 429 }
      );
    }

    // 3. Payload Size Limit
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Payload exceeds size limit" },
        { status: 413 }
      );
    }

    // 4. Production Disabled Flag / Private Key Availability Check
    if (process.env.RELAY_DISABLED === "true") {
      return NextResponse.json(
        {
          success: false,
          error: "Server relayer is disabled. Please connect your BridgeKey browser wallet to sign directly on-chain.",
        },
        { status: 503 }
      );
    }

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Relayer private key is not configured. Please connect BridgeKey wallet to submit directly.",
        },
        { status: 400 }
      );
    }

    // 5. Parse and Validate Request Body
    const body = await req.json();
    const { action, contractAddress, payload } = body;

    if (!action || !ALLOWED_ACTIONS.includes(action as AllowedAction)) {
      return NextResponse.json(
        { success: false, error: "Invalid action specified" },
        { status: 400 }
      );
    }

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid payload" },
        { status: 400 }
      );
    }

    const targetContract = contractAddress || CONTRACT_ADDRESS_TESTNET;
    if (!targetContract || !ETH_ADDRESS_REGEX.test(targetContract)) {
      return NextResponse.json(
        { success: false, error: "Invalid contract address" },
        { status: 400 }
      );
    }

    // 6. Action-Specific Parameter Validation
    if (action === "createCampaign") {
      const { budgetHash, goal, itemsCount } = payload;
      if (!budgetHash || !HEX_BYTES32_REGEX.test(budgetHash)) {
        return NextResponse.json({ success: false, error: "Invalid budgetHash format (32-byte hex required)" }, { status: 400 });
      }
      if (typeof goal !== "number" || goal <= 0 || !Number.isSafeInteger(goal)) {
        return NextResponse.json({ success: false, error: "Invalid goal amount" }, { status: 400 });
      }
      if (typeof itemsCount !== "number" || itemsCount <= 0 || itemsCount > 100 || !Number.isSafeInteger(itemsCount)) {
        return NextResponse.json({ success: false, error: "Invalid itemsCount (must be integer between 1 and 100)" }, { status: 400 });
      }
    } else if (action === "recordDonation") {
      const { campaignId, receiptHash, amount } = payload;
      if (typeof campaignId !== "number" || campaignId < 1 || !Number.isSafeInteger(campaignId)) {
        return NextResponse.json({ success: false, error: "Invalid campaignId" }, { status: 400 });
      }
      if (!receiptHash || !HEX_BYTES32_REGEX.test(receiptHash)) {
        return NextResponse.json({ success: false, error: "Invalid receiptHash format (32-byte hex required)" }, { status: 400 });
      }
      if (typeof amount !== "number" || amount <= 0 || !Number.isSafeInteger(amount)) {
        return NextResponse.json({ success: false, error: "Invalid donation amount" }, { status: 400 });
      }
    } else if (action === "recordExpense") {
      const { campaignId, lineItemId, expenseHash, amount } = payload;
      if (typeof campaignId !== "number" || campaignId < 1 || !Number.isSafeInteger(campaignId)) {
        return NextResponse.json({ success: false, error: "Invalid campaignId" }, { status: 400 });
      }
      if (typeof lineItemId !== "number" || lineItemId < 0 || !Number.isSafeInteger(lineItemId)) {
        return NextResponse.json({ success: false, error: "Invalid lineItemId" }, { status: 400 });
      }
      if (!expenseHash || !HEX_BYTES32_REGEX.test(expenseHash)) {
        return NextResponse.json({ success: false, error: "Invalid expenseHash format (32-byte hex required)" }, { status: 400 });
      }
      if (typeof amount !== "number" || amount <= 0 || !Number.isSafeInteger(amount)) {
        return NextResponse.json({ success: false, error: "Invalid expense amount" }, { status: 400 });
      }
    }

    // 7. Connect to MST Blockchain RPC
    const provider = new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl, {
      chainId: MST_TESTNET.chainId,
      name: MST_TESTNET.name,
    });

    const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const wallet = new ethers.Wallet(formattedKey, provider);

    const balance = await provider.getBalance(wallet.address);
    const minRequiredGas = ethers.parseEther("0.005");
    if (balance < minRequiredGas) {
      return NextResponse.json(
        {
          success: false,
          error: `Relayer wallet balance (${ethers.formatEther(balance)} tMSTC) is insufficient for gas fees. Please fund relayer address ${wallet.address} with testnet tokens at ${MST_TESTNET.faucetUrl}`,
        },
        { status: 503 }
      );
    }

    const contract = new ethers.Contract(targetContract, ABI, wallet);
    let tx: ethers.ContractTransactionResponse;

    if (action === "createCampaign") {
      const { budgetHash, goal, itemsCount } = payload;
      tx = await contract.createCampaign(budgetHash, goal, itemsCount);
    } else if (action === "recordDonation") {
      const { campaignId, receiptHash, amount } = payload;
      tx = await contract.recordDonation(campaignId, receiptHash, amount);
    } else {
      const { campaignId, lineItemId, expenseHash, amount } = payload;
      tx = await contract.recordExpense(campaignId, lineItemId, expenseHash, amount);
    }

    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      data: {
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber,
        explorerUrl: `${MST_TESTNET.blockExplorerUrl}/tx/${tx.hash}`,
        signer: wallet.address,
      },
    });
  } catch (error: any) {
    // Log generic error message without exposing any sensitive details
    console.error("Relay transaction execution error:", error?.message || "Unknown error");
    return NextResponse.json(
      {
        success: false,
        error: "Failed to broadcast transaction on MST Blockchain. Please verify contract permissions or sign with BridgeKey.",
      },
      { status: 500 }
    );
  }
}
