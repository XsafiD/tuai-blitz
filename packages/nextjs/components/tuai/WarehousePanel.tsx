"use client";

import { useState } from "react";
import { ActionButton, AddrInput, Field, SeriesWithId, validAddr } from "./common";
import { formatIDR, formatNum, toIDRX } from "./lib";
import { useTuai } from "./useTuai";
import { keccak256, stringToHex } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const PaperField = ({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
    <span className="t-k">{k}</span>
    <span className={mono ? "t-num" : ""} style={{ fontWeight: 600, overflowWrap: "anywhere" }}>
      {v}
    </span>
  </div>
);

export const WarehousePanel = ({ focus }: { focus?: SeriesWithId }) => {
  const { address, pending, run, writeTuai } = useTuai();
  const { data: isWarehouse } = useScaffoldReadContract({
    contractName: "TuaiBlitz",
    functionName: "isWarehouse",
    args: [address],
  });

  // --- daftarkan resi (createSeries) ---
  const [receiptNo, setReceiptNo] = useState("RESI-2026-001");
  const [commodity, setCommodity] = useState("Kopi Arabika");
  const [grade, setGrade] = useState("Grade 1");
  const [price, setPrice] = useState("100000");
  const [maxKg, setMaxKg] = useState("2000");
  const [docHash, setDocHash] = useState<`0x${string}` | "">("");
  const [docName, setDocName] = useState("");

  const onFile = async (file?: File) => {
    if (!file) return;
    setDocHash(keccak256(new Uint8Array(await file.arrayBuffer())));
    setDocName(file.name);
  };
  // Tanpa file: hash dari nomor resi, supaya demo tetap jalan.
  const finalDocHash = docHash || keccak256(stringToHex(receiptNo));

  // --- tokenisasi (mintReceipt) ---
  const [farmer, setFarmer] = useState("");
  const [mintKg, setMintKg] = useState("2000");
  const isMine = !!focus && focus.warehouse.toLowerCase() === address?.toLowerCase();
  const remaining = focus ? focus.maxKg - focus.mintedKg : 0n;

  // Kartu kertas menampilkan seri aktif; kalau belum ada, pratinjau isi form.
  const paper = focus
    ? {
        no: focus.receiptNo,
        commodity: `${focus.commodity} ${focus.grade}`,
        kg: `${formatNum(focus.maxKg)} kg`,
        price: formatIDR(focus.pricePerKg),
        hash: focus.docHash,
      }
    : {
        no: receiptNo,
        commodity: `${commodity} ${grade}`,
        kg: `${Number(maxKg || 0).toLocaleString("id-ID")} kg`,
        price: `Rp${Number(price || 0).toLocaleString("id-ID")}`,
        hash: finalDocHash,
      };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!isWarehouse && address && (
        <div className="t-alert">Wallet ini belum terdaftar sebagai gudang. Minta admin menjalankan setWarehouse.</div>
      )}
      <div className="t-grid">
        <div className="t-paper" style={{ flex: "1 1 420px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, letterSpacing: "0.12em", fontWeight: 700, color: "#6B5D43" }}>
                {focus ? "TERCATAT ON-CHAIN" : "PRATINJAU"}
              </span>
              <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.02em" }}>RESI GUDANG</span>
            </div>
            {focus && <span className="t-stamp">TERVERIFIKASI</span>}
          </div>
          <div style={{ height: 1, background: "#CFC4AC" }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "14px 24px",
              fontSize: 14,
            }}
          >
            <PaperField k="Nomor resi" v={paper.no} mono />
            <PaperField k="Komoditas" v={paper.commodity} />
            <PaperField k="Berat bersih" v={paper.kg} mono />
            <PaperField k="Harga acuan / kg" v={paper.price} mono />
          </div>
          <PaperField k="Hash dokumen (keccak256)" v={<span style={{ fontSize: 12 }}>{paper.hash}</span>} mono />
          <span style={{ fontSize: 12, color: "#6B5D43" }}>
            Dokumen fisik tidak diunggah — hanya sidik jarinya yang dicatat di Monad.
          </span>
        </div>

        <div className="t-card">
          <span className="t-lbl">Babak 1 · Gudang</span>
          <h2 className="t-h2">Daftarkan resi baru</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <Field label="Nomor resi">
              <input className="t-input" value={receiptNo} onChange={e => setReceiptNo(e.target.value)} />
            </Field>
            <Field label="Komoditas">
              <input className="t-input" value={commodity} onChange={e => setCommodity(e.target.value)} />
            </Field>
            <Field label="Grade">
              <input className="t-input" value={grade} onChange={e => setGrade(e.target.value)} />
            </Field>
            <Field label="Harga acuan / kg (Rp)">
              <input className="t-input" type="number" value={price} onChange={e => setPrice(e.target.value)} />
            </Field>
            <Field label="Berat bersih (kg)">
              <input className="t-input" type="number" value={maxKg} onChange={e => setMaxKg(e.target.value)} />
            </Field>
            <Field label={docName ? `Dokumen: ${docName}` : "Dokumen resi (opsional)"}>
              <input
                type="file"
                className="t-input"
                style={{ paddingTop: 10 }}
                onChange={e => onFile(e.target.files?.[0])}
              />
            </Field>
          </div>
          <ActionButton
            label="Daftarkan resi"
            pending={pending}
            disabled={!isWarehouse || !address}
            style={{ marginTop: "auto" }}
            onClick={() =>
              run("Daftarkan resi", () =>
                writeTuai({
                  functionName: "createSeries",
                  args: [receiptNo, commodity, grade, finalDocHash, address!, toIDRX(price), BigInt(maxKg || 0)],
                }),
              )
            }
          />
        </div>
      </div>

      <div className="t-card">
        <span className="t-lbl">Tokenisasi</span>
        <h2 className="t-h2">Pecah resi jadi token per kg</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="t-well" style={{ flex: 1 }}>
            <span className="t-lbl">Sisa resi</span>
            <span className="t-num" style={{ fontSize: 24 }}>
              {focus ? `${formatNum(remaining)} kg` : "–"}
            </span>
          </div>
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
            <path d="M4 14 H22 M16 8 L22 14 L16 20" fill="none" stroke="#B8F35A" strokeWidth="2.4" />
          </svg>
          <div className="t-well" style={{ flex: 1 }}>
            <span className="t-lbl">Sudah jadi token</span>
            <span className="t-num" style={{ fontSize: 24, color: "#B8F35A" }}>
              {focus ? formatNum(focus.mintedKg) : "–"}
            </span>
          </div>
        </div>
        <div className="t-row">
          <span className="t-muted">1 token</span>
          <span>1 kg komoditas di gudang ini</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 12 }}>
          <Field label="Alamat petani penerima">
            <AddrInput value={farmer} onChange={setFarmer} placeholder="0x… petani" />
          </Field>
          <Field label="Jumlah (kg)">
            <input className="t-input" type="number" value={mintKg} onChange={e => setMintKg(e.target.value)} />
          </Field>
        </div>
        {focus && !isMine && (
          <span className="t-dim">Seri ini milik gudang lain — hanya gudangnya yang bisa mint.</span>
        )}
        <ActionButton
          label="Tokenisasi"
          pending={pending}
          disabled={!focus || !isMine || !validAddr(farmer) || BigInt(mintKg || 0) > remaining}
          onClick={() =>
            run(`Tokenisasi ${mintKg} kg`, () =>
              writeTuai({
                functionName: "mintReceipt",
                args: [focus!.id, farmer as `0x${string}`, BigInt(mintKg || 0)],
              }),
            )
          }
        />
      </div>
    </div>
  );
};
