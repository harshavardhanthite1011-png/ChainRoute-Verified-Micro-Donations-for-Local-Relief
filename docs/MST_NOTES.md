# MST Blockchain Integration & Technical Notes

*Documented for Team "Blockers" | Project: ChainRoute*
*Sources: Official MST Documentation (docs.mstblockchain.com, llms.txt, MST Buildathon 2.0 Guide)*

---

## 1. Network Specifications

### MST Testnet
- **Network Name**: MST Testnet
- **RPC Endpoint**: `https://testnetrpc.mstblockchain.com`
- **Chain ID**: `91562037` (Hex: `0x5752035` - verified via JSON-RPC `eth_chainId`)
- **Native Currency Symbol**: `tMSTC`
- **Block Explorer**: [https://testnet.mstscan.com](https://testnet.mstscan.com)
- **Public Faucet**: [https://faucet.mstblockchain.com](https://faucet.mstblockchain.com)

### MST Mainnet
- **Network Name**: MST Mainnet
- **RPC Endpoint**: `https://mariorpc.mstblockchain.com/`
- **Chain ID**: `4646` (Hex: `0x1226` - verified via JSON-RPC `eth_chainId`)
- **Native Currency Symbol**: `MSTC`
- **Block Explorer**: [https://mstscan.com](https://mstscan.com)

---

## 2. EVM Compatibility & Solidity Version

- **EVM Compatibility**: 
  - MST Blockchain is a Layer 1 blockchain that is **fully EVM-compatible**.
  - Supports standard Ethereum Virtual Machine opcodes, account types (EOAs and Contract Accounts), gas models, and contract interactions.
  - Standard EVM tooling like Hardhat, Foundry, Remix IDE, Ethers.js, and Viem work natively.
- **Solidity Version**:
  - The documentation and Vibe Kit officially demonstrate and recommend Solidity versions **`^0.8.20`** to **`^0.8.24`**.
  - In our implementation, we use `pragma solidity ^0.8.20;` with the standard optimizer enabled (`runs: 200`), which is fully supported and compatible with standard OpenZeppelin contracts v5.

---

## 3. Hardhat Network Configuration

Confirmed from official docs (`ide-and-hands-on-practices.md`, `vibe-kit.md`, `deployment-on-mainnet.md`):

```javascript
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    mstTestnet: {
      url: process.env.MST_TESTNET_RPC || "https://testnetrpc.mstblockchain.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 91562037,
    },
    mstMainnet: {
      url: process.env.MST_MAINNET_RPC || "https://mariorpc.mstblockchain.com/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 4646,
      gasPrice: "auto",
    },
  },
};
```

---

## 4. Wallet Integration (BridgeKey)

- **BridgeKey** is the official non-custodial wallet for MST Blockchain ([bridgekey.io](https://bridgekey.io)).
- Chrome Extension ID: `chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg`
- BridgeKey injects standard `window.ethereum` (EIP-1193) provider for web applications, allowing standard `eth_requestAccounts`, `wallet_switchEthereumChain`, and `wallet_addEthereumChain` calls.
- Fallback to MetaMask or other EIP-1193 injected providers is supported seamlessly.

---

## 5. SDK & Tooling Reference

- **TypeScript SDK**: `@mstblockchain/mst-sdk` (provides Client, Provider, Signer wrappers).
- **VibeKit**: `@mstblockchain/mst-vibe-kit` / `create-mst-app`.
- **Block Explorer**: Blockscout-powered MSTScan explorer supporting standard verification APIs.
