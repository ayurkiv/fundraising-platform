"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import type { Abi } from "viem";

import CampaignArtifact from "@/abi/Campaign.json";
import UsdcArtifact from "@/abi/MockUSDC.json";

const CampaignAbi = CampaignArtifact.abi as Abi;
const UsdcAbi = UsdcArtifact.abi as Abi;

const USDC = process.env.NEXT_PUBLIC_USDC as `0x${string}`;

export function useDonate(campaignAddress: `0x${string}`) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);

  async function donate(amountUSDC: number) {
    if (!address) throw new Error("Wallet not connected");

    setLoading(true);
    try {
      const amount = BigInt(Math.floor(amountUSDC * 1e6));

      // 1️⃣ approve
      await writeContractAsync({
        address: USDC,
        abi: UsdcAbi,
        functionName: "approve",
        args: [campaignAddress, amount],
      });

      // 2️⃣ donate
      await writeContractAsync({
        address: campaignAddress,
        abi: CampaignAbi,
        functionName: "donate",
        args: [amount],
      });
    } finally {
      setLoading(false);
    }
  }

  return { donate, loading };
}
