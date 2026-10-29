# On-Chain Verification & Transaction Root Cause Analysis

*Team "Blockers" | MST Blockchain Buildathon 2.0 (Round 2)*  
*Project: ChainRoute*

---

## 1. Investigation of Questioned Hash `0x0ef2741306468a376fb6147c12194c83be8f3eaf7d718617020ba7c9c460e015`

### 1a. Trace & Code Location
- **Originating File & Line**:
  - [frontend/src/components/DonationModal.tsx:L56-L58](file:///Users/macbookpro/Study%20buddy%20%F0%9F%91%BE/MST%20Blockchain%20Project/frontend/src/components/DonationModal.tsx#L56-L58)
  - [frontend/src/components/ExpenseUpload.tsx:L147-L149](file:///Users/macbookpro/Study%20buddy%20%F0%9F%91%BE/MST%20Blockchain%20Project/frontend/src/components/ExpenseUpload.tsx#L147-L149)
- **Code Trace**:
  ```typescript
  let onChainTxHash = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("")}`;
  ```
- **Trigger**:
  When a user clicked "Confirm & Record On-Chain", the component called `POST /api/relay`. Because the backend had no deployer private key and no deployed contract address in `.env`, `/api/relay` returned an error. The frontend catch block caught this error and fell back to the random 64-hex string generator.

### 1b. RPC Query Results
- **MST Testnet (`https://testnetrpc.mstblockchain.com`)**:
  - `eth_getTransactionByHash("0x0ef27413...")` $\rightarrow$ `null`
  - `eth_getTransactionReceipt("0x0ef27413...")` $\rightarrow$ `null`
- **MST Mainnet (`https://mariorpc.mstblockchain.com/`)**:
  - `eth_getTransactionByHash("0x0ef27413...")` $\rightarrow$ `null`
  - `eth_getTransactionReceipt("0x0ef27413...")` $\rightarrow$ `null`

### 1c. Chain ID & RPC Alignment
- Testnet RPC: `https://testnetrpc.mstblockchain.com`
- Chain ID: `91562037` (Hex: `0x5752035`)
- Both RPC and wallet configuration are aligned.

### 1d. Gas Settings & Receipt Await
- In the initial client modal, no real transaction was sent through BridgeKey, so no receipt was awaited.

### 1e. Contract Code Check
- `NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET` is currently unset in `.env`, meaning no contract has been deployed yet on testnet.

---

## 2. Root Cause Classification

**Classification**: **(A) Fake / Local Hash**
- **Evidence**: The hash was produced client-side by `Math.random()` in `DonationModal.tsx` fallback logic when `/api/relay` failed. It was never signed by a wallet, never submitted to an RPC node, and never included in any block.
- **Rule Enforcement**: In accordance with Buildathon Rule 1 & Rule 2, all simulated fallbacks must be completely eliminated. Every transaction must be signed by BridgeKey (or a funded relayer) and awaited until a receipt with `status: 1` is returned.

---

## 3. Deprecation Notice: MST Coral Testnet

> ⚠️ **MST Testnet Deprecation Notice**:
> The MST Testnet Explorer (`testnet.mstscan.com`) currently displays a notice stating that the current testnet (`Chain ID 91562037`) will be deprecated after **31 January 2027** and replaced by **"MST Coral Testnet"**.
> 
> **Buildathon Policy**: Per instructions, we do **not** invent or migrate to Coral RPCs or chain IDs at this time. We remain on the official Buildathon Round 2 testnet (`https://testnetrpc.mstblockchain.com`, Chain ID `91562037`). We will confirm with Buildathon organizers if any transition is required before final submission.

---

## 4. Fix & Hardening Strategy

1. **Eliminate All Simulated Hash Generators**:
   Remove `Math.random()` hex generation from `DonationModal.tsx` and `ExpenseUpload.tsx`.
2. **Direct BridgeKey Wallet Signing**:
   When the user submits a donation or expense:
   - Ensure the user is connected via BridgeKey on MST Testnet (`91562037`).
   - If chainId does not match, block signing and prompt network switch.
   - Request real signature via `walletManager.getBrowserSigner()`.
   - Submit real transaction directly to the contract.
   - Await receipt (`receipt.status === 1`).
   - Show explorer link **only** after receipt confirmation.
3. **Clear Distinction Between Hash Types**:
   - `dataHash` / `fingerprint`: 32-byte SHA-256 fingerprint of the bill/receipt payload.
   - `txHash`: Real blockchain transaction identifier.
