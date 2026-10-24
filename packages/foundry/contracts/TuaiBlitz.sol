// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MockIDRX} from "./MockIDRX.sol";

/// @title Tuai Blitz
/// @notice Resi gudang sebagai ERC1155 + pinjaman IDRX dengan jaminan resi.
/// @dev MVP testnet. Satu user hanya boleh punya satu pinjaman aktif.
contract TuaiBlitz is ERC1155, Ownable, ReentrancyGuard {
    // --- konstanta (jangan diubah) ---
    uint256 public constant MAX_LTV_BPS = 6000; // 60%
    uint256 public constant LIQ_THRESHOLD_BPS = 8000; // 80%
    uint256 public constant INTEREST_BPS = 200; // 2% flat per pinjaman
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant TRADE_FEE_BPS = 50; // 0,5% fee jual-beli per kg, masuk pool

    // --- model data ---
    struct Series {
        string receiptNo; // "RESI-2026-001"
        string commodity; // "Kopi Arabika"
        string grade; // "Grade 1"
        bytes32 docHash; // keccak256 dokumen resi fisik (PDF/scan)
        address warehouse; // penerbit token
        uint256 pricePerKg; // IDRX 6 desimal, mis. 100_000e6
        uint256 maxKg; // plafon dari resi, mis. 2000
        uint256 mintedKg; // sudah diterbitkan
        uint256 redeemedKg; // sudah diambil fisik
        bool active;
    }

    struct Loan {
        uint256 seriesId;
        uint256 collateralKg;
        uint256 principal; // pokok dalam IDRX
        uint256 debt; // pokok + bunga flat
        bool active;
    }

    struct Listing {
        address seller;
        uint256 seriesId;
        uint256 kgLeft; // sisa kg yang belum terjual
        uint256 pricePerKg; // IDRX 6 desimal
        bool active;
    }

    // --- state ---
    MockIDRX public immutable idrx;

    mapping(address => bool) public isWarehouse;
    mapping(uint256 => Series) public series;
    uint256[] public seriesIds;
    uint256 public nextSeriesId = 1;

    mapping(address => Loan) public loans;
    mapping(uint256 => uint256) public seizedKg; // jaminan hasil likuidasi per seri

    mapping(address => uint256) public shares;
    uint256 public totalShares;
    uint256 public totalOutstandingPrincipal;

    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId = 1;

    // --- event ---
    event SeriesCreated(uint256 indexed seriesId, string receiptNo, bytes32 docHash, uint256 maxKg);
    event ReceiptMinted(uint256 indexed seriesId, address indexed to, uint256 kg);
    event PriceUpdated(uint256 indexed seriesId, uint256 oldPrice, uint256 newPrice);
    event Borrowed(address indexed user, uint256 indexed seriesId, uint256 kg, uint256 principal);
    event Repaid(address indexed user, uint256 principal, uint256 interest);
    event Liquidated(address indexed user, uint256 indexed seriesId, uint256 kg, uint256 debt);
    event Redeemed(uint256 indexed seriesId, address indexed holder, uint256 kg);
    event PoolDeposit(address indexed lender, uint256 amount, uint256 shares);
    event PoolWithdraw(address indexed lender, uint256 shares, uint256 amount);
    event SeizedSold(uint256 indexed seriesId, address indexed buyer, uint256 kg, uint256 paid);
    event Listed(uint256 indexed listingId, address indexed seller, uint256 indexed seriesId, uint256 kg, uint256 pricePerKg);
    event Bought(uint256 indexed listingId, address indexed buyer, uint256 kg, uint256 paid, uint256 fee);
    event ListingCancelled(uint256 indexed listingId, uint256 kgReturned);

    modifier onlyWarehouse() {
        require(isWarehouse[msg.sender], "not warehouse");
        _;
    }

    constructor(address idrx_) ERC1155("") Ownable(msg.sender) {
        idrx = MockIDRX(idrx_);
    }

    /// @notice Wajib ada, kalau tidak `borrow` akan revert saat token masuk escrow.
    function onERC1155Received(address, address, uint256, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return 0xf23a6e61;
    }

    // --- admin & gudang: seri resi ---

    function setWarehouse(address w, bool allowed) external onlyOwner {
        require(w != address(0), "zero warehouse");
        isWarehouse[w] = allowed;
    }

    function createSeries(
        string calldata receiptNo,
        string calldata commodity,
        string calldata grade,
        bytes32 docHash,
        address warehouse,
        uint256 pricePerKg,
        uint256 maxKg
    ) external returns (uint256 id) {
        // Owner boleh membuat seri untuk gudang mana pun; gudang terdaftar hanya untuk dirinya sendiri.
        if (msg.sender != owner()) {
            require(isWarehouse[msg.sender], "not owner or warehouse");
            require(warehouse == msg.sender, "warehouse must be sender");
        }
        require(docHash != bytes32(0), "docHash 0");
        require(pricePerKg > 0, "price 0");
        require(maxKg > 0, "maxKg 0");

        // id diambil dulu, baru increment: seriesIds mulai dari 1.
        id = nextSeriesId;
        nextSeriesId = id + 1;

        series[id] = Series({
            receiptNo: receiptNo,
            commodity: commodity,
            grade: grade,
            docHash: docHash,
            warehouse: warehouse,
            pricePerKg: pricePerKg,
            maxKg: maxKg,
            mintedKg: 0,
            redeemedKg: 0,
            active: true
        });
        seriesIds.push(id);

        emit SeriesCreated(id, receiptNo, docHash, maxKg);
    }

    function mintReceipt(uint256 seriesId, address to, uint256 kg) external onlyWarehouse nonReentrant {
        Series storage s = series[seriesId];
        require(s.active, "series inactive");
        require(isWarehouse[s.warehouse], "warehouse not allowed");
        require(kg > 0, "kg 0");
        require(s.mintedKg + kg <= s.maxKg, "over issuance");

        s.mintedKg += kg;
        _mint(to, seriesId, kg, "");

        emit ReceiptMinted(seriesId, to, kg);
    }

    function setPrice(uint256 seriesId, uint256 newPricePerKg) external onlyOwner {
        Series storage s = series[seriesId];
        require(s.warehouse != address(0), "no series");
        require(newPricePerKg > 0, "price 0");

        uint256 oldPrice = s.pricePerKg;
        s.pricePerKg = newPricePerKg;

        emit PriceUpdated(seriesId, oldPrice, newPricePerKg);
    }

    function getSeries() external view returns (Series[] memory list) {
        list = new Series[](seriesIds.length);
        for (uint256 i = 0; i < seriesIds.length; i++) {
            list[i] = series[seriesIds[i]];
        }
    }

    // --- petani: pinjam, lunasi, kesehatan posisi ---

    function borrow(uint256 seriesId, uint256 kg) external nonReentrant {
        require(!loans[msg.sender].active, "loan active");
        require(kg > 0, "kg 0");

        Series storage s = series[seriesId];
        require(s.active, "series inactive");

        uint256 value = kg * s.pricePerKg;
        uint256 principal = (value * MAX_LTV_BPS) / BPS_DENOMINATOR;
        require(principal > 0, "principal 0");
        require(idrx.balanceOf(address(this)) >= principal, "pool insufficient");

        // Resi masuk escrow SEBELUM IDRX keluar.
        _safeTransferFrom(msg.sender, address(this), seriesId, kg, "");

        uint256 debt = (principal * (BPS_DENOMINATOR + INTEREST_BPS)) / BPS_DENOMINATOR;

        totalOutstandingPrincipal += principal;
        loans[msg.sender] = Loan({
            seriesId: seriesId,
            collateralKg: kg,
            principal: principal,
            debt: debt,
            active: true
        });

        require(idrx.transfer(msg.sender, principal), "transfer failed");

        emit Borrowed(msg.sender, seriesId, kg, principal);
    }

    function repay() external nonReentrant {
        Loan memory loan = loans[msg.sender];
        require(loan.active, "no loan");

        require(idrx.transferFrom(msg.sender, address(this), loan.debt), "transfer failed");
        _safeTransferFrom(address(this), msg.sender, loan.seriesId, loan.collateralKg, "");

        totalOutstandingPrincipal -= loan.principal;
        delete loans[msg.sender];

        emit Repaid(msg.sender, loan.principal, loan.debt - loan.principal);
    }

    function maxBorrow(uint256 seriesId, uint256 kg) public view returns (uint256) {
        return (kg * series[seriesId].pricePerKg * MAX_LTV_BPS) / BPS_DENOMINATOR;
    }

    function collateralValueOf(address user) public view returns (uint256) {
        Loan memory loan = loans[user];
        if (!loan.active) return 0;
        return loan.collateralKg * series[loan.seriesId].pricePerKg;
    }

    function ltvBps(address user) public view returns (uint256) {
        uint256 value = collateralValueOf(user);
        if (value == 0) return 0;
        return (loans[user].debt * BPS_DENOMINATOR) / value;
    }

    function isLiquidatable(address user) public view returns (bool) {
        Loan memory loan = loans[user];
        if (!loan.active) return false;
        uint256 value = collateralValueOf(user);
        return (loan.debt * BPS_DENOMINATOR) >= (value * LIQ_THRESHOLD_BPS);
    }

    // --- likuidasi: jaminan pindah ke seizedKg, tanpa kirim IDRX ---

    function liquidate(address user) external nonReentrant {
        Loan memory loan = loans[user];
        require(loan.active, "no loan");
        require(isLiquidatable(user), "not liquidatable");

        seizedKg[loan.seriesId] += loan.collateralKg;
        totalOutstandingPrincipal -= loan.principal;
        delete loans[user];

        emit Liquidated(user, loan.seriesId, loan.collateralKg, loan.debt);
    }

    // --- redemption: resi dibakar, kg fisik diambil ---

    function redeem(uint256 seriesId, uint256 kg) external nonReentrant {
        require(kg > 0, "kg 0");
        require(balanceOf(msg.sender, seriesId) >= kg, "insufficient receipt");

        _burn(msg.sender, seriesId, kg);
        series[seriesId].redeemedKg += kg;

        emit Redeemed(seriesId, msg.sender, kg);
    }

    // --- pasar per kg: pemilik resi titip jual, investor beli pecahan kg ---

    function listForSale(uint256 seriesId, uint256 kg, uint256 pricePerKg)
        external
        nonReentrant
        returns (uint256 listingId)
    {
        require(series[seriesId].active, "series inactive");
        require(kg > 0, "kg 0");
        require(pricePerKg > 0, "price 0");

        // Kontrak = token, jadi escrow tidak butuh setApprovalForAll.
        _safeTransferFrom(msg.sender, address(this), seriesId, kg, "");

        listingId = nextListingId;
        nextListingId = listingId + 1;
        listings[listingId] =
            Listing({seller: msg.sender, seriesId: seriesId, kgLeft: kg, pricePerKg: pricePerKg, active: true});

        emit Listed(listingId, msg.sender, seriesId, kg, pricePerKg);
    }

    function buy(uint256 listingId, uint256 kg) external nonReentrant {
        Listing storage l = listings[listingId];
        require(l.active, "listing inactive");
        require(kg > 0, "kg 0");
        require(kg <= l.kgLeft, "not enough kg");

        uint256 paid = kg * l.pricePerKg;
        uint256 fee = (paid * TRADE_FEE_BPS) / BPS_DENOMINATOR;

        l.kgLeft -= kg;
        if (l.kgLeft == 0) l.active = false;

        // Fee masuk saldo kontrak -> menaikkan totalAssets pool (yield lender).
        require(idrx.transferFrom(msg.sender, l.seller, paid - fee), "transfer failed");
        if (fee > 0) require(idrx.transferFrom(msg.sender, address(this), fee), "fee failed");
        _safeTransferFrom(address(this), msg.sender, l.seriesId, kg, "");

        emit Bought(listingId, msg.sender, kg, paid, fee);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage l = listings[listingId];
        require(l.active, "listing inactive");
        require(l.seller == msg.sender, "not seller");

        uint256 kg = l.kgLeft;
        l.kgLeft = 0;
        l.active = false;
        _safeTransferFrom(address(this), msg.sender, l.seriesId, kg, "");

        emit ListingCancelled(listingId, kg);
    }

    /// @return list semua listing (indeks i = listingId i+1), termasuk yang sudah tidak aktif.
    function getListings() external view returns (Listing[] memory list) {
        list = new Listing[](nextListingId - 1);
        for (uint256 i = 0; i < list.length; i++) {
            list[i] = listings[i + 1];
        }
    }

    // --- pool pemberi pinjaman ---

    function totalAssets() public view returns (uint256) {
        return idrx.balanceOf(address(this)) + totalOutstandingPrincipal;
    }

    /// @return harga satu share, 1e18 = 1.0
    function sharePrice() public view returns (uint256) {
        if (totalShares == 0) return 1e18;
        return (totalAssets() * 1e18) / totalShares;
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "amount 0");
        require(idrx.transferFrom(msg.sender, address(this), amount), "transfer failed");

        // totalAssets() sudah termasuk `amount`, jadi kurangi dulu untuk share pertama.
        uint256 s = totalShares == 0 ? amount : (amount * totalShares) / (totalAssets() - amount);

        shares[msg.sender] += s;
        totalShares += s;

        emit PoolDeposit(msg.sender, amount, s);
    }

    function withdraw(uint256 shareAmount) external nonReentrant {
        require(shareAmount > 0, "shares 0");
        require(totalShares > 0, "no shares");
        require(shares[msg.sender] >= shareAmount, "insufficient shares");

        uint256 amount = (shareAmount * totalAssets()) / totalShares;
        require(idrx.balanceOf(address(this)) >= amount, "pool illiquid");

        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;

        require(idrx.transfer(msg.sender, amount), "transfer failed");

        emit PoolWithdraw(msg.sender, shareAmount, amount);
    }
}
