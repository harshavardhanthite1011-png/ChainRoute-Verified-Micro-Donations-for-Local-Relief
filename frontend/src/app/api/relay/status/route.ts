import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { MST_TESTNET } from "../../../../lib/constants";


export async function GET() {
  try {
    const isRelayDisabled = process.env.RELAY_DISABLED === "true";
    const privateKey = process.env.PRIVATE_KEY;

    if (isRelayDisabled || !privateKey) {
      return NextResponse.json({
        enabled: false,
        reason: isRelayDisabled ? "Relayer disabled by administrator" : "Relayer private key not configured",
      });
    }

    const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const wallet = new ethers.Wallet(formattedKey);

    let balanceFormatted = "0";
    try {
      const provider = new ethers.JsonRpcProvider(MST_TESTNET.rpcUrl, {
        chainId: MST_TESTNET.chainId,
        name: MST_TESTNET.name,
      });
      const balance = await provider.getBalance(wallet.address);
      balanceFormatted = ethers.formatEther(balance);
    } catch (err: any) {
      console.warn("Could not query relayer balance:", err?.message || err);
    }

    return NextResponse.json({
      enabled: true,
      relayerAddress: wallet.address,
      balance: balanceFormatted,
      network: MST_TESTNET.name,
      chainId: MST_TESTNET.chainId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { enabled: false, error: "Failed to evaluate relayer status" },
      { status: 500 }
    );
  }
}
