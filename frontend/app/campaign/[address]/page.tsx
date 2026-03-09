"use client";

import { useQuery } from "@apollo/client";
import { GET_CAMPAIGN } from "@/lib/queries";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useDonate } from "@/hooks/useDonate";
import { useAccount } from "wagmi";
import { fetchMetadata, ipfsToHttp, type CampaignMetadata } from "@/lib/ipfs";

type Donation = {
  id: string;
  from: string;
  amount: string;
  timestamp: string;
};

type Campaign = {
  id: string;
  owner: string;
  targetAmount: string;
  totalRaised: string;
  deadline: string;
  metadataCID: string;
  donations: Donation[];
};

type CampaignData = {
  campaign: Campaign | null;
};

// ─── Helpers ─────────────────────────────────────────────
function formatUSDC(value: string) { return Number(value) / 1e6; }
function isExpired(deadline: string) { return Date.now() / 1000 > Number(deadline); }
function shortAddr(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }
function timeLeft(deadline: string): string {
  const diff = Number(deadline) - Date.now() / 1000;
  if (diff <= 0) return "Campaign ended";
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h remaining`;
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m remaining`;
}

// ─── Progress Bar ─────────────────────────────────────────
function ProgressBar({ raised, target }: { raised: number; target: number }) {
  const percent = Math.min((raised / target) * 100, 100);
  const full = percent >= 100;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          <b style={{ color: "var(--text-primary)", fontSize: 15 }}>{raised.toLocaleString()}</b> USDC raised
        </span>
        <span className="progress-pct">{percent.toFixed(1)}%</span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${full ? "full" : ""}`} style={{ width: `${percent}%` }} />
      </div>
      <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
        Goal: {target.toLocaleString()} USDC
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function CampaignPage() {
  const { address } = useParams<{ address: string }>();
  const { address: wallet } = useAccount();
  const [amount, setAmount] = useState("");

  // ✅ ALL HOOKS FIRST
  const { donate, loading: donating } = useDonate(address as `0x${string}`);

  const { data, loading, error } = useQuery<CampaignData>(GET_CAMPAIGN, {
    variables: { id: address.toLowerCase() },
  });

  const [meta, setMeta]               = useState<CampaignMetadata | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  useEffect(() => {
    const cid = data?.campaign?.metadataCID;
    if (!cid) return;
    setMetaLoading(true);
    fetchMetadata(cid).then((result) => {
      setMeta(result);
      setMetaLoading(false);
    });
  }, [data?.campaign?.metadataCID]);

  // ⬇️ EARLY RETURNS AFTER HOOKS
  if (loading) {
    return (
      <main className="narrow">
        <div className="state-box">
          <span className="state-icon">⟳</span>
          <h3>Loading campaign…</h3>
        </div>
      </main>
    );
  }

  if (error || !data?.campaign) {
    return (
      <main className="narrow">
        <div className="state-box">
          <span className="state-icon">✕</span>
          <h3>Campaign not found</h3>
          <p>This address doesn&apos;t match any campaign</p>
        </div>
      </main>
    );
  }

  const c       = data.campaign;
  const expired = isExpired(c.deadline);
  const raised  = formatUSDC(c.totalRaised);
  const target  = formatUSDC(c.targetAmount);

  return (
    <main className="narrow">
      {/* Back */}
      <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
        ← All campaigns
      </a>

      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 className="page-title" style={{ fontSize: 24 }}>
          {metaLoading ? (
            <span className="meta-skeleton" style={{ width: 200, height: 28, display: "inline-block" }} />
          ) : (
            meta?.title || "Campaign"
          )}
        </h1>
        <span className={`badge ${expired ? "badge-ended" : "badge-active"}`}>
          {expired ? "Ended" : "Live"}
        </span>
      </div>

      {/* ── Metadata Hero ── */}
      {(metaLoading || meta) && (
        <div className="campaign-meta-hero">
          {/* Image */}
          {metaLoading ? (
            <div className="campaign-hero-img-skeleton" />
          ) : meta?.image ? (
            <img src={ipfsToHttp(meta.image)} alt={meta.title} className="campaign-hero-img" />
          ) : null}

          {/* Description */}
          {metaLoading ? (
            <>
              <span className="meta-skeleton" style={{ width: "85%", height: 16, marginBottom: 8 }} />
              <span className="meta-skeleton" style={{ width: "65%", height: 16 }} />
            </>
          ) : meta?.description ? (
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.75 }}>
              {meta.description}
            </p>
          ) : null}
        </div>
      )}

      {/* Addresses */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div className="stat-box">
          <div className="stat-label">Contract</div>
          <div className="stat-value mono">{shortAddr(c.id)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Owner</div>
          <div className="stat-value mono">{shortAddr(c.owner)}</div>
        </div>
      </div>

      {/* Progress card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <ProgressBar raised={raised} target={target} />
        <hr className="divider" />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-secondary)" }}>
          <span>Donations: <b style={{ color: "var(--text-primary)" }}>{c.donations.length}</b></span>
          <span style={{ color: expired ? "var(--red)" : "var(--green)" }}>{timeLeft(c.deadline)}</span>
        </div>
      </div>

      {/* Donate */}
      {!expired && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 className="section-title">Support this campaign</h2>
          {wallet ? (
            <div className="donate-row">
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount in USDC"
              />
              <button
                className="btn btn-primary"
                disabled={donating || !amount || Number(amount) <= 0}
                onClick={() => donate(Number(amount))}
                style={{ minWidth: 120 }}
              >
                {donating ? <><span className="spinner" /> Processing</> : "Donate"}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Connect your wallet to donate</p>
          )}
        </div>
      )}

      {/* Donation history */}
      {c.donations.length > 0 ? (
        <div>
          <h2 className="section-title">Donation History</h2>
          <div className="donation-list">
            {[...c.donations]
              .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
              .map((d) => (
                <div key={d.id} className="donation-item">
                  <div>
                    <div className="donation-from">{shortAddr(d.from)}</div>
                    <div className="donation-time">{new Date(Number(d.timestamp) * 1000).toLocaleString()}</div>
                  </div>
                  <div className="donation-amount">+{formatUSDC(d.amount).toLocaleString()} USDC</div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="state-box" style={{ padding: "40px 24px" }}>
          <span className="state-icon" style={{ fontSize: 32 }}>◈</span>
          <h3 style={{ fontSize: 16 }}>No donations yet</h3>
          <p>Be the first to support this campaign</p>
        </div>
      )}
    </main>
  );
}
