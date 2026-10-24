# Tuai Blitz

**Resi gudang jadi token per kg di Monad.** Petani tidak perlu menjual panen dengan harga murah saat harga jatuh. Resi gudang mereka dijadikan jaminan untuk pinjaman stablecoin instan, dan investor bisa membeli pecahan komoditas per kg.

Dibuat untuk **Monad Blitz Jogja vol.2** di The Studio.

---

## Masalah dan solusi

- **Masalah:** saat panen, harga komoditas jatuh dan petani terpaksa menjual murah karena butuh uang. Resi gudang sebenarnya bisa menjadi jaminan, tapi prosesnya lama dan resinya sulit diperjualbelikan.
- **Solusi:** gudang terdaftar menerbitkan resi on-chain lengkap dengan hash dokumennya. Resi dipecah menjadi token ERC-1155, di mana **1 token = 1 kg**. Petani bisa langsung meminjam IDRX (stablecoin tiruan) sampai **LTV 60%**, investor bisa membeli pecahan per kg, dan posisi yang harganya turun di bawah batas bisa dilikuidasi.
- **Kenapa Monad:** transaksi per kg itu kecil dan sering, jadi butuh biaya murah dan konfirmasi cepat.

## Fitur MVP

| Fitur | Kontrak | Halaman |
|---|---|---|
| Gudang terdaftar menerbitkan resi (komoditas, kg, hash dokumen) | `createSeries`, `mintReceipt` | Tab **Gudang** |
| Resi jadi token pecahan per kg milik petani | ERC-1155, 1 token = 1 kg | Tab **Gudang** / **Petani** |
| Petani pinjam instan IDRX, LTV maks 60%, bunga flat 2% | `borrow`, `repay` | Tab **Petani** |
| Investor beli pecahan per kg, fee 0,5% masuk pool | `listForSale`, `buy`, `cancelListing` | Tab **Petani** / **Investor** |
| Pool pemberi pinjaman (share naik dari bunga dan fee) | `deposit`, `withdraw` | Tab **Investor** |
| Harga oracle diubah admin, posisi di bawah batas bisa dilikuidasi | `setPrice`, `liquidate` (LTV ≥ 80%) | Tab **Admin** |

**Sengaja ditunda:** penebusan barang fisik di gudang (fungsi `redeem` sudah ada di kontrak tapi tidak ditampilkan), KYC, multi-komoditas, oracle sungguhan, mainnet, dan domain sendiri.

## Model bisnis

1. **Fee penerbitan resi** dibayar gudang.
2. **Selisih bunga pinjaman.** Di kontrak: bunga flat 2% masuk pool.
3. **Fee jual-beli per kg.** Di kontrak: 0,5% dari setiap pembelian masuk pool.

---

## Semua URL

### Aplikasi

| Path | Fungsi |
|---|---|
| **Live URL** | _(diisi setelah deploy Vercel)_ |
| `/` | Langsung diarahkan ke `/tuai` |
| `/tuai` | **Aplikasi utama**: tab Gudang, Petani, Investor, Admin |
| `/debug` | Debug kontrak bawaan Scaffold-ETH: panggil semua fungsi `TuaiBlitz` dan `MockIDRX` langsung |
| `/blockexplorer` | Block explorer bawaan Scaffold-ETH (hanya untuk chain lokal; untuk testnet gunakan explorer Monad) |
| Lokal | http://localhost:3000 → http://localhost:3000/tuai |

### Kontrak (Monad Testnet, chain ID 10143), sudah verified

