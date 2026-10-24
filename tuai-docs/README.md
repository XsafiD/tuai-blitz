# Tuai Blitz

Repo: `git@github.com:XsafiD/tuai-blitz.git` · workspace lokal: `…/vault-004/tuai-lite`

MVP testnet: resi gudang (ERC-1155) → pinjam IDRX 60% LTV → likuidasi saat harga jatuh.

Semua toolchain **lokal di workspace** (`tuai-lite/`): tidak ada `sudo`, tidak ada instalasi global.

```
tuai-lite/                    # workspace (tidak di-commit)
├── activate.sh               # source ini dulu di setiap terminal
├── app/                      # REPO git: github.com/XsafiD/tuai-blitz
│   ├── tuai-docs/
│   │   ├── STATUS.md         # papan status T0–T23 + gate log
│   │   ├── BATCH-PLAN.md     # 7 batch (B0–B6) + gate + mode darurat
│   │   ├── README.md         # dokumen ini
│   │   └── notes/            # t0-preflight, b2-credit-layer, b3-tests
│   ├── packages/foundry/     # kontrak, test, script deploy
│   └── packages/nextjs/      # UI (B5)
├── demo/                     # rekaman layar (mp4 tidak di-commit)
└── .tools/                   # foundry, yarn shim, corepack cache (jangan di-commit)
```

## Mulai

```bash
cd tuai-lite
source ./activate.sh
```

Keystore lokal ada di `.tools/home` (bukan `~/.foundry`), jadi deploy tidak menyentuh home:

```bash
# terminal 1 — chain
anvil

# terminal 2 — deploy lokal (anvil harus hidup)
cd app && HOME="$TUAIBLITZ_ROOT/.tools/home" yarn deploy --file DeployTuai.s.sol --keystore scaffold-eth-default

# terminal 3 — UI
cd app && yarn start        # http://localhost:3000
```

Test kontrak:

```bash
cd app/packages/foundry && forge test -vv
```

## Deploy testnet (B4)

Keystore: `tuai-deployer` (password `tuai-lite-demo`, file di `.tools/home/.foundry/keystores`).
Butuh MON di Monad Testnet (base fee ±100 gwei, deploy ±0,83 MON).

```bash
cd app && HOME="$TUAIBLITZ_ROOT/.tools/home" \
  yarn deploy --file DeployTuai.s.sol --network monad_testnet --keystore tuai-deployer
```

Password diminta interaktif. Untuk non-interaktif tambahkan `--password` lewat `forge script` langsung
(`yarn deploy` belum meneruskan password).

## Catatan penting

- `packages/nextjs/scaffold.config.ts` sudah diperbaiki: `chains.monad_testnet` tidak ada di `viem@2.31.1`, diganti `chains.monadTestnet`. Jangan dikembalikan.
- Nama network Foundry tetap `monad_testnet` (`yarn deploy --network monad_testnet`). Itu namespace Foundry, bukan viem.
- `ETH_KEYSTORE_ACCOUNT` di `packages/foundry/.env` harus cocok dengan keystore yang ada.
- Jangan jalankan `yarn chain` (menulis keystore ke `~/.foundry`). Pakai `anvil` langsung.
- `script/DeployHelpers.s.sol` dipatch untuk forge 1.8.6: `this.getChain()`/`this.anvil_setBalance()` diganti panggilan internal, karena forge menolak `address(this)` di script.

## Aturan

1. Baca `BATCH-PLAN.md` §3 sebelum menyentuh kode. Satu file, satu pemilik.
2. Jangan install apa pun ke sistem. Binary baru → `.tools/` + `activate.sh`.
3. Jangan commit `.env`, private key, `.tools/`, atau video demo.
4. Gate merah = batch berikutnya tidak dimulai.
5. Urutan: **B0 → B1 → B2 → B3 → B4 → B5 → B6**.

## Status saat ini

- **B0–B3 selesai**; ABI beku setelah B3 (`forge test` 4/4).
- **B4 berjalan**: script deploy + keystore siap, menunggu dana Monad Testnet.
- B5 (UI) belum mulai.
