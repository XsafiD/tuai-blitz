// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockIDRX} from "../contracts/MockIDRX.sol";
import {TuaiBlitz} from "../contracts/TuaiBlitz.sol";

/// @notice T8 + T9: setup bersama dan tiga test inti Tuai Blitz.
/// @dev Angka mengikuti notes/b2-credit-layer.md (principal 120_000_000e6, bukan 120_000e6).
contract TuaiBlitzTest is Test {
    // --- konstanta skenario demo ---
    uint256 internal constant PRICE_PER_KG = 100_000e6; // Rp100.000 / kg
    uint256 internal constant MAX_KG = 2000; // 2.000 kg
    uint256 internal constant SERIES_ID = 1;
    bytes32 internal constant DOC_HASH = keccak256("RESI-001.pdf");

    uint256 internal constant COLLATERAL_VALUE = 200_000_000e6; // Rp200 juta
    uint256 internal constant PRINCIPAL = 120_000_000e6; // 60% dari nilai jaminan = Rp120 juta
    uint256 internal constant INTEREST = 2_400_000e6; // 2% flat = Rp2,4 juta
    uint256 internal constant DEBT = PRINCIPAL + INTEREST; // Rp122,4 juta

    uint256 internal constant LENDER_FUNDS = 1_000_000_000e6; // Rp1 miliar
    uint256 internal constant POOL_DEPOSIT = 500_000_000e6; // Rp500 juta

    MockIDRX internal idrx;
    TuaiBlitz internal tuai;

    address internal warehouse = makeAddr("warehouse");
    address internal farmer = makeAddr("farmer");
    address internal lender = makeAddr("lender");
    address internal investor = makeAddr("investor");

    function setUp() public {
        // T8 — deploy, daftarkan gudang, buat seri RESI-001.
        idrx = new MockIDRX();
        tuai = new TuaiBlitz(address(idrx));

        tuai.setWarehouse(warehouse, true);
        tuai.createSeries("RESI-001", "Kopi Arabika", "Grade 1", DOC_HASH, warehouse, PRICE_PER_KG, MAX_KG);

        // Isi pool lewat lender: mint -> approve -> deposit.
        idrx.mint(lender, LENDER_FUNDS);
        vm.startPrank(lender);
        idrx.approve(address(tuai), type(uint256).max);
        tuai.deposit(POOL_DEPOSIT);
        vm.stopPrank();

        // Terbitkan 2.000 kg resi ke petani.
        vm.prank(warehouse);
        tuai.mintReceipt(SERIES_ID, farmer, MAX_KG);
    }

    /// @notice Pinjaman 60% dari nilai jaminan, bukan lebih.
    function testBorrowSixtyPercent() public {
        vm.startPrank(farmer);
        tuai.setApprovalForAll(address(tuai), true);
        tuai.borrow(SERIES_ID, MAX_KG);
        vm.stopPrank();

        // IDRX cair ke petani, resi masuk escrow kontrak.
        assertEq(idrx.balanceOf(farmer), PRINCIPAL, "IDRX cair != 60% jaminan");
        assertEq(tuai.balanceOf(address(tuai), SERIES_ID), MAX_KG, "resi tidak di escrow");
        assertEq(tuai.balanceOf(farmer, SERIES_ID), 0, "resi masih di petani");

        // Batas pinjam, nilai jaminan, dan LTV.
        assertEq(tuai.maxBorrow(SERIES_ID, MAX_KG), PRINCIPAL, "maxBorrow salah");
        assertEq(tuai.collateralValueOf(farmer), COLLATERAL_VALUE, "nilai jaminan salah");
        assertEq(tuai.ltvBps(farmer), 6120, "LTV harus 61,2% karena debt termasuk bunga");
        assertEq(tuai.collateralValueOf(farmer) * tuai.MAX_LTV_BPS() / tuai.BPS_DENOMINATOR(), PRINCIPAL);

        // debt = principal + bunga flat 2%.
        (uint256 seriesId, uint256 collateralKg, uint256 principal, uint256 debt, bool active) = tuai.loans(farmer);
        assertEq(seriesId, SERIES_ID);
        assertEq(collateralKg, MAX_KG);
        assertEq(principal, PRINCIPAL);
        assertEq(debt, DEBT);
        assertTrue(active);
        assertEq(tuai.totalOutstandingPrincipal(), PRINCIPAL);

        // Satu user hanya boleh punya satu pinjaman aktif.
        vm.prank(farmer);
        vm.expectRevert("loan active");
        tuai.borrow(SERIES_ID, 1);
    }

    /// @notice Melunasi debt mengembalikan seluruh jaminan dan menghapus pinjaman.
    function testRepayReturnsCollateral() public {
        vm.startPrank(farmer);
        tuai.setApprovalForAll(address(tuai), true);
        tuai.borrow(SERIES_ID, MAX_KG);

        // Petani hanya pegang principal; tambal bunga untuk bisa melunasi penuh.
        idrx.mint(farmer, INTEREST);
        idrx.approve(address(tuai), DEBT);
        tuai.repay();
        vm.stopPrank();

        // Jaminan kembali utuh, saldo IDRX petani habis terpakai.
        assertEq(tuai.balanceOf(farmer, SERIES_ID), MAX_KG, "jaminan tidak kembali");
        assertEq(tuai.balanceOf(address(tuai), SERIES_ID), 0, "escrow tidak kosong");
        assertEq(idrx.balanceOf(farmer), 0, "saldo petani harus habis");

        // Pinjaman terhapus, outstanding nol, pool menerima principal + bunga.
        (,,,, bool active) = tuai.loans(farmer);
        assertFalse(active, "pinjaman masih aktif");
        assertEq(tuai.totalOutstandingPrincipal(), 0, "outstanding tidak nol");
        assertEq(tuai.collateralValueOf(farmer), 0);
        assertEq(idrx.balanceOf(address(tuai)), POOL_DEPOSIT + INTEREST);
        assertEq(tuai.totalAssets(), POOL_DEPOSIT + INTEREST);
    }

    /// @notice Likuidasi: tidak pada harga Rp80k, ya pada Rp70k; jaminan jadi seizedKg.
    function testLiquidationAtEightyPercent() public {
        vm.startPrank(farmer);
        tuai.setApprovalForAll(address(tuai), true);
        tuai.borrow(SERIES_ID, MAX_KG);
        vm.stopPrank();

        uint256 poolBefore = idrx.balanceOf(address(tuai));

        // Harga turun ke Rp80.000: LTV 76,5% < 80% -> belum bisa dilikuidasi.
        tuai.setPrice(SERIES_ID, 80_000e6);
        assertEq(tuai.collateralValueOf(farmer), 160_000_000e6);
        assertEq(tuai.ltvBps(farmer), 7650);
        assertFalse(tuai.isLiquidatable(farmer), "Rp80k seharusnya belum likuidatable");

        vm.expectRevert("not liquidatable");
        tuai.liquidate(farmer);

        // Harga turun ke Rp70.000: LTV 87,4% >= 80% -> likuidasi.
        tuai.setPrice(SERIES_ID, 70_000e6);
        assertTrue(tuai.isLiquidatable(farmer), "Rp70k seharusnya likuidatable");

        tuai.liquidate(farmer);

        // Jaminan tercatat di seizedKg dan tetap di kustodi kontrak (T5: tidak ada transfer token).
        assertEq(tuai.seizedKg(SERIES_ID), MAX_KG, "seizedKg salah");
        assertEq(tuai.balanceOf(address(tuai), SERIES_ID), MAX_KG, "token jaminan harus tetap di kontrak");
        assertEq(idrx.balanceOf(address(tuai)), poolBefore, "likuidasi tidak boleh mengirim IDRX");
        assertEq(tuai.totalOutstandingPrincipal(), 0);

        (,,,, bool active) = tuai.loans(farmer);
        assertFalse(active, "pinjaman masih aktif");
        assertFalse(tuai.isLiquidatable(farmer), "pinjaman terhapus masih likuidatable");
    }

    // --- v2: docHash, gudang buat seri, pasar per kg ---

    uint256 internal constant LIST_KG = 500;

    function _listAndFundInvestor() internal returns (uint256 listingId) {
        vm.prank(farmer);
        listingId = tuai.listForSale(SERIES_ID, LIST_KG, PRICE_PER_KG);

        idrx.mint(investor, LENDER_FUNDS);
        vm.prank(investor);
        idrx.approve(address(tuai), type(uint256).max);
    }

    /// @notice Hash dokumen resi tersimpan di seri.
    function testCreateSeriesStoresDocHash() public view {
        TuaiBlitz.Series[] memory list = tuai.getSeries();
        assertEq(list.length, 1);
        assertEq(list[0].docHash, DOC_HASH, "docHash tidak tersimpan");
        assertEq(list[0].warehouse, warehouse);
    }

    /// @notice Gudang terdaftar boleh menerbitkan seri sendiri, tidak untuk gudang lain.
    function testWarehouseCanCreateOwnSeries() public {
        vm.prank(warehouse);
        uint256 id = tuai.createSeries("RESI-002", "Gabah", "Grade 1", DOC_HASH, warehouse, 6_000e6, 5000);
        assertEq(id, 2);

        vm.prank(warehouse);
        vm.expectRevert("warehouse must be sender");
        tuai.createSeries("RESI-003", "Gabah", "Grade 1", DOC_HASH, farmer, 6_000e6, 5000);

        vm.prank(farmer);
        vm.expectRevert("not owner or warehouse");
        tuai.createSeries("RESI-004", "Gabah", "Grade 1", DOC_HASH, farmer, 6_000e6, 5000);

        vm.expectRevert("docHash 0");
        tuai.createSeries("RESI-005", "Gabah", "Grade 1", bytes32(0), warehouse, 6_000e6, 5000);
    }

    /// @notice Investor beli 100 kg: penjual terima 99,5%, fee 0,5% masuk pool.
    function testBuyPerKgPaysSellerAndFee() public {
        uint256 listingId = _listAndFundInvestor();
        assertEq(listingId, 1);
        assertEq(tuai.balanceOf(farmer, SERIES_ID), MAX_KG - LIST_KG, "kg listing harus di escrow");
        assertEq(tuai.balanceOf(address(tuai), SERIES_ID), LIST_KG);

        uint256 paid = 100 * PRICE_PER_KG; // Rp10 juta
        uint256 fee = paid * tuai.TRADE_FEE_BPS() / tuai.BPS_DENOMINATOR(); // Rp50 ribu

        vm.prank(investor);
        tuai.buy(listingId, 100);

        assertEq(tuai.balanceOf(investor, SERIES_ID), 100, "investor tidak terima kg");
        assertEq(idrx.balanceOf(farmer), paid - fee, "penjual harus terima 99,5%");
        assertEq(idrx.balanceOf(investor), LENDER_FUNDS - paid);
        assertEq(tuai.totalAssets(), POOL_DEPOSIT + fee, "fee harus menambah pool");
        assertGt(tuai.sharePrice(), 1e18, "share price lender harus naik");

        (,, uint256 kgLeft,, bool active) = tuai.listings(listingId);
        assertEq(kgLeft, LIST_KG - 100);
        assertTrue(active);
    }

    /// @notice Beli sebagian sampai habis, lalu batalkan listing lain; kg kembali ke penjual.
    function testPartialBuyAndCancel() public {
        uint256 listingId = _listAndFundInvestor();

        vm.startPrank(investor);
        tuai.buy(listingId, 400);
        vm.expectRevert("not enough kg");
        tuai.buy(listingId, 200);
        tuai.buy(listingId, 100);
        vm.expectRevert("listing inactive");
        tuai.buy(listingId, 1);
        vm.stopPrank();

        (,, uint256 kgLeft,, bool active) = tuai.listings(listingId);
        assertEq(kgLeft, 0);
        assertFalse(active, "listing habis harus nonaktif");
        assertEq(tuai.balanceOf(investor, SERIES_ID), LIST_KG);

        // Listing kedua dibatalkan: hanya penjual yang boleh.
        vm.prank(farmer);
        uint256 second = tuai.listForSale(SERIES_ID, 300, PRICE_PER_KG);
        assertEq(tuai.balanceOf(farmer, SERIES_ID), MAX_KG - LIST_KG - 300);

        vm.prank(investor);
        vm.expectRevert("not seller");
        tuai.cancelListing(second);

        vm.prank(farmer);
        tuai.cancelListing(second);
        assertEq(tuai.balanceOf(farmer, SERIES_ID), MAX_KG - LIST_KG, "kg tidak kembali");
        assertEq(tuai.getListings().length, 2);
    }

    /// @notice Kg yang sedang dijual tidak bisa sekaligus dijadikan jaminan.
    function testListedKgCannotBeBorrowed() public {
        _listAndFundInvestor();

        vm.prank(farmer);
        vm.expectRevert();
        tuai.borrow(SERIES_ID, MAX_KG);

        vm.prank(farmer);
        tuai.borrow(SERIES_ID, MAX_KG - LIST_KG);
        assertEq(idrx.balanceOf(farmer), tuai.maxBorrow(SERIES_ID, MAX_KG - LIST_KG));
    }
}
