# DEMO FLOW — Tuai Blitz (3 menit)

Aplikasi: live URL / `http://localhost:3000` → otomatis ke `/tuai`. Jaringan: **Monad Testnet (10143)**.
Kontrak: TuaiBlitz `0x4c35241BBbdD33FfAD0C3d9928bC8607F0560B2B` · MockIDRX `0xd6463A40844d535c10a0AF85FDC09144D17b80b6` (verified).

## 0. Identitas & wallet

| Identitas | Tab | Wallet | Siapa pegang | Catatan |
|---|---|---|---|---|
| **Admin** (oracle harga) | Admin | `0x0548b15Fc15eC4779ad1E766aa3c93C827AB820a` (`tuai-deployer`) | dev 1 | Satu-satunya yang bisa `setPrice` / `setWarehouse` (owner) |
| **Gudang** | Gudang | `0x3399fD9c40edD70968586b768FF25D438f61b1c9` | ____ | Sudah `isWarehouse = true`; pemilik seri #1 |
| **Petani** (Pak Budi) | Petani | `0xD2fE7007DBB45E12E401142Dc5C612699aA4BaA9` | ____ | Sudah punya MON untuk gas |
| **Investor / Pemberi pinjaman** | Investor | `0xAf5764db02839644D22ae11b968F65bFdCa0C0fa` (`dev-haidar`) atau wallet lain | dev 2 | Isi pool + beli per kg |

Cara pegang wallet saat demo: MetaMask dengan 3 akun (Gudang, Petani, Investor) — ganti akun dari ikon MetaMask, halaman ikut ter-update. **Admin dijalankan dev 1 dari laptopnya** (buka URL yang sama) karena kunci owner ada di sana.

## 1. Persiapan (sebelum naik panggung, ±10 menit)

| # | Identitas | Langkah | Cek berhasil |
|---|---|---|---|
| P1 | Semua | Tambah Monad Testnet di MetaMask, pastikan tiap wallet punya ≥ 0,2 MON | saldo MON terlihat |
| P2 | Investor | Tab **Investor** → **Ambil Rp1 M IDRX uji** → konfirmasi | Saldo IDRX Rp1.000.000.000 |
| P3 | Investor | Tab **Investor** → Setor ke pool `500000000` → **Setor** (2 tx: approve + deposit) | Pool "Total aset" Rp500.000.000 |
| P4 | Petani | Pastikan **tidak ada pinjaman aktif** (tab Petani → "Posisi pinjaman: Belum ada pinjaman") | kalau masih aktif → likuidasi/lunasi dulu |
| P5 | Admin | Pastikan harga seri yang dipakai Rp100.000 (tab Admin → **Set harga Rp100.000**) | angka besar Rp100.000 |
| P6 | Semua | Buka explorer di tab browser lain: `testnet.monadexplorer.com` | — |

> **Pool wajib terisi (P3).** Tanpa itu tombol Pinjam revert `pool insufficient`. Status 2026-10-24 14:4x: pool **Rp0**.

**Latihan vs live:** latihan pakai seri #1 (`RESI-2026-001`). Saat live, gudang mendaftarkan resi **baru** (`RESI-2026-002`, `-003`, …) supaya kondisi selalu segar — chip langkah di header ikut seri terbaru.

## 2. Alur live (ikuti kerangka 3 menit)

### 0:00 — Masalah (narasi, tanpa klik)
> "Saat panen harga jatuh, petani terpaksa jual murah karena butuh uang. Resi gudang sebenarnya bisa jadi jaminan, tapi prosesnya lama dan tidak likuid."

### 0:30 — Solusi + buka live URL
> "Tuai mengubah resi gudang jadi token per kg: petani pinjam instan, investor bisa beli pecahan per kg."
Tunjukkan header: **Monad Testnet · kontrak verified ↗**.

### 0:45 — Babak 1 · GUDANG (wallet Gudang)
1. Tab **Gudang**. Isi: Nomor resi `RESI-2026-002`, Kopi Arabika, Grade 1, harga `100000`, berat `2000`, (opsional) pilih file PDF resi → hash dokumen muncul di kartu kertas.
2. Klik **Daftarkan resi** → konfirmasi. Kartu berubah jadi **TERCATAT ON-CHAIN · TERVERIFIKASI**.
3. Di "Pecah resi jadi token per kg": alamat petani `0xD2fE7007DBB45E12E401142Dc5C612699aA4BaA9`, jumlah `2000` → **Tokenisasi** → konfirmasi.
4. Cek: "Sudah jadi token **2.000**", chip **1 Tokenisasi** hijau.
> Kalimat: "Gudang terdaftar menerbitkan resi; dokumen fisiknya cukup dicatat sidik jarinya. 1 token = 1 kg kopi."

