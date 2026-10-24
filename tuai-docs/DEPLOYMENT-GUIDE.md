# Multi-Deployer Setup — Tuai Blitz

## Konsep

Setiap developer punya private key sendiri → bisa deploy kapan saja tanpa share key.

**Keuntungan:**
- Tidak ada yang share private key
- Setiap developer bisa deploy independen
- Bisa deploy dari komputer mana saja
- Lebih aman untuk tim

## Aturan utama: satu deployment kanonik

Setiap deploy = **kontrak baru** dengan owner = deployer-nya. Tiga orang deploy sendiri-sendiri = tiga kontrak terpisah (data, admin, pool beda). Karena itu:

- Tim memakai **satu** deployment untuk frontend & demo — alamat di `STATUS.md` §Alamat deployment.
- Deploy ulang hanya kalau **kontrak berubah**, dan diumumkan dulu di grup.
- Fungsi admin (`setPrice`, `setWarehouse`) hanya bisa dipanggil **owner deployment kanonik**. Developer lain minta owner menjalankan `setWarehouse(<alamatnya>, true)` kalau perlu peran gudang.

### Setelah deploy testnet — wajib commit 3 hal

```bash
git add packages/foundry/deployments/10143.json \
        packages/foundry/broadcast/DeployTuai.s.sol/10143/run-*.json \
        packages/nextjs/contracts/deployedContracts.ts
```

`deployedContracts.ts` di-generate dari folder `broadcast/`. Kalau file broadcast 10143 tidak di-commit, developer lain yang menjalankan `yarn deploy` lokal (anvil) akan **menghapus blok 10143** dari `deployedContracts.ts` saat generate ulang. File broadcast aman di-commit: data sensitif disimpan foundry di `cache/`, bukan di `broadcast/`. Folder `dry-run/` dan chain `31337` tetap di-ignore (`packages/foundry/.gitignore`).

**Jangan commit** `deployedContracts.ts` hasil `yarn deploy` lokal kalau blok `10143` hilang — cek dulu `git diff`.

## Setup per Developer

### 1. Buat keystore lokal (sekali saja)

```bash
cd app/packages/foundry

# Opsi A: generate keystore baru
yarn account:generate
# Input nama: dev-<nama>  (misal: dev-haidar, dev-xsafi, dev-team3)
# Buat password yang kuat

# Opsi B: import dari MetaMask
yarn account:import
# Input nama: dev-<nama>
# Paste private key dari MetaMask
# Buat password keystore
```

### 2. Catat alamat keystore

```bash
# Di laptop ini, cek alamat
HOME="$TUAIBLITZ_ROOT/.tools/home" cast wallet address --account dev-<nama>
```

Simpan alamat ini untuk di-share ke tim.

### 3. Deploy testnet

```bash
cd app

# Deploy dengan keystore
HOME="$TUAIBLITZ_ROOT/.tools/home" \
  yarn deploy --file DeployTuai.s.sol --network monad_testnet --keystore dev-<nama>

# Atau langsung dengan forge (kalau yarn deploy bermasalah)
HOME="$TUAIBLITZ_ROOT/.tools/home" \
  forge script packages/foundry/script/DeployTuai.s.sol \
  --rpc-url https://testnet-rpc.monad.xyz \
  --account dev-<nama> \
  --broadcast --legacy --ffi
# password ditanya interaktif — jangan pakai --password (tersimpan di history shell)
```

### 4. Verifikasi kontrak (tanpa private key)

```bash
cd packages/foundry
forge verify-contract <alamat MockIDRX> contracts/MockIDRX.sol:MockIDRX \
  --chain 10143 --verifier sourcify --verifier-url https://sourcify-api-monad.blockvision.org
forge verify-contract <alamat TuaiBlitz> contracts/TuaiBlitz.sol:TuaiBlitz \
  --chain 10143 --constructor-args $(cast abi-encode "c(address)" <alamat MockIDRX>) \
  --verifier sourcify --verifier-url https://sourcify-api-monad.blockvision.org
```

### Windows (tanpa `.tools/`)

Path `$TUAIBLITZ_ROOT/.tools` hanya ada di mesin Linux dev 1. Di Windows: pasang Foundry v1.8.6 (zip `foundry_v1.8.6_win32_amd64.zip` dari GitHub release, ekstrak ke `C:\Users\<user>\.foundry\bin`, tambahkan ke PATH), `yarn install` di root, lalu jalankan perintah di atas tanpa prefix `HOME=...`.

## Koordinasi Tim

### Cara 1: Deployer Registry (Recommended)

Setiap developer daftarkan alamatnya di grup/chat:

```
dev-haidar:  0x1234...
dev-xsafi:   0x5678...
dev-team3:   0xabcd...
```

**Keuntungan:** Semua bisa deploy, alamat tercatat, tidak bentrok.

### Cara 2: Deployer Utama

Satu orang jadi "Deployer Utama", yang lain hanya commit kode.

- Deployer utama: `dev-haidar` → deploy ke testnet
- Developer lain: commit code, PR, review

**Keuntungan:** Lebih terkontrol, tidak ada deploy duplikat.

## Konfigurasi .env

Setiap developer buat `.env` sendiri (sudah di .gitignore):

```bash
# packages/foundry/.env
ALCHEMY_API_KEY=<dari alchemy>
ETHERSCAN_API_KEY=<dari etherscan>

# Pilih salah satu:
ETH_KEYSTORE_ACCOUNT=dev-<nama>      # pakai keystore
# atau
DEPLOYER_PRIVATE_KEY=0x...           # pakai private key langsung (kurang aman)
```

## Troubleshooting

### "Keystore not found"
```bash
# Pastikan keystore ada
ls $HOME/.foundry/keystores/
# atau di lokasi custom
ls tuai-lite/.tools/home/.foundry/keystores/
```

### "Insufficient funds"
- Cek saldo: `cast balance <alamat> --rpc-url https://testnet-rpc.monad.xyz`
- Faucet: https://faucet.monad.xyz atau kirim MON dari developer lain

### "Nonce too low"
- Tunggu transaksi pending selesai
- Atau reset nonce: `cast nonce <alamat> --rpc-url ...`

## Best Practices

1. **Jangan commit .env** — sudah di .gitignore, tapi tetap hati-hati
2. **Backup keystore** — simpan backup encrypted di tempat aman
3. **Password kuat** — minimal 12 karakter, kombinasi huruf-angka-simbol
4. **Alamat tercatat** — setiap developer catat alamatnya di shared doc
5. **Komunikasi** — sebelum deploy, announce di grup supaya tidak bentrok

## Contoh Workflow Tim

```
Developer A:
1. git pull
2. ada perubahan kontrak baru
3. announce di grup: "deploy v3 testnet dalam 5 menit"
4. deploy
5. catat alamat baru di STATUS.md
6. push

Developer B:
1. git pull
2. lihat alamat baru di STATUS.md
3. lanjut kerja UI/frontend dengan alamat terbaru
```

## Alamat Deployer Aktif

| Developer | Nama Keystore | Alamat | Status |
|-----------|---------------|--------|--------|
| Xsafi (dev 1) | tuai-deployer | 0x0548b15Fc15eC4779ad1E766aa3c93C827AB820a | Aktif — **owner deployment kanonik v2** (6,58 MON) |
| Haidar (dev 2) | dev-haidar | _(isi setelah `yarn account:generate`)_ | Belum |
| | | | |

Tambahkan baris untuk setiap developer yang join.
