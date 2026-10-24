# Tuai — Rencana Hackathon 7 Jam

> Monad Blitz Jogja Vol. 2 · 24 Oktober 2026
> Dokumen ini menggantikan versi panjang (`Ide-longform.md`). Fokusnya satu: **demo yang jalan, pitch yang jelas, pertanyaan juri yang terjawab.**
> Yang tertulis di sini sudah dipotong sesuai waktu build, bukan sesuai ambisi.

## Pitch satu kalimat

> Petani terpaksa menjual hasil panen murah karena butuh uang di hari panen. Tuai mengubah resi gudang menjadi token per kilogram di Monad, supaya petani bisa meminjam cepat atau menjual sebagian — tanpa menjual seluruh panen di harga terendah.

Kalimat kedua untuk juri:

> Ini bukan janji panen. Jaminannya adalah kopi yang sudah ada di gudang berizin, sudah diuji mutu, dan resinya teregistrasi.

---

## 1. Masalah dan urgensi

Petani butuh uang tepat saat panen. Saat itu juga harga komoditas paling rendah, karena semua orang menjual bersamaan. Yang punya uang adalah tengkulak, dan petani menerima harga terburuknya.

Solusinya secara hukum sudah ada: **Sistem Resi Gudang (SRG)** — UU No. 9 Tahun 2006. Petani menyimpan komoditas di gudang berizin Bappebti, barangnya diuji mutu, lalu mendapat resi yang bisa dijadikan jaminan pinjaman atau ditunda penjualannya.

Skalanya sudah besar, tapi manfaatnya belum sampai ke petani kecil:
- Nilai resi mencapai **Rp2,7 triliun** hingga Juli 2025
- **230+ gudang** di **28 provinsi**
- Pembiayaan yang tersalurkan **Rp1,2 triliun**

Empat hambatan yang tersisa:
1. Pembiayaan masih lewat bank, administratif, dan pemberinya terbatas.
2. Resi bisa diperdagangkan secara hukum, tapi belum ada pasar yang mudah diakses.
3. Satu resi = satu batch besar, tidak bisa dijual sebagian.
4. Pendana kecil tidak bisa ikut membiayai.

**Urgensinya** ada di tiga lapis:

- **Musiman dan berulang.** Panen datang tiap tahun, harga jatuh tiap panen. Ini bukan masalah sekali selesai.
- **Infrastruktur sudah ada, lapisan likuiditasnya yang belum.** Kami tidak perlu membangun gudang, registry, atau lembaga penilai. Semuanya sudah berjalan. Yang hilang justru bagian yang paling cocok dikerjakan perangkat lunak.
- **Kepercayaan sedang rendah.** TaniFund gagal bayar sekitar **Rp14 miliar** kepada ~130 investor dan izinnya dicabut OJK pada 3 Mei 2024. Penyebabnya: jaminannya hanya janji panen. Di sini jaminannya barang fisik yang sudah berada di gudang.

Kalimat penutup bagian ini:

> Setiap panen, petani menjual asetnya di harga terendah karena tidak punya pilihan lain. Bukan karena tidak ada gudangnya, tapi karena tidak ada cara mencairkan sebagian tanpa menjual semuanya.

---

## 2. Solusi: Tuai Lite

Tuai adalah **lapisan likuiditas di atas SRG**. Resi yang sudah sah dipecah menjadi token per kilogram. Pemegang token bisa meminjam, menjual sebagian, atau menukar token kembali dengan barang.

Empat fitur produk, **tiga yang dibangun besok**:

| Fitur | Dibangun? | Catatan |
|---|---|---|
| Tokenisasi resi (1 token = 1 kg) | Ya | Satu seri per kombinasi komoditas + mutu + gudang |
| Pinjam instan dengan jaminan token | Ya | LTV 60%, stablecoin mock |
| Likuidasi otomatis saat harga turun | Ya | Ambang 80%, disimulasikan |
| Redemption fisik | Ya, versi minimal | Bakar token, tandai barang keluar |
| Jual sebagian ke pembeli lain | Tidak (demo manual) | Ditampilkan sebagai "beli dari akun kedua" |
| Dashboard pemberi pinjaman | Tidak | Cukup tampilkan saldo pool |
| Integrasi PT KBI, pencairan rupiah | Tidak | Di luar cakupan lomba |

**Batas yang kami akui terbuka:** di MVP, harga dan data gudang disimulasikan. Yang benar-benar berjalan on-chain adalah penerbitan token, pinjaman, perubahan harga, likuidasi, dan redemption.

