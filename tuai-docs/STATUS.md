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
| T12 | Wallet & config | P0 | B4 | [x] | keystore `tuai-deployer` = `0x0548…820a`; di-fund 1 MON; deploy testnet sukses |
| T13 | Deploy testnet | P0 | B4 | [x] | **MockIDRX**: `0xEAa62e5E56762216eC3750eaC7c0516F71a98052` · **TuaiBlitz**: `0xcb69deB7Db12C64943D105098d51654650e50185` · sisa 0,154 MON |
| T14 | Halaman baca seri | P0 | B5 | [x] | `app/tuai/page.tsx` + `components/tuai/*`; style dari `docs.lokal/Lumbung UI.html` (board "Tuai Lite · halaman demo"): gelap + lime, Geist, kartu resi kertas, chip langkah; `/` → redirect `/tuai`; `targetNetworks` hanya `monadTestnet` |
| T15 | Aksi tulis | P0 | B5 | [x] | Gudang: createSeries (+docHash dari file) & mint · Petani: borrow/repay/listForSale/cancel · Investor: faucet/buy/deposit/withdraw · Admin: setPrice (preset 100k/80k/70k + slider), liquidate, setWarehouse; approve IDRX otomatis; log tx → explorer. **Belum diuji klik end-to-end di wallet** |
| T16 | Format & warna LTV | P0 | B5 | [x] | `formatIDR`, bar LTV 3 zona (aman <70, waspada 70–80, likuidasi ≥80 sesuai design + ambang kontrak), harga likuidasi/kg |
| T17 | Panel lender | P1 | B5 | [ ] | skip kalau > 30 m |
| T18 | Event feed | P1 | B5 | [ ] | skip kalau > 30 m |
| T19 | `sellSeized` | P2 | B2 | [ ] | dilewati — P2; **digantikan T25** (pasar per kg) |
| T20 | Seed demo | P0 | B6 | [ ] | |
| T21 | Uji alur penuh | P0 | B6 | [ ] | |
| T22 | Rekaman cadangan | P0 | B6 | [ ] | link cloud: ____ |
| T23 | Latihan pitch | P0 | B6 | [ ] | ikuti kerangka demo 3 menit di checklist |
| T24 | `docHash` + gudang boleh `createSeries` | P0 | B7 | [x] | `createSeries(receiptNo, commodity, grade, docHash, warehouse, price, maxKg)`; owner atau gudang (untuk dirinya); `docHash` ≠ 0 |
| T25 | Pasar per kg (`listForSale`/`buy`/`cancelListing`, fee 0,5% → pool) | P0 | B7 | [x] | + `getListings()`, `TRADE_FEE_BPS=50`; escrow tanpa `setApprovalForAll`; beli sebagian OK |
| T26 | Test v2 (docHash, beli per kg, partial, cancel) + 4 lama | P0 | B7 | [x] | **9 lulus**, 0 gagal, 0 skip → **ABI FINAL**; optimizer ON (200 runs): runtime 28,9 KB → 16,6 KB |
| T27 | Redeploy testnet + `deployedContracts.ts` chain 10143 | P0 | B8 | [x] | **MockIDRX**: `0xd6463…80b6` · **TuaiBlitz**: `0x4c35…0B2B`; sisa 6,58 MON; blok 10143 di `deployedContracts.ts` ditambahkan manual dari `deployments/10143.json` + ABI `out/` (`broadcast/` di-ignore); blok 31337 masih ABI v1 → regenerate saat `yarn deploy` lokal |
| T28 | Verifikasi kontrak di explorer | P0 | B8 | [x] | Sourcify Monad (blockvision): MockIDRX matchId 2058153, TuaiBlitz 2058154 — creation + runtime **full match** |
| T29 | Live URL (Vercel) | P0 | B9 | [ ] | URL: ____ |
| T30 | README submit | P0 | B9 | [ ] | repo, alamat, live URL, verified, model bisnis |
| T31 | Submit | P0 | B9 | [ ] | **≤ 16:30** (lock 16:45) |
| T32 | Simulasi 30 investor | P1 | B10 | [ ] | hanya jika T21 lulus |

## Blokir

| Waktu | Task | Alasan | Aksi |
|---|---|---|---|
| 2026-10-24 10:45 | T13 | Saldo deployer `0x0548…820a` = **0 MON**; butuh ±0,83 MON | Difund 1 MON → deploy sukses 11:28 WIB |
| 2026-10-24 | T27 | Kontrak 11:28 belum punya `docHash` & beli per kg (checklist acara) | Kerjakan B7 lalu redeploy; saldo sudah 7,154 MON |

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
| B4 | 2 alamat di explorer | PASS (MockIDRX + TuaiBlitz terlihat di testnet.monadexplorer.com) | 2026-10-24 11:28 |
| B4 | 2 alamat di explorer | (baris ganda — abaikan, lihat baris PASS di atas) | |
| B5 | alur UI end-to-end | belum | |
| B6 | video laptop + cloud | belum | |
| B7 | `forge test` kontrak v2 | PASS (9/9; simulasi deploy 10143 OK, gas 5,58 jt ≈ ≤1,12 MON) | 2026-10-24 11:5x |
| B8 | redeploy + verified | PASS — redeploy 12:07 (2 alamat v2, bytecode = build lokal); verified Sourcify full match 12:37 | 2026-10-24 12:37 |
| B9 | live URL + README + submit | belum | |

**Koreksi angka (B2):** `BATCH-PLAN` menulis principal `120_000e6`. Aritmetika sebenarnya `2000 × 100_000e6 × 6000/10000 = 120_000_000e6` (Rp120 juta) — angka di dokumen kurang 1000×. Dipakai angka benar agar konsisten dengan target demo T20 (jaminan Rp200 jt, pinjaman Rp120 jt, LTV 61%). Rincian + implikasi B3: `notes/b2-credit-layer.md`.

**Catatan B3:** `liquidate` tidak memindahkan/membakar token jaminan — token tetap di kustodi kontrak dan `seizedKg` menjadi catatan akuntansinya (sesuai T5). Detail: `notes/b3-tests.md`.

**Brand (B4):** produk = **Tuai Blitz**; repo = `github.com/XsafiD/tuai-blitz`. Kontrak di-rename `TuaiLite` → `TuaiBlitz` (kosmetik: nama file/artifact, **selector ABI tidak berubah**, test tetap 4/4).

## Alamat deployment

```
Network : Monad Testnet (10143)
MockIDRX: 0xd6463A40844d535c10a0AF85FDC09144D17b80b6
TuaiBlitz: 0x4c35241BBbdD33FfAD0C3d9928bC8607F0560B2B
Deployer: 0x0548b15Fc15eC4779ad1E766aa3c93C827AB820a
Waktu   : 2026-10-24 12:07 WIB
Catatan : versi v2 — docHash + pasar per kg (T27)
```
