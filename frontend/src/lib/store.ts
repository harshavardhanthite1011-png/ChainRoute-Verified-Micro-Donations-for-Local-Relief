export interface LineItem {
  id: number;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  quantity: string;
}

export interface DonationRecord {
  id: string;
  campaignId: number;
  donorName: string;
  donorEmail?: string;
  amount: number;
  timestamp: number;
  paymentGatewayTxnId: string;
  receiptHash?: string;
  onChainTxHash?: string;
  status: "CONFIRMED" | "RECORDED_ON_CHAIN";
  isOnChain?: boolean;
}

export interface ExpenseRecord {
  id: string;
  campaignId: number;
  lineItemId: number;
  lineItemName: string;
  amount: number;
  invoiceNo: string;
  vendorName: string;
  vendorGstin: string;
  receiverAccount: string;
  billImageUrl: string;
  billHash: string;
  deliveryPhotoUrl: string;
  deliveryPhotoHash: string;
  volunteerName: string;
  volunteerLocation: string;
  timestamp: number;
  expenseHash?: string;
  onChainTxHash?: string;
  status: "PENDING_DELIVERY" | "VERIFIED_READY" | "RECORDED_ON_CHAIN";
  fraudReport?: any;
  isOnChain?: boolean;
}

export interface CampaignData {
  id: number;
  title: string;
  slug: string;
  description: string;
  organizerName: string;
  organizerAddress: string;
  organizerPhoneMasked: string;
  organizerKycVerified: boolean;
  category: "Flood Relief" | "Medical Emergency" | "Cyclone Support" | "Earthquake";
  location: string;
  imageUrl: string;
  goal: number;
  totalRaised: number;
  totalSpent: number;
  budgetHash: string;
  lineItems: LineItem[];
  onChainTxHash?: string;
  createdAt: number;
  status: "ACTIVE" | "COMPLETED";
}

export const INITIAL_CAMPAIGNS: CampaignData[] = [
  {
    id: 1,
    title: "Wayanad Landslide Rapid Food & Medical Relief Drive",
    slug: "wayanad-landslide-relief",
    description:
      "Providing immediate emergency food grains, medical first-aid trauma kits, and temporary water sanitation to 600 displaced families in Meppadi & Chooralmala.",
    organizerName: "Aarav Menon (Kerala Disaster Volunteer Network)",
    organizerAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    organizerPhoneMasked: "+91 98470 •••• 12",
    organizerKycVerified: true,
    category: "Flood Relief",
    location: "Wayanad, Kerala",
    imageUrl:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
    goal: 500000,
    totalRaised: 320000,
    totalSpent: 145000,
    budgetHash: "0x78a53df4e70e3090885e34892c57a9f939eb51e0ca63fb5583b632fa5a73e1c4",
    createdAt: Date.now() - 86400000 * 4,
    status: "ACTIVE",
    lineItems: [
      {
        id: 0,
        name: "500kg Premium Sona Masoori Rice & Pulses",
        allocatedAmount: 180000,
        spentAmount: 85000,
        quantity: "500 kg sacks",
      },
      {
        id: 1,
        name: "Emergency First-Aid Trauma Kits & Antibiotics",
        allocatedAmount: 200000,
        spentAmount: 60000,
        quantity: "250 family packs",
      },
      {
        id: 2,
        name: "Off-Grid Water Purification Tablets & Logistics",
        allocatedAmount: 120000,
        spentAmount: 0,
        quantity: "15,000 tablets + transport",
      },
    ],
  },
  {
    id: 2,
    title: "Assam Flood Response: Clean Water & Infant Nutrition",
    slug: "assam-flood-response",
    description:
      "Delivering baby food, essential infant nourishment, and solar water purifiers to cut-off island villages along the Brahmaputra river basin.",
    organizerName: "Dr. Priyam Saikia (Northeast Health Foundation)",
    organizerAddress: "0x1234567890123456789012345678901234567890",
    organizerPhoneMasked: "+91 94350 •••• 88",
    organizerKycVerified: true,
    category: "Flood Relief",
    location: "Majuli & Dhubri, Assam",
    imageUrl:
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80",
    goal: 350000,
    totalRaised: 180000,
    totalSpent: 75000,
    budgetHash: "0x39a16fbd918ce20d41908bfcf2f20150d32e54148c772db5a7c29359e1903e1a",
    createdAt: Date.now() - 86400000 * 2,
    status: "ACTIVE",
    lineItems: [
      {
        id: 0,
        name: "Infant Milk Formula & High-Energy Biscuits",
        allocatedAmount: 150000,
        spentAmount: 75000,
        quantity: "400 tins",
      },
      {
        id: 1,
        name: "River Boat Fuel & Local Transit",
        allocatedAmount: 100000,
        spentAmount: 0,
        quantity: "8 transport runs",
      },
      {
        id: 2,
        name: "Heavy-Duty Tarpaulins & Mosquito Nets",
        allocatedAmount: 100000,
        spentAmount: 0,
        quantity: "300 units",
      },
    ],
  },
];

