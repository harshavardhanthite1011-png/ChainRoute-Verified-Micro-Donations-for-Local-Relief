import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import ABI from "../../../contracts/ChainRouteLedgerABI.json";
import { MST_TESTNET, MST_MAINNET } from "../../../lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractAddress, campaignId, type, index, candidateHash, isMainnet } = body;

    if (!contractAddress) {
      return NextResponse.json(
        { success: false, error: "Contract address is required." },
        { status: 400 }
      );
    }

    const network = isMainnet ? MST_MAINNET : MST_TESTNET;
    const provider = new ethers.JsonRpcProvider(network.rpcUrl, {
      chainId: network.chainId,
      name: network.name,
    });

    const contract = new ethers.Contract(contractAddress, ABI, provider);

    let onChainHash = "";
    let matches = false;

    if (type === "expense") {
      const expenseEntry = await contract.getExpense(campaignId, index);
      onChainHash = expenseEntry.expenseHash;
      matches = onChainHash.toLowerCase() === (candidateHash || "").toLowerCase();
    } else if (type === "receipt") {
      const donationEntry = await contract.getDonation(campaignId, index);
      onChainHash = donationEntry.receiptHash;
      matches = onChainHash.toLowerCase() === (candidateHash || "").toLowerCase();
    } else {
      return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        matches,
        onChainHash,
        candidateHash,
        verifiedAt: new Date().toISOString(),
        network: network.name,
        explorerUrl: `${network.blockExplorerUrl}/address/${contractAddress}`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Verification query failed" },
      { status: 500 }
    );
  }
}
