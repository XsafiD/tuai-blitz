# BATCH PLAN — Tuai Blitz (eksekusi malam ini)

Sumber: `ide-monad/07-todo-malam-ini.md` (T0–T23).
Folder kerja: `tuai-lite/` (repo scaffold di `tuai-lite/app`, toolchain di `tuai-lite/.tools`).

**Jumlah batch: 7 (B0–B6).** Satu batch = satu sesi kerja yang berakhir di sebuah *gate* yang bisa diverifikasi dengan perintah. Batch berikutnya tidak boleh dimulai kalau gate sebelumnya merah — kecuali gate-nya UI (boleh jalan paralel dengan kontrak, lihat §5).

Total estimasi realistis: **± 7 jam** (5 jam 15 murni + buffer). Kalau mulai 00.00 → selesai ± 07.00. Kalau mulai ≥ 02.30 → langsung **Mode Darurat** (§6).

---

## 0. REVISI 2026-10-24 — selaraskan dengan "Tuai Blitz Checklist" acara

> **Bagian ini menggantikan §1–§3 untuk sisa pekerjaan.** §1–§8 di bawah tetap disimpan sebagai riwayat B0–B4.
> Sumber: `Tuai Blitz Checklist.md` (Monad Blitz Jogja vol.2). **Submit ≤ 16:30**, lock 16:45.

### 0.1 Hasil audit terhadap checklist

| Poin checklist | Status sekarang | Tindakan |
|---|---|---|
| Gudang terdaftar terbitkan resi (komoditas, kg, **hash dokumen**) | ⚠️ tidak ada `docHash`; `createSeries` hanya `onlyOwner` | **T24** |
| Resi = token pecahan per kg milik petani | ✅ ERC1155, 1 token = 1 kg | — |
| Petani pinjam instan, LTV maks 60% | ✅ diuji | — |
| **Investor beli pecahan per kg** | ❌ hanya pool `deposit` (investor = lender, bukan pembeli kg) | **T25** |
| Harga oracle admin → likuidasi | ✅ diuji | — |
| Sudut Monad: "simulasi 30 investor" | ❌ | **T32** (bonus) |
| Live URL | ❌ frontend belum ada | B5 + **T29** |
| Tx terlihat di explorer | ❌ UI belum ada | T15 (link hash) |
| Kontrak **verified** | ❌ | **T28** |
| Repo + contract address di README | ❌ README masih bawaan Scaffold-ETH | **T30** |
| Deploy **selama acara** | ⚠️ deploy 11:28 versi lama | redeploy **T27** (wajib karena ABI berubah) |
| Key tidak ditempel ke AI | ✅ keystore `tuai-deployer` | jalankan deploy sendiri |

**Konsekuensi:** keputusan "ABI BEKU" di B3 **dicabut satu kali** untuk T24 + T25. Setelah B7 hijau → ABI beku lagi (final). Alamat 11:28 (`0xcb69…0185`) dianggap **usang**, jangan dipakai di UI/README.

### 0.2 Urutan prioritas (kerjakan dari atas, jangan lompat)

| # | ID | Task | P | Batch | Estimasi |
|---|---|---|---|---|---|
| 1 | T24 | `docHash` di `Series` + gudang terdaftar boleh `createSeries` | P0 | B7 | 15 m |
| 2 | T25 | Pasar per kg: `listForSale` / `buy` / `cancelListing` + fee jual-beli | P0 | B7 | 35 m |
| 3 | T26 | Test baru + 4 test lama tetap hijau | P0 | B7 | 25 m |
| 4 | T27 | Redeploy testnet + generate `deployedContracts.ts` chain 10143 | P0 | B8 | 15 m |
| 5 | T28 | Verifikasi kedua kontrak di explorer | P0 | B8 | 15 m |
| 6 | T14–T16 | Frontend 4 panel (Gudang, Petani, **Investor**, Admin) + link tx | P0 | B5 | 100 m |
| 7 | T29 | Deploy frontend ke Vercel → live URL | P0 | B9 | 20 m |
| 8 | T20–T21 | Seed demo + uji alur penuh **sesuai urutan demo 3 menit** | P0 | B6 | 30 m |
| 9 | T30 | README submit (deskripsi, alamat, live URL, link verified, model bisnis) | P0 | B9 | 15 m |
| 10 | T22–T23 | Rekaman cadangan + latihan pitch 3 menit | P0 | B6 | 40 m |
| 11 | T31 | **Submit ≤ 16:30** | P0 | B9 | 5 m |
| 12 | T32 | Tombol "simulasi 30 investor" | P1 | B10 | 30 m |
| 13 | T17 / T18 | Panel lender detail / event feed | P2 | — | — |
| 14 | T19 | `sellSeized` (jual jaminan sitaan) — digantikan T25 | P2 | — | — |

