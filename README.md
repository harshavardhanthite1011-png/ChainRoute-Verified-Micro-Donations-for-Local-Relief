# ChainRoute – Verified Micro-Donations for Local Relief

[![Live Demo](https://img.shields.io/badge/Live%20Demo-chainroute--relief.vercel.app-000000?style=for-the-badge&logo=vercel)](https://chainroute-relief.vercel.app)
[![MST Blockchain](https://img.shields.io/badge/MST%20Blockchain-Layer%201-10B981?style=for-the-badge)](https://mstblockchain.com)
[![MST Testnet](https://img.shields.io/badge/MST%20Testnet-ChainID%2091562037-06B6D4?style=for-the-badge)](https://testnet.mstscan.com)
[![BridgeKey](https://img.shields.io/badge/Wallet-BridgeKey%20Integrated-8B5CF6?style=for-the-badge)](https://bridgekey.io)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-3B82F6?style=for-the-badge)](https://soliditylang.org/)
[![Append-Only](https://img.shields.io/badge/Ledger-Append--Only%20Guaranteed-F59E0B?style=for-the-badge)](docs/ARCHITECTURE.md)

**Built by Team "Blockers" for MST Blockchain Buildathon 2.0 (Round 2: MVP Build Sprint)**

🔗 **Live Production Application**: [https://chainroute-relief.vercel.app](https://chainroute-relief.vercel.app)  
📦 **Official GitHub Repository**: [https://github.com/harshavardhanthite1011-png/ChainRoute-Verified-Micro-Donations-for-Local-Relief](https://github.com/harshavardhanthite1011-png/ChainRoute-Verified-Micro-Donations-for-Local-Relief)

---

## 1. Problem Statement
During natural disasters and local crises (floods, landslides, medical emergencies), millions of rupees are donated by well-meaning citizens. However, traditional charitable relief operations are plagued by:
1. **Opaque Spending**: Donors have no visibility into how funds are allocated or disbursed once contributed.
2. **Ghost Expenses & Invoices**: Corrupt organizers reuse old supplier bills or submit fabricated receipts.
3. **Ghost Deliveries**: Goods are paid for on paper, but never reach victims on the ground.
4. **Blockchain Bloat**: Storing raw images, PII, and full invoices on-chain causes privacy violations and gas exhaustion.

---

## 2. The ChainRoute Solution
ChainRoute solves this crisis of trust by anchoring disaster relief to **India's First Layer 1 MST Blockchain**:
- **Fixed Line-Item Budgets**: Organizers publish campaigns with fixed budget line items (rice, medicine, transport), fingerprinted as a canonical `budgetHash` on-chain.
- **P5 Automated Anti-Fraud Pipeline**: Before any expense reaches the blockchain, 5 automated checks run (GSTIN structure, approved vendor whitelist, invoice uniqueness, budget tolerance, and payment account match).
- **Dual-Proof Verification**: An expense requires **two distinct proofs**:
  1. The organizer's vendor bill + payment receipt.
  2. An **independent, distinct 2nd volunteer's** geolocated ground delivery photo.
- **Cryptographic Fingerprinting**: Accepted expense bundles are converted into a 32-byte SHA-256 hash appended permanently to the `ChainRouteLedger` contract.
- **One-Click Donor "Verify" Tool**: Donors click "Verify" to recompute the SHA-256 hash client-side and match it against the immutable MST Blockchain state.

---

## 3. System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │                      CHAINROUTE UI                     │
                    │   (Next.js App Router + Tailwind CSS + BridgeKey SDK)  │
                    └───────────────┬────────────────────────┬───────────────┘
                                    │                        │
                                    ▼                        ▼
     ┌───────────────────────────────────────────┐ ┌──────────────────────────────────────────┐
     │           OFF-CHAIN (Supabase / DB)       │ │          ON-CHAIN (MST Blockchain)       │
     ├───────────────────────────────────────────┤ ├──────────────────────────────────────────┤
     │ • High-resolution bill photos             │ │ • ChainRouteLedger.sol (Append-Only)     │
     │ • Ground volunteer delivery photos        │ │ • budgetHash (SHA-256 of line items)     │
     │ • Organizer KYC (phone, ID, address)      │ │ • receiptHash (SHA-256 of gateway txn)   │
     │ • Volunteer GPS metadata & timestamp      │ │ • expenseHash (SHA-256 of dual proofs)   │
     │ • AI OCR bill extraction logs             │ │ • Running totals: raised / spent / rem   │
     │ • Approved vendor registry                │ │ • No edit or delete functions (Immutable)│
     └───────────────────────────────────────────┘ └──────────────────────────────────────────┘
```

For complete technical notes and architectural defense points for judges, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 4. Technology Stack

- **Blockchain Platform**: MST Blockchain Layer 1 (EVM-compatible)
- **Smart Contracts**: Solidity `0.8.20`, Hardhat Development Environment, Ethers.js `v6`
- **Frontend Framework**: Next.js 14 (App Router), React, TypeScript
- **Styling & UI**: Tailwind CSS, Glassmorphic Design System, Lucide React Icons, Canvas Confetti
- **Wallet Provider**: BridgeKey Official Extension (`io.bridgekey.wallet`, EIP-6963 Direct Discovery)
- **Cryptographic Security**: Client-side Canonical SHA-256 Fingerprinting (`crypto.createHash` / WebCrypto)
- **Verification Engine**: P5 Automated Pre-Flight Fraud Engine & On-Chain Replay Protection
- **Transaction Verification**: Live MST JSON-RPC Query CLI Tool (`scripts/verify-tx.ts`)

---

## 5. MST Blockchain Network Specifications

| Parameter | MST Testnet | MST Mainnet |
| :--- | :--- | :--- |
| **Network Name** | MST Testnet | MST Mainnet |
| **Chain ID** | `91562037` (`0x5752035`) | `4646` (`0x1226`) |
| **RPC Endpoint** | `https://testnetrpc.mstblockchain.com` | `https://mariorpc.mstblockchain.com/` |
| **Native Symbol** | `tMSTC` | `MSTC` |
| **Block Explorer** | [https://testnet.mstscan.com](https://testnet.mstscan.com) | [https://mstscan.com](https://mstscan.com) |
| **Public Faucet** | [https://faucet.mstblockchain.com](https://faucet.mstblockchain.com) | N/A (Mainnet funds provided) |
| **Official Wallet**| [BridgeKey Extension](https://bridgekey.io) | [BridgeKey Extension](https://bridgekey.io) |

Official technical notes and verification logs are in [docs/MST_NOTES.md](docs/MST_NOTES.md) and [docs/BRIDGEKEY_NOTES.md](docs/BRIDGEKEY_NOTES.md).

### Wallet Integration (BridgeKey)
- **EIP-6963 Direct Provider Discovery**: ChainRoute discovers the official BridgeKey extension via modern EIP-6963 standard (`io.bridgekey.wallet`), completely bypassing `window.ethereum` to eliminate multi-wallet conflicts with MetaMask.
- **Dedicated Provider Binding**: All account requests, network auto-switching (to MST Testnet `0x5752035` or Mainnet `0x1226`), and contract signing invoke the isolated BridgeKey provider object.
- **Graceful Detection**: If BridgeKey is not present, the user is presented with a direct install prompt linking to the official Chrome Web Store extension, with zero fallback to MetaMask.

---

## 5. Smart Contract: `ChainRouteLedger.sol`

Located in `contracts/contracts/ChainRouteLedger.sol`. Fully verified with Hardhat test suite (17/17 passing unit tests).

### Core Functions
- `createCampaign(bytes32 budgetHash, uint256 goal, uint32 itemsCount) -> uint256 campaignId`: Creates campaign and emits `CampaignCreated`.
- `recordDonation(uint256 campaignId, bytes32 receiptHash, uint256 amount)`: Appends donation receipt hash, checks replay protection, increments `totalRaised`.
- `recordExpense(uint256 campaignId, uint32 lineItemId, bytes32 expenseHash, uint256 amount)`: Appends dual-proof expense hash, checks duplicate invoice protection, increments `totalSpent`.
- `getCampaignTotals(uint256 campaignId)`: Returns `(totalRaised, totalSpent, remaining, goal)`.
- `verifyExpenseHash(uint256 campaignId, uint256 index, bytes32 testHash) -> bool`: On-chain mathematical proof verification.

### Append-Only Guarantee
The contract contains **zero edit or delete functions**. Once an entry is recorded, it is permanent.

---

## 6. P5 Automated Anti-Fraud Pipeline

ChainRoute enforces a 5-gate pipeline before an expense can touch the blockchain:
1. **Gate 1: GSTIN Format Check**: Validates Indian 15-character GST structure.
2. **Gate 2: Approved Vendor Registry**: Ensures vendor is pre-whitelisted for relief logistics.
3. **Gate 3: Invoice Uniqueness**: Cross-checks across existing database and on-chain records to eliminate double-billing.
4. **Gate 4: Line Item Budget Tolerance**: Guarantees claim cannot exceed remaining line-item budget (with max 5% emergency buffer).
5. **Gate 5: Beneficiary Account Matching**: Verifies bank payment beneficiary matches vendor registered account.

---

## 7. Deployed Contracts & Verified On-Chain Evidence

Official deployments and verified live transactions on **MST Testnet (Chain ID `91562037`)**:

### Core Contract Deployment
| Property | Value |
| :--- | :--- |
| **Contract Name** | `ChainRouteLedger` |
| **Network** | MST Testnet (Chain ID `91562037`) |
| **Contract Address** | [`0x2B94E953B87ff4AA113350d8E3AEE335eAC80E45`](https://testnet.mstscan.com/address/0x2B94E953B87ff4AA113350d8E3AEE335eAC80E45) |
| **Deployer Address** | `0x42793d66b354FF17AB6710bAF369F6838A6F5378` |
| **Deployment Tx Hash** | [`0xb0c9858018932d62cb3981e3ed2bd471aa952487f43c3c3f6829bd87a3f4c1b8`](https://testnet.mstscan.com/tx/0xb0c9858018932d62cb3981e3ed2bd471aa952487f43c3c3f6829bd87a3f4c1b8) |
| **Block Number** | `6666708` |
| **Status** | ✅ SUCCESS (status: 1) |

### Verified Live Testnet Transactions (P0 Core Flow)
| Transaction Type | Function Called | Parameters / Hash Fingerprint | Tx Hash | MSTScan Link | Block |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Create Campaign** | `createCampaign` | Budget Hash (Line items table), Goal: ₹40,000, Items: 3 | `0x94f5e4207f01a0997974151a1af94832829ed5d1fb606687985c9ea3266c592e` | [MSTScan Tx](https://testnet.mstscan.com/tx/0x94f5e4207f01a0997974151a1af94832829ed5d1fb606687985c9ea3266c592e) | `6666737` |
| **2. Record Donation** | `recordDonation` | Campaign ID: 1, Receipt Hash (SHA-256), Amount: ₹10,000 | `0xefa1086d42f4dbbfc4b76a9011eaf696637714c0f90722cd66529fed9f64b5ad` | [MSTScan Tx](https://testnet.mstscan.com/tx/0xefa1086d42f4dbbfc4b76a9011eaf696637714c0f90722cd66529fed9f64b5ad) | `6666740` |
| **3. Record Expense** | `recordExpense` | Campaign ID: 1, Line Item ID: 0 (Rice), Expense Hash, Amount: ₹6,000 | `0xe9e99b347d41860d5105e72e297b1fb84b0c6ac9bc22f64d5ebc0d40355cec96` | [MSTScan Tx](https://testnet.mstscan.com/tx/0xe9e99b347d41860d5105e72e297b1fb84b0c6ac9bc22f64d5ebc0d40355cec96) | `6666742` |
| **4. Authorize Relayer** | `setAuthorizedWriter` | Authorized Account: `0x7AdcbDF99843B20AAadC650b51C8547f3410Df8D`, Status: `true` | `0xc23b98c8471a1d089b7894aa63de30a904a532939ab5e240add279ff842b9707` | [MSTScan Tx](https://testnet.mstscan.com/tx/0xc23b98c8471a1d089b7894aa63de30a904a532939ab5e240add279ff842b9707) | `6698781` |
| **5. Fund Relayer Gas** | *Transfer (tMSTC)* | Relayer: `0x7AdcbDF99843B20AAadC650b51C8547f3410Df8D`, Amount: 1.0 tMSTC | `0x606d09c876721a3ff41a8eb8d4b7b378e5c59b10f19f0e270eee07bee3a138f7` | [MSTScan Tx](https://testnet.mstscan.com/tx/0x606d09c876721a3ff41a8eb8d4b7b378e5c59b10f19f0e270eee07bee3a138f7) | `6698804` |

> Complete deployment notes and explorer verification details are documented in [DEPLOYMENTS.md](DEPLOYMENTS.md).

---

## 8. Setup & Run Instructions

### Prerequisites
- Node.js v20+ or v22+
- npm v10+
- BridgeKey Wallet Extension ([bridgekey.io](https://bridgekey.io)) or MetaMask

### 1. Clone & Configure
```bash
git clone https://github.com/harshavardhanthite1011-png/ChainRoute-Verified-Micro-Donations-for-Local-Relief.git
cd ChainRoute-Verified-Micro-Donations-for-Local-Relief
cp .env.example .env
```

Configure your testnet deployer private key in `.env`:
```env
PRIVATE_KEY=your_testnet_private_key_here
```
*(Claim free tMSTC tokens at [https://faucet.mstblockchain.com](https://faucet.mstblockchain.com) or [https://faucet.masterstroke.academy](https://faucet.masterstroke.academy)).*

### 2. Compile & Test Smart Contracts
```bash
cd contracts
npm install
npm run compile
npm test
```
*Expected: 17 passing tests covering access control, duplicate prevention, and append-only invariants.*

### 3. Deploy & Interact on MST Testnet (Optional)
```bash
# Deploy fresh contract instance
npm run deploy:testnet

# Run the 3-step core transaction suite
npx hardhat run scripts/interact.ts --network mstTestnet

# Verify any transaction on MST Testnet
cd ..
node scripts/verify-tx.js <txHash> testnet
```

### 4. Run Frontend Locally
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 9. Video Demonstration
- **Walkthrough Video**: *[Watch Demo Video (YouTube / Loom) — Video Link Placeholder](https://github.com/harshavardhanthite1011-png/ChainRoute-Verified-Micro-Donations-for-Local-Relief)*
- **Demo Script**: See [DEMO.md](DEMO.md) for the complete 2.5-minute video walkthrough guide covering the live flow, fraud rejection simulator, and MSTScan explorer verification.

---

## 10. Security & Mainnet Key Hygiene Policy

> 🔒 **Critical Security Rule**:
> - Any deployer private key used in `.env` during local testing or testnet development must be treated as **COMPROMISED**.
> - **MST Mainnet Requirement**: When deploying to MST Mainnet (`Chain ID 4646`), teams must generate a **fresh, isolated private key** that has never been exposed in development files or testnet faucets.
> - **In-Browser Signing Primary**: The ChainRoute frontend prioritizes client-side transaction signing via the official BridgeKey browser wallet (`io.bridgekey.wallet`), meaning no private key ever enters the web application.
> - **Server-Side Relayer Hardening**: For sponsored or automated demo flows, the backend `/api/relay` route is hardened with:
>   - Strict input validation on all actions and hex parameters (`createCampaign`, `recordDonation`, `recordExpense`).
>   - Origin and host verification preventing cross-origin abuse.
>   - Per-IP sliding-window rate limiting (10 req/min).
>   - **Dedicated Low-Balance Key**: The relayer operates under a dedicated, isolated relayer wallet holding only minimal gas reserves (e.g. 1-2 tMSTC). It is never given administrator or ownership rights on-chain.
>   - If `RELAY_DISABLED=true` is set, the relayer route is shut down completely and all submissions require direct BridgeKey wallet connection.