---

## 3. Kenapa Monad

Jawaban jujur: untuk demo 2.000 token, database biasa cukup. Alasan Monad menjadi masuk akal bukan di skala demo, tapi di skala kalau produk ini berhasil.

**Angka jaringan** (Monad Foundation): ~10.000 TPS, blok 400 ms, finalitas ~800 ms, gas nyaris nol, EVM-compatible penuh.

**Kenapa angka itu penting untuk Tuai:**

1. **Unit transaksinya kecil dan banyak.** Satu resi 2 ton menjadi 2.000 token. Perdagangan per kilogram berarti puluhan ribu transaksi kecil per gudang per musim. Di L1 Ethereum, biaya transaksi akan lebih besar dari nilai barangnya.
2. **Pihaknya banyak dan tidak saling percaya.** Gudang, petani, pemberi pinjaman, pembeli, dan registry butuh satu catatan yang sama. Ini alasan struktural, bukan sekadar "biar cepat".
3. **Update harga dan likuidasi harus dekat dengan real-time.** Kalau responsnya menit-menit, posisi jaminan bisa sudah jauh di bawah ambang sebelum sempat ditindak.
4. **Likuiditas jadi composable.** Token yang sama bisa dipakai di pool pinjaman, pasar, atau protokol lain tanpa integrasi baru — sesuatu yang tidak mungkin kalau setiap gudang punya database sendiri.

Kalimat untuk panggung:

> Kalau Tuai hanya dipakai satu gudang, kami tidak butuh blockchain. Kalau dipakai 230 gudang dengan jutaan transaksi per kilogram, kami butuh rantai yang biayanya mendekati nol dan finalitasnya di bawah satu detik. Itu Monad.

---

## 4. Inovasi dan pembeda

Yang sudah ada hari ini:

| Yang sudah ada | Apa yang sudah dilakukan | Yang belum |
|---|---|---|
| SRG / e-resi (PT KBI) | Digitalisasi dokumen resi, registrasi, pengawasan | Resi tetap satu dokumen utuh, tidak bisa dipecah, tidak bisa diperdagangkan per kg |
| Repo SRG via bank | Resi dijadikan jaminan pinjaman bank | Proses administratif, pemberi dana terbatas, tidak instan |
| TaniFund | Pendanaan petani berbasis platform | Jaminannya janji panen; gagal bayar Rp14 M, izin dicabut OJK |
| RWA lending global (Centrifuge, Maple, dll.) | Tokenisasi piutang dan kredit | Tidak menyentuh resi gudang Indonesia, tidak ada jalur penebusan barang fisik |

**Tiga pembeda yang bisa dipertahankan:**

1. **Jalur keluar ke barang fisik, bukan cuma ke uang.** Pemegang token bisa membakar token dan mengambil komoditasnya di gudang. Ini yang membedakan Tuai dari token RWA yang sebenarnya hanya surat utang. Nilainya tidak bergantung pada satu pihak yang bersedia membeli kembali.
2. **Unitnya per kilogram, bukan per batch.** Ini membuka partisipasi pendana kecil dan penjualan sebagian — dua hal yang secara struktural tidak bisa dilakukan resi konvensional.
3. **Jaminannya barang yang sudah ada, bukan proyeksi panen.** Ini jawaban langsung atas kegagalan model TaniFund.

Yang **tidak** kami klaim: bahwa tokenisasi resi belum pernah terpikirkan. Yang baru adalah menggabungkan aset berizin lokal, unit per kilogram, pool pinjaman terbuka, dan penebusan fisik dalam satu alur.

---

## 5. Pasar dan profitabilitas

**Pasar yang sudah terbukti ada:**

- Rp2,7 triliun nilai resi, Rp1,2 triliun pembiayaan tersalurkan, 230+ gudang, 28 provinsi.
- Pasar awalnya bukan "semua petani Indonesia", tapi **satu gudang atau koperasi mitra**. Setiap gudang yang aktif adalah unit pertumbuhan yang bisa dihitung.

**Model pendapatan:**

| Sumber | Besaran (asumsi) |
|---|---|
| Fee tokenisasi | 0,3% dari nilai resi yang diterbitkan |
| Porsi bunga pinjaman | 20% dari bunga yang dibayar petani |
| Fee redemption | Rp50 per kg |
| Fee pasar sekunder | 0,2% per transaksi |

**Hitungan per gudang (semua angka adalah asumsi, bukan proyeksi):**