**Aturan potong waktu:** kalau jam 15:00 B5 belum hijau → stop fitur, langsung T29 + T30 + T22 dengan apa yang jalan. T32 hanya dikerjakan kalau T21 sudah lulus.

### 0.3 Batch baru

```
B7 (kontrak v2) ──> B8 (redeploy + verify) ──> B5 (frontend) ──> B9 (live URL + README) ──> B6 (demo) ──> submit
                                                                                     └──> B10 (bonus, opsional)
```

#### B7 — Kontrak v2 (T24, T25, T26) · 75 m

File: `packages/foundry/contracts/TuaiBlitz.sol`, `packages/foundry/test/TuaiBlitz.t.sol`.

- **T24**
  - `Series` tambah `bytes32 docHash` (hash PDF/scan resi fisik).
  - `createSeries(receiptNo, commodity, grade, docHash, warehouse, pricePerKg, maxKg)`.
  - Akses: `owner` **atau** `isWarehouse[msg.sender]`; kalau pemanggil gudang, `warehouse` wajib = `msg.sender`.
  - `SeriesCreated` tambah `docHash`.
- **T25** pasar sekunder per kg (escrow di kontrak, tidak butuh `setApprovalForAll` karena kontrak = token):
  - `struct Listing { address seller; uint256 seriesId; uint256 kgLeft; uint256 pricePerKg; bool active; }`
  - `listForSale(seriesId, kg, pricePerKg) returns (listingId)` → `_safeTransferFrom(msg.sender, address(this), …)`.
  - `buy(listingId, kg)` → pembeli bayar `kg × pricePerKg` IDRX; `TRADE_FEE_BPS = 50` (0,5%) masuk **pool** (menaikkan `totalAssets` → yield lender = model bisnis on-chain); sisa ke penjual; token kg ke pembeli. Boleh beli sebagian.
  - `cancelListing(listingId)` → sisa kg kembali ke penjual.
  - `getListings()` view untuk UI.
  - Event `Listed`, `Bought`, `ListingCancelled`.
  - Catatan: kg yang sedang di-listing **tidak** bisa dijadikan jaminan (sudah di escrow) — wajar.
- **T26** test: `testCreateSeriesStoresDocHash`, `testWarehouseCanCreateOwnSeries`, `testBuyPerKgPaysSellerAndFee`, `testPartialBuyAndCancel`, + 4 test lama.

**Gate B7:** `forge test -vv` → semua lulus, 0 skip. Setelah ini **ABI FINAL**.

**Angka tetap:** `MAX_LTV_BPS=6000`, `LIQ_THRESHOLD_BPS=8000`, `INTEREST_BPS=200`, IDRX 6 desimal, kg bulat.

#### B8 — Redeploy + verify (T27, T28) · 30 m

- Saldo deployer 7,15 MON (cek 2026-10-24) — cukup (deploy ±0,85 MON @100 gwei).
- `yarn deploy --network monadTestnet` (**dijalankan sendiri**, keystore `tuai-deployer`). Pastikan `deployments/10143.json` **dan** `packages/nextjs/contracts/deployedContracts.ts` memuat chain 10143 → commit keduanya.
- Setelah deploy, jalankan dari wallet deployer: `setWarehouse(<burner gudang>, true)` + faucet IDRX + `deposit` ke pool (atau masuk T20).
- **T28** verifikasi (Sourcify/explorer Monad, lihat `script/VerifyAll.s.sol` / `yarn verify --network monadTestnet`). Bukti: centang hijau di testnet.monadexplorer.com.

