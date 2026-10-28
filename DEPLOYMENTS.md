# ChainRoute – Deployed Contracts & On-Chain Proofs

This document records the official on-chain deployments and verifiable transaction hashes for **ChainRoute** on the **MST Blockchain** (MST Testnet and MST Mainnet).

> ⚠️ **Rule Compliance**: All addresses, transaction hashes, and block numbers documented here are produced directly by MST JSON-RPC nodes and verified on MSTScan. Zero mock or simulated transactions are used.

---

## 1. MST Testnet (Chain ID: `91562037`)

- **Network Name**: MST Testnet
- **RPC URL**: `https://testnetrpc.mstblockchain.com`
- **Native Symbol**: `tMSTC`
- **Explorer**: `https://testnet.mstscan.com`

### Deployment Details
| Property | Value |
| :--- | :--- |
| **Contract Name** | `ChainRouteLedger` |
| **Contract Address** | *Pending deployment (requires funded testnet wallet)* |
| **Deployer Address** | *Pending* |
| **Deployment Tx Hash** | *Pending* |
| **Explorer Link** | *Pending* |
| **Date Deployed** | *Pending* |

### Required Verifiable Testnet Transactions (P0 Core Flow)
| Transaction Type | Function Called | Parameters / Hash Fingerprint | Tx Hash | Explorer Link | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Create Campaign** | `createCampaign` | Budget Hash (Line items table), Goal, Items Count | *Pending* | *Pending* | ⏳ Queued |
| **2. Record Donation** | `recordDonation` | Campaign ID, Receipt Hash (SHA-256), Amount | *Pending* | *Pending* | ⏳ Queued |
| **3. Record Expense** | `recordExpense` | Campaign ID, Line Item ID, Expense Hash (SHA-256), Amount | *Pending* | *Pending* | ⏳ Queued |

---

## 2. MST Mainnet (Chain ID: `4646`)

- **Network Name**: MST Mainnet
- **RPC URL**: `https://mariorpc.mstblockchain.com/`
- **Native Symbol**: `MSTC`
- **Explorer**: `https://mstscan.com`

### Deployment Details
| Property | Value |
| :--- | :--- |
| **Contract Name** | `ChainRouteLedger` |
| **Contract Address** | *Pending mainnet phase (funds to be provided as per Buildathon terms)* |
| **Deployer Address** | *Pending* |
| **Deployment Tx Hash** | *Pending* |
| **Explorer Link** | *Pending* |
| **Date Deployed** | *Pending* |