- 50 petani, rata-rata pinjaman Rp50 juta → portofolio aktif **Rp2,5 miliar**
- Bunga 12% per tahun → **Rp300 juta** bunga per tahun
- Porsi protokol 20% → **Rp60 juta per tahun per gudang**
- Ditambah fee tokenisasi dan redemption, kira-kira **Rp80–100 juta per tahun per gudang**

Dengan biaya tim ramping sekitar Rp600 juta per tahun, titik impas ada di sekitar **7–10 gudang aktif** — sekitar 3–4% dari 230 gudang yang sudah ada. Itu bukan pasar yang harus diciptakan dari nol.

**Kejujuran yang perlu disampaikan:** pada skala hackathon, ini belum menghasilkan uang. Yang kami tunjukkan adalah jalur menuju impas, bukan laba hari ini.

**Keberatan yang pasti muncul: "KUR cuma 6%, kenapa petani mau pinjam di sini?"**

Jawaban: KUR mensyaratkan agunan tambahan, rekam kredit, dan proses yang tidak selesai dalam hitungan menit. Banyak petani kecil tidak masuk kriteria, atau butuh dana sebelum pengajuan bank selesai. Tuai tidak bersaing pada harga dengan subsidi negara; kami bersaing pada **kecepatan, agunan yang sudah ada di gudang, dan kemampuan menjual sebagian tanpa kehilangan seluruh upside harga**. Kalau nanti skema subsidi bisa memakai Tuai sebagai kanal, biaya bisa turun lagi — tapi itu bukan klaim MVP.

---

## 6. Demo (2,5 menit)

Satu cerita, tiga babak. Tidak ada lompatan fitur.

**Persiapan:** dua akun siap — `Gudang` dan `Pak Budi`. Harga awal Rp100.000/kg. Saldo pool sudah diisi. Rekaman cadangan sudah ada.

| Waktu | Yang dilakukan | Yang dikatakan |
|---|---|---|
| 0:00–0:20 | Tunjukkan resi (gambar dokumen) | "Ini resi kopi 2 ton milik Pak Budi, sudah di gudang berizin." |
| 0:20–0:40 | Login sebagai gudang, klik "Tokenisasi" | "Resi ini dipecah jadi 2.000 token. Satu token satu kilogram." |
| 0:40–1:10 | Ganti ke akun Pak Budi, klik "Pinjam" | "Dia mengunci 2.000 token dan menerima 60% nilai, cair dalam satu blok. Tidak ada bank, tidak ada formulir." |
| 1:10–1:40 | Admin menurunkan harga ke Rp70.000 | "Sekarang harga jatuh. Posisi Pak Budi menyentuh ambang likuidasi." |
| 1:40–2:00 | Klik "Likuidasi" | "Jaminan dilelang otomatis ke pool. Pemberi pinjaman tidak kehilangan pokok." |
| 2:00–2:30 | Klik "Tebus" di akun lain, token terbakar | "Atau pemegang token datang ke gudang, bakar token, ambil kopinya. Token selalu sama dengan stok." |

**Jangan didemokan:** pasar sekunder penuh, dashboard yield, integrasi registry. Sebut sebagai roadmap, bukan demo.

**Rencana cadangan:** rekaman layar 2 menit siap di laptop dan di ponsel. Kalau RPC atau proyektor bermasalah, video diputar dan kamu tetap menarasikan live.

---

## 7. Scope 7 jam

### Yang dibangun

- [ ] `TuaiLite.sol`: mint resi, pinjam, lunasi, set harga, likuidasi, redemption
- [ ] Mock stablecoin (IDRX-like, 6 desimal) + pool likuiditas
- [ ] Halaman tunggal dengan pemilih peran: Gudang / Petani / Pemberi Pinjaman / Admin
- [ ] Panel harga + indikator kesehatan posisi (LTV)
- [ ] Seed data: 1 gudang, 1 petani, 1 resi, 1 posisi pinjaman
- [ ] Rekaman demo cadangan

### Yang tidak dibangun

- [ ] Integrasi nyata PT KBI / Bappebti
- [ ] Pencairan ke rupiah
- [ ] Order book atau AMM
- [ ] Multi-gudang, multi-komoditas
- [ ] Autentikasi pengguna sungguhan (cukup koneksi wallet)
- [ ] Embedded wallet / login nomor HP

### Jadwal hari H

