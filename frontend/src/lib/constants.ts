// MST Blockchain Network Definitions & App Constants
export const MST_TESTNET = {
  chainId: 91562037,
  chainIdHex: "0x5752035",
  name: "MST Testnet",
  rpcUrl: "https://testnetrpc.mstblockchain.com",
  currencySymbol: "tMSTC",
  decimals: 18,
  blockExplorerUrl: "https://testnet.mstscan.com",
  faucetUrl: "https://faucet.mstblockchain.com",
  faucetAltUrl: "https://faucet.masterstroke.academy",
};

export const MST_MAINNET = {
  chainId: 4646,
  chainIdHex: "0x1226",
  name: "MST Mainnet",
  rpcUrl: "https://mariorpc.mstblockchain.com/",
  currencySymbol: "MSTC",
  decimals: 18,
  blockExplorerUrl: "https://mstscan.com",
};

export const BRIDGEKEY_CONFIG = {
  name: "BridgeKey",
  website: "https://bridgekey.io",
  chromeExtension:
    "https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg",
};

// Contract address fallback
export const CONTRACT_ADDRESS_TESTNET =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET || "0x2B94E953B87ff4AA113350d8E3AEE335eAC80E45";
export const CONTRACT_ADDRESS_MAINNET =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET || "";

// P5 Approved Vendor Registry (For Automated Pre-Flight Fraud Verification)
export interface ApprovedVendor {
  id: string;
  name: string;
  gstin: string;
  category: "Grains & Food" | "Pharmaceuticals" | "Logistics" | "Shelter & Sanitation";
  accountNumberMasked: string;
  status: "ACTIVE" | "SUSPENDED";
}

export const APPROVED_VENDORS: ApprovedVendor[] = [
  {
    id: "VEND-001",
    name: "Kisan Agro Relief Supplies",
    gstin: "27AABCK1234F1Z5",
    category: "Grains & Food",
    accountNumberMasked: "•••• 4892",
    status: "ACTIVE",
  },
  {
    id: "VEND-002",
    name: "Sanjivani Lifecare Pharma",
    gstin: "27AAGCS9876Q1Z2",
    category: "Pharmaceuticals",
    accountNumberMasked: "•••• 9104",
    status: "ACTIVE",
  },
  {
    id: "VEND-003",
    name: "Garuda Quick Cargo & Logistics",
    gstin: "27AAACG5544P1Z8",
    category: "Logistics",
    accountNumberMasked: "•••• 3321",
    status: "ACTIVE",
  },
  {
    id: "VEND-004",
    name: "Aashray Shelter & Tarp Mills",
    gstin: "27AAZCA1122D1Z4",
    category: "Shelter & Sanitation",
    accountNumberMasked: "•••• 7712",
    status: "ACTIVE",
  },
];
