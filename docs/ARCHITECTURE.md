# ChainRoute – System Architecture & Design Rationale

**Team Blockers** | *MST Blockchain Buildathon 2.0*  
*Project: ChainRoute – Verified Micro-Donations for Local Relief*

---

## 1. Executive Summary & Problem Statement

### The Problem
During disasters and local emergencies (floods, landslides, medical emergencies), millions of dollars are donated to relief funds. However:
1. **Opaque Spending**: Donors have no visibility into how money is split and spent once donated.
2. **Ghost Expenses & Duplicate Invoices**: Corrupt intermediaries reuse the same supplier invoice across multiple relief drives or forge receipts.
3. **Ghost Deliveries**: Goods are paid for but never physically delivered to victims.
4. **Blockchain Friction**: Storing raw images, PII (names, phone numbers), or full invoice text directly on-chain is gas-prohibitive, leaks privacy, and bloats the ledger.

### The Solution: ChainRoute
ChainRoute solves this with a **dual-proof, verified micro-donation model** anchored to the **MST Layer 1 Blockchain**:
- **Granular Line-Item Budgets**: Organizers publish campaigns with fixed line-item budgets (e.g., 500kg rice, 100 medicine kits, transport) hashed on-chain (`budgetHash`).
- **Dual-Proof Verification**: An expense is only eligible for recording after **two distinct proofs** are submitted:
  1. Organizer uploads the vendor bill + payment proof.
  2. An **independent, distinct 2nd volunteer** on the ground uploads geolocated delivery photo proof.
- **Automated Anti-Fraud Pipeline (P5)**: Before anything touches the blockchain, automated checks run (GSTIN validation, vendor whitelist check, budget item tolerance, invoice uniqueness).
- **Cryptographic Fingerprinting**: Accepted bundles are condensed into a single **SHA-256 fingerprint** recorded append-only on the MST Blockchain.
- **Instant Donor Verification**: Anyone can inspect live totals (raised / spent / remaining) and click **"Verify"** to recompute the SHA-256 hash client-side and match it directly against the immutable MST blockchain state.

---

## 2. On-Chain vs. Off-Chain Separation

Following **Rule 5**, our architecture enforces strict boundaries:

```
┌─────────────────────────────────────────────────────────────┐
│                       CHAINROUTE UI                         │
│   (Next.js + Tailwind + BridgeKey / Viem / Ethers SDK)      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      OFF-CHAIN (Supabase)    │ │    ON-CHAIN (MST Blockchain)│
├──────────────────────────────┤ ├────────────────────────────┤
│ • Full bill high-res image   │ │ • budgetHash (SHA-256)     │
│ • Delivery photo proofs      │ │ • receiptHash (SHA-256)    │
│ • Vendor details & GSTIN     │ │ • expenseHash (SHA-256)    │
│ • Organizer KYC (phone, ID)  │ │ • campaignId, lineItemId   │
│ • Volunteer GPS metadata     │ │ • amount (units)           │
│ • AI OCR extraction logs     │ │ • block timestamp          │
│ • Rejection audit logs       │ │ • recordedBy signer        │
└──────────────────────────────┘ └────────────────────────────┘
```

### Why this design?
1. **Zero Bloat & Minimal Gas**: Only 32-byte hashes, integers, and timestamps are written to the MST Blockchain.
2. **GDPR / Privacy Compliance**: Personal phone numbers, donor identities, and volunteer faces are never permanently etched on an immutable public ledger.
3. **Append-Only Tamper-Evidence**: The on-chain hash acts as an immutable anchor. If anyone alters even a single pixel in an uploaded bill or changes a rupee in the off-chain database, the recomputed SHA-256 hash diverges, immediately flagging tampering on the donor dashboard.

---

## 3. Smart Contract Design (`ChainRouteLedger.sol`)

The smart contract is intentionally minimalist, secure, and provably **append-only**:
- **No Edit or Delete Functions**: Once a campaign, donation, or expense is recorded, there are zero functions in the bytecode that can alter or delete it.
- **Access Control**:
  - `owner`: Contract deployer (can authorize organizers or relayers).
  - `authorizedWriters`: Allows trusted backend relayers and verified organizers (via BridgeKey) to submit on-chain transactions.
