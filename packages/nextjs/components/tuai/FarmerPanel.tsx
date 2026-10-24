"use client";

import { useState } from "react";
import { ActionButton, Field, LtvBar, Row, SeriesWithId, Stat, StatusPill, useListings, useMyKg } from "./common";
import { formatBps, formatIDR, formatKg, formatNum, liquidationPrice, loanStatus, toIDRX } from "./lib";
import { useTuai } from "./useTuai";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const MAX_LTV_BPS = 6000n;

export const FarmerPanel = ({ focus, series }: { focus?: SeriesWithId; series: SeriesWithId[] }) => {
  const { address, pending, run, writeTuai, writeIdrx, ensureAllowance } = useTuai();
  const myKg = useMyKg(series);
  const freeKg = focus ? (myKg.get(focus.id.toString()) ?? 0n) : 0n;

  const { data: loan } = useScaffoldReadContract({ contractName: "TuaiBlitz", functionName: "loans", args: [address] });
  const { data: ltv } = useScaffoldReadContract({ contractName: "TuaiBlitz", functionName: "ltvBps", args: [address] });
  const { data: collateralValue } = useScaffoldReadContract({
    contractName: "TuaiBlitz",
    functionName: "collateralValueOf",
    args: [address],
  });
  const { data: idrxBalance } = useScaffoldReadContract({
    contractName: "MockIDRX",
    functionName: "balanceOf",
    args: [address],
  });
  const [, loanKg, principal, debt, loanActive] = (loan ?? [0n, 0n, 0n, 0n, false]) as readonly [
    bigint,
    bigint,
    bigint,
    bigint,
    boolean,
  ];
  const status = loanStatus(loanActive, ltv);

  // --- pinjam ---
  const [borrowKg, setBorrowKg] = useState("2000");
  const kg = BigInt(borrowKg || 0);
  const value = focus ? kg * focus.pricePerKg : 0n;
  const receive = (value * MAX_LTV_BPS) / 10_000n;

  // --- jual per kg ---
  const [sellKg, setSellKg] = useState("500");
  const [sellPrice, setSellPrice] = useState("");
  const sellPriceRp = sellPrice || (focus ? (focus.pricePerKg / 1_000_000n).toString() : "");
  const myListings = useListings().filter(l => l.active && l.seller.toLowerCase() === address?.toLowerCase());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="t-stats">
        <Stat label="Token bebas" value={formatNum(freeKg)} sub="kg di wallet" />
        <Stat label="Token dijaminkan" value={formatNum(loanActive ? loanKg : 0n)} sub="kg di escrow kontrak" />
        <Stat label="Harga sekarang" value={focus ? formatIDR(focus.pricePerKg) : "–"} sub="per kg · oracle admin" />
        <Stat label="Saldo IDRX" value={formatIDR(idrxBalance)} />
      </div>

      <div className="t-grid">
        <div className="t-card">
          <span className="t-lbl">Babak 2 · Pinjam</span>
          <h2 className="t-h2">Jaminkan resi, uang cair</h2>
          {loanActive ? (
            <>
              <Row k="Pokok diterima">{formatIDR(principal)}</Row>
              <Row k="Utang (pokok + bunga 2%)">{formatIDR(debt)}</Row>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
                <ActionButton
                  label="Lunasi"
                  pending={pending}
                  onClick={() =>
                    run("Lunasi", async () => {
                      await ensureAllowance(debt);
                      return writeTuai({ functionName: "repay" });
                    })
                  }
                />
                <ActionButton
                  label="Ambil IDRX uji untuk bunga"
                  variant="secondary"
                  pending={pending}
                  onClick={() =>
                    run("Ambil IDRX uji untuk bunga", () =>
                      writeIdrx({ functionName: "mint", args: [address!, toIDRX(10_000_000)] }),
                    )
                  }
                />
              </div>
            </>
          ) : (
            <>
              <Field label="Dijaminkan (kg)">
                <input className="t-input" type="number" value={borrowKg} onChange={e => setBorrowKg(e.target.value)} />
              </Field>
              <Row k="Nilai jaminan">{formatIDR(value)}</Row>
              <Row k="Batas pinjaman">60%</Row>
              <div className="t-well">
                <span className="t-lbl">Kamu terima</span>
                <span className="t-num" style={{ fontSize: 32, color: "#B8F35A" }}>
                  {formatIDR(receive)}
                </span>
              </div>
              {freeKg === 0n ? (
                <span className="t-dim">Belum ada token. Gudang perlu menokenisasi resi dulu.</span>
              ) : (
                <ActionButton
                  label="Pinjam"
                  pending={pending}
                  disabled={!focus || kg === 0n || kg > freeKg}
                  onClick={() => run("Pinjam", () => writeTuai({ functionName: "borrow", args: [focus!.id, kg] }))}
                />
              )}
            </>
          )}
        </div>

        <div className="t-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="t-lbl">Posisi pinjaman</span>
            <StatusPill {...status} />
          </div>
          <Row k="Utang">{formatIDR(loanActive ? debt : 0n)}</Row>
          <Row k="Nilai jaminan sekarang">{formatIDR(collateralValue)}</Row>
          <Row k="LTV (utang ÷ nilai jaminan)">
            <span style={{ fontWeight: 600 }}>{formatBps(ltv)}</span>
          </Row>
          <LtvBar bps={loanActive ? ltv : undefined} />
          {loanActive && (
            <span className="t-dim">
              Likuidasi terjadi kalau harga di bawah {formatIDR(liquidationPrice(debt, loanKg))} per kg.
            </span>
          )}
        </div>
      </div>

      <div className="t-grid">
        <div className="t-card">
          <span className="t-lbl">Babak 3 · Jual per kg</span>
          <h2 className="t-h2">Tawarkan pecahan ke investor</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <Field label="Jumlah (kg)">
              <input className="t-input" type="number" value={sellKg} onChange={e => setSellKg(e.target.value)} />
            </Field>
            <Field label="Harga / kg (Rp)">
              <input
                className="t-input"
                type="number"
                value={sellPriceRp}
                onChange={e => setSellPrice(e.target.value)}
              />
            </Field>
          </div>
          <Row k="Total ditawarkan">{formatIDR(BigInt(sellKg || 0) * toIDRX(sellPriceRp || 0))}</Row>
          <ActionButton
            label="Pasang listing"
            pending={pending}
            disabled={!focus || !sellPriceRp || BigInt(sellKg || 0) === 0n || BigInt(sellKg || 0) > freeKg}
            onClick={() =>
              run(`Listing ${sellKg} kg`, () =>
                writeTuai({
                  functionName: "listForSale",
                  args: [focus!.id, BigInt(sellKg || 0), toIDRX(sellPriceRp)],
                }),
              )
            }
          />
        </div>

        <div className="t-card">
          <span className="t-lbl">Listing saya</span>
          {myListings.length === 0 ? (
            <span className="t-dim">Belum ada listing aktif.</span>
          ) : (
            myListings.map(l => (
              <div key={l.id.toString()} className="t-row" style={{ alignItems: "center" }}>
                <span>
                  <span className="t-num">#{l.id.toString()}</span>{" "}
                  <span className="t-muted">
                    sisa {formatKg(l.kgLeft)} @ {formatIDR(l.pricePerKg)}
                  </span>
                </span>
                <ActionButton
                  label={`Batalkan #${l.id}`}
                  variant="secondary"
                  pending={pending}
                  onClick={() =>
                    run(`Batalkan #${l.id}`, () => writeTuai({ functionName: "cancelListing", args: [l.id] }))
                  }
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
