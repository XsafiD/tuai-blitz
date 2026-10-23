// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockIDRX} from "../contracts/MockIDRX.sol";
import {TuaiLite} from "../contracts/TuaiLite.sol";

/// @notice T8 + T9: setup bersama dan tiga test inti Tuai Lite.
/// @dev Angka mengikuti notes/b2-credit-layer.md (principal 120_000_000e6, bukan 120_000e6).
contract TuaiLiteTest is Test {
    // --- konstanta skenario demo ---
    uint256 internal constant PRICE_PER_KG = 100_000e6; // Rp100.000 / kg
    uint256 internal constant MAX_KG = 2000; // 2.000 kg
    uint256 internal constant SERIES_ID = 1;

    uint256 internal constant COLLATERAL_VALUE = 200_000_000e6; // Rp200 juta
    uint256 internal constant PRINCIPAL = 120_000_000e6; // 60% dari nilai jaminan = Rp120 juta
    uint256 internal constant INTEREST = 2_400_000e6; // 2% flat = Rp2,4 juta
    uint256 internal constant DEBT = PRINCIPAL + INTEREST; // Rp122,4 juta

    uint256 internal constant LENDER_FUNDS = 1_000_000_000e6; // Rp1 miliar
    uint256 internal constant POOL_DEPOSIT = 500_000_000e6; // Rp500 juta

    MockIDRX internal idrx;
    TuaiLite internal tuai;

    address internal warehouse = makeAddr("warehouse");
    address internal farmer = makeAddr("farmer");
    address internal lender = makeAddr("lender");

    function setUp() public {
        // T8 — deploy, daftarkan gudang, buat seri RESI-001.
        idrx = new MockIDRX();
        tuai = new TuaiLite(address(idrx));

        tuai.setWarehouse(warehouse, true);
        tuai.createSeries("RESI-001", "Kopi Arabika", "Grade 1", warehouse, PRICE_PER_KG, MAX_KG);

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
}
