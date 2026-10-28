import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import ABI from "../../../contracts/ChainRouteLedgerABI.json";
import { MST_TESTNET } from "../../../lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, contractAddress, payload } = body;

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        {
          success: false,
          error: "PRIVATE_KEY is not configured in backend .env. Please connect via BridgeKey wallet or set PRIVATE_KEY.",
        },
        { status: 400 }
      );
    }

    const targetContract = contractAddress || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET;
    if (!targetContract) {
      return NextResponse.json(
        {
          success: false,
          error: "No contract address specified. Deploy contract on MST Testnet first.",
        },
        { status: 400 }
      );
    }

    const provider = new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl, {
      chainId: MST_TESTNET.chainId,
      name: MST_TESTNET.name,
    });

    const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const wallet = new ethers.Wallet(formattedKey, provider);

    const balance = await provider.getBalance(wallet.address);
    if (balance === BigInt(0)) {
      return NextResponse.json(
        {
          success: false,
          error: `Relayer wallet ${wallet.address} has 0 tMSTC balance! Fund it at ${MST_TESTNET.faucetUrl}`,
        },
        { status: 400 }
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
    } else if (action === "recordExpense") {
      const { campaignId, lineItemId, expenseHash, amount } = payload;
      tx = await contract.recordExpense(campaignId, lineItemId, expenseHash, amount);
    } else {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
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
    console.error("Relay error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to relay transaction to MST Blockchain",
      },
      { status: 500 }
    );
  }
}
