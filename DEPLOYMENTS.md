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
| **Contract Address** | `0x2B94E953B87ff4AA113350d8E3AEE335eAC80E45` |
| **Deployer Address** | `0x42793d66b354FF17AB6710bAF369F6838A6F5378` |
| **Deployment Tx Hash** | `0xb0c9858018932d62cb3981e3ed2bd471aa952487f43c3c3f6829bd87a3f4c1b8` |
| **Explorer Link** | [https://testnet.mstscan.com/address/0x2B94E953B87ff4AA113350d8E3AEE335eAC80E45](https://testnet.mstscan.com/address/0x2B94E953B87ff4AA113350d8E3AEE335eAC80E45) |
| **Date Deployed** | October 29, 2026 |

### Required Verifiable Testnet Transactions (P0 Core Flow)
| Transaction Type | Function Called | Parameters / Hash Fingerprint | Tx Hash | Explorer Link | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Create Campaign** | `createCampaign` | Budget Hash (Line items table), Goal: ₹40,000, Items Count: 3 | `0x94f5e4207f01a0997974151a1af94832829ed5d1fb606687985c9ea3266c592e` | [MSTScan Tx](https://testnet.mstscan.com/tx/0x94f5e4207f01a0997974151a1af94832829ed5d1fb606687985c9ea3266c592e) | ✅ Block 6666737 |
| **2. Record Donation** | `recordDonation` | Campaign ID: 1, Receipt Hash (SHA-256), Amount: ₹10,000 | `0xefa1086d42f4dbbfc4b76a9011eaf696637714c0f90722cd66529fed9f64b5ad` | [MSTScan Tx](https://testnet.mstscan.com/tx/0xefa1086d42f4dbbfc4b76a9011eaf696637714c0f90722cd66529fed9f64b5ad) | ✅ Block 6666740 |
| **3. Record Expense** | `recordExpense` | Campaign ID: 1, Line Item ID: 0 (Rice), Expense Hash, Amount: ₹6,000 | `0xe9e99b347d41860d5105e72e297b1fb84b0c6ac9bc22f64d5ebc0d40355cec96` | [MSTScan Tx](https://testnet.mstscan.com/tx/0xe9e99b347d41860d5105e72e297b1fb84b0c6ac9bc22f64d5ebc0d40355cec96) | ✅ Block 6666742 |

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

---

## 3. Mainnet Key Hygiene & Security Policy
> 🔒 **Security Notice - Key Compromise Prevention**:
> Any private key utilized during development or testnet deployments must be treated as **COMPROMISED**.
> Under no circumstances should testnet deployer credentials or keys from development environments be used for MST Mainnet.
> Prior to mainnet deployment, a **dedicated, fresh deployer key** must be generated in a secure environment and funded exclusively for the official contract deployment.

