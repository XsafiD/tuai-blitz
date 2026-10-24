# T0 — Hasil Preflight (sudah dijalankan)

Tanggal: 2026-10-24 · Mesin: linux x64 · Folder: `tuai-lite/`

## 1. Versi

| Komponen | Hasil | Catatan |
|---|---|---|
| node | **v22.23.2** | syarat repo `>=20.18.3` terpenuhi |
| yarn | **3.2.3** | dari `.yarn/releases/yarn-3.2.3.cjs`, diakses lewat shim `tuai-lite/.tools/bin` |
| forge | **1.8.6** | `tuai-lite/.tools/foundry/bin/forge` (tidak ada di sistem) |
| anvil | 1.8.6 | hidup, `eth_chainId` = `0x7a69` (31337) |
| cast | 1.8.6 | tersedia |
| OpenZeppelin | **v5.3.0** | `contracts/utils/ReentrancyGuard.sol`, `Ownable(msg.sender)` |
| submodule | forge-std, OZ, solidity-bytes-utils | sudah di-init rekursif |

`forge --version` di sistem **kosong** sebelum instalasi — semua binary berada di dalam project.

## 2. Hook Scaffold yang tersedia

`app/packages/nextjs/hooks/scaffold-eth/` berisi:

```
useScaffoldReadContract.ts        <- API BARU
useScaffoldWriteContract.ts       <- API BARU
useScaffoldContract.ts
useScaffoldEventHistory.ts
useScaffoldWatchContractEvent.ts
useDeployedContractInfo.ts
useTransactor.tsx
...
```

**Kesimpulan: pakai API baru.** Jangan tulis `useScaffoldContractRead` / `useScaffoldContractWrite` (tidak ada di repo ini).

## 3. Hasil perintah verifikasi

```bash
$ forge build          # sukses, hanya warning lint (vm.createSelectFork)
$ forge test
Ran 1 test for test/YourContract.t.sol:YourContractTest
[PASS] testMessageOnDeployment() (gas: 9424)
Suite result: ok. 1 passed; 0 failed; 0 skipped
$ anvil --port 8545 && curl eth_chainId
{"jsonrpc":"2.0","id":1,"result":"0x7a69"}
```

## 4. Deviations — dokumen 07 vs repo nyata

Repo: `github.com/monad-developers/scaffold-monad-foundry` (branch `main`, commit `14fa9c8`).

| # | Dokumen 07 | Repo nyata | Tindakan |
|---|---|---|---|
| 1 | `packages/nextjs/pages/tuai.tsx` | **App Router** — `app/layout.tsx`, `app/page.tsx` | halaman → `app/tuai/page.tsx`; komponen → `app/components/tuai/` |
| 2 | `packages/foundry/deploy/00_deploy_tuai.ts` (hardhat-deploy) | **Foundry Script** — `script/Deploy.s.sol`, `DeployYourContract.s.sol`; Makefile `DEPLOY_SCRIPT` | tulis `script/DeployTuai.s.sol` turunan `ScaffoldETHDeploy`, daftarkan di `Deploy.s.sol` |
| 3 | `targetNetworks: [chains.monadTestnet]` | kode repo `chains.monad_testnet` (tidak ada di viem 2.31.1 → app 500) | **sudah diperbaiki** jadi `chains.monadTestnet` |
| 4 | `yarn deploy --network monadTestnet` | nama network `monad_testnet` (foundry.toml + scaffold.config) | pakai `--network monad_testnet` |
| 5 | `.env` di root repo | `.env` di `packages/foundry/.env` (auto-copy dari `.env.example`), isi `ALCHEMY_API_KEY`, `ETHERSCAN_API_KEY`, `ETH_KEYSTORE_ACCOUNT`, `DEPLOYER_PRIVATE_KEY` | jangan bikin `.env` baru di root; `.env` sudah di-ignore `packages/foundry/.gitignore` |
| 6 | "cek hook lama vs baru" | sudah API baru | `useScaffoldReadContract` / `useScaffoldWriteContract` |
| 7 | "cek OZ v4 vs v5" | v5.3.0 | import v5 |
| 8 | deploy pakai Hardhat `hre.deployments` | tidak ada hardhat-deploy | jangan ikuti snippet TS di T11 |
| 9 | `yarn chain` | `make chain` → import keystore ke `~/.foundry/keystores` lalu `anvil` | boleh; keystore = data wallet, bukan instalasi sistem. Alternatif nol jejak: jalankan `anvil` langsung |
| 10 | "faucet IDRX mint terbuka" | belum ada kontrak | tetap sesuai rencana T1 |

