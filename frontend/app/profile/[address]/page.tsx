"use client";

import { useQuery } from "@apollo/client";
import { GET_MY_CAMPAIGNS, GET_MY_DONATIONS } from "@/lib/queries";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

type MyCampaignsData = { campaigns: Campaign[] };
type MyDonationsData = { donations: Donation[] };

// ─── Helpers ─────────────────────────────────────────────
function formatUSDC(value: string) { return Number(value) / 1e6; }
function isExpired(deadline: string) { return Date.now() / 1000 > Number(deadline); }
function shortAddr(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }
function timeLeft(deadline: string): string {
  const diff = Number(deadline) - Date.now() / 1000;
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h left`;
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m left`;
}

// ─── Page ────────────────────────────────────────────────
export default function ProfilePage() {
  const { address } = useParams<{ address: string }>();
  const walletAddr = address.toLowerCase();

  const { data: campaignsData, loading: campaignsLoading } = useQuery<MyCampaignsData>(
    GET_MY_CAMPAIGNS,
    { variables: { owner: walletAddr } }
  );

  const { data: donationsData, loading: donationsLoading } = useQuery<MyDonationsData>(
    GET_MY_DONATIONS,
    { variables: { from: walletAddr } }
  );

  // Metadata
  const [metaMap, setMetaMap] = useState<Record<string, CampaignMetadata | null>>({});
  const [metaLoadingSet, setMetaLoadingSet] = useState<Set<string>>(new Set());

  const campaigns = campaignsData?.campaigns ?? [];
  const donations = donationsData?.donations ?? [];

  const donatedCampaigns = useMemo(() => {
    return donations.reduce<Campaign[]>((acc, d) => {
      if (!acc.find((c) => c.id === d.campaign.id)) acc.push(d.campaign);
      return acc;
    }, []);
  }, [donations]);

  const allCampaigns = useMemo(() => [...campaigns, ...donatedCampaigns], [campaigns, donatedCampaigns]);

  useEffect(() => {
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

  // ─── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalDonated = donations.reduce((sum, d) => sum + formatUSDC(d.amount), 0);
    const totalRaised = campaigns.reduce((sum, c) => sum + formatUSDC(c.totalRaised), 0);
    const uniqueProjects = new Set(donations.map((d) => d.campaign.id)).size;
    const activeCampaigns = campaigns.filter((c) => !isExpired(c.deadline)).length;

    return { totalDonated, totalRaised, uniqueProjects, activeCampaigns };
  }, [donations, campaigns]);

  const isLoading = campaignsLoading || donationsLoading;

  if (isLoading) {
    return (
      <main>
        <div className="state-box">
          <span className="state-icon">⟳</span>
          <h3>Loading profile…</h3>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {/* Gradient avatar based on address */}
          <div
            className="profile-avatar-img"
            style={{
              background: `linear-gradient(135deg, #${walletAddr.slice(2, 8)}, #${walletAddr.slice(8, 14)})`,
            }}
          />
        </div>
        <div className="profile-info">
          <h1 className="profile-address mono">{shortAddr(walletAddr)}</h1>
          <a
            href={`https://amoy.polygonscan.com/address/${walletAddr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="profile-explorer-link"
          >
            View on Polygonscan →
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="profile-stats">
        <div className="profile-stat-card">
          <div className="profile-stat-value" style={{ color: "var(--green)" }}>
            {stats.totalDonated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="profile-stat-label">USDC Donated</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value" style={{ color: "var(--purple)" }}>
            {stats.totalRaised.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="profile-stat-label">USDC Raised</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value" style={{ color: "var(--cyan)" }}>
            {stats.uniqueProjects}
          </div>
          <div className="profile-stat-label">Projects Supported</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value" style={{ color: "var(--blue)" }}>
            {campaigns.length}
          </div>
          <div className="profile-stat-label">Campaigns Created</div>
        </div>
      </div>

      {/* Created Campaigns */}
      {campaigns.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 40 }}>
            Created Campaigns
            <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>
              ({campaigns.length})
            </span>
          </h2>
          <div className="campaign-grid" style={{ marginTop: 16 }}>
            {campaigns.map((c) => {
              const meta = metaMap[c.id];
              const raised = formatUSDC(c.totalRaised);
              const target = formatUSDC(c.targetAmount);
              const expired = isExpired(c.deadline);
              const percent = Math.min((raised / target) * 100, 100);

              return (
                <Link key={c.id} href={`/campaign/${c.id}`} className="card-link">
                  <div className="card" style={{ opacity: expired ? 0.65 : 1, paddingTop: 0 }}>
                    {metaLoadingSet.has(c.id) ? (
                      <div className="card-thumbnail card-thumbnail-skeleton" />
                    ) : meta?.image ? (
                      <div className="card-thumbnail">
                        <img src={ipfsToHttp(meta.image)} alt={meta.title} className="card-thumbnail-img" />
                      </div>
                    ) : (
                      <div className="card-thumbnail card-thumbnail-placeholder" />
                    )}
                    <div className="campaign-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="campaign-card-title" style={{ fontSize: 15, color: "var(--text-primary)", marginBottom: 2 }}>
                          {meta?.title || "Campaign"}
                        </div>
                        <div className="campaign-card-address">{shortAddr(c.id)}</div>
                      </div>
                      <span className={`badge ${expired ? "badge-ended" : "badge-active"}`}>
                        {expired ? "Ended" : "Live"}
                      </span>
                    </div>
                    <div className="progress-track" style={{ marginTop: 12 }}>
                      <div className={`progress-fill ${percent >= 100 ? "full" : ""}`} style={{ width: `${percent}%` }} />
                    </div>
                    <div className="campaign-card-footer">
                      <span>{raised.toLocaleString()} / {target.toLocaleString()} USDC</span>
                      <span>{timeLeft(c.deadline)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Supported Projects */}
      {donatedCampaigns.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 40 }}>
            Supported Projects
            <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>
              ({donatedCampaigns.length})
            </span>
          </h2>
          <div className="campaign-grid" style={{ marginTop: 16 }}>
            {donatedCampaigns.map((c) => {
              const meta = metaMap[c.id];
              const raised = formatUSDC(c.totalRaised);
              const target = formatUSDC(c.targetAmount);
              const expired = isExpired(c.deadline);
              const percent = Math.min((raised / target) * 100, 100);
              // Calculate how much this user donated to this campaign
              const userDonated = donations
                .filter((d) => d.campaign.id === c.id)
                .reduce((sum, d) => sum + formatUSDC(d.amount), 0);

              return (
                <Link key={c.id} href={`/campaign/${c.id}`} className="card-link">
                  <div className="card" style={{ opacity: expired ? 0.65 : 1, paddingTop: 0 }}>
                    {metaLoadingSet.has(c.id) ? (
                      <div className="card-thumbnail card-thumbnail-skeleton" />
                    ) : meta?.image ? (
                      <div className="card-thumbnail">
                        <img src={ipfsToHttp(meta.image)} alt={meta.title} className="card-thumbnail-img" />
                      </div>
                    ) : (
                      <div className="card-thumbnail card-thumbnail-placeholder" />
                    )}
                    <div className="campaign-card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="campaign-card-title" style={{ fontSize: 15, color: "var(--text-primary)", marginBottom: 2 }}>
                          {meta?.title || "Campaign"}
                        </div>
                        <div className="campaign-card-address">{shortAddr(c.id)}</div>
                      </div>
                      <span className="badge" style={{ background: "rgba(16,185,129,0.1)", color: "var(--green)", border: "1px solid rgba(16,185,129,0.3)" }}>
                        You: {userDonated.toLocaleString()} USDC
                      </span>
                    </div>
                    <div className="progress-track" style={{ marginTop: 12 }}>
                      <div className={`progress-fill ${percent >= 100 ? "full" : ""}`} style={{ width: `${percent}%` }} />
                    </div>
                    <div className="campaign-card-footer">
                      <span>{raised.toLocaleString()} / {target.toLocaleString()} USDC</span>
                      <span>{timeLeft(c.deadline)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Donation History */}
      {donations.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 40 }}>
            Donation History
            <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>
              ({donations.length})
            </span>
          </h2>
          <div className="donation-list">
            {donations.map((d) => {
              const meta = metaMap[d.campaign.id];
              return (
                <Link key={d.id} href={`/campaign/${d.campaign.id}`} className="card-link">
                  <div className="donation-item">
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                        {meta?.title || shortAddr(d.campaign.id)}
                      </div>
                      <div className="donation-time">
                        {new Date(Number(d.timestamp) * 1000).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="donation-amount">
                      +{formatUSDC(d.amount).toLocaleString()} USDC
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {campaigns.length === 0 && donations.length === 0 && (
        <div className="state-box" style={{ marginTop: 48 }}>
          <span className="state-icon">◈</span>
          <h3>No activity yet</h3>
          <p>This wallet hasn&apos;t created or donated to any campaigns</p>
        </div>
      )}
    </main>
  );
}