**Gate B8:** 2 alamat baru verified di explorer + `STATUS.md` §Alamat diperbarui.

#### B5 — Frontend (T14, T15, T16) · 100 m — **direvisi**

Tab jadi: **Gudang** (buat seri + `docHash` dari upload file → `keccak256`, mint ke petani) · **Petani** (pinjam, lunasi, LTV berwarna, jual kg via `listForSale`) · **Investor** (daftar listing, beli per kg, faucet IDRX, deposit pool) · **Admin** (slider harga, likuidasi).
Setiap aksi tulis menampilkan hash yang bisa diklik → `https://testnet.monadexplorer.com/tx/<hash>`.
`scaffold.config.ts`: saat demo `targetNetworks` hanya `monadTestnet`.

**Gate B5:** jalan penuh di browser sesuai urutan demo: buat seri → mint → pinjam → listing → investor beli → harga 70k → likuidasi.

#### B9 — Live URL + README + submit (T29, T30, T31) · 40 m

- **T29** Vercel (`yarn vercel` / import repo, root `packages/nextjs`). Domain `*.vercel.app` cukup (domain sendiri memang ditunda).
- **T30** README root ditulis ulang: masalah, solusi satu kalimat, fitur MVP, alamat kontrak + link verified, live URL, cara jalan lokal, model bisnis (fee penerbitan, selisih bunga 2%, fee jual-beli 0,5%), yang sengaja ditunda.
- **T31** submit ≤ 16:30.

#### B6 — Demo (T20–T23) · 70 m — **direvisi**

- **T20** seed: 3–4 burner (admin, gudang, petani, investor) masing-masing 0,1–0,2 MON dari deployer; pool terisi; seri `RESI-2026-001` Kopi Arabika 2.000 kg @ Rp100.000.
- **T21** latihan alur 2× mengikuti kerangka demo:
  1. 0:00 masalah · 0:30 solusi + buka live URL
  2. 0:45 gudang terbitkan resi → petani pinjam Rp120 jt → petani listing 500 kg → investor beli 100 kg → tunjukkan tx di explorer
  3. 2:00 harga 70k → likuidasi; "kenapa Monad: tx kecil per kg murah & cepat"
  4. 2:20 model bisnis · 2:40 repo, alamat, live URL, verified
- **T22** rekaman cadangan (laptop + cloud). **T23** latihan pitch + 3 jawaban juri.
- Aturan acara: sebut lokasi "The Studio", minta izin orang yang masuk frame.

#### B10 — Bonus Monad (T32) · 30 m — hanya jika T21 lulus

Tombol "simulasi 30 investor": generate 30 burner di browser, deployer/admin kirim MON + IDRX ke masing-masing (atau satu wallet kirim 30 `buy` 1–5 kg dengan nonce manual), lalu tembak `buy` paralel; tampilkan hitungan tx terkonfirmasi + waktu total. Perhatikan gas Monad dihitung dari `gas_limit` → set gas limit wajar per tx.

---

## 1. Ringkasan batch (rencana awal — riwayat, lihat §0 untuk sisa)

| Batch | Nama | Task | Estimasi | Gate (harus hijau) |
|---|---|---|---|---|
| **B0** | Fondasi & Toolchain | T0 | 30 m | `forge build` + `forge test` baseline + anvil + `GET /` 200 |
| **B1** | Kontrak — lapisan resi | T1, T2, T3 | 50 m | `forge build`; `createSeries` + `mintReceipt` benar |
| **B2** | Kontrak — lapisan kredit | T4, T5, T6, T7 (T7b opsional) | 95 m | `forge build`; principal 2.000 kg = `120_000e6` |
| **B3** | Test tiga inti | T8, T9, T10 | 45 m | `forge test -vv` 3/3 lulus, 0 skip |
| **B4** | Deploy testnet | T11, T12, T13 | 45 m | 2 alamat tampil di explorer + `deployments.md` |
| **B5** | Frontend | T14, T15, T16 (T17, T18 P1) | 100 m | alur mint→pinjam→harga→likuidasi jalan di browser |
| **B6** | Demo & rekaman | T20, T21, T22, T23 | 60 m | video 2 menit ada di laptop **dan** cloud |

