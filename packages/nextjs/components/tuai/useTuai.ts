"use client";

import { useState } from "react";
import { useTxLog } from "./TxLog";
import { useAccount } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

/** Hook bersama: tulis ke TuaiBlitz/MockIDRX, catat hash, dan approve IDRX otomatis kalau allowance kurang. */
export const useTuai = () => {
  const { address } = useAccount();
  const { push } = useTxLog();
  const [pending, setPending] = useState<string | null>(null);

  const { data: tuaiInfo } = useDeployedContractInfo({ contractName: "TuaiBlitz" });
  const { writeContractAsync: writeTuai } = useScaffoldWriteContract({ contractName: "TuaiBlitz" });
  const { writeContractAsync: writeIdrx } = useScaffoldWriteContract({ contractName: "MockIDRX" });

  const { data: allowance, refetch: refetchAllowance } = useScaffoldReadContract({
    contractName: "MockIDRX",
    functionName: "allowance",
    args: [address, tuaiInfo?.address],
  });

  /** Jalankan aksi dengan status pending + catat hash ke log. */
  const run = async (label: string, fn: () => Promise<`0x${string}` | undefined>) => {
    setPending(label);
    try {
      const hash = await fn();
      push(label, hash);
      return hash;
    } catch (e) {
      console.error(label, e);
    } finally {
      setPending(null);
    }
  };

  /** Pastikan TuaiBlitz boleh menarik `amount` IDRX dari wallet. */
  const ensureAllowance = async (amount: bigint) => {
    if (!tuaiInfo) return;
    const { data: current } = await refetchAllowance();
    if ((current ?? allowance ?? 0n) >= amount) return;
    const hash = await writeIdrx({ functionName: "approve", args: [tuaiInfo.address, amount] });
    push("Approve IDRX", hash);
  };

  return { address, pending, run, writeTuai, writeIdrx, ensureAllowance };
};
