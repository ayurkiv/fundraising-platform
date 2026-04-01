"use client";

import { useQuery } from "@apollo/client";
import { GET_MY_CAMPAIGNS, GET_MY_DONATIONS } from "@/lib/queries";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { fetchMetadata, ipfsToHttp, type CampaignMetadata } from "@/lib/ipfs";

type Campaign = {
  id: string;
  owner: string;
  targetAmount: string;
  totalRaised: string;
  deadline: string;
  metadataCID: string;
  createdAtBlock: string;
};

type Donation = {
  id: string;
  from: string;
  amount: string;
  timestamp: string;
  txHash: string;
  campaign: Campaign;
};

type MyCampaignsData = {
  campaigns: Campaign[];
};

type MyDonationsData = {
  donations: Donation[];
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

function formatDate(timestamp: string) {
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
function CampaignCard({ c, meta, metaLoading }: { c: Campaign; meta: CampaignMetadata | null; metaLoading: boolean }) {
  const raised  = formatUSDC(c.totalRaised);
  const target  = formatUSDC(c.targetAmount);
  const expired = isExpired(c.deadline);

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

          <div className="campaign-card-amounts">
            <div className="campaign-card-raised">
              {raised.toLocaleString()}<span>USDC</span>
            </div>
            <div className="campaign-card-target">of {target.toLocaleString()} USDC goal</div>
          </div>

          <ProgressBar raised={raised} target={target} />

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
export default function MyCampaignsPage() {
  const { address, isConnected } = useAccount();

  const ownerAddr = address?.toLowerCase() ?? "";

  const {
    data: campaignsData,
    loading: campaignsLoading,
  } = useQuery<MyCampaignsData>(GET_MY_CAMPAIGNS, {
    variables: { owner: ownerAddr },
    skip: !isConnected,
  });

  const {
    data: donationsData,
    loading: donationsLoading,
  } = useQuery<MyDonationsData>(GET_MY_DONATIONS, {
    variables: { from: ownerAddr },
    skip: !isConnected,
  });

  // Metadata loading
  const [metaMap, setMetaMap] = useState<Record<string, CampaignMetadata | null>>({});
  const [metaLoadingSet, setMetaLoadingSet] = useState<Set<string>>(new Set());

  const myCampaigns = campaignsData?.campaigns ?? [];
  const myDonations = donationsData?.donations ?? [];

  // Deduplicate donated campaigns
  const donatedCampaigns = myDonations.reduce<Campaign[]>((acc, d) => {
    if (!acc.find((c) => c.id === d.campaign.id)) {
      acc.push(d.campaign);
    }
    return acc;
  }, []);

  // Collect all campaigns that need metadata
  const allCampaigns = [...myCampaigns, ...donatedCampaigns];

  useEffect(() => {
    if (allCampaigns.length === 0) return;

    const toFetch = allCampaigns.filter(
      (c) => c.metadataCID && !(c.id in metaMap) && !metaLoadingSet.has(c.id)
    );

    if (toFetch.length === 0) return;

    setMetaLoadingSet((prev) => {
      const next = new Set(prev);
      toFetch.forEach((c) => next.add(c.id));
      return next;
    });

    toFetch.forEach((c) => {
      fetchMetadata(c.metadataCID).then((result) => {
        setMetaMap((prev) => ({ ...prev, [c.id]: result }));
        setMetaLoadingSet((prev) => {
          const next = new Set(prev);
          next.delete(c.id);
          return next;
        });
      });
    });
  }, [allCampaigns, metaMap, metaLoadingSet]);

  // Tab state
  const [tab, setTab] = useState<"created" | "donated">("created");

  if (!isConnected) {
    return (
      <main>
        <div className="state-box" style={{ marginTop: 48 }}>
          <span className="state-icon">◈</span>
          <h3>Connect your wallet</h3>
          <p>Connect your wallet to see your campaigns and donation history</p>
        </div>
      </main>
    );
  }

  const isLoading = campaignsLoading || donationsLoading;

  if (isLoading) {
    return (
      <main>
        <div className="state-box">
          <span className="state-icon">⟳</span>
          <h3>Loading your campaigns…</h3>
          <p>Fetching on-chain data</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <h1 className="page-title">
        My <span className="gradient-text">Campaigns</span>
      </h1>
      <p className="page-subtitle">
        Campaigns you created and projects you supported
      </p>

      {/* Tabs */}
      <div className="filter-bar" style={{ marginTop: 28 }}>
        <div className="filter-btn-group">
          <button
            className={`filter-btn ${tab === "created" ? "filter-btn-active" : ""}`}
            onClick={() => setTab("created")}
          >
            Created ({myCampaigns.length})
          </button>
          <button
            className={`filter-btn ${tab === "donated" ? "filter-btn-active" : ""}`}
            onClick={() => setTab("donated")}
          >
            Donated ({donatedCampaigns.length})
          </button>
        </div>
      </div>

      {/* Created Campaigns Tab */}
      {tab === "created" && (
        <>
          {myCampaigns.length === 0 ? (
            <div className="state-box" style={{ marginTop: 32 }}>
              <span className="state-icon">◈</span>
              <h3>No campaigns created</h3>
              <p>
                You have not created any campaigns yet.{" "}
                <Link href="/create" style={{ color: "var(--purple)" }}>Create one now</Link>
              </p>
            </div>
          ) : (
            <div className="campaign-grid" style={{ marginTop: 24 }}>
              {myCampaigns.map((c) => (
                <CampaignCard
                  key={c.id}
                  c={c}
                  meta={metaMap[c.id] ?? null}
                  metaLoading={metaLoadingSet.has(c.id) || (!!c.metadataCID && !(c.id in metaMap))}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Donated Campaigns Tab */}
      {tab === "donated" && (
        <>
          {donatedCampaigns.length === 0 ? (
            <div className="state-box" style={{ marginTop: 32 }}>
              <span className="state-icon">◈</span>
              <h3>No donations yet</h3>
              <p>
                You have not donated to any campaigns yet.{" "}
                <Link href="/" style={{ color: "var(--purple)" }}>Browse campaigns</Link>
              </p>
            </div>
          ) : (
            <>
              <div className="campaign-grid" style={{ marginTop: 24 }}>
                {donatedCampaigns.map((c) => (
                  <CampaignCard
                    key={c.id}
                    c={c}
                    meta={metaMap[c.id] ?? null}
                    metaLoading={metaLoadingSet.has(c.id) || (!!c.metadataCID && !(c.id in metaMap))}
                  />
                ))}
              </div>

              {/* Donation history */}
              <h2 className="section-title" style={{ marginTop: 48 }}>
                Donation History
                <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>
                  ({myDonations.length})
                </span>
              </h2>
              <div className="donation-list">
                {myDonations.map((d) => {
                  const meta = metaMap[d.campaign.id];
                  return (
                    <Link key={d.id} href={`/campaign/${d.campaign.id}`} className="card-link">
                      <div className="donation-item">
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                            {meta?.title || shortAddr(d.campaign.id)}
                          </div>
                          <div className="donation-time">{formatDate(d.timestamp)}</div>
                        </div>
                        <div className="donation-amount">
                          {formatUSDC(d.amount).toLocaleString()} USDC
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