Tugas yang tidak masuk batch P0: **T7b / T19** (`sellSeized`, P2) dan **T17 / T18** (P1). Dikerjakan hanya di ekor batch masing-masing kalau sisa waktu > 30 menit.

### Peta P0 → batch

```
P0: deploy testnet      -> B4
P0: forge test 3 inti   -> B3
P0: UI 5 aksi           -> B5
P0: rekaman 2 menit     -> B6
```

Empat P0 itu adalah definisi "selesai malam ini". B1, B2 hanya jalan menuju B3/B4; B0 hanya jalan menuju semuanya.

---

## 2. Ketergantungan antar batch

```
B0 ──> B1 ──> B2 ──> B3 ──> B4 ──> B5 ──> B6
                    │               ▲
                    └── ABI beku ───┘
```

- **B0 gagal → semua batch diblokir.** Perbaiki dulu, jangan "sambil jalan".
- **B1 → B2** berurutan karena `TuaiBlitz.sol` satu file; dua orang tidak boleh menulis file yang sama.
- **B3 mengunci ABI.** Setelah B3 hijau, tidak ada perubahan signature fungsi. Frontend (B5) tidak boleh menunggu kontrak yang berubah-ubah.
- **B5 boleh mulai lebih awal** (setelah B1 selesai) untuk bagian baca-saja, karena `getSeries()` sudah ada. Tapi B5 tidak boleh ditutup sebagai "selesai" sebelum B4 memberi alamat testnet.
- **B6 butuh B4 + B5.** Tanpa alamat testnet dan UI yang jalan, rekaman tidak mungkin.

---

## 3. Detail per batch

### B0 — Fondasi & Toolchain (T0) · 30 m

Status: **SELESAI** (lihat `notes/t0-preflight.md`).

- [x] `node --version` → v22.23.2
- [x] Foundry lokal → `forge 1.8.6` di `tuai-lite/.tools/foundry/bin`
- [x] `yarn install` → selesai (yarn 3.2.3 via shim lokal)
- [x] submodule (forge-std, OZ 5.3.0, solidity-bytes-utils) ter-init
- [x] `yarn compile` + `forge test` baseline lulus (1 test bawaan)
- [x] anvil hidup, `eth_chainId` = `0x7a69`
- [x] `yarn deploy` lokal sukses, ABI TS ter-generate
- [x] `yarn start` → `http://localhost:3000` **200**
- [x] OZ = **v5.3.0** → `utils/ReentrancyGuard.sol`, `Ownable(msg.sender)`
- [x] Hook = **API baru** (`useScaffoldReadContract`, `useScaffoldWriteContract`)
- [x] Bug repo diperbaiki: `chains.monad_testnet` → `chains.monadTestnet` (viem 2.31.1)
- [ ] `yarn account` (opsional, bukan gate)

**Gate B0:**
```bash
source ./activate.sh
cd app/packages/foundry && forge build && forge test
# anvil hidup -> yarn deploy (lihat README untuk HOME lokal) -> yarn start -> GET / 200
```

**Stop rule:** kalau `yarn start` gagal > 2× estimasi, jangan lanjut ke B5 nanti — pakai `next dev` langsung dari `app/packages/nextjs` dan catat di status.

---

### B1 — Kontrak: lapisan resi (T1, T2, T3) · 50 m

Pemilik file: `app/packages/foundry/contracts/MockIDRX.sol`, `app/packages/foundry/contracts/TuaiBlitz.sol`.

1. **T1** `MockIDRX` (ERC20, 6 desimal, faucet `mint` terbuka).
2. **T2** kerangka `TuaiBlitz`: import, konstanta, struct `Series`/`Loan`, state, modifier, event, constructor, `onERC1155Received` (`0xf23a6e61`).
3. **T3** `setWarehouse`, `createSeries`, `mintReceipt`, `setPrice`, `getSeries` + require wajib.

