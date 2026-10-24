"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { AdminPanel } from "~~/components/tuai/AdminPanel";
import { FarmerPanel } from "~~/components/tuai/FarmerPanel";
import { InvestorPanel } from "~~/components/tuai/InvestorPanel";
import { TxLog, TxLogProvider } from "~~/components/tuai/TxLog";
import { WarehousePanel } from "~~/components/tuai/WarehousePanel";
import { SeriesSelect, useListings, useSeries } from "~~/components/tuai/common";
import { addressUrl, formatNum } from "~~/components/tuai/lib";
import { useDeployedContractInfo, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const TABS = [
  { key: "gudang", label: "Gudang" },
  { key: "petani", label: "Petani" },
  { key: "investor", label: "Investor" },
  { key: "admin", label: "Admin" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const Logo = () => (
  <svg width="34" height="34" viewBox="0 0 160 160" role="img" aria-label="Logo Tuai">
    <path
      transform="translate(8 8)"
      fill="#33480F"
      d="M48 16 H112 V24 H128 V32 H136 V48 H144 V112 H136 V128 H128 V136 H112 V144 H48 V136 H32 V128 H24 V112 H16 V48 H24 V32 H32 V24 H48 Z"
    />
    <path
      fill="#B8F35A"
      d="M48 16 H112 V24 H128 V32 H136 V48 H144 V112 H136 V128 H128 V136 H112 V144 H48 V136 H32 V128 H24 V112 H16 V48 H24 V32 H32 V24 H48 Z"
    />
    <g fill="#0A0D0B">
      {[
        [75, 34],
        [65, 44],
        [85, 44],
        [75, 54],
        [65, 64],
        [85, 64],
        [75, 74],
        [65, 84],
        [85, 84],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="10" height="10" />
      ))}
    </g>
    <g fill="#0A0D0B" fillOpacity="0.6">
      {[94, 104, 114].map(y => (
        <rect key={y} x="75" y={y} width="10" height="10" />
      ))}
    </g>
  </svg>
);

const Step = ({ label, done }: { label: string; done: boolean }) => (
  <span
    className="t-pill"
    style={
      done
        ? { background: "rgba(74,222,128,0.12)", color: "#6EE7A0", fontWeight: 600 }
        : { border: "1px solid rgba(255,255,255,0.12)", color: "#8C978F" }
    }
  >
    {label}
  </span>
);

const TuaiPage: NextPage = () => {
  const [tab, setTab] = useState<TabKey>("gudang");
  const series = useSeries();
  const listings = useListings();
  const [focusId, setFocusId] = useState("");
  const { data: tuai } = useDeployedContractInfo({ contractName: "TuaiBlitz" });

  // Seri fokus default = seri terbaru.
  useEffect(() => {
    if (!focusId && series.length > 0) setFocusId(series[series.length - 1].id.toString());
  }, [series, focusId]);
  const focus = series.find(s => s.id.toString() === focusId);

  // Chip langkah demo dari state on-chain.
  const { data: outstanding } = useScaffoldReadContract({
    contractName: "TuaiBlitz",
    functionName: "totalOutstandingPrincipal",
  });
  const { data: seized } = useScaffoldReadContract({
    contractName: "TuaiBlitz",
    functionName: "seizedKg",
    args: [focus?.id],
  });
  const minted = !!focus && focus.mintedKg > 0n;
  const liquidated = (seized ?? 0n) > 0n;
  const borrowed = (outstanding ?? 0n) > 0n || liquidated;
  const listed = listings.some(l => l.seriesId === focus?.id);

  return (
    <TxLogProvider>
      <header style={{ padding: "16px 24px 0" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            background: "#121714",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "8px 8px 8px 16px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px 20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}>
            <Logo />
            <span style={{ fontWeight: 600, fontSize: 22, letterSpacing: "-0.05em" }}>tuai</span>
            <span
              style={{
                fontSize: 12,
                padding: "3px 8px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#A3ADA7",
              }}
            >
              Blitz
            </span>
          </div>
          <div style={{ flex: 1 }} />
          {tuai && (
            <a
              className="t-pill"
              href={addressUrl(tuai.address)}
              target="_blank"
              rel="noreferrer"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#C9D1CC",
                minHeight: 40,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 99, background: "#B8F35A" }} />
              Monad Testnet · kontrak verified ↗
            </a>
          )}
          <RainbowKitCustomConnectButton />
        </div>
      </header>

      <main
        style={{
          maxWidth: 1248,
          margin: "0 auto",
          padding: "32px 24px 64px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <section
          style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <span className="t-lbl">
              Resi gudang on-chain{focus ? ` · ${focus.commodity} ${focus.grade} · ${focus.receiptNo}` : ""}
            </span>
            <h1 style={{ margin: 0, fontSize: 40, letterSpacing: "-0.04em", fontWeight: 600, lineHeight: 1.1 }}>
              {focus
                ? `Resi ${focus.commodity.toLowerCase()} ${formatNum(focus.maxKg)} kg`
                : "Panen tidak harus dijual murah"}
            </h1>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <Step label="1 Tokenisasi" done={minted} />
            <Step label="2 Pinjam" done={borrowed} />
            <Step label="3 Jual per kg" done={listed} />
            <Step label="4 Likuidasi" done={liquidated} />
          </div>
        </section>

        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}
        >
          <nav
            role="tablist"
            aria-label="Pilih peran"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              background: "#121714",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 999,
              padding: 4,
            }}
          >
            {TABS.map(t => (
              <button
                key={t.key}
                role="tab"
                type="button"
                className="t-tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>
          {series.length > 1 && (
            <div style={{ minWidth: 260 }}>
              <SeriesSelect series={series} value={focusId} onChange={setFocusId} />
            </div>
          )}
        </div>

        {tab === "gudang" && <WarehousePanel focus={focus} />}
        {tab === "petani" && <FarmerPanel focus={focus} series={series} />}
        {tab === "investor" && <InvestorPanel focus={focus} series={series} />}
        {tab === "admin" && <AdminPanel focus={focus} />}

        <TxLog />
      </main>
    </TxLogProvider>
  );
};

export default TuaiPage;
