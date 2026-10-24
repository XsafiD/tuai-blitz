# B3 — Tiga test inti (T8–T10)

Tanggal: 2026-10-24 · file: `app/packages/foundry/test/TuaiBlitz.t.sol` · commit `ab60b06`

## Hasil gate

```
forge test -vv
Ran 2 test suites: 4 tests passed, 0 failed, 0 skipped
```

| Test | Cek utama | Hasil |
|---|---|---|
| `testBorrowSixtyPercent` | saldo petani `120_000_000e6`, escrow 2000 kg, `debt=122_400_000e6`, LTV `6120` bps, pinjaman kedua revert `loan active` | PASS |
| `testRepayReturnsCollateral` | 2000 kg kembali, `loans` terhapus, outstanding `0`, pool `POOL_DEPOSIT + INTEREST` | PASS |
| `testLiquidationAtEightyPercent` | @80k `false` + revert `not liquidatable`; @70k `true`; `seizedKg=2000`; tanpa transfer IDRX | PASS |
| `testMessageOnDeployment` (bawaan) | — | PASS |

**ABI BEKU** setelah gate ini: tidak ada perubahan signature fungsi mulai B4.

## Setup T8

- `MockIDRX` + `TuaiBlitz`, `setWarehouse(warehouse, true)`.
- `createSeries("RESI-001","Kopi Arabika","Grade 1",warehouse,100_000e6,2000)` → `SERIES_ID = 1`.
- Lender: mint `1_000_000_000e6`, approve, `deposit(500_000_000e6)`.
- `mintReceipt(1, farmer, 2000)`.

Angka mengikuti koreksi B2 (`principal 120_000_000e6`, bunga `2_400_000e6`), **bukan** `120_000e6` di dokumen 07.

## Temuan saat menulis test

1. **Likuidasi tidak memindahkan/membakar token jaminan.** `liquidate` hanya `seizedKg += collateralKg` + `delete loans[user]` (sesuai T5). Token 2000 kg tetap di kustodi kontrak dan `seizedKg` menjadi catatan akuntansinya. Assertion test disesuaikan: `balanceOf(kontrak) == seizedKg == 2000`, bukan 0. Ini konsisten dengan rancangan; `sellSeized` (T19) nanti yang akan mengeluarkan token.
2. **LTV saat pinjam = 6120 bps**, bukan 6000, karena `debt` sudah termasuk bunga flat 2% sedangkan `principal` 60% dari nilai jaminan. Test mengunci angka ini agar regresi terlihat.
3. `forge test` dari `app/packages/foundry` tetap memuat `.env`; tidak masalah untuk test (tidak ada RPC), hanya `cast` yang terkena quirk B2.
