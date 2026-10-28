// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChainRouteLedger
 * @author Team Blockers
 * @notice Append-only ledger for ChainRoute: Verified Micro-Donations for Local Relief on MST Blockchain.
 * @dev Records SHA-256 fingerprinted budget hashes, donation receipts, and dual-verified expense proofs.
 *      Zero mutation or deletion functions exist in this contract (pure append-only).
 */
contract ChainRouteLedger {
    // -------------------------------------------------------------
    // DATA STRUCTURES
    // -------------------------------------------------------------

    struct Campaign {
        uint256 id;
        bytes32 budgetHash;      // SHA-256 hash of line items budget specification
        uint256 goal;            // Campaign fundraising goal
        uint32 itemsCount;       // Number of predefined line items
        address organizer;       // Campaign organizer address
        uint256 createdAt;       // Block timestamp of creation
        uint256 totalRaised;     // Running total of verified donations
        uint256 totalSpent;      // Running total of verified expenses
        uint256 donationCount;   // Number of recorded donations
        uint256 expenseCount;    // Number of recorded expenses
        bool exists;
    }

    struct DonationEntry {
        bytes32 receiptHash;     // SHA-256 fingerprint of donation payment receipt
        uint256 amount;          // Donation amount
        uint256 timestamp;       // Block timestamp when recorded
        address recordedBy;      // Relayer or organizer account that submitted tx
    }

    struct ExpenseEntry {
        uint32 lineItemId;       // Zero-indexed line item identifier
        bytes32 expenseHash;     // SHA-256 fingerprint of bill + payment + delivery bundle
        uint256 amount;          // Expense amount
        uint256 timestamp;       // Block timestamp when recorded
        address recordedBy;      // Relayer or organizer account that submitted tx
    }

    // -------------------------------------------------------------
    // STATE VARIABLES
    // -------------------------------------------------------------

    address public owner;
    uint256 public campaignCount;

    // Access control: authorized backends, organizers, or relayer accounts
    mapping(address => bool) public authorizedWriters;

    // Campaigns by ID (campaignId starts at 1)
    mapping(uint256 => Campaign) public campaigns;

    // Historical entries by campaign ID and sequential index
    mapping(uint256 => mapping(uint256 => DonationEntry)) private _donations;
    mapping(uint256 => mapping(uint256 => ExpenseEntry)) private _expenses;

    // Global replay protection: uniqueness guarantees
    mapping(bytes32 => bool) public usedReceiptHashes;
    mapping(bytes32 => bool) public usedExpenseHashes;

    // -------------------------------------------------------------
    // EVENTS
    // -------------------------------------------------------------

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AuthorizedWriterSet(address indexed account, bool authorized);

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed organizer,
        bytes32 budgetHash,
        uint256 goal,
        uint32 itemsCount,
        uint256 timestamp
    );

    event DonationRecorded(
        uint256 indexed campaignId,
        uint256 indexed donationIndex,
        bytes32 receiptHash,
        uint256 amount,
        uint256 timestamp
    );

    event ExpenseRecorded(
        uint256 indexed campaignId,
        uint256 indexed expenseIndex,
        uint32 indexed lineItemId,
        bytes32 expenseHash,
        uint256 amount,
        uint256 timestamp
    );

    // -------------------------------------------------------------
    // MODIFIERS
    // -------------------------------------------------------------

    modifier onlyOwner() {
        require(msg.sender == owner, "ChainRoute: caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedWriters[msg.sender],
            "ChainRoute: caller is not authorized to write"
        );
        _;
    }

    // -------------------------------------------------------------
    // CONSTRUCTOR
    // -------------------------------------------------------------

    constructor() {
        owner = msg.sender;
        authorizedWriters[msg.sender] = true;
        emit OwnershipTransferred(address(0), msg.sender);
        emit AuthorizedWriterSet(msg.sender, true);
    }

    // -------------------------------------------------------------
    // ACCESS CONTROL
    // -------------------------------------------------------------

    function setAuthorizedWriter(address account, bool authorized) external onlyOwner {
        require(account != address(0), "ChainRoute: zero address cannot be authorized");
        authorizedWriters[account] = authorized;
        emit AuthorizedWriterSet(account, authorized);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ChainRoute: new owner cannot be zero address");
        address oldOwner = owner;
        owner = newOwner;
        authorizedWriters[newOwner] = true;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // -------------------------------------------------------------
    // CORE MUTATING FUNCTIONS (APPEND-ONLY)
    // -------------------------------------------------------------

    /**
     * @notice Create a new relief campaign with an on-chain budget fingerprint.
     * @param budgetHash SHA-256 hash of the predefined line-item budget table.
     * @param goal Total target fundraising goal in units/cents.
     * @param itemsCount Total count of line items in the campaign budget.
     * @return campaignId The unique sequential ID of the created campaign.
     */
    function createCampaign(
        bytes32 budgetHash,
        uint256 goal,
        uint32 itemsCount
    ) external onlyAuthorized returns (uint256 campaignId) {
        require(budgetHash != bytes32(0), "ChainRoute: budgetHash cannot be empty");
        require(goal > 0, "ChainRoute: goal must be greater than zero");
        require(itemsCount > 0, "ChainRoute: itemsCount must be greater than zero");

        campaignCount++;
        campaignId = campaignCount;

        Campaign storage c = campaigns[campaignId];
        c.id = campaignId;
        c.budgetHash = budgetHash;
        c.goal = goal;
        c.itemsCount = itemsCount;
        c.organizer = msg.sender;
        c.createdAt = block.timestamp;
        c.totalRaised = 0;
        c.totalSpent = 0;
        c.donationCount = 0;
        c.expenseCount = 0;
        c.exists = true;

        emit CampaignCreated(
            campaignId,
            msg.sender,
            budgetHash,
            goal,
            itemsCount,
            block.timestamp
        );
    }

    /**
     * @notice Append a verified donation record to a campaign.
     * @param campaignId Unique campaign ID.
     * @param receiptHash SHA-256 fingerprint of the verified payment gateway receipt.
     * @param amount Donation amount.
     * @return donationIndex Sequential index of this donation within the campaign.
     */
    function recordDonation(
        uint256 campaignId,
        bytes32 receiptHash,
        uint256 amount
    ) external onlyAuthorized returns (uint256 donationIndex) {
        Campaign storage c = campaigns[campaignId];
        require(c.exists, "ChainRoute: campaign does not exist");
        require(receiptHash != bytes32(0), "ChainRoute: receiptHash cannot be empty");
        require(amount > 0, "ChainRoute: donation amount must be positive");
        require(!usedReceiptHashes[receiptHash], "ChainRoute: duplicate receipt hash rejected");

        usedReceiptHashes[receiptHash] = true;

        donationIndex = c.donationCount;
        _donations[campaignId][donationIndex] = DonationEntry({
            receiptHash: receiptHash,
            amount: amount,
            timestamp: block.timestamp,
            recordedBy: msg.sender
        });

        c.totalRaised += amount;
        c.donationCount++;

        emit DonationRecorded(
            campaignId,
            donationIndex,
            receiptHash,
            amount,
            block.timestamp
        );
    }

    /**
     * @notice Append a verified expense record with dual-proofs (bill + volunteer delivery photo).
     * @param campaignId Unique campaign ID.
     * @param lineItemId Index of the budget line item (0 <= lineItemId < itemsCount).
     * @param expenseHash SHA-256 fingerprint of bill + payment proof + delivery photo bundle.
     * @param amount Expense amount claimed.
     * @return expenseIndex Sequential index of this expense within the campaign.
     */
    function recordExpense(
        uint256 campaignId,
        uint32 lineItemId,
        bytes32 expenseHash,
        uint256 amount
    ) external onlyAuthorized returns (uint256 expenseIndex) {
        Campaign storage c = campaigns[campaignId];
        require(c.exists, "ChainRoute: campaign does not exist");
        require(lineItemId < c.itemsCount, "ChainRoute: lineItemId out of bounds");
        require(expenseHash != bytes32(0), "ChainRoute: expenseHash cannot be empty");
        require(amount > 0, "ChainRoute: expense amount must be positive");
        require(!usedExpenseHashes[expenseHash], "ChainRoute: duplicate expense hash rejected");

        usedExpenseHashes[expenseHash] = true;

        expenseIndex = c.expenseCount;
        _expenses[campaignId][expenseIndex] = ExpenseEntry({
            lineItemId: lineItemId,
            expenseHash: expenseHash,
            amount: amount,
            timestamp: block.timestamp,
            recordedBy: msg.sender
        });

        c.totalSpent += amount;
        c.expenseCount++;

        emit ExpenseRecorded(
            campaignId,
            expenseIndex,
            lineItemId,
            expenseHash,
            amount,
            block.timestamp
        );
    }

    // -------------------------------------------------------------
    // VIEW / READ FUNCTIONS
    // -------------------------------------------------------------

    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        require(campaigns[campaignId].exists, "ChainRoute: campaign does not exist");
        return campaigns[campaignId];
    }

    function getCampaignTotals(uint256 campaignId)
        external
        view
        returns (
            uint256 totalRaised,
            uint256 totalSpent,
            uint256 remaining,
            uint256 goal
        )
    {
        Campaign storage c = campaigns[campaignId];
        require(c.exists, "ChainRoute: campaign does not exist");

        totalRaised = c.totalRaised;
        totalSpent = c.totalSpent;
        remaining = totalRaised > totalSpent ? (totalRaised - totalSpent) : 0;
        goal = c.goal;
    }

    function getDonation(uint256 campaignId, uint256 index)
        external
        view
        returns (DonationEntry memory)
    {
        Campaign storage c = campaigns[campaignId];
        require(c.exists, "ChainRoute: campaign does not exist");
        require(index < c.donationCount, "ChainRoute: donation index out of range");
        return _donations[campaignId][index];
    }

    function getExpense(uint256 campaignId, uint256 index)
        external
        view
        returns (ExpenseEntry memory)
    {
        Campaign storage c = campaigns[campaignId];
        require(c.exists, "ChainRoute: campaign does not exist");
        require(index < c.expenseCount, "ChainRoute: expense index out of range");
        return _expenses[campaignId][index];
    }

    function getDonations(
        uint256 campaignId,
        uint256 offset,
        uint256 limit
    ) external view returns (DonationEntry[] memory entries) {
        Campaign storage c = campaigns[campaignId];
        require(c.exists, "ChainRoute: campaign does not exist");

        if (offset >= c.donationCount || limit == 0) {
            return new DonationEntry[](0);
        }

        uint256 toIndex = offset + limit;
        if (toIndex > c.donationCount) {
            toIndex = c.donationCount;
        }

        uint256 count = toIndex - offset;
        entries = new DonationEntry[](count);
        for (uint256 i = 0; i < count; i++) {
            entries[i] = _donations[campaignId][offset + i];
        }
    }

    function getExpenses(
        uint256 campaignId,
        uint256 offset,
        uint256 limit
    ) external view returns (ExpenseEntry[] memory entries) {
        Campaign storage c = campaigns[campaignId];
        require(c.exists, "ChainRoute: campaign does not exist");

        if (offset >= c.expenseCount || limit == 0) {
            return new ExpenseEntry[](0);
        }

        uint256 toIndex = offset + limit;
        if (toIndex > c.expenseCount) {
            toIndex = c.expenseCount;
        }

        uint256 count = toIndex - offset;
        entries = new ExpenseEntry[](count);
        for (uint256 i = 0; i < count; i++) {
            entries[i] = _expenses[campaignId][offset + i];
        }
    }

    /**
     * @notice Recomputes verification on-chain by comparing a calculated candidate hash with stored record.
     */
    function verifyExpenseHash(
        uint256 campaignId,
        uint256 index,
        bytes32 testHash
    ) external view returns (bool) {
        Campaign storage c = campaigns[campaignId];
        if (!c.exists || index >= c.expenseCount) {
            return false;
        }
        return _expenses[campaignId][index].expenseHash == testHash;
    }

    /**
     * @notice Recomputes verification on-chain by comparing a calculated receipt hash with stored record.
     */
    function verifyReceiptHash(
        uint256 campaignId,
        uint256 index,
        bytes32 testHash
    ) external view returns (bool) {
        Campaign storage c = campaigns[campaignId];
        if (!c.exists || index >= c.donationCount) {
            return false;
        }
        return _donations[campaignId][index].receiptHash == testHash;
    }
}
