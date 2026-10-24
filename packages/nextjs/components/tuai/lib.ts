import type { CSSProperties } from "react";
import { formatUnits, parseUnits } from "viem";

export const IDRX_DECIMALS = 6;
export const EXPLORER = "https://testnet.monadexplorer.com";
export const LIQ_THRESHOLD_BPS = 8000n;

/** Rupiah utuh (string dari input) -> IDRX 6 desimal. */
export const toIDRX = (rupiah: string | number) => parseUnits(String(rupiah || 0), IDRX_DECIMALS);

/** IDRX 6 desimal -> "Rp120.000.000". */
export const formatIDR = (value?: bigint) => {
  if (value === undefined) return "…";
  const n = Number(formatUnits(value, IDRX_DECIMALS));
  return "Rp" + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
};

export const formatKg = (kg?: bigint) => (kg === undefined ? "…" : `${Number(kg).toLocaleString("id-ID")} kg`);
export const formatNum = (n?: bigint) => (n === undefined ? "…" : Number(n).toLocaleString("id-ID"));

export const formatBps = (bps?: bigint) =>
  bps === undefined || bps === 0n ? "–" : `${(Number(bps) / 100).toFixed(1).replace(".", ",")}%`;

export type Tone = "good" | "warn" | "bad" | "quiet";

/** Status posisi sesuai design: < 70% aman, 70–80% waspada, >= 80% bisa dilikuidasi (ambang kontrak). */
export const loanStatus = (active: boolean, bps?: bigint): { label: string; tone: Tone } => {
  if (!active || bps === undefined) return { label: "Belum ada pinjaman", tone: "quiet" };
  if (bps >= LIQ_THRESHOLD_BPS) return { label: "Bisa dilikuidasi", tone: "bad" };
  if (bps >= 7000n) return { label: "Waspada", tone: "warn" };
  return { label: "Aman", tone: "good" };
};

export const toneStyle: Record<Tone, CSSProperties> = {
  good: { background: "rgba(74,222,128,0.12)", color: "#6EE7A0" },
  warn: { background: "rgba(251,191,36,0.14)", color: "#FCD34D" },
  bad: { background: "rgba(248,113,113,0.14)", color: "#FCA5A5" },
  quiet: { background: "rgba(255,255,255,0.06)", color: "#A3ADA7" },
};

/** Harga/kg di mana LTV menyentuh 80%: debt / (kg × 0,8). */
export const liquidationPrice = (debt: bigint, kg: bigint) =>
  kg === 0n ? 0n : (debt * 10_000n) / (kg * LIQ_THRESHOLD_BPS);

export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const addressUrl = (address: string) => `${EXPLORER}/address/${address}`;

export const shortHash = (hash: string) => `${hash.slice(0, 6)}…${hash.slice(-4)}`;

export type Series = {
  receiptNo: string;
  commodity: string;
  grade: string;
  docHash: `0x${string}`;
  warehouse: `0x${string}`;
  pricePerKg: bigint;
  maxKg: bigint;
  mintedKg: bigint;
  redeemedKg: bigint;
  active: boolean;
};

export type Listing = {
  seller: `0x${string}`;
  seriesId: bigint;
  kgLeft: bigint;
  pricePerKg: bigint;
  active: boolean;
};
