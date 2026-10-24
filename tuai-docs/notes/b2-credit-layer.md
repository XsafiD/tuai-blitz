# B2 — Lapisan kredit (T4–T7)

Tanggal: 2026-10-24 · file: `app/packages/foundry/contracts/TuaiBlitz.sol` · commit `2317b3d`

## Yang ditambahkan

- `borrow` — urutan 10 langkah sesuai dokumen (cek → `value` → `principal` → saldo pool → escrow resi → `debt` → `totalOutstandingPrincipal` → simpan `loans` → transfer IDRX → event).
- `repay`, `maxBorrow`, `collateralValueOf`, `ltvBps`, `isLiquidatable`.
- `liquidate` — hanya memindahkan jaminan ke `seizedKg`, tidak mengirim IDRX.
- `redeem` — `_burn` lalu `redeemedKg += kg`.
- Pool: `deposit`, `withdraw`, `totalAssets`, `sharePrice`.
- T19 `sellSeized` **tidak** dikerjakan (P2, tidak dipakai gate mana pun).

## Verifikasi (anvil + cast, 32 cek, semua PASS)

| Hal | Hasil |
|---|---|
| `maxBorrow(1, 2000)` | `120_000_000e6` |
| `loan.principal` / `loan.debt` | `120_000_000e6` / `122_400_000e6` |
| `ltvBps` saat pinjam | `6120` (61,2%) |
| `collateralValueOf` | `200_000_000e6` (Rp200 jt) |
| escrow resi di kontrak | `2000` kg |
| pinjaman kedua | revert `loan active` |
| `isLiquidatable` @80k / @70k | `false` / `true` |
| `seizedKg` setelah likuidasi | `2000` |
| `totalOutstandingPrincipal` setelah likuidasi | `0` |
| `repay` | 2000 kg kembali, loan terhapus, outstanding `0` |
| `redeem` 100 kg | saldo 1900, `redeemedKg=100` |
| `sharePrice` awal → setelah bunga | `1e18` → `0.7648e18` (alur uji memuat kerugian likuidasi) |
| `withdraw` 250e12 share | `191_200_000_000_000` IDRX |

## Koreksi angka dokumen (penting untuk B3)

`BATCH-PLAN.md` menulis principal `120_000e6`. Aritmetika sebenarnya:

```
2000 kg × 100_000e6        = 200_000_000e6   (Rp200 juta)
× 6000 / 10000             = 120_000_000e6   (Rp120 juta)
```

Jadi `120_000e6` kurang **1000×**. Angka yang benar adalah **`120_000_000e6`** (1,2e14 base unit), konsisten dengan T20: jaminan Rp200 jt, pinjaman Rp120 jt, LTV 61%.

Konsekuensi untuk B3:

- `idrx.mint(pool, 1_000_000_000e6)` (bukan `1_000_000e6`)
- `deposit(500_000_000e6)` (bukan `500_000e6`)
- assert `principal == 120_000_000e6`, `debt == 122_400_000e6`

## Quirk toolchain (untuk batch berikutnya)

1. `cast call` yang dijalankan dari `app/packages/foundry` memuat `.env` → `ETH_KEYSTORE_ACCOUNT` → error "Keystore file ... does not exist" walau hanya operasi baca. Jalankan `cast` dari direktori lain (mis. `/tmp/opencode`) atau override env.
2. `forge create --constructor-args <addr>` di forge 1.8.6 mencoba RPC default `localhost:8545` dan gagal. Pakai `--constructor-args-path <file>` (satu argumen per baris).