| Jam | Kegiatan | Target |
|---|---|---|
| 0:00–0:30 | Setup, deploy kontrak, isi seed data | Kontrak live di testnet |
| 0:30–2:30 | Frontend inti: mint + pinjam | Alur utama jalan end-to-end |
| 2:30–4:00 | Harga turun, likuidasi, redemption | Tiga babak demo lengkap |
| 4:00–5:00 | Polish: angka rapi, label jelas, error state | Bisa dipresentasikan tanpa malu |
| 5:00–5:45 | Rekam demo cadangan | File video tersimpan |
| 5:45–6:30 | Latihan pitch + hafal Q&A | 2,5 menit tanpa membaca |
| 6:30–7:00 | Buffer | Tidak menambah fitur |

### Kriteria berhenti (kill criteria)

Kalau **pukul 2:30 mint + pinjam belum jalan di testnet**, hentikan pengembangan fitur. Pakai rekaman, rapikan slide, dan habiskan sisa waktu untuk pitch. Demo setengah jadi lebih buruk daripada demo terekam yang utuh.

**Aturan malam ini:** kontrak dan halaman utama ditulis sekarang, bukan besok. Besok hanya merakit, memperbaiki, dan berlatih.

---

## 8. Arsitektur minimum

```
[ Halaman web (Next.js + wagmi/viem) ]
        |
        | baca/tulis
        v
[ TuaiLite.sol di Monad testnet ]
   |-- ReceiptToken      : saldo kg per seri (ERC-1155 sederhana)
   |-- LendingPool       : mock IDRX, LTV 60%, ambang 80%
   |-- MockOracle        : harga per seri, admin-set
   |-- Roles             : admin, gudang terverifikasi
        |
        v
[ Dunia nyata — disimulasikan di MVP ]
   resi, mutu, stok gudang, harga
```

**Fungsi kontrak yang wajib ada:**

```solidity
mintReceipt(seriesId, to, kg)        // hanya gudang terverifikasi
borrow(seriesId, kg)                 // kunci token, cairkan stablecoin 60%
repay(amount)                        // lunasi, token kembali
setPrice(seriesId, pricePerKg)       // oracle mock
liquidate(user)                      // jika LTV > 80%
redeem(seriesId, kg)                 // bakar token, tandai barang keluar
health(user) view returns (uint256)  // LTV untuk UI
```

**Keputusan teknis:**

| Aspek | Pilihan | Alasan |
|---|---|---|
| Token | ERC-1155 per seri | Satu kontrak, banyak jenis barang, saldo per kg |
| Stablecoin | Mock ERC-20, 6 desimal | Tidak perlu akun bursa atau bridge saat demo |
| Harga | Admin-set | Cukup untuk menunjukkan mekanisme; oracle nyata jadi roadmap |
| Likuidasi | Manual trigger | Otomatis butuh keeper; manual lebih aman di panggung |
| Jaringan | Monad testnet | Sesuai target lomba |

---

## 9. Keamanan

Yang benar-benar penting di produk ini bukan reentrancy — itu sudah standar. Yang penting adalah **kecocokan antara token dan barang fisik**.

| Ancaman | Mitigasi di MVP | Catatan produksi |
|---|---|---|
| Penerbitan oleh pihak tak berwenang | Whitelist gudang (`onlyWarehouse`) | Multisig + audit |
| **Over-issuance oleh gudang yang sah** | Plafon per nomor resi, satu resi hanya bisa dimintakan sekali | Rekonsiliasi stok berkala, jaminan gudang, audit fisik |
| Harga dimanipulasi | Harga admin-set + batas perubahan | Oracle multi-sumber, TWAP, deviation cap |
| Penarikan barang ganda | Barang hanya keluar setelah token dibakar (di MVP: penanda `redeemed`) | Kontrol fisik di gudang, dokumen serah terima |
| Reentrancy | Checks-effects-interactions + guard | Audit |
| Kunci admin bocor | Satu admin di MVP, disebut sebagai keterbatasan | Multisig, timelock, pause |
| Bug LTV | Pembulatan hati-hati, unit test skenario ekstrem | Fuzzing, audit |

**Pertanyaan yang harus dijawab jujur kalau ditanya:** "Siapa yang menjamin gudang tidak menerbitkan token ganda?" Jawab: "Di MVP, plafon per resi dan pencatatan on-chain. Di produksi, itu harus diselesaikan dengan kewajiban kontraktual gudang, rekonsiliasi stok, dan audit — dan itu memang bagian tersulit dari bisnis ini, bukan bagian blockchain-nya."

---

