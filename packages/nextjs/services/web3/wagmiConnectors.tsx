import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { rainbowkitBurnerWallet } from "burner-connector";
import * as chains from "viem/chains";
import scaffoldConfig from "~~/scaffold.config";

const { onlyLocalBurnerWallet, targetNetworks } = scaffoldConfig;

const wallets = [
  metaMaskWallet,
  walletConnectWallet,
  ledgerWallet,
  coinbaseWallet,
  rainbowWallet,
  safeWallet,
  ...(!targetNetworks.some(network => network.id !== (chains.hardhat as chains.Chain).id) || !onlyLocalBurnerWallet
    ? [rainbowkitBurnerWallet]
    : []),
];

// Saat SSR/SSG, RainbowKit membuat fallback connector WalletConnect untuk
// wallet seperti MetaMask/Rainbow, dan inisialisasi WalletConnect Core memakai
// indexedDB yang tidak tersedia di Node (muncul "indexedDB is not defined"
// waktu `next build`). Connector tidak pernah dipakai di server, jadi cukup
// dibuat di browser.
const isBrowser = typeof window !== "undefined";

/**
 * wagmi connectors for the wagmi context
 */
export const wagmiConnectors = isBrowser
  ? connectorsForWallets(
      [
        {
          groupName: "Supported Wallets",
          wallets,
        },
      ],

      {
        appName: "scaffold-eth-2",
        projectId: scaffoldConfig.walletConnectProjectId,
      },
    )
  : [];