**Gate B1:**
```bash
cd app/packages/foundry && forge build
# cek cepat manual (anvil + cast) atau lewat test T8 nanti:
# createSeries(...) -> seriesIds bertambah; mintReceipt -> mintedKg naik; setPrice -> event PriceUpdated
```

**Jangan:** menyentuh test, script deploy, frontend.

---

### B2 — Kontrak: lapisan kredit (T4, T5, T6, T7) · 95 m

Urutan dalam satu file, jangan dibalik: `borrow` → `repay` → `liquidate` → `redeem` → pool.

- **T4** `borrow`, `repay`, `maxBorrow`, `collateralValueOf`, `ltvBps`, `isLiquidatable`. Urutan 10 langkah di dokumen wajib persis (cek saldo pool sebelum escrow, hitung `debt` sebelum simpan).
- **T5** `liquidate`: hanya pindahkan jaminan ke `seizedKg`, **tidak** mengirim IDRX.
- **T6** `redeem`: `_burn` lalu `redeemedKg += kg`.
- **T7** pool: `deposit`, `withdraw`, `totalAssets`, `sharePrice`. Rumus share pakai `(totalAssets() - amount)` saat pertama.
- **T7b (P2, opsional)** `sellSeized` — hanya kalau B2 selesai < 75 menit.

**Gate B2:**
```bash
cd app/packages/foundry && forge build
# hitung manual: 2000 kg * 100_000e6 * 6000 / 10000 = 120_000e6
```

**Angka yang tidak boleh berubah:** `MAX_LTV_BPS=6000`, `LIQ_THRESHOLD_BPS=8000`, `INTEREST_BPS=200`, `BPS_DENOMINATOR=10000`, IDRX 6 desimal, kg bulat.

---

### B3 — Test tiga inti (T8, T9, T10) · 45 m

Status: **SELESAI** (`ab60b06`, lihat `notes/b3-tests.md`).

File: `app/packages/foundry/test/TuaiBlitz.t.sol` (hanya file ini).

- **T8** setup: deploy `MockIDRX` + `TuaiBlitz`, `setWarehouse`, `createSeries("RESI-001","Kopi Arabika","Grade 1",warehouse,100_000e6,2000)`, mint IDRX ke pool, approve, `deposit(500_000e6)`.
- **T9** tiga test wajib: `testBorrowSixtyPercent`, `testRepayReturnsCollateral`, `testLiquidationAtEightyPercent` (80k → `false`, 70k → `true`, `seizedKg == 2000`).
- **T10** jalankan `forge test -vv`.