## 10. Jawaban untuk pertanyaan juri

### 1. Apa relevansinya dengan Monad? Apa untungnya?

> Tuai memecah satu resi menjadi ribuan unit dan memperdagangkannya per kilogram. Artinya transaksinya kecil dan banyak — persis jenis beban yang membuat chain mahal tidak masuk akal. Monad memberi blok 400 ms, finalitas di bawah satu detik, dan gas yang nyaris nol, jadi pinjaman mikro dan perdagangan per kg tetap ekonomis. Selain itu EVM-compatible, jadi kami bisa memakai tooling standar dan langsung composable dengan protokol lain di Monad.

Cadangan: sebutkan 10.000 TPS dan alasan struktural (banyak pihak tidak saling percaya butuh ledger bersama).

### 2. Inovasinya apa? Apa bedanya dengan yang sudah ada?

> Resi gudang sudah ada, bank sudah membiayainya, dan e-resi sudah didigitalkan. Yang belum ada adalah cara memecah resi menjadi unit per kilogram yang bisa dipinjamkan dan diperdagangkan, lalu ditebus kembali menjadi barang fisik. Tiga pembeda kami: unit per kg, pool pendanaan terbuka, dan jalur penebusan barang — bukan sekadar token yang nilainya bergantung pada satu pihak yang mau membelinya.

Jangan bilang "belum ada yang pernah bikin". Bilang "belum ada yang menggabungkan keempatnya untuk SRG Indonesia".

### 3. Pasarannya ada? Profitable?

> Pasarannya sudah ada dan sudah dihitung negara: Rp2,7 triliun nilai resi, Rp1,2 triliun pembiayaan, 230 gudang di 28 provinsi. Kami tidak perlu menciptakan kebiasaan baru; kami menambah lapisan likuiditas pada sistem yang sudah berjalan. Unit ekonomi kami dihitung per gudang: portofolio Rp2,5 miliar menghasilkan sekitar Rp80–100 juta per tahun untuk protokol. Titik impas di 7–10 gudang. Pada skala hackathon belum profitable — yang kami tunjukkan adalah jalurnya, bukan klaim laba hari ini.

### 4. Bisa dibangun dalam waktu yang ditentukan?

> Yang kami bangun adalah satu alur inti: tokenisasi, pinjam, harga turun, likuidasi, redemption. Bukan seluruh platform. Kontraknya sekitar 200 baris dan sudah ditulis sebelum hari H; hari H dipakai untuk integrasi, demo, dan latihan. Fitur di luar alur itu — pasar sekunder, dashboard lender, integrasi registry — sengaja tidak dibangun dan kami sebut sebagai roadmap.

Kalau ditanya "kenapa tidak sekalian": jawab bahwa memilih apa yang tidak dibangun adalah bagian dari rekayasa.

### 5. Pernah pengalaman bikin sebelumnya?

Jawab jujur, lalu alihkan ke bukti. Jangan mengarang.

> Ini proyek pertama saya yang menyentuh aset dunia nyata. Sebelumnya saya [isi: proyek web / hackathon / aplikasi apa]. Yang bisa saya tunjukkan hari ini bukan portofolio, tapi hasil: kontrak berjalan di testnet, demo utuh, dan rekaman cadangan. Saya juga membatasi scope secara sadar supaya yang didemokan benar-benar selesai.

Kalau timnya berisi orang berpengalaman, sebutkan perannya masing-masing dan tunjukkan pembagian kerja yang jelas.

### 6. Latar belakang dan urgensi ide ini?

> Saya melihat pola yang berulang: petani menjual murah bukan karena tidak tahu harga, tapi karena butuh uang hari itu. Negara sudah membangun solusinya — SRG — tapi bagian yang mencairkan nilainya masih lambat dan eksklusif. Ditambah lagi, kegagalan TaniFund menunjukkan bahwa pendanaan pertanian tanpa jaminan fisik berbahaya. Tuai menggabungkan dua hal yang sudah terbukti: resi gudang sebagai jaminan, dan tokenisasi untuk memecah serta mempercepat. Urgensinya musiman dan berulang setiap panen, dan infrastrukturnya sudah ada — yang kurang hanya lapisan perangkat lunak.

### Pertanyaan tambahan yang sering menyusul

**"Kenapa tidak pakai database saja?"**
> Untuk satu gudang, bisa. Masalahnya ada empat pihak yang tidak saling percaya dan saldo yang berpindah tangan. Database milik siapa? Kalau gudang yang memegang, pemberi pinjaman harus percaya penuh. Kalau kami yang memegang, kami jadi perantara terpusat yang justru ingin kami hindari. Blockchain membuat aturan dan saldo bisa diperiksa semua pihak tanpa perlu saling percaya.

