"use client";

import { useQuery } from "@apollo/client";
import { GET_CAMPAIGNS } from "@/lib/queries";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMetadata, ipfsToHttp, type CampaignMetadata } from "@/lib/ipfs";

type Campaign = {
  id: string;
  owner: string;
  targetAmount: string;
  totalRaised: string;
  deadline: string;
  metadataCID: string;
};

type CampaignsData = {
  campaigns: Campaign[];
};

// ─── Helpers ─────────────────────────────────────────────
function formatUSDC(value: string) {
  return Number(value) / 1e6;
}

function isExpired(deadline: string) {
  return Date.now() / 1000 > Number(deadline);
}

function timeLeft(deadline: string): string {
  const diff = Number(deadline) - Date.now() / 1000;
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h left`;
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m left`;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ─── Progress Bar ─────────────────────────────────────────
function ProgressBar({ raised, target }: { raised: number; target: number }) {
  const percent = Math.min((raised / target) * 100, 100);
  const full = percent >= 100;

  return (
    <div>
      <div className="progress-track">
        <div className={`progress-fill ${full ? "full" : ""}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-meta">
        <span>
          <b style={{ color: "var(--text-primary)" }}>{raised.toLocaleString()}</b>
          {" "}/ {target.toLocaleString()} USDC
        </span>
        <span className="progress-pct">{percent.toFixed(1)}%</span>
      </div>
    </div>
  );
}

// ─── Campaign Card ────────────────────────────────────────
function CampaignCard({ c }: { c: Campaign }) {
  const raised  = formatUSDC(c.totalRaised);
  const target  = formatUSDC(c.targetAmount);
  const expired = isExpired(c.deadline);

  const [meta, setMeta]           = useState<CampaignMetadata | null>(null);
  const [metaLoading, setMetaLoading] = useState(!!c.metadataCID);

  useEffect(() => {
    if (!c.metadataCID) { setMetaLoading(false); return; }
    setMetaLoading(true);
    fetchMetadata(c.metadataCID).then((result) => {
      setMeta(result);
      setMetaLoading(false);
    });
  }, [c.metadataCID]);

  return (
    <Link href={`/campaign/${c.id}`} className="card-link">
      <div className="card" style={{ opacity: expired ? 0.65 : 1, paddingTop: 0 }}>

        {/* Thumbnail */}
        {metaLoading ? (
          <div className="card-thumbnail card-thumbnail-skeleton" />
        ) : meta?.image ? (
          <div className="card-thumbnail">
            <img src={ipfsToHttp(meta.image)} alt={meta.title} className="card-thumbnail-img" />
          </div>
        ) : (
          <div className="card-thumbnail card-thumbnail-placeholder" />
        )}

        {/* Card body */}
        <div style={{ padding: "0" }}>

          {/* Header */}
          <div className="campaign-card-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="campaign-card-title" style={{ fontSize: 15, color: "var(--text-primary)", marginBottom: 2 }}>
                {metaLoading ? (
                  <span className="meta-skeleton" style={{ width: 140, height: 16 }} />
                ) : (
                  meta?.title || "Campaign"
                )}
              </div>
              <div className="campaign-card-address">{shortAddr(c.id)}</div>
            </div>
            <span className={`badge ${expired ? "badge-ended" : "badge-active"}`} style={{ flexShrink: 0 }}>
              {expired ? "Ended" : "Live"}
            </span>
          </div>

          {/* Amount */}
          <div className="campaign-card-amounts">
            <div className="campaign-card-raised">
              {raised.toLocaleString()}<span>USDC</span>
            </div>
            <div className="campaign-card-target">of {target.toLocaleString()} USDC goal</div>
          </div>

          {/* Progress */}
          <ProgressBar raised={raised} target={target} />

          {/* Footer */}
          <div className="campaign-card-footer">
            <span>
              Owner:{" "}
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--cyan)" }}>
                {shortAddr(c.owner)}
              </span>
            </span>
            <span>{timeLeft(c.deadline)}</span>
          </div>
        </div>

      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function HomePage() {
  const { data, loading, error } = useQuery<CampaignsData>(GET_CAMPAIGNS);

  if (loading) {
    return (
      <main>
        <div className="state-box">
          <span className="state-icon">⟳</span>
          <h3>Loading campaigns…</h3>
          <p>Fetching on-chain data</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <div className="state-box">
          <span className="state-icon">✕</span>
          <h3>Failed to load</h3>
          <p>Could not connect to the subgraph</p>
        </div>
      </main>
    );
  }

  const campaigns = data?.campaigns ?? [];
  const active    = campaigns.filter((c) => !isExpired(c.deadline));
  const ended     = campaigns.filter((c) =>  isExpired(c.deadline));

  return (
    <main>
      {/* Hero */}
      <div>
        <h1 className="page-title">
          Decentralized <span className="gradient-text">Fundraising</span>
        </h1>
        <p className="page-subtitle">
          Support projects powered by smart contracts on Polygon Amoy
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="state-box" style={{ marginTop: 48 }}>
          <span className="state-icon">◈</span>
          <h3>No campaigns yet</h3>
          <p>Connect your wallet and create the first campaign</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="section-title" style={{ marginTop: 40 }}>
                Active Campaigns
                <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>
                  ({active.length})
                </span>
              </h2>
              <div className="campaign-grid">
                {active.map((c) => <CampaignCard key={c.id} c={c} />)}
              </div>
            </section>
          )}

          {ended.length > 0 && (
            <section>
              <h2 className="section-title" style={{ marginTop: 48 }}>
                Past Campaigns
                <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>
                  ({ended.length})
                </span>
              </h2>
              <div className="campaign-grid">
                {ended.map((c) => <CampaignCard key={c.id} c={c} />)}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