**Gate B3 (sekaligus gate P0 #2):**
```bash
cd app/packages/foundry && forge test -vv
# wajib: 4 test lulus (3 inti + 1 bawaan), 0 failed, 0 skipped
```

**Kalau gagal karena bug kontrak:** perbaiki kontrak, jangan melemahkan test. Setelah gate ini hijau → **ABI BEKU**.

---

### B4 — Deploy testnet (T11, T12, T13) · 45 m

- **T11** script deploy. **Koreksi dari dokumen:** repo ini memakai Foundry Script, bukan hardhat-deploy. Jadi file yang benar adalah `app/packages/foundry/script/DeployTuai.s.sol` (kontrak `ScaffoldETHDeploy`, pola sama dengan `DeployYourContract.s.sol`), bukan `deploy/00_deploy_tuai.ts`. Lihat `notes/t0-preflight.md` §Deviations.
- **T12** wallet & env: `.env` yang dipakai repo ada di `app/packages/foundry/.env` (`ETH_KEYSTORE_ACCOUNT`, `DEPLOYER_PRIVATE_KEY`, RPC). `scaffold.config.ts` **sudah** memuat `chains.monad_testnet` — cukup pastikan `targetNetworks` hanya testnet saat demo. Burner browser harus = deployer, kalau tidak `onlyOwner` revert saat demo.
- **T13** `yarn deploy --network monad_testnet` (nama network di repo ini `monad_testnet`, **bukan** `monadTestnet`). Catat alamat ke `app/deployments.md` + salin ke `STATUS.md`.

**Gate B4 (gate P0 #1):**
```bash
cd app && yarn deploy --network monad_testnet
# 2 alamat tercetak, terlihat di https://testnet.monadexplorer.com
```

**Siapkan 3 burner** (admin/gudang, petani, lender) + 0.05–0.1 MON masing-masing untuk petani & lender.

---

### B5 — Frontend (T14, T15, T16 + P1) · 100 m

- **T14** halaman baca: 4 tab (Gudang, Petani, Pemberi Pinjaman, Admin), `getSeries()`, `totalAssets()`, `sharePrice()`, `loans(addr)`, alamat kontrak + link explorer.
  **Lokasi file (koreksi):** `app/packages/nextjs/app/tuai/page.tsx` + `app/packages/nextjs/components/tuai/*.tsx`. Repo ini **App Router**, tidak ada `pages/`.
- **T15** aksi tulis: `mintReceipt`, `setApprovalForAll` + `borrow`, `approve` + `repay`, `setPrice` (slider 50k–150k), `liquidate`, faucet/`deposit`/`withdraw`. Semua tombol `disabled` saat pending + hash bisa diklik.
- **T16** helper `formatIDR`, warna LTV (hijau <60, kuning 60–79, merah ≥80), estimasi pinjaman saat kg diketik.
- **T17 (P1)** panel lender, **T18 (P1)** event feed — lewati kalau > 30 menit.

**Gate B5 (gate P0 #3):**
Satu kali jalan penuh di browser: tampil seri → mint 2.000 kg → pinjam → ubah harga 80k → 70k → likuidasi. Tidak ada revert, tidak ada tombol menggantung.

---

### B6 — Demo & rekaman (T20, T21, T22, T23) · 60 m

- **T20** seed: seri `RESI-001` 2.000 kg @ Rp100.000, deposit pool, 2.000 token ke petani. Cek UI: jaminan Rp200 jt, pinjaman Rp120 jt, LTV 60%.
- **T21** uji alur penuh 2× (state segar), total < 2,5 menit.
- **T22** rekam 2 menit 1080p, simpan `tuai-lite/demo/tuai-demo.mp4`, upload Drive, salin link ke `STATUS.md`, salin ke ponsel.
- **T23** latihan pitch 2,5 menit + 3 jawaban (kenapa bukan database, gudang curang, siapa pembeli jaminan) + kalimat pembuka cadangan.

**Gate B6 (gate P0 #4):**
File video ada (laptop + cloud) dan `app/deployments.md` berisi alamat final.

---

## 4. Aturan "lokal saja" (tidak menyentuh sistem)

Semua perintah dijalankan setelah:

```bash
cd tuai-lite && source ./activate.sh
```

| Komponen | Lokasi | Jangan |
|---|---|---|
| forge/anvil/cast | `tuai-lite/.tools/foundry/bin` | `sudo`, `/usr/local/bin`, `~/.foundry` |
| yarn 3 | `tuai-lite/.tools/bin` + `.yarn/releases` | `npm i -g`, `corepack enable` global |
| cache corepack | `tuai-lite/.tools/corepack` | `~/.cache/node/corepack` |
| node_modules | `tuai-lite/app/node_modules` | install di folder luar |
| solidity libs | `app/packages/foundry/lib` (submodule) | `forge install --global` |

Satu-satunya file yang mungkin keluar folder: `~/.foundry/keystores/scaffold-eth-default` yang dibuat `make chain`. Itu **data wallet**, bukan instalasi. Kalau mau nol jejak, jalankan `anvil` langsung (bukan `yarn chain`) dan deploy dengan `--private-key` akun anvil #0.

---

## 5. Kalau ada 4 agent (paralel)

Ikuti tabel §12 dokumen, tapi dipetakan ke batch:

| Jam | Agent Contract | Agent Test | Agent Frontend | Agent Deploy/Demo |
|---|---|---|---|---|
| 0:00–0:30 | — | baca spec | setup komponen | **B0** |
| 0:30–1:20 | **B1** | tulis T8 | T14 (baca, mock data) | siapkan burner |
| 1:20–2:55 | **B2** | T9 (test) | T14 lanjut | naskah pitch |
| 2:55–3:40 | perbaiki bug | **B3** | T15 | **B4** (setelah ABI beku) |
| 3:40–5:20 | beku kontrak | verifikasi | **B5** | T20 seed |
| 5:20–6:20 | — | — | perbaikan UI | **B6** |

Aturan keras: **satu file, satu pemilik.** `TuaiBlitz.sol` hanya Agent Contract; test hanya Agent Test; `app/tuai/*` hanya Agent Frontend.

---

## 6. Mode Darurat (pemicu otomatis)

Aktifkan kalau salah satu benar:
- sekarang ≥ 02.30 dan B2 belum hijau, atau
- B3 sudah 2× estimasi (90 menit) masih merah.

Yang dipertahankan: `MockIDRX`, `mintReceipt`, `borrow` (60%), `setPrice`, `liquidate`, UI satu halaman.
Yang dibuang: pool share-based (ganti `mapping(address => uint256)`), `redeem`, T17, T18, T19, styling.
Demo darurat 90 detik: mint 2.000 → pinjam Rp120 jt → harga Rp70k → likuidasi.

Batch darurat jadi 4: **B0 → B1' (T1–T3 + T4 + T5) → B4 → B5'**. B3 diganti satu test `testEmergencyFlow`.

---

## 7. Koreksi wajib atas dokumen 07

Dokumen 07 ditulis untuk `scaffold-monad-foundry` versi lama (Hardhat deploy + Pages Router). Repo yang di-clone berbeda. Sebelum eksekusi, pakai koreksi ini:

| # | Dokumen 07 bilang | Kenyataan di repo | Ganti jadi |
|---|---|---|---|
| 1 | `packages/nextjs/pages/tuai.tsx` | App Router (`app/layout.tsx`) | `app/packages/nextjs/app/tuai/page.tsx` |
| 2 | `packages/foundry/deploy/00_deploy_tuai.ts` | Foundry Script (`script/Deploy.s.sol`) | `app/packages/foundry/script/DeployTuai.s.sol` |
| 3 | `scaffold.config.ts` → `chains.monadTestnet` | kode repo `chains.monad_testnet` — **tidak ada di viem 2.31.1**, app 500 | sudah diperbaiki jadi `chains.monadTestnet`; jangan dikembalikan |
| 4 | `yarn deploy --network monadTestnet` | nama network foundry `monad_testnet` (beda namespace dari viem) | `--network monad_testnet` |
| 5 | `.env` di root repo | `.env` ada di `packages/foundry/.env` + `ETH_KEYSTORE_ACCOUNT` | pakai env repo, jangan bikin `.env` baru di root |
| 6 | hook lama vs baru "cek dulu" | sudah API baru | `useScaffoldReadContract` / `useScaffoldWriteContract` |
| 7 | OZ v4/v5 "cek dulu" | v5.3.0 | `utils/ReentrancyGuard.sol`, `Ownable(msg.sender)` |
| 8 | test `borrow(1, 2000)` | `seriesIds` mulai dari 1 (bukan 0) | pastikan `createSeries` push dulu baru increment |

Nomor 8 adalah sumber bug paling mahal malam ini: kalau `nextSeriesId` di-increment sebelum dipakai, `borrow(1, ...)` akan menunjuk seri kosong dan test gagal dengan revert yang membingungkan.

---

## 8. Checklist "jangan tidur sebelum"

- [ ] B0 gate hijau
- [x] B1 gate hijau
- [ ] B2 gate hijau
- [x] B3 gate hijau (3 test inti, 0 skip)
- [ ] B4 gate hijau (2 alamat testnet)
- [ ] B5 gate hijau (5 aksi UI)
- [ ] B6 gate hijau (video di laptop + cloud)
- [ ] `STATUS.md` terisi, tidak ada task `[ ]` di P0
