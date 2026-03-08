"use client";

import { useAccount, useWriteContract } from "wagmi";
import { useState } from "react";
import FactoryAbi from "@/abi/CampaignFactory.json";
import Link from "next/link";

const FACTORY = process.env.NEXT_PUBLIC_FACTORY as `0x${string}`;

export default function CreateCampaignPage() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [target, setTarget] = useState("");
  const [days, setDays] = useState("");
  const [metadata, setMetadata] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!address) {
    return (
      <main className="narrow">
        <div className="state-box" style={{ marginTop: 80 }}>
          <span className="state-icon">🔒</span>
          <h3>Wallet not connected</h3>
          <p>Please connect your wallet to create a campaign</p>
        </div>
      </main>
    );
  }

  async function create() {
    const deadline = Math.floor(Date.now() / 1000) + Number(days) * 86400;

    const hash = await writeContractAsync({
      address: FACTORY,
      abi: FactoryAbi.abi,
      functionName: "createCampaign",
      args: [BigInt(Number(target) * 1e6), deadline, metadata],
    });

    setTxHash(hash);
    setTarget("");
    setDays("");
    setMetadata("");
  }

  const isValid = Number(target) > 0 && Number(days) > 0 && metadata.trim().length > 0;

  return (
    <main className="narrow">
      {/* Back */}
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--text-secondary)",
          marginBottom: 24,
        }}
      >
        ← Back to campaigns
      </Link>

      {/* Title */}
      <h1 className="page-title">
        Launch a{" "}
        <span className="gradient-text">Campaign</span>
      </h1>
      <p className="page-subtitle" style={{ marginBottom: 32 }}>
        Deploy your fundraising campaign on Polygon Amoy
      </p>

      {/* Success banner */}
      {txHash && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "var(--radius-md)",
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            marginBottom: 24,
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--green)", marginBottom: 4 }}>
            ✓ Campaign created!
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-secondary)",
              wordBreak: "break-all",
            }}
          >
            Tx: {txHash}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="card">
        <div className="create-form">
          <div className="input-group">
            <label className="input-label">Target Amount (USDC)</label>
            <input
              className="input"
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g. 5000"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Duration (days)</label>
            <input
              className="input"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 30"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Metadata CID (IPFS)</label>
            <input
              className="input input-mono"
              type="text"
              placeholder="Qm…"
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
            />
          </div>

          {/* Preview row */}
          {isValid && (
            <div
              style={{
                padding: "14px 16px",
                background: "rgba(139, 92, 246, 0.06)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                color: "var(--text-secondary)",
                display: "grid",
                gap: 4,
              }}
            >
              <span>
                Goal:{" "}
                <b style={{ color: "var(--text-primary)" }}>
                  {Number(target).toLocaleString()} USDC
                </b>
              </span>
              <span>
                Deadline:{" "}
                <b style={{ color: "var(--text-primary)" }}>
                  {new Date(Date.now() + Number(days) * 86400 * 1000).toLocaleDateString()}
                </b>
              </span>
            </div>
          )}

          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={create}
            disabled={!isValid || isPending}
          >
            {isPending ? (
              <>
                <span className="spinner" />
                Deploying…
              </>
            ) : (
              "Deploy Campaign"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
