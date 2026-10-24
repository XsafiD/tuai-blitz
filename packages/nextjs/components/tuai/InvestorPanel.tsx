"use client";

import { useState } from "react";
import { ActionButton, Field, Row, SeriesWithId, Stat, seriesLabel, useListings, useMyKg } from "./common";
import { formatIDR, formatKg, formatNum, toIDRX } from "./lib";
import { useTuai } from "./useTuai";
import { formatUnits } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const FAUCET_RP = 1_000_000_000; // Rp1 miliar IDRX uji
const FEE_BPS = 50n;

export const InvestorPanel = ({ focus, series }: { focus?: SeriesWithId; series: SeriesWithId[] }) => {
  const { address, pending, run, writeTuai, writeIdrx, ensureAllowance } = useTuai();
  const myKg = useMyKg(series);
  const listings = useListings().filter(l => l.active);

  const { data: idrxBalance } = useScaffoldReadContract({
    contractName: "MockIDRX",
    functionName: "balanceOf",
    args: [address],
  });
  const { data: totalAssets } = useScaffoldReadContract({ contractName: "TuaiBlitz", functionName: "totalAssets" });
  const { data: outstanding } = useScaffoldReadContract({
    contractName: "TuaiBlitz",
    functionName: "totalOutstandingPrincipal",
  });
  const { data: sharePrice } = useScaffoldReadContract({ contractName: "TuaiBlitz", functionName: "sharePrice" });
  const { data: myShares } = useScaffoldReadContract({
    contractName: "TuaiBlitz",
    functionName: "shares",
    args: [address],
  });
  const { data: seized } = useScaffoldReadContract({
    contractName: "TuaiBlitz",
    functionName: "seizedKg",
    args: [focus?.id],
  });

  const [buyKg, setBuyKg] = useState<Record<string, string>>({});
  const [depositRp, setDepositRp] = useState("500000000");
  const heldKg = focus ? (myKg.get(focus.id.toString()) ?? 0n) : 0n;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="t-stats">
        <Stat label="Saldo IDRX" value={formatIDR(idrxBalance)} />
        <Stat label="Kepemilikan kg" value={formatNum(heldKg)} sub={focus ? seriesLabel(focus) : undefined} />
        <div className="t-card" style={{ gap: 8, justifyContent: "center" }}>
          <span className="t-lbl">Faucet testnet</span>
          <ActionButton
            label="Ambil Rp1 M IDRX uji"
            variant="secondary"
            pending={pending}
            disabled={!address}
            onClick={() =>
              run("Ambil IDRX uji", () => writeIdrx({ functionName: "mint", args: [address!, toIDRX(FAUCET_RP)] }))
            }
          />
        </div>
      </div>

      <div className="t-card">
        <span className="t-lbl">Babak 3 · Investor</span>
        <h2 className="t-h2">Beli pecahan per kg</h2>
        {listings.length === 0 && (
          <span className="t-dim">Belum ada listing. Petani memasang listing dari tab Petani.</span>
        )}
        {listings.map(l => {
          const key = l.id.toString();
          const kg = buyKg[key] ?? "100";
          const cost = BigInt(kg || 0) * l.pricePerKg;
          const fee = (cost * FEE_BPS) / 10_000n;
          return (
            <div
              key={key}
              className="t-well"
              style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 16, padding: 20 }}
            >
              <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>{seriesLabel(series.find(s => s.id === l.seriesId))}</span>
                <span className="t-dim" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  Listing #{key} · penjual <Address address={l.seller} size="xs" onlyEnsOrAddress />
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span className="t-lbl">Sisa</span>
                <span className="t-num">{formatKg(l.kgLeft)}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span className="t-lbl">Harga/kg</span>
                <span className="t-num">{formatIDR(l.pricePerKg)}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  className="t-input t-num"
                  style={{ width: 96 }}
                  type="number"
                  value={kg}
                  onChange={e => setBuyKg({ ...buyKg, [key]: e.target.value })}
                />
                <ActionButton
                  label={`Beli ${kg} kg (#${key})`}
                  pending={pending}
                  disabled={!kg || BigInt(kg) === 0n || BigInt(kg) > l.kgLeft}
                  onClick={() =>
                    run(`Beli ${kg} kg (#${key})`, async () => {
                      await ensureAllowance(cost);
                      return writeTuai({ functionName: "buy", args: [l.id, BigInt(kg)] });
                    })
                  }
                />
              </div>
              <span className="t-dim" style={{ flexBasis: "100%" }}>
                Bayar {formatIDR(cost)} · penjual terima {formatIDR(cost - fee)} · fee {formatIDR(fee)} (0,5%) masuk
                pool
              </span>
            </div>
          );
        })}
      </div>

      <div className="t-card">
        <span className="t-lbl">Pool pemberi pinjaman</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          {[
            ["Total aset", formatIDR(totalAssets)],
            ["Sedang dipinjam", formatIDR(outstanding)],
            [
              "Tersedia",
              totalAssets !== undefined && outstanding !== undefined ? formatIDR(totalAssets - outstanding) : "…",
            ],
            ["Jaminan dipegang pool", formatKg(seized)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="t-muted" style={{ fontSize: 13 }}>
                {k}
              </span>
              <span className="t-num" style={{ fontSize: 26 }}>
                {v}
              </span>
            </div>
          ))}
        </div>
        <Row k="Harga share (naik dari bunga + fee jual-beli)">
          {sharePrice !== undefined ? Number(formatUnits(sharePrice, 18)).toFixed(6) : "…"}
        </Row>
        <Row k="Share saya">
          {myShares !== undefined ? Number(formatUnits(myShares, 6)).toLocaleString("id-ID") : "…"}
        </Row>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 220px" }}>
            <Field label="Setor ke pool (Rp)">
              <input className="t-input" type="number" value={depositRp} onChange={e => setDepositRp(e.target.value)} />
            </Field>
          </div>
          <ActionButton
            label="Setor"
            pending={pending}
            disabled={!depositRp}
            onClick={() =>
              run("Setor ke pool", async () => {
                await ensureAllowance(toIDRX(depositRp));
                return writeTuai({ functionName: "deposit", args: [toIDRX(depositRp)] });
              })
            }
          />
          <ActionButton
            label="Tarik semua"
            variant="secondary"
            pending={pending}
            disabled={!myShares}
            onClick={() => run("Tarik dari pool", () => writeTuai({ functionName: "withdraw", args: [myShares!] }))}
          />
        </div>
      </div>
    </div>
  );
};
