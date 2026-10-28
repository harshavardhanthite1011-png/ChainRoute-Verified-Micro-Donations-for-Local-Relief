# ChainRoute – 2.5 Minute Demo Video Script & Walkthrough Guide

**Team Blockers** | *MST Blockchain Buildathon 2.0 (Round 2 MVP)*  
**Project**: ChainRoute – Verified Micro-Donations for Local Relief

---

## Video Outline & Timing (Total: 2m 30s)

| Timestamp | Screen / Visual | Speaker Audio / Narration | Key Takeaway for Judges |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:25** | Landing Page & Hero Stats | *"Hi Judges, we are Team Blockers presenting ChainRoute. In every natural disaster, generous people donate millions, but traditional charities suffer from ghost expenses, fake invoices, and zero proof of delivery. ChainRoute solves this on the MST Layer 1 Blockchain."* | Clear problem & value prop |
| **0:25 - 0:50** | Campaign Budget & Donation Flow | *"Here is an active relief campaign for Wayanad Landslides. Notice how the budget is split into fixed line items (rice, medical kits, transport) with a canonical budget hash already anchored on-chain. A donor donates ₹1,000 using UPI/gateway. The system instantly generates a canonical SHA-256 receipt fingerprint and commits it append-only to the MST Testnet ledger via our smart contract."* | Non-custodial transparency + real hash recording |
| **0:50 - 1:25** | P5 Fraud Engine & Dual-Proof Upload | *"Now, how does money get spent? Organizers cannot simply take cash. First, the organizer uploads the supplier bill. Watch what happens when we test Preset 2 with a fake GSTIN—Gate 1 and Gate 2 immediately flag and reject it! When we test Preset 3 with a duplicate invoice, Gate 3 stops double-billing dead in its tracks. Only when all 5 gates pass AND a distinct 2nd volunteer uploads a geolocated ground delivery photo is the expense signed and recorded on the MST Blockchain."* | Demonstrates P5 automated fraud detection live |
| **1:25 - 2:00** | Cryptographic "Verify" Button & Tamper Demonstration | *"Now, let's take the role of an auditor or donor. In the Expense Audit Timeline, we click 'Verify' on an expense. Our client recomputes the SHA-256 fingerprint from the invoice, GSTIN, amount, bill proof, and delivery photo, and queries the MST Blockchain node. Look: 100% cryptographic match! Now watch what happens when we toggle 'Simulate Tampering'—even a single rupee alteration causes immediate divergence, triggering a bright red Tamper Alert. Mathematical proof of zero fraud!"* | Fulfills core cryptographic verification requirement |
| **2:00 - 2:30** | MSTScan Explorer & Architecture Summary | *"Every transaction can be verified on MSTScan at Chain ID 91562037. Our contract is 100% append-only with zero edit or delete functions. ChainRoute turns disaster relief into an immutable, fraud-proof public record. Thank you!"* | Closes loop with explorer proof |

---

## Live Demo Checklist for Presenter
- [ ] Wallet connected to **MST Testnet (Chain ID 91562037)** using BridgeKey or MetaMask.
- [ ] Browser window open with `testnet.mstscan.com` to show real transaction receipts.
- [ ] Show 1 successful verified donation.
- [ ] Show 1 rejected fake bill (Preset 2) and 1 duplicate invoice rejection (Preset 3).
- [ ] Click the **"Verify"** button, show the green hash match, then toggle **"Simulate Tampering"** to show instant fraud detection!
