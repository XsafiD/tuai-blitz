"use client";

import { Listing, Series, Tone, toneStyle } from "./lib";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

/** Semua seri resi; indeks i = seriesId i+1 (seriesIds mulai dari 1, berurutan). */
export const useSeries = () => {
  const { data } = useScaffoldReadContract({ contractName: "TuaiBlitz", functionName: "getSeries" });
  const list = (data ?? []) as readonly Series[];
  return list.map((s, i) => ({ ...s, id: BigInt(i + 1) }));
};

export type SeriesWithId = ReturnType<typeof useSeries>[number];

/** Semua listing; indeks i = listingId i+1. */
export const useListings = () => {
  const { data } = useScaffoldReadContract({ contractName: "TuaiBlitz", functionName: "getListings" });
  return ((data ?? []) as readonly Listing[]).map((l, i) => ({ ...l, id: BigInt(i + 1) }));
};

/** Saldo kg wallet yang terhubung untuk tiap seri (ERC1155 balanceOfBatch). */
export const useMyKg = (series: SeriesWithId[]) => {
  const { address } = useAccount();
  const ids = series.map(s => s.id);
  const { data } = useScaffoldReadContract({
    contractName: "TuaiBlitz",
    functionName: "balanceOfBatch",
    args: [ids.map(() => address ?? "0x0000000000000000000000000000000000000000"), ids],
    query: { enabled: !!address && ids.length > 0 },
  });
  const map = new Map<string, bigint>();
  ids.forEach((id, i) => map.set(id.toString(), (data as readonly bigint[] | undefined)?.[i] ?? 0n));
  return map;
};

export const seriesLabel = (s?: SeriesWithId) => (s ? `${s.receiptNo} · ${s.commodity} ${s.grade}` : "-");

/** Input alamat ber-style Tuai, garis merah kalau format salah. */
export const AddrInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <input
    className="t-input t-num"
    value={value}
    placeholder={placeholder}
    spellCheck={false}
    onChange={e => onChange(e.target.value.trim())}
    style={value && !isAddress(value) ? { borderColor: "#F87171" } : undefined}
  />
);

export const validAddr = (v: string) => (isAddress(v) ? (v as `0x${string}`) : undefined);

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="t-field">
    <span>{label}</span>
    {children}
  </label>
);

export const Row = ({ k, children }: { k: React.ReactNode; children: React.ReactNode }) => (
  <div className="t-row">
    <span className="t-muted">{k}</span>
    <span className="t-num">{children}</span>
  </div>
);

export const Stat = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => (
  <div className="t-card" style={{ gap: 8 }}>
    <span className="t-lbl">{label}</span>
    <span className="t-num" style={{ fontSize: 30 }}>
      {value}
    </span>
    {sub && <span className="t-dim">{sub}</span>}
  </div>
);

export const StatusPill = ({ label, tone }: { label: string; tone: Tone }) => (
  <span
    style={{
      padding: "5px 12px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 600,
      whiteSpace: "nowrap",
      ...toneStyle[tone],
    }}
  >
    {label}
  </span>
);

/** Bar LTV tiga zona (0–70 aman, 70–80 waspada, > 80 likuidasi) + penanda posisi. */
export const LtvBar = ({ bps }: { bps?: bigint }) => {
  const left = Math.min(Number(bps ?? 0n) / 100, 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative", display: "flex", gap: 4 }}>
        <div style={{ flex: 70, height: 10, borderRadius: 99, background: "rgba(74,222,128,0.35)" }} />
        <div style={{ flex: 10, height: 10, borderRadius: 99, background: "rgba(251,191,36,0.5)" }} />
        <div style={{ flex: 20, height: 10, borderRadius: 99, background: "rgba(248,113,113,0.45)" }} />
        {bps !== undefined && bps > 0n && (
          <div
            style={{
              position: "absolute",
              top: -6,
              left: `${left}%`,
              width: 22,
              height: 22,
              marginLeft: -11,
              borderRadius: 99,
              background: "#EEF2EF",
              border: "4px solid #121714",
              boxSizing: "border-box",
              transition: "left .4s",
            }}
          />
        )}
      </div>
      <div className="t-row" style={{ fontSize: 12, color: "#8C978F" }}>
        <span>0–70% aman</span>
        <span>70–80% waspada</span>
        <span>≥ 80% likuidasi</span>
      </div>
    </div>
  );
};

export const ActionButton = ({
  label,
  pending,
  disabled,
  onClick,
  variant = "primary",
  style,
}: {
  label: string;
  pending: string | null;
  disabled?: boolean;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  style?: React.CSSProperties;
}) => (
  <button
    type="button"
    className={variant === "secondary" ? "t-btn2" : variant === "danger" ? "t-btn t-danger" : "t-btn"}
    disabled={disabled || pending !== null}
    onClick={onClick}
    style={style}
  >
    {pending === label && <span className="loading loading-spinner loading-xs" />}
    {label}
  </button>
);

export const SeriesSelect = ({
  series,
  value,
  onChange,
}: {
  series: SeriesWithId[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <select className="t-input" value={value} onChange={e => onChange(e.target.value)}>
    {series.length === 0 && <option value="">Belum ada seri</option>}
    {series.map(s => (
      <option key={s.id.toString()} value={s.id.toString()}>
        #{s.id.toString()} {seriesLabel(s)}
      </option>
    ))}
  </select>
);
