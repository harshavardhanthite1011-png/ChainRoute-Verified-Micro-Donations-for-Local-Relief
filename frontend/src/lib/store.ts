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
  receiptHash: string;
  onChainTxHash?: string;
  status: "CONFIRMED" | "RECORDED_ON_CHAIN";
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
  expenseHash: string;
  onChainTxHash?: string;
  status: "PENDING_DELIVERY" | "VERIFIED_READY" | "RECORDED_ON_CHAIN";
  fraudReport?: any;
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
    amount: 15000,
    timestamp: Date.now() - 86400000 * 3,
    paymentGatewayTxnId: "pay_Nkl29xX98z001",
    receiptHash: "0x51c726a57cf4d5a44efbe88554dc313ebfc49a21226ee41a1ad6ba6efd429a14",
    onChainTxHash: "0x9812739182379127391827391827391827391827391827391827391827391827",
    status: "RECORDED_ON_CHAIN",
  },
  {
    id: "DON-002",
    campaignId: 1,
    donorName: "Rohan Varma",
    donorEmail: "rohan.v@example.com",
    amount: 50000,
    timestamp: Date.now() - 86400000 * 2,
    paymentGatewayTxnId: "pay_Nkl88yZ77a002",
    receiptHash: "0x2e8f19da45012356ec39d5718a5bf2384910cfab5816da081a27e36500df7892",
    onChainTxHash: "0xa123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    status: "RECORDED_ON_CHAIN",
  },
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: "EXP-001",
    campaignId: 1,
    lineItemId: 0,
    lineItemName: "500kg Premium Sona Masoori Rice & Pulses",
    amount: 85000,
    invoiceNo: "INV-2026-KA-4412",
    vendorName: "Kisan Agro Relief Supplies",
    vendorGstin: "27AABCK1234F1Z5",
    receiverAccount: "•••• 4892",
    billImageUrl:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    billHash: "0x44f128ac812931a293d9ef9238fa802193bda19293847291a823719823719283",
    deliveryPhotoUrl:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80",
    deliveryPhotoHash: "0x9923812983192839182391829381928391829381928391829381928391829381",
    volunteerName: "Vikram Nair (Ground Volunteer ID: #VOL-88)",
    volunteerLocation: "Chooralmala Camp Shelter, GPS: 11.5381° N, 76.1287° E",
    timestamp: Date.now() - 86400000 * 2,
    expenseHash: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
    onChainTxHash: "0x777aaa111222333444555666777888999aaabbbcccdddeeefff00011122233344",
    status: "RECORDED_ON_CHAIN",
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
    timestamp: Date.now() - 86400000 * 1,
    expenseHash: "0xfe9876543210fedcba09876543210fedcba09876543210fedcba09876543210f",
    onChainTxHash: "0x888bbb222333444555666777888999aaabbbcccdddeeefff00011122233344455",
    status: "RECORDED_ON_CHAIN",
  },
];
