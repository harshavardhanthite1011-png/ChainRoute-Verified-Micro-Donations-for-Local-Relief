# BridgeKey Wallet Integration & Resolution Notes

*Team "Blockers" | MST Blockchain Buildathon 2.0*  
*Project: ChainRoute*

---

## 1. Confirmed Extension Identifiers (Empirical Verification)

From browser scans with both MetaMask and BridgeKey extensions active:
- **EIP-6963 RDNS**: `io.bridgekey.wallet`
- **Provider Name**: `BridgeKey`
- **Flag**: `isBridgeKey: true`
- **Chrome Web Store Extension ID**: `bfjojdcfenehemjgjlepdjomkpginlkg`
- **Extension URL**: [https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg](https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg)

---

## 2. Root Cause & Architectural Fix

### The Conflict
When multiple EVM wallet extensions (such as MetaMask and BridgeKey) are enabled in Chrome:
- MetaMask overrides the global `window.ethereum` object (`window.ethereum.isMetaMask === true`).
- `window.ethereum.providers` array was not present.
- Any naive invocation of `window.ethereum.request(...)` or default injected connectors directly activates MetaMask, completely hijacking the connection.

### The Resolution (`frontend/src/lib/wallet.ts`)
1. **EIP-6963 Provider Announcement**:
   - The app listens for `eip6963:announceProvider` and dispatches `eip6963:requestProvider`.
   - Providers are collected and filtered specifically for `detail.info.rdns === "io.bridgekey.wallet"` (with fallback to `detail.provider.isBridgeKey === true`).
2. **Direct Provider Binding**:
   - The connection request (`eth_requestAccounts`), chain query (`eth_chainId`), network switch (`wallet_switchEthereumChain`), and network add (`wallet_addEthereumChain`) are called **strictly on the isolated BridgeKey provider instance**.
   - Generic `window.ethereum` is completely bypassed across the entire codebase.
3. **No Silent MetaMask Fallback**:
   - If BridgeKey is not installed, the UI directly renders an **"Install BridgeKey"** button pointing to the Chrome Web Store, preventing any accidental routing to MetaMask.
4. **Persistence & Event Handling**:
   - When connected, `localStorage` records `chainroute_connected_rdns = "io.bridgekey.wallet"`.
   - Upon page refresh, `walletManager.autoReconnect()` silently restores the session via `provider.request({ method: "eth_accounts" })`.
   - `accountsChanged` and `chainChanged` listeners are bound directly to the BridgeKey provider.

---

## 3. Network Parameters & Dynamic Hex Calculation

- **MST Testnet**:
  - Decimal Chain ID: `91562037`
  - Computed Hex: `"0x" + (91562037).toString(16)` = **`0x5752035`**
  - RPC URL: `https://testnetrpc.mstblockchain.com`
  - Symbol: `tMSTC`
  - Explorer: `https://testnet.mstscan.com`
- **MST Mainnet**:
  - Decimal Chain ID: `4646`
  - Computed Hex: `"0x" + (4646).toString(16)` = **`0x1226`**
  - RPC URL: `https://mariorpc.mstblockchain.com/`
  - Symbol: `MSTC`
  - Explorer: `https://mstscan.com`