- **Global Replay & Duplicate Protection**:
  - `usedReceiptHashes[bytes32]`: Rejects duplicate donation receipt hashes.
  - `usedExpenseHashes[bytes32]`: Prevents replay of invoices or bills across campaigns or line items.
- **Cryptographic Verification Invariants**:
  - `verifyExpenseHash(campaignId, index, testHash)`: Public view function allowing any node or external client to mathematically verify hash parity.

---

## 4. Multi-Stage Anti-Fraud Pipeline (P5 Specification)

Before a transaction is signed on MST Blockchain, the expense submission must pass five automated gates:

```
                    ┌────────────────────────────┐
                    │  Organizer Bill Upload     │
                    └─────────────┬──────────────┘
                                  ▼
                    ┌────────────────────────────┐
                    │  Vision AI Extraction      │
                    │ (Vendor, GSTIN, Inv#, Amt) │
                    └─────────────┬──────────────┘
                                  ▼
    ┌─────────────────────────────────────────────────────────┐
    │                AUTOMATED FRAUD GATES                    │
    ├─────────────────────────────────────────────────────────┤
    │ Gate 1: GSTIN Format & Checksum Verification            │
    │ Gate 2: Approved Vendor Registry Lookup                 │
    │ Gate 3: Invoice Number Uniqueness across DB & Ledger    │
    │ Gate 4: Amount within Line-Item Budget Allocation       │
    │ Gate 5: Payment Receiver Account Verification           │
    └─────────────────────────────┬───────────────────────────┘
                                  ▼
                    ┌────────────────────────────┐
                    │ Independent Volunteer      │
                    │ Ground Delivery Proof Photo│
                    └─────────────┬──────────────┘
                                  ▼
                    ┌────────────────────────────┐
                    │ SHA-256 Fingerprint Bundle │
                    │ Generated & Stamped On-MST │
                    └────────────────────────────┘
```

1. **GSTIN Lookup & Verification**: Checks format and matches against the approved vendor registry.
2. **Vendor Approval List**: Organizers can only claim expenses paid to pre-approved relief suppliers (preventing personal fund diversion).
3. **Budget Tolerance Check**: Expense claimed cannot exceed the remaining allocation for that specific line item.
4. **Invoice & Payment Uniqueness**: Ensures the exact same invoice number or payment UTR/tx ID has never been claimed before in any campaign.
5. **Dual Independence Check**: The person confirming receipt and delivery *cannot* be the organizer who created the expense.

---

## 5. MST Blockchain Integration

- **MST Testnet**:
  - RPC: `https://testnetrpc.mstblockchain.com`
  - Chain ID: `91562037` (`0x5752035`)
  - Explorer: `https://testnet.mstscan.com`
- **MST Mainnet**:
  - RPC: `https://mariorpc.mstblockchain.com/`
  - Chain ID: `4646` (`0x1226`)
  - Explorer: `https://mstscan.com`
- **BridgeKey Wallet Integration**:
  - ChainRoute provides 1-click network switching to MST Testnet / Mainnet via EIP-1193 standard (`wallet_addEthereumChain` / `wallet_switchEthereumChain`).
  - Native integration with the official BridgeKey extension (`bridgekey.io`) with fallback for standard web3 wallets.

---

## 6. How the "Verify" Button Works

When a donor or judge visits the dashboard and clicks **"Verify"** on any expense:
1. The client fetches the off-chain expense metadata bundle: `{ invoiceNo, vendorGstin, amount, items, billImageSha256, deliveryPhotoSha256 }`.
2. The client computes `localHash = SHA256(canonicalBundleString)`.
3. The client queries the MST Blockchain contract via JSON-RPC: `ledger.getExpense(campaignId, expenseIndex)`.
4. It compares `localHash` with `onChainRecord.expenseHash`.
5. **Green Status**: Hashes match 1:1, verifying authenticity and zero tampering since publication.
6. **Tamper Test**: If a judge alters any byte of the invoice or image, the client shows a striking **Tamper Warning (Red)** demonstrating mathematical proof of fraud prevention.
