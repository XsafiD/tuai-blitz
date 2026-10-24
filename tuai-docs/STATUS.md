# STATUS — Tuai Blitz

Lokasi: `/home/xsafi0/Documents/ASACYBER/riset/vault-004/tuai-lite` · repo: `github.com/XsafiD/tuai-blitz` (lokal `app/`) · dokumen: `app/tuai-docs/`
Papan status hidup. Update setelah setiap task (jangan hapus baris).
Batch & gate: lihat `BATCH-PLAN.md`.

Kolom **B** = batch.

| ID | Task | P | B | Status | Catatan |
|---|---|---|---|---|---|
| T0 | Preflight | P0 | B0 | [x] | OZ **5.3.0** ; hook **API baru** ; forge 1.8.6 lokal ; build/test/deploy/start hijau ; `chains.monad_testnet` → `monadTestnet` diperbaiki |
| T1 | MockIDRX | P0 | B1 | [x] | ERC20 6 desimal + faucet; `forge build` hijau (`ba026e7`) |
| T2 | Kerangka kontrak | P0 | B1 | [x] | struct/state/event + `onERC1155Received` (`526fc59`) |
| T3 | Seri resi | P0 | B1 | [x] | `seriesIds` mulai 1 ; mint 2000 kg OK ; over-issuance & non-warehouse revert ; `PriceUpdated` ter-emit (`a56311c`) |
| T4 | Pinjam & lunasi | P0 | B2 | [x] | 10 langkah persis; 2.000 kg → principal **120_000_000e6** (Rp120 jt), debt `122_400_000e6`, LTV 6120 bps; pinjaman kedua revert (`2317b3d`) |
| T5 | Likuidasi | P0 | B2 | [x] | @80k `false`, @70k `true`; `seizedKg=2000`; outstanding turun principal; tanpa kirim IDRX (`2317b3d`) |
| T6 | Redemption | P0 | B2 | [x] | redeem 100 kg → `_burn` + `redeemedKg=100`, saldo 1900 (`2317b3d`) |
| T7 | Pool | P0 | B2 | [x] | deposit share 1:1, `sharePrice` 1e18; withdraw 250e12 share → `191_200_000_000_000` IDRX; `totalAssets = saldo + outstanding` (`2317b3d`) |
| T8 | Setup test | P0 | B3 | [x] | `test/TuaiBlitz.t.sol`; seri 1, pool `500_000_000e6` (`ab60b06`) |
| T9 | Tiga test inti | P0 | B3 | [x] | borrow 60% / repay / likuidasi 80k→false, 70k→true; semua assert PASS (`ab60b06`) |
| T10 | `forge test` | P0 | B3 | [x] | **4 lulus, 0 gagal, 0 skip**; **ABI BEKU** (`ab60b06`) |
| T11 | Deploy script | P0 | B4 | [x] | `script/DeployTuai.s.sol`; deploy lokal sukses, `MockIDRX`+`TuaiBlitz` ter-generate (`6da9c8a`) |
| T12 | Wallet & config | P0 | B4 | [ ] | keystore `tuai-deployer` = `0x0548…820a` dibuat; saldo **0 MON**; burner browser belum diimpor |
| T13 | Deploy testnet | P0 | B4 | [ ] | simulasi chain 10143 OK; menunggu dana **±0,83 MON** (base fee 100 gwei) |
| T14 | Halaman baca seri | P0 | B5 | [ ] | `app/tuai/page.tsx` |
| T15 | Aksi tulis | P0 | B5 | [ ] | |
| T16 | Format & warna LTV | P0 | B5 | [ ] | |
| T17 | Panel lender | P1 | B5 | [ ] | skip kalau > 30 m |
| T18 | Event feed | P1 | B5 | [ ] | skip kalau > 30 m |
| T19 | `sellSeized` | P2 | B2 | [ ] | dilewati — P2, tidak dipakai gate; ABI dibekukan di B3 |
| T20 | Seed demo | P0 | B6 | [ ] | |
| T21 | Uji alur penuh | P0 | B6 | [ ] | |
| T22 | Rekaman cadangan | P0 | B6 | [ ] | link cloud: ____ |
| T23 | Latihan pitch | P0 | B6 | [ ] | |

## Blokir

| Waktu | Task | Alasan | Aksi |
|---|---|---|---|
| 2026-10-24 10:45 | T13 | Saldo deployer `0x0548…820a` = **0 MON**; butuh ±0,83 MON (base fee 100 gwei × 8,25 jt gas) | Kirim **0,9–1 MON** ke alamat deployer, lalu jalankan T13 |
| | | | |

## Gate log

| Batch | Gate | Hasil | Waktu |
|---|---|---|---|
| B0 | `forge build` + `forge test` baseline | PASS (1 test bawaan) | 2026-10-24 00:2x |
| B0 | anvil + `eth_chainId` | PASS (0x7a69) | |
| B0 | `yarn deploy` lokal + ABI TS | PASS (`deployments/31337.json`) | |
| B0 | `yarn start` → `GET /` | PASS (200, setelah fix `monadTestnet`) | |
| B1 | `forge build` | PASS (0 error) | 2026-10-24 00:45 |
| B1 | anvil + cast: `createSeries`/`mintReceipt`/`setPrice` | PASS (`seriesIds[0]=1`, `mintedKg=2000`, over-issuance & non-warehouse revert, `PriceUpdated` log) | 2026-10-24 00:46 |
| B2 | `forge build` + angka principal | PASS (0 error; 2.000 kg → **120_000_000e6** = Rp120 jt; 32 cek cast di anvil) | 2026-10-24 00:58 |
| B3 | `forge test -vv` 3/3 | PASS (3 inti + 1 bawaan = **4 lulus**, 0 gagal, 0 skip) | 2026-10-24 01:0x |
| B4 | 2 alamat di explorer | belum | |
| B5 | alur UI end-to-end | belum | |
| B6 | video laptop + cloud | belum | |

**Koreksi angka (B2):** `BATCH-PLAN` menulis principal `120_000e6`. Aritmetika sebenarnya `2000 × 100_000e6 × 6000/10000 = 120_000_000e6` (Rp120 juta) — angka di dokumen kurang 1000×. Dipakai angka benar agar konsisten dengan target demo T20 (jaminan Rp200 jt, pinjaman Rp120 jt, LTV 61%). Rincian + implikasi B3: `notes/b2-credit-layer.md`.

**Catatan B3:** `liquidate` tidak memindahkan/membakar token jaminan — token tetap di kustodi kontrak dan `seizedKg` menjadi catatan akuntansinya (sesuai T5). Detail: `notes/b3-tests.md`.

**Brand (B4):** produk = **Tuai Blitz**; repo = `github.com/XsafiD/tuai-blitz`. Kontrak di-rename `TuaiLite` → `TuaiBlitz` (kosmetik: nama file/artifact, **selector ABI tidak berubah**, test tetap 4/4).

## Alamat deployment

```
Network : Monad Testnet (10143)
MockIDRX: - (belum deploy)
TuaiBlitz: - (belum deploy)
Deployer: 0x0548b15Fc15eC4779ad1E766aa3c93C827AB820a
Waktu   : -
```
