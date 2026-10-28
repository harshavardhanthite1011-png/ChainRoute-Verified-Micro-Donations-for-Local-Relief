# BridgeKey Wallet Integration & Empirical Diagnostics

*Team "Blockers" | MST Blockchain Buildathon 2.0*  
*Project: ChainRoute*

---

## 1. Official Extension & App Identifiers

- **Official Website**: [https://bridgekey.io](https://bridgekey.io)
- **Chrome Web Store Extension**:
  - URL: `https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg`
  - Extension ID: `bfjojdcfenehemjgjlepdjomkpginlkg`
- **Android App**:
  - Package ID: `com.bridgekey`
  - Play Store: `https://play.google.com/store/apps/details?id=com.bridgekey`

---

## 2. MST Blockchain Network Parameters (Confirmed Hex)

- **MST Testnet**:
  - Decimal Chain ID: `91562037`
  - **Hex Chain ID**: `0x5752035` *(Verified via node `(91562037).toString(16)` and JSON-RPC `eth_chainId` on `https://testnetrpc.mstblockchain.com`)*
  - RPC URL: `https://testnetrpc.mstblockchain.com`
  - Symbol: `tMSTC`
  - Decimals: `18`
  - Explorer: `https://testnet.mstscan.com`
- **MST Mainnet**:
  - Decimal Chain ID: `4646`
  - **Hex Chain ID**: `0x1226` *(Verified via node `(4646).toString(16)` and JSON-RPC `eth_chainId` on `https://mariorpc.mstblockchain.com/`)*
  - RPC URL: `https://mariorpc.mstblockchain.com/`
  - Symbol: `MSTC`
  - Decimals: `18`
  - Explorer: `https://mstscan.com`

---

## 3. The Root Cause of the Bug & EIP-6963 Multi-Injected Conflict

When both MetaMask and BridgeKey extensions are installed:
1. Both extensions inject into `window.ethereum`.
2. MetaMask typically overwrites or intercepts `window.ethereum`, setting `window.ethereum.isMetaMask = true`.
3. Calling `window.ethereum.request({ method: 'eth_requestAccounts' })` routes directly to MetaMask, hijacking the user connection.
4. **The Fix**:
   - Modern EVM standard **EIP-6963** announces distinct provider details (`info.name`, `info.rdns`, `info.uuid`, `info.icon`, `provider`).
   - If multiple providers exist under `window.ethereum.providers[]`, we filter and isolate the BridgeKey provider object.
   - All subsequent reads, network additions, network switches, and transaction signings must use **that exact provider instance**, completely bypassing generic `window.ethereum`.

---

## 4. Diagnostics Tool (`/debug/wallets`)

To empirically capture the exact RDNS, flags, and provider shape from the user's browser:
- Diagnostic URL: `http://localhost:3000/debug/wallets`
- Scans:
  1. `eip6963:announceProvider` events.
  2. `window.ethereum` flags & `window.ethereum.providers` array.
  3. Global namespaces (`window.bridgekey`, `window.bridgeKey`, etc.).
  4. Provides 1-click "Copy Diagnostic JSON" button.
