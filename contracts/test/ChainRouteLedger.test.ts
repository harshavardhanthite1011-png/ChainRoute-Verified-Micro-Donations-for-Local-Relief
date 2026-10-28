import { expect } from "chai";
import { ethers } from "hardhat";
import { ChainRouteLedger } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ChainRouteLedger Smart Contract", function () {
  let ledger: ChainRouteLedger;
  let owner: HardhatEthersSigner;
  let organizer: HardhatEthersSigner;
  let donor: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  // Mock SHA-256 style 32-byte hashes
  const sampleBudgetHash = ethers.keccak256(ethers.toUtf8Bytes("budget:rice,medicine,transport"));
  const sampleReceiptHash1 = ethers.keccak256(ethers.toUtf8Bytes("receipt:donor-1-tx-100"));
  const sampleReceiptHash2 = ethers.keccak256(ethers.toUtf8Bytes("receipt:donor-2-tx-200"));
  const sampleExpenseHash1 = ethers.keccak256(ethers.toUtf8Bytes("expense:rice-vendor-invoice-500"));
  const sampleExpenseHash2 = ethers.keccak256(ethers.toUtf8Bytes("expense:medicine-vendor-invoice-300"));

  beforeEach(async function () {
    [owner, organizer, donor, attacker] = await ethers.getSigners();

    const LedgerFactory = await ethers.getContractFactory("ChainRouteLedger");
    ledger = (await LedgerFactory.deploy()) as ChainRouteLedger;
    await ledger.waitForDeployment();
  });

  describe("Deployment & Initial State", function () {
    it("should set deployer as owner and authorized writer", async function () {
      expect(await ledger.owner()).to.equal(owner.address);
      expect(await ledger.authorizedWriters(owner.address)).to.be.true;
      expect(await ledger.campaignCount()).to.equal(0);
    });

    it("should allow owner to grant and revoke authorized writer permissions", async function () {
      expect(await ledger.authorizedWriters(organizer.address)).to.be.false;

      await expect(ledger.connect(owner).setAuthorizedWriter(organizer.address, true))
        .to.emit(ledger, "AuthorizedWriterSet")
        .withArgs(organizer.address, true);

      expect(await ledger.authorizedWriters(organizer.address)).to.be.true;

      await expect(ledger.connect(owner).setAuthorizedWriter(organizer.address, false))
        .to.emit(ledger, "AuthorizedWriterSet")
        .withArgs(organizer.address, false);

      expect(await ledger.authorizedWriters(organizer.address)).to.be.false;
    });

    it("should revert if non-owner tries to grant authorization", async function () {
      await expect(
        ledger.connect(attacker).setAuthorizedWriter(attacker.address, true)
      ).to.be.revertedWith("ChainRoute: caller is not the owner");
    });
  });

  describe("Campaign Creation", function () {
    beforeEach(async function () {
      await ledger.connect(owner).setAuthorizedWriter(organizer.address, true);
    });

    it("happy path: creates campaign and emits CampaignCreated event", async function () {
      const goal = 100000; // e.g. 1,00,000 INR
      const itemsCount = 3;

      const tx = await ledger.connect(organizer).createCampaign(
        sampleBudgetHash,
        goal,
        itemsCount
      );
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      expect(await ledger.campaignCount()).to.equal(1);

      const campaign = await ledger.getCampaign(1);
      expect(campaign.id).to.equal(1);
      expect(campaign.budgetHash).to.equal(sampleBudgetHash);
      expect(campaign.goal).to.equal(goal);
      expect(campaign.itemsCount).to.equal(itemsCount);
      expect(campaign.organizer).to.equal(organizer.address);
      expect(campaign.totalRaised).to.equal(0);
      expect(campaign.totalSpent).to.equal(0);
      expect(campaign.donationCount).to.equal(0);
      expect(campaign.expenseCount).to.equal(0);
      expect(campaign.exists).to.be.true;
    });

    it("reverts if unauthorized caller tries to create campaign", async function () {
      await expect(
        ledger.connect(attacker).createCampaign(sampleBudgetHash, 50000, 2)
      ).to.be.revertedWith("ChainRoute: caller is not authorized to write");
    });

    it("reverts on invalid input parameters", async function () {
      // Empty budget hash
      await expect(
        ledger.connect(organizer).createCampaign(ethers.ZeroHash, 50000, 2)
      ).to.be.revertedWith("ChainRoute: budgetHash cannot be empty");

      // Zero goal
      await expect(
        ledger.connect(organizer).createCampaign(sampleBudgetHash, 0, 2)
      ).to.be.revertedWith("ChainRoute: goal must be greater than zero");

      // Zero items count
      await expect(
        ledger.connect(organizer).createCampaign(sampleBudgetHash, 50000, 0)
      ).to.be.revertedWith("ChainRoute: itemsCount must be greater than zero");
    });
  });

  describe("Donation Recording (Append-only & Verification)", function () {
    const goal = 100000;
    const itemsCount = 3;

    beforeEach(async function () {
      await ledger.connect(owner).setAuthorizedWriter(organizer.address, true);
      await ledger.connect(organizer).createCampaign(sampleBudgetHash, goal, itemsCount);
    });

    it("happy path: records donation and updates running total", async function () {
      const amount = 5000;
      const tx = await ledger.connect(organizer).recordDonation(1, sampleReceiptHash1, amount);
      await expect(tx)
        .to.emit(ledger, "DonationRecorded")
        .withArgs(1, 0, sampleReceiptHash1, amount, await (await ethers.provider.getBlock("latest"))!.timestamp);

      const totals = await ledger.getCampaignTotals(1);
      expect(totals.totalRaised).to.equal(amount);
      expect(totals.totalSpent).to.equal(0);
      expect(totals.remaining).to.equal(amount);
      expect(totals.goal).to.equal(goal);

      const donation = await ledger.getDonation(1, 0);
      expect(donation.receiptHash).to.equal(sampleReceiptHash1);
      expect(donation.amount).to.equal(amount);
      expect(donation.recordedBy).to.equal(organizer.address);

      // Verify on-chain getter
      expect(await ledger.verifyReceiptHash(1, 0, sampleReceiptHash1)).to.be.true;
      expect(await ledger.verifyReceiptHash(1, 0, sampleReceiptHash2)).to.be.false;
    });

    it("rejects duplicate receiptHash across calls (replay protection)", async function () {
      await ledger.connect(organizer).recordDonation(1, sampleReceiptHash1, 5000);

      await expect(
        ledger.connect(organizer).recordDonation(1, sampleReceiptHash1, 5000)
      ).to.be.revertedWith("ChainRoute: duplicate receipt hash rejected");
    });

    it("reverts if unauthorized caller tries to record donation", async function () {
      await expect(
        ledger.connect(attacker).recordDonation(1, sampleReceiptHash1, 1000)
      ).to.be.revertedWith("ChainRoute: caller is not authorized to write");
    });

    it("reverts if campaign does not exist or amount is zero", async function () {
      await expect(
        ledger.connect(organizer).recordDonation(999, sampleReceiptHash1, 1000)
      ).to.be.revertedWith("ChainRoute: campaign does not exist");

      await expect(
        ledger.connect(organizer).recordDonation(1, sampleReceiptHash1, 0)
      ).to.be.revertedWith("ChainRoute: donation amount must be positive");
    });
  });

  describe("Expense Recording (Dual-proof & Anti-fraud)", function () {
    const goal = 100000;
    const itemsCount = 3;

    beforeEach(async function () {
      await ledger.connect(owner).setAuthorizedWriter(organizer.address, true);
      await ledger.connect(organizer).createCampaign(sampleBudgetHash, goal, itemsCount);
      // Fund the campaign with donation first
      await ledger.connect(organizer).recordDonation(1, sampleReceiptHash1, 20000);
    });

    it("happy path: records verified expense and updates totals", async function () {
      const lineItemId = 0; // Rice
      const expenseAmount = 8000;

      const tx = await ledger.connect(organizer).recordExpense(
        1,
        lineItemId,
        sampleExpenseHash1,
        expenseAmount
      );
      await expect(tx).to.emit(ledger, "ExpenseRecorded");

      const totals = await ledger.getCampaignTotals(1);
      expect(totals.totalRaised).to.equal(20000);
      expect(totals.totalSpent).to.equal(8000);
      expect(totals.remaining).to.equal(12000);

      const expense = await ledger.getExpense(1, 0);
      expect(expense.lineItemId).to.equal(lineItemId);
      expect(expense.expenseHash).to.equal(sampleExpenseHash1);
      expect(expense.amount).to.equal(expenseAmount);
      expect(expense.recordedBy).to.equal(organizer.address);

      // Verify on-chain verification function
      expect(await ledger.verifyExpenseHash(1, 0, sampleExpenseHash1)).to.be.true;
      expect(await ledger.verifyExpenseHash(1, 0, sampleExpenseHash2)).to.be.false;
    });

    it("rejects duplicate expenseHash (replay & invoice reuse prevention)", async function () {
      await ledger.connect(organizer).recordExpense(1, 0, sampleExpenseHash1, 5000);

      await expect(
        ledger.connect(organizer).recordExpense(1, 0, sampleExpenseHash1, 5000)
      ).to.be.revertedWith("ChainRoute: duplicate expense hash rejected");
    });

    it("reverts on invalid line item ID (out of bounds)", async function () {
      // itemsCount is 3, valid indices are 0, 1, 2
      await expect(
        ledger.connect(organizer).recordExpense(1, 3, sampleExpenseHash1, 5000)
      ).to.be.revertedWith("ChainRoute: lineItemId out of bounds");
    });

    it("reverts if unauthorized caller tries to record expense", async function () {
      await expect(
        ledger.connect(attacker).recordExpense(1, 0, sampleExpenseHash1, 5000)
      ).to.be.revertedWith("ChainRoute: caller is not authorized to write");
    });
  });

  describe("Append-Only Guarantees & Batch Reads", function () {
    const goal = 50000;
    const itemsCount = 2;

    beforeEach(async function () {
      await ledger.connect(owner).setAuthorizedWriter(organizer.address, true);
      await ledger.connect(organizer).createCampaign(sampleBudgetHash, goal, itemsCount);
      await ledger.connect(organizer).recordDonation(1, sampleReceiptHash1, 10000);
      await ledger.connect(organizer).recordDonation(1, sampleReceiptHash2, 15000);
      await ledger.connect(organizer).recordExpense(1, 0, sampleExpenseHash1, 6000);
      await ledger.connect(organizer).recordExpense(1, 1, sampleExpenseHash2, 4000);
    });

    it("reads full donation batch correctly with pagination", async function () {
      const donations = await ledger.getDonations(1, 0, 10);
      expect(donations.length).to.equal(2);
      expect(donations[0].receiptHash).to.equal(sampleReceiptHash1);
      expect(donations[0].amount).to.equal(10000);
      expect(donations[1].receiptHash).to.equal(sampleReceiptHash2);
      expect(donations[1].amount).to.equal(15000);
    });

    it("reads full expense batch correctly with pagination", async function () {
      const expenses = await ledger.getExpenses(1, 0, 10);
      expect(expenses.length).to.equal(2);
      expect(expenses[0].lineItemId).to.equal(0);
      expect(expenses[0].expenseHash).to.equal(sampleExpenseHash1);
      expect(expenses[0].amount).to.equal(6000);
      expect(expenses[1].lineItemId).to.equal(1);
      expect(expenses[1].expenseHash).to.equal(sampleExpenseHash2);
      expect(expenses[1].amount).to.equal(4000);
    });

    it("confirms past entries are immutable and preserved", async function () {
      const expense0Before = await ledger.getExpense(1, 0);
      const donation0Before = await ledger.getDonation(1, 0);

      // Perform new actions
      const hash3 = ethers.keccak256(ethers.toUtf8Bytes("expense:new-item-123"));
      await ledger.connect(organizer).recordExpense(1, 0, hash3, 2000);

      // Check earlier entries did not mutate
      const expense0After = await ledger.getExpense(1, 0);
      const donation0After = await ledger.getDonation(1, 0);

      expect(expense0Before.expenseHash).to.equal(expense0After.expenseHash);
      expect(expense0Before.amount).to.equal(expense0After.amount);
      expect(donation0Before.receiptHash).to.equal(donation0After.receiptHash);
      expect(donation0Before.amount).to.equal(donation0After.amount);

      // Verify running totals
      const totals = await ledger.getCampaignTotals(1);
      expect(totals.totalRaised).to.equal(25000);
      expect(totals.totalSpent).to.equal(12000);
      expect(totals.remaining).to.equal(13000);
    });
  });
});
