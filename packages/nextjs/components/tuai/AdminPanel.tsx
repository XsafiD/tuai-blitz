"use client";

import { useState } from "react";
import { ActionButton, AddrInput, Field, Row, SeriesWithId, StatusPill, validAddr } from "./common";
import { formatBps, formatIDR, formatKg, loanStatus, toIDRX } from "./lib";
import { useTuai } from "./useTuai";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const PRESETS = [100_000, 80_000, 70_000];

export const AdminPanel = ({ focus }: { focus?: SeriesWithId }) => {
  const { address, pending, run, writeTuai } = useTuai();
  const { data: owner } = useScaffoldReadContract({ contractName: "TuaiBlitz", functionName: "owner" });
  const isOwner = !!address && owner?.toLowerCase() === address.toLowerCase();

  // --- oracle harga ---
  const [newPrice, setNewPrice] = useState(70_000);

  // --- posisi & likuidasi ---
  const [borrower, setBorrower] = useState("");
  const target = validAddr(borrower);
  const { data: loan } = useScaffoldReadContract({ contractName: "TuaiBlitz", functionName: "loans", args: [target] });
  const { data: ltv } = useScaffoldReadContract({ contractName: "TuaiBlitz", functionName: "ltvBps", args: [target] });
  const { data: liquidatable } = useScaffoldReadContract({
    contractName: "TuaiBlitz",
    functionName: "isLiquidatable",
    args: [target],
  });
  const [, loanKg, , debt, loanActive] = (loan ?? [0n, 0n, 0n, 0n, false]) as readonly [
    bigint,
    bigint,
    bigint,
    bigint,
    boolean,
  ];
  const status = loanStatus(loanActive, ltv);

  // --- gudang ---
  const [warehouse, setWarehouse] = useState("");

  const setPrice = (p: number) =>
    run(`Set harga Rp${p.toLocaleString("id-ID")}`, () =>
      writeTuai({ functionName: "setPrice", args: [focus!.id, toIDRX(p)] }),
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!isOwner && address && (
        <div className="t-alert">Hanya owner kontrak yang bisa mengubah harga dan mendaftarkan gudang.</div>
      )}
      <div className="t-grid">
        <div className="t-card">
          <span className="t-lbl">Babak 4 · Harga turun</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="t-muted" style={{ fontSize: 13 }}>
              Harga {focus ? `${focus.commodity} ${focus.grade}` : "–"}
            </span>
            <span className="t-num" style={{ fontSize: 44, letterSpacing: "-0.03em" }}>
              {focus ? formatIDR(focus.pricePerKg) : "–"}
            </span>
            <span className="t-dim">per kg · harga simulasi admin (oracle tiruan)</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PRESETS.map(p => (
              <ActionButton
                key={p}
                label={`Set harga Rp${p.toLocaleString("id-ID")}`}
                variant="secondary"
                pending={pending}
                disabled={!isOwner || !focus}
                onClick={() => setPrice(p)}
              />
            ))}
          </div>
          <Field label={`Harga lain: Rp${newPrice.toLocaleString("id-ID")}/kg`}>
            <input
              type="range"
              className="range range-sm"
              style={{ accentColor: "#B8F35A" }}
              min={50_000}
              max={150_000}
              step={5_000}
              value={newPrice}
              onChange={e => setNewPrice(Number(e.target.value))}
            />
          </Field>
          <ActionButton
            label={`Set harga Rp${newPrice.toLocaleString("id-ID")}`}
            pending={pending}
            disabled={!isOwner || !focus}
            onClick={() => setPrice(newPrice)}
          />
        </div>

        <div className="t-card">
          <span className="t-lbl">Posisi berisiko</span>
          <Field label="Alamat peminjam">
            <AddrInput value={borrower} onChange={setBorrower} placeholder="0x… petani" />
          </Field>
          <div className="t-row" style={{ alignItems: "center" }}>
            <span className="t-muted">Status</span>
            <StatusPill {...status} />
          </div>
          <Row k="Jaminan">{formatKg(loanActive ? loanKg : 0n)}</Row>
          <Row k="LTV">{formatBps(loanActive ? ltv : 0n)}</Row>
          <Row k="Utang">{formatIDR(loanActive ? debt : 0n)}</Row>
          {liquidatable ? (
            <ActionButton
              label="Likuidasi"
              variant="danger"
              pending={pending}
              onClick={() => run("Likuidasi", () => writeTuai({ functionName: "liquidate", args: [target!] }))}
            />
          ) : (
            <span className="t-dim">Tombol likuidasi muncul saat LTV mencapai 80%. Siapa pun boleh melikuidasi.</span>
          )}
        </div>
      </div>

      <div className="t-card">
        <span className="t-lbl">Daftarkan gudang</span>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 320px" }}>
            <Field label="Alamat gudang">
              <AddrInput value={warehouse} onChange={setWarehouse} placeholder="0x… gudang" />
            </Field>
          </div>
          <ActionButton
            label="Daftarkan gudang"
            pending={pending}
            disabled={!isOwner || !validAddr(warehouse)}
            onClick={() =>
              run("Daftarkan gudang", () =>
                writeTuai({ functionName: "setWarehouse", args: [warehouse as `0x${string}`, true] }),
              )
            }
          />
        </div>
      </div>
    </div>
  );
};