## 5. Catatan teknis yang bisa menggigit

- **Deploy script butuh `--ffi`** (sudah di Makefile). Saat memanggil `forge script` manual, jangan lupa `--ffi --legacy --broadcast`.
- **`yarn deploy` meng-generate ABI TS** (`scripts-js/generateTsAbis.js`) ke `packages/nextjs/contracts/deployedContracts.ts`. Setelah B4, frontend otomatis bisa import kontrak baru — jangan edit file itu manual.
- **`nmHoistingLimits: workspaces`** → dependency tidak di-hoist. Import lintas package bisa gagal; pakai dependency yang sudah ada di `packages/nextjs/package.json`.
- **Anvil chain id 31337**, monad testnet **10143**. Jangan campur alamat deployment lokal dan testnet di UI saat demo.
- **`seriesIds` mulai dari 1**: `createSeries` harus `id = ++nextSeriesId` (atau push lalu `nextSeriesId = id`) supaya `borrow(1, ...)` menunjuk seri pertama, bukan seri kosong.
- **`getSeries()` mengembalikan struct dinamis** (string) — `useScaffoldReadContract` perlu `abi` dari `deployedContracts.ts`, bukan ABI manual.

## 6. Temuan saat menyalakan app (bug repo, sudah diperbaiki)

`scaffold.config.ts` di branch `main` memakai:

```ts
import * as chains from "viem/chains";
targetNetworks: [chains.foundry, chains.monad_testnet],
```

**`monad_testnet` tidak ada di `viem@2.31.1`.** Yang ada: `chains.monadTestnet` (chain id 10143). Akibatnya `next dev` mengembalikan **HTTP 500** dan `wagmiConnectors` crash (`Cannot read properties of undefined (reading 'id')`).

Perbaikan (1 baris, sudah diterapkan):

```ts
targetNetworks: [chains.foundry, chains.monadTestnet],
```

Setelah itu `GET /` = **200**. Jadi bila dokumen 07 menulis `chains.monadTestnet`, dokumen itu yang benar — kode repo yang salah.

Catatan: `monad_testnet` **tetap** dipakai sebagai nama network di `foundry.toml` (`[rpc_endpoints]`) dan untuk `yarn deploy --network monad_testnet`. Dua namespace ini berbeda: viem vs foundry.

## 7. Verifikasi deploy lokal (lulus)

Agar tidak menulis ke `~/.foundry`, keystore anvil disimpan di `.tools/home`:

```bash
mkdir -p .tools/home .tools/foundry/keystores
HOME="$TUAIBLITZ_ROOT/.tools/home" cast wallet import scaffold-eth-default \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --unsafe-password localhost
```

Lalu, dengan anvil hidup:

```bash
cd app && HOME="$TUAIBLITZ_ROOT/.tools/home" yarn deploy --keystore scaffold-eth-default
```

Hasil:

```
ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
📝 Updated TypeScript contract definition file on ../nextjs/contracts/deployedContracts.ts
deployments/31337.json
```

Artinya jalur `Makefile` → `forge script` → `generateTsAbis.js` sehat. `ETH_KEYSTORE_ACCOUNT` di `.env` **wajib** menunjuk ke nama keystore yang benar-benar ada, kalau tidak `forge script` gagal dengan `Keystore file ... does not exist` meskipun `--private-key` diberikan.

## 8. Status akhir B0

- [x] `forge build` + `forge test` baseline lulus
- [x] anvil hidup
- [x] `yarn deploy` lokal sukses + ABI TS ter-generate
- [x] `yarn start` → `http://localhost:3000` **200**
- [ ] `yarn account` (butuh keystore; opsional, bukan gate)
- [ ] burner wallet browser di-fund (nanti saat B4)