**"Kalau gudang curang?"**
> Itu risiko utama, dan kami tidak menyembunyikannya. Mitigasinya berlapis: plafon per nomor resi, rekonsiliasi stok, kewajiban kontraktual gudang, dan penjaminan yang sudah ada di SRG. Blockchain mencegah penggandaan di sisi catatan; kecurangan fisik dicegah oleh kontrol operasional dan audit.

**"Regulasinya bagaimana?"**
> Kami tidak menerbitkan aset sendiri. Posisi kami adalah teknologi yang dipakai pengelola gudang atau pusat registrasi. Untuk produksi, tokenisasi resi perlu persetujuan Bappebti, dan sisi pendanaan kemungkinan masuk wilayah OJK. MVP ini testnet, tanpa uang sungguhan, dan kami sebut batas itu terbuka.

**"Kalau harga anjlok, petani dilikuidasi?"**
> Ada tiga lapis: LTV konservatif 60%, peringatan dini, dan masa tenggang sebelum likuidasi. Kalau tetap jatuh, jaminan dijual ke off-taker yang sudah dikontrak — bukan ke pasar bebas yang mungkin sedang kosong. Ini juga alasan kami tidak mengklaim likuidasi otomatis berjalan tanpa pembeli.

---

## 11. Asumsi dan hal yang tidak diklaim

Tulis ini di slide terakhir atau sampaikan saat Q&A. Juri lebih percaya tim yang tahu batas dirinya.

- Harga komoditas dan data gudang **disimulasikan** di MVP.
- Stablecoin yang dipakai adalah **mock**, bukan IDRX sungguhan. Untuk produksi, IDRX (rupiah) lebih tepat daripada stablecoin dolar karena petani meminjam dan melunasi dalam rupiah.
- Belum ada integrasi dengan PT KBI, Bappebti, atau bank.
- Likuidasi mengasumsikan ada off-taker. Di MVP, pool yang menyerap.
- Pemecahan resi dan penebusan per kilogram perlu dipastikan sesuai aturan SRG — ini pertanyaan legal terbuka, bukan hal yang sudah selesai.
- Tidak ada uang sungguhan yang berpindah tangan.

---

## 12. Tim dan pembagian tugas

| Peran | Tanggung jawab | Nama |
|---|---|---|
| Smart contract | `TuaiLite.sol`, deploy, seed data |  |
| Frontend | Halaman peran, koneksi wallet, panel LTV |  |
| Demo dan pitch | Naskah, rekaman, latihan Q&A |  |
| Keamanan (bisa merangkap) | Review kontrak, daftar ancaman, skenario gagal |  |

Kalau solo: kerjakan kontrak lebih dulu, frontend memakai komponen template, dan rekaman demo dibuat paling lambat pukul 5.

---

## 13. Sumber

- [Digitalisasi KBI perkuat akses pembiayaan, Bisnis.com](https://market.bisnis.com/read/20251021/94/1922794/digitalisasi-kbi-perkuat-akses-pembiayaan-efisiensi-ekspor-komoditas)
- [Duet Bappebti dan KBI dorong pemanfaatan SRG, CNBC Indonesia](https://www.cnbcindonesia.com/market/20191129162413-17-119127/duet-bappebti-kbi-dorong-pemanfaatan-sistem-resi-gudang)
- [Kronologi TaniFund gagal bayar, detikFinance](https://finance.detik.com/fintech/d-6765171/kronologi-tanifund-gagal-bayar-hingga-terancam-izin-dicabut-ojk)
- [Perjalanan gagal bayar TaniFund, Kontan](https://keuangan.kontan.co.id/news/perjalanan-panjang-gagal-bayar-tanifund-digugat-lender-hingga-dicabut-izin-usaha)
- [Contextualizing Blockchain Performance, Monad Foundation](https://monad.xyz/blog/contextualizing-blockchain-performance)
- [Pelaksanaan Penjaminan Sistem Resi Gudang, Jurnal Reformasi Hukum Trisakti](https://e-journal.trisakti.ac.id/index.php/refor/article/download/18692/10504)
- [UU No. 9 Tahun 2006 tentang Sistem Resi Gudang](https://peraturan.bpk.go.id/Details/40022/uu-no-9-tahun-2006)