### 1:05 — Babak 2 · PETANI (ganti akun ke Petani)
1. Tab **Petani**. Kartu atas: **Token bebas 2.000**.
2. "Jaminkan resi, uang cair": isi `1500` kg → **Kamu terima Rp90.000.000** → **Pinjam** → konfirmasi.
3. Cek: Posisi **Aman**, LTV **61,2%**, utang Rp91.800.000, "Likuidasi kalau harga di bawah Rp76.500/kg". Chip **2 Pinjam** hijau.
> Kalimat: "Dana cair dalam satu blok, LTV maksimal 60%."

### 1:25 — Babak 3 · PETANI jual per kg
1. Masih tab **Petani**, "Tawarkan pecahan ke investor": `500` kg @ `100000` → **Pasang listing** → konfirmasi.
2. Cek: "Listing saya #N · sisa 500 kg" (nomor listing bertambah tiap latihan). Chip **3 Jual per kg** hijau.

### 1:35 — Babak 3 · INVESTOR (ganti akun ke Investor)
1. Tab **Investor** → listing muncul. Isi `100` kg → **Beli 100 kg** → konfirmasi (approve + buy bila perlu).
2. Cek: "Kepemilikan kg **100**", rincian: bayar Rp10.000.000, petani terima Rp9.950.000, **fee Rp50.000 masuk pool** → harga share pool naik.
3. Klik hash di **Transaksi sesi ini** → tunjukkan tx di explorer.
> Kalimat: "Kenapa Monad: pembelian per kg itu transaksi kecil — harus murah dan cepat."

### 2:00 — Babak 4 · ADMIN (dev 1, laptop/akun owner)
1. Tab **Admin** → **Set harga Rp80.000** → di tab Petani posisi jadi **Waspada** (LTV 76,5%).
2. **Set harga Rp70.000** → posisi **Bisa dilikuidasi** (LTV 87,4%).
3. "Posisi berisiko": tempel alamat petani `0xD2fE…BaA9` → tombol **Likuidasi** muncul → klik → konfirmasi.
4. Cek: status **Belum ada pinjaman**, tab Investor "Jaminan dipegang pool **1.500 kg**", chip **4 Likuidasi** hijau.
> Kalimat: "Harga turun di bawah batas → siapa pun bisa melikuidasi; jaminan diserap pool, pokok lender terlindungi."

### 2:20 — Model bisnis (narasi)
- Fee penerbitan resi dari gudang
- Selisih bunga pinjaman (on-chain: bunga flat 2% → pool)
- Fee jual-beli per kg (on-chain: 0,5% → pool)

### 2:40 — Penutup
Sebut: repo `github.com/XsafiD/tuai-blitz`, alamat TuaiBlitz `0x4c35…0B2B` (verified di explorer), live URL.

## 3. Angka acuan (2.000 kg @ Rp100.000, pinjam 1.500 kg)

| Momen | Nilai jaminan | Utang | LTV | Status |
|---|---|---|---|---|
| Setelah pinjam (Rp100.000) | Rp150.000.000 | Rp91.800.000 | 61,2% | Aman |
| Harga Rp80.000 | Rp120.000.000 | Rp91.800.000 | 76,5% | Waspada |
| Harga Rp70.000 | Rp105.000.000 | Rp91.800.000 | 87,4% | Bisa dilikuidasi |

Batas likuidasi: harga < **Rp76.500/kg**.

## 4. Kalau ada masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| Pinjam revert `pool insufficient` | Pool kosong | Langkah P3 |
| Pinjam revert `loan active` | Petani masih punya pinjaman dari latihan | Likuidasi (harga 70k) atau Lunasi |
| Tombol Tokenisasi abu-abu | Wallet bukan gudang pemilik seri / alamat petani salah | Ganti akun ke Gudang; lihat pesan kuning di bawah tombol |
| Tombol Pasang listing abu-abu | Token bebas di seri itu kurang | Pesan kuning menunjukkan saldo; tokenisasi dulu atau kurangi kg |
| Tombol harga abu-abu | Bukan wallet owner | Admin dijalankan dev 1 |
| Saldo belum berubah | Data refresh tiap 4 detik | Tunggu sebentar |
| Live gagal total | — | Putar rekaman cadangan (T22) |
