// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MockIDRX} from "./MockIDRX.sol";

/// @title Tuai Lite
/// @notice Resi gudang sebagai ERC1155 + pinjaman IDRX dengan jaminan resi.
/// @dev MVP testnet. Satu user hanya boleh punya satu pinjaman aktif.
contract TuaiLite is ERC1155, Ownable, ReentrancyGuard {
    // --- konstanta (jangan diubah) ---
    uint256 public constant MAX_LTV_BPS = 6000; // 60%
    uint256 public constant LIQ_THRESHOLD_BPS = 8000; // 80%
    uint256 public constant INTEREST_BPS = 200; // 2% flat per pinjaman
    uint256 public constant BPS_DENOMINATOR = 10_000;

    // --- model data ---
    struct Series {
        string receiptNo; // "RESI-2026-001"
        string commodity; // "Kopi Arabika"
        string grade; // "Grade 1"
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

    // --- event ---
    event SeriesCreated(uint256 indexed seriesId, string receiptNo, uint256 maxKg);
    event ReceiptMinted(uint256 indexed seriesId, address indexed to, uint256 kg);
    event PriceUpdated(uint256 indexed seriesId, uint256 oldPrice, uint256 newPrice);
    event Borrowed(address indexed user, uint256 indexed seriesId, uint256 kg, uint256 principal);
    event Repaid(address indexed user, uint256 principal, uint256 interest);
    event Liquidated(address indexed user, uint256 indexed seriesId, uint256 kg, uint256 debt);
    event Redeemed(uint256 indexed seriesId, address indexed holder, uint256 kg);
    event PoolDeposit(address indexed lender, uint256 amount, uint256 shares);
    event PoolWithdraw(address indexed lender, uint256 shares, uint256 amount);
    event SeizedSold(uint256 indexed seriesId, address indexed buyer, uint256 kg, uint256 paid);

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
}