| Kontrak | Alamat | Explorer | Verifikasi |
|---|---|---|---|
| **TuaiBlitz** | `0x4c35241BBbdD33FfAD0C3d9928bC8607F0560B2B` | [monadexplorer](https://testnet.monadexplorer.com/address/0x4c35241BBbdD33FfAD0C3d9928bC8607F0560B2B) | [Sourcify](https://sourcify-api-monad.blockvision.org/v2/contract/10143/0x4c35241BBbdD33FfAD0C3d9928bC8607F0560B2B) |
| **MockIDRX** (ERC-20, 6 desimal) | `0xd6463A40844d535c10a0AF85FDC09144D17b80b6` | [monadexplorer](https://testnet.monadexplorer.com/address/0xd6463A40844d535c10a0AF85FDC09144D17b80b6) | [Sourcify](https://sourcify-api-monad.blockvision.org/v2/contract/10143/0xd6463A40844d535c10a0AF85FDC09144D17b80b6) |

Deployer / owner: `0x0548b15Fc15eC4779ad1E766aa3c93C827AB820a` · deploy 2026-10-24 12:07 WIB.

### Jaringan dan tautan luar

| Nama | URL |
|---|---|
| Repo | https://github.com/XsafiD/tuai-blitz |
| RPC Monad Testnet | https://testnet-rpc.monad.xyz |
| Explorer | https://testnet.monadexplorer.com |
| Faucet MON | https://faucet.monad.xyz |
| Docs Monad | https://docs.monad.xyz/developer-essentials |

### Dokumen proyek

| Path | Isi |
|---|---|
| [`tuai-docs/DEMO-FLOW.md`](tuai-docs/DEMO-FLOW.md) | Naskah demo 3 menit per identitas, angka acuan, dan troubleshooting |
| [`tuai-docs/STATUS.md`](tuai-docs/STATUS.md) | Papan status task dan alamat deployment |
| [`tuai-docs/BATCH-PLAN.md`](tuai-docs/BATCH-PLAN.md) | Rencana batch dan prioritas |
| [`tuai-docs/DEPLOYMENT-GUIDE.md`](tuai-docs/DEPLOYMENT-GUIDE.md) | Deploy dan verifikasi multi-developer |
| [`packages/foundry/contracts/TuaiBlitz.sol`](packages/foundry/contracts/TuaiBlitz.sol) | Kontrak utama |
| [`packages/foundry/test/TuaiBlitz.t.sol`](packages/foundry/test/TuaiBlitz.t.sol) | Test kontrak (9 lulus) |
| [`packages/nextjs/app/tuai/page.tsx`](packages/nextjs/app/tuai/page.tsx) | Halaman aplikasi |
| [`packages/nextjs/components/tuai/`](packages/nextjs/components/tuai/) | Panel Gudang, Petani, Investor, Admin |

---

## Cara menjalankan

### Prasyarat

- Node.js ≥ 20.18.3
- Yarn: `npm install -g yarn` (repo otomatis memakai yarn 3.2.3 dari `.yarn/releases`)
- Git
- [Foundry](https://book.getfoundry.sh/) 1.8.x, hanya untuk compile, test, dan deploy kontrak
- MetaMask atau wallet EVM lain dengan jaringan **Monad Testnet** (chain ID 10143, RPC di atas), plus sedikit MON dari faucet untuk gas

### Jalankan frontend (memakai kontrak yang sudah ter-deploy di testnet)

```bash
git clone https://github.com/XsafiD/tuai-blitz.git
cd tuai-blitz
git submodule update --init --recursive   # library Solidity (forge-std, OpenZeppelin)
yarn install
yarn start                                 # http://localhost:3000 → /tuai
```

Alamat dan ABI kontrak sudah ada di `packages/nextjs/contracts/deployedContracts.ts`. Tidak perlu mengisi `.env` untuk menjalankan frontend.

### Build produksi dan deploy frontend

```bash
yarn next:build        # build produksi
yarn next:serve        # jalankan hasil build
yarn vercel            # deploy ke Vercel (root project: packages/nextjs)
```

### Kontrak: compile, test, deploy, verifikasi

```bash
yarn compile           # forge build
yarn test              # forge test (9 test)

# deploy ke Monad Testnet dengan keystore sendiri (password ditanya interaktif)
yarn deploy --file DeployTuai.s.sol --network monad_testnet --keystore <nama-keystore>
```

Deploy ulang akan membuat **kontrak baru** dengan owner baru. Tim memakai satu deployment saja, jadi lihat aturannya dan perintah verifikasi di [`tuai-docs/DEPLOYMENT-GUIDE.md`](tuai-docs/DEPLOYMENT-GUIDE.md).

---

## Cara pakai per identitas

Buka `/tuai`, klik **Connect Wallet**, lalu pilih tab sesuai peran. Setiap transaksi muncul di kartu **Transaksi sesi ini** dengan link ke explorer. Data on-chain diperbarui otomatis setiap ±4 detik. Kalau sebuah tombol abu-abu, alasannya ditampilkan di bawah tombol itu.

Header menampilkan 4 chip langkah (**1 Tokenisasi → 2 Pinjam → 3 Jual per kg → 4 Likuidasi**) yang menyala sesuai keadaan on-chain seri yang dipilih.

### 1. Admin (owner kontrak)

Wallet: owner `0x0548…820a`. Hanya owner yang bisa mengubah harga dan mendaftarkan gudang.

1. **Daftarkan gudang:** tab **Admin**, kartu "Daftarkan gudang", isi alamat gudang, lalu klik **Daftarkan gudang**.
2. **Ubah harga oracle:** klik tombol preset **Rp100.000 / Rp80.000 / Rp70.000**, atau geser slider (Rp50.000–150.000) lalu klik **Set harga**.
3. **Likuidasi:** di kartu "Posisi berisiko", tempel alamat peminjam. Status, LTV, dan utang akan tampil. Kalau LTV ≥ 80%, tombol **Likuidasi** muncul. Likuidasi boleh dilakukan wallet siapa pun, bukan hanya admin.

### 2. Gudang

Wallet: alamat yang sudah didaftarkan admin (`isWarehouse = true`).

1. **Daftarkan resi:** tab **Gudang**, isi nomor resi, komoditas, grade, harga acuan per kg, dan berat bersih. Pilih file dokumen resi kalau ada: hash keccak256-nya dihitung di browser, dan file itu sendiri **tidak diunggah**. Klik **Daftarkan resi**. Kartu kertas berubah menjadi *TERCATAT ON-CHAIN · TERVERIFIKASI*.
2. **Tokenisasi:** di kartu "Pecah resi jadi token per kg", isi alamat petani dan jumlah kg, lalu klik **Tokenisasi**. Hanya gudang pemilik seri yang bisa mint, dan jumlahnya tidak boleh melebihi berat resi.

### 3. Petani

Wallet: alamat yang menerima token dari gudang.

1. **Lihat aset:** kartu atas menampilkan token bebas, token dijaminkan, harga sekarang, dan saldo IDRX.
2. **Pinjam:** isi jumlah kg yang dijaminkan. "Kamu terima" menunjukkan 60% dari nilai jaminan. Klik **Pinjam**. Syaratnya: token cukup, tidak ada pinjaman aktif, dan **dana pool cukup**.
3. **Pantau posisi:** kartu "Posisi pinjaman" menampilkan utang (pokok + bunga 2%), nilai jaminan, LTV, bar 3 zona (aman di bawah 70%, waspada 70–80%, likuidasi ≥ 80%), dan harga batas likuidasi per kg.
4. **Lunasi:** klik **Lunasi**. Approve IDRX berjalan otomatis. Kalau IDRX kurang untuk bunga, klik **Ambil IDRX uji untuk bunga**.
5. **Jual per kg:** isi jumlah kg dan harga per kg (bawaannya harga oracle), lalu klik **Pasang listing**. Token dititipkan ke kontrak. Listing bisa dibatalkan dari kartu "Listing saya".

### 4. Investor / pemberi pinjaman

Wallet: wallet apa saja.

1. **Ambil IDRX uji:** klik **Ambil Rp1 M IDRX uji** (faucet testnet).
2. **Isi pool:** isi jumlah di "Setor ke pool", lalu klik **Setor**. Approve dan deposit berjalan otomatis. Pool ini sumber dana pinjaman petani. **Pool wajib terisi sebelum petani bisa meminjam.**
3. **Beli per kg:** di "Beli pecahan per kg", isi jumlah kg pada listing, lalu klik **Beli**. Rinciannya: total bayar, yang diterima penjual (99,5%), dan fee 0,5% yang masuk pool.
4. **Pantau pool:** total aset, dana yang sedang dipinjam, dana tersedia, jaminan hasil likuidasi, harga share, dan share milikmu. Klik **Tarik semua** untuk menarik share.

### Contoh skenario lengkap

Ini skenario resi 2.000 kg @ Rp100.000, petani menjaminkan 1.500 kg. Urutan langkah lengkapnya dan tabel troubleshooting ada di [`tuai-docs/DEMO-FLOW.md`](tuai-docs/DEMO-FLOW.md).

| Langkah | Identitas | Hasil |
|---|---|---|
| Setor Rp500 jt ke pool | Investor | Pool siap meminjamkan |
| Daftarkan resi + tokenisasi 2.000 kg | Gudang | Petani memegang 2.000 token |
| Pinjam dengan jaminan 1.500 kg | Petani | Cair Rp90 jt, LTV 61,2% |
| Listing 500 kg | Petani | Ditawarkan ke investor |
| Beli 100 kg | Investor | Bayar Rp10 jt, fee Rp50 rb masuk pool |
| Harga → Rp80.000 | Admin | LTV 76,5%, status Waspada |
| Harga → Rp70.000, lalu likuidasi | Admin | LTV 87,4%, 1.500 kg diserap pool |

---

## Teknologi

Monad Testnet · Solidity 0.8.24 + OpenZeppelin 5.3 (ERC-1155, ERC-20) · Foundry · Next.js 15 (App Router) · wagmi / viem · RainbowKit · Tailwind + daisyUI · dibangun di atas [Scaffold-ETH 2](https://scaffoldeth.io).

## Lisensi

MIT. Lihat [LICENCE](LICENCE).
