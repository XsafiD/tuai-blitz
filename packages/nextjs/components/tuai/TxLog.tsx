"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { shortHash, txUrl } from "./lib";

type TxEntry = { label: string; hash: string; at: Date };

const TxLogContext = createContext<{ entries: TxEntry[]; push: (label: string, hash?: string) => void }>({
  entries: [],
  push: () => undefined,
});

export const TxLogProvider = ({ children }: { children: React.ReactNode }) => {
  const [entries, setEntries] = useState<TxEntry[]>([]);
  const push = useCallback((label: string, hash?: string) => {
    if (!hash) return;
    setEntries(prev => [{ label, hash, at: new Date() }, ...prev].slice(0, 50));
  }, []);
  return <TxLogContext.Provider value={{ entries, push }}>{children}</TxLogContext.Provider>;
};

export const useTxLog = () => useContext(TxLogContext);

/** Riwayat tx sesi ini, tiap baris bisa diklik ke explorer (untuk demo). */
export const TxLog = () => {
  const { entries } = useTxLog();
  return (
    <div className="t-card" style={{ gap: 12 }}>
      <span className="t-lbl">Transaksi sesi ini · Monad Testnet</span>
      {entries.length === 0 ? (
        <span className="t-dim">Belum ada transaksi. Setiap aksi di atas muncul di sini dengan link ke explorer.</span>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
          {entries.map(e => (
            <div key={e.hash} className="t-row" style={{ alignItems: "center" }}>
              <span>
                <span className="t-num t-dim">{e.at.toLocaleTimeString("id-ID")}</span> {e.label}
              </span>
              <a className="t-num" href={txUrl(e.hash)} target="_blank" rel="noreferrer">
                {shortHash(e.hash)} ↗
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