export const INITIAL_DONATIONS: DonationRecord[] = [
  {
    id: "DON-001",
    campaignId: 1,
    donorName: "Ananya Sharma",
    donorEmail: "ananya@example.com",
    amount: 10000,
    timestamp: 1730200000000,
    paymentGatewayTxnId: "pay_Nkl29xX98z001",
    receiptHash: "0x35bd9ff72ab315ba2dde52afb0a2e19661bd0a67f3d6f396a62435bd820056cf",
    onChainTxHash: "0xefa1086d42f4dbbfc4b76a9011eaf696637714c0f90722cd66529fed9f64b5ad",
    status: "RECORDED_ON_CHAIN",
    isOnChain: true,
  },
  {
    id: "DON-002",
    campaignId: 1,
    donorName: "Rohan Varma",
    donorEmail: "rohan.v@example.com",
    amount: 500,
    timestamp: 1730300000000,
    paymentGatewayTxnId: "pay_Nkl88yZ77a002",
    receiptHash: "0x8e98daf23b6b027387468ec1c69c91d48279580b81341a15c672c3ca424a5e04",
    onChainTxHash: "0x4df1a416e177a848aeadee62f5baa1e54df3610ed30a93d9a1f947da0c150553",
    status: "RECORDED_ON_CHAIN",
    isOnChain: true,
  },
  {
    id: "DON-003",
    campaignId: 2,
    donorName: "Amitabh Sen",
    donorEmail: "amitabh.s@example.com",
    amount: 1000,
    timestamp: 1730350000000,
    paymentGatewayTxnId: "pay_Nkl99aB12c003",
    receiptHash: "0xe750dcc98460fd80cd4ce3d76533a8c5bae54fb5a558c5a7016b71fbf4f335c2",
    onChainTxHash: "0xfecd792c95a5403195f898f91822a2ff3852913fb1bd2b7969e4a83dd73b93c8",
    status: "RECORDED_ON_CHAIN",
    isOnChain: true,
  },
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: "EXP-001",
    campaignId: 1,
    lineItemId: 0,
    lineItemName: "500kg Premium Sona Masoori Rice & Pulses",
    amount: 35000,
    invoiceNo: "INV-2026-KA-9912",
    vendorName: "Kisan Agro Relief Supplies",
    vendorGstin: "27AABCK1234F1Z5",
    receiverAccount: "•••• 4892",
    billImageUrl:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    billHash: "0xcca99c203a3c43287f304799cf6e9b80c40d201616a7a4ff520cf8a58f202db7",
    deliveryPhotoUrl:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80",
    deliveryPhotoHash: "0xe35ac412a81a7e7f1b0a19a22bb63aacd0a8e080652d0b5b7c96db5a130efb35",
    volunteerName: "Geetha Pillai (#VOL-62)",
    volunteerLocation: "Meppadi Community Shelter, GPS: 11.5510° N, 76.1260° E",
    timestamp: 1730384772000,
    expenseHash: "0xe24632ab0d6227a428093e70f62960d21d15dd08c0377550d3f69e0709ad391f",
    onChainTxHash: "0x26c2dfd9dea6692854d970b239ed58e40d3559005d2b9f367bf71bdbf14a8f26",
    status: "RECORDED_ON_CHAIN",
    isOnChain: true,
  },
  {
    id: "EXP-002",
    campaignId: 1,
    lineItemId: 1,
    lineItemName: "Emergency First-Aid Trauma Kits & Antibiotics",
    amount: 60000,
    invoiceNo: "INV-2026-SL-8831",
    vendorName: "Sanjivani Lifecare Pharma",
    vendorGstin: "27AAGCS9876Q1Z2",
    receiverAccount: "•••• 9104",
    billImageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    billHash: "0x55aa66bb77cc88dd99ee00ff11223344556677889900aabbccddeeff00112233",
    deliveryPhotoUrl:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80",
    deliveryPhotoHash: "0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
    volunteerName: "Sneha George (Medical Nurse Volunteer ID: #VOL-41)",
    volunteerLocation: "Meppadi Health Centre, GPS: 11.5512° N, 76.1245° E",
    timestamp: 1730300000000,
    status: "VERIFIED_READY",
    isOnChain: false,
  },
];
