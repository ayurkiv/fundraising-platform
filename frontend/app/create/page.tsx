"use client";

import { useAccount, useWriteContract } from "wagmi";
import { useState, useRef } from "react";
import FactoryAbi from "@/abi/CampaignFactory.json";
import Link from "next/link";
import { uploadFileToPinata, uploadJsonToPinata } from "@/lib/ipfs";
import { parseError, type ParsedError } from "@/lib/errors";

const FACTORY = process.env.NEXT_PUBLIC_FACTORY as `0x${string}`;

type UploadStep =
  | "idle"
  | "uploading-image"
  | "uploading-metadata"
  | "deploying"
  | "done";

const STEP_LABELS: Record<UploadStep, string> = {
  idle:               "Deploy Campaign",
  "uploading-image":  "Uploading photo…",
  "uploading-metadata": "Uploading metadata…",
  deploying:          "Deploying…",
  done:               "Deploy Campaign",
};

const STEP_PROGRESS: Record<UploadStep, string> = {
  idle:               "0%",
  "uploading-image":  "33%",
  "uploading-metadata": "66%",
  deploying:          "90%",
  done:               "100%",
};

export default function CreateCampaignPage() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget]         = useState("");
  const [days, setDays]             = useState("");
  const [photoFile, setPhotoFile]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [txHash, setTxHash]         = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<ParsedError | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function create() {
    setUploadError(null);
    setTxHash(null);
    try {
      // 1. Upload photo (optional)
      let imageCID = "";
      if (photoFile) {
        setUploadStep("uploading-image");
        imageCID = await uploadFileToPinata(photoFile);
      }

      // 2. Upload metadata JSON
      setUploadStep("uploading-metadata");
      const metadataCID = await uploadJsonToPinata({
        title:       title.trim(),
        description: description.trim(),
        image:       imageCID ? `ipfs://${imageCID}` : "",
      });

      // 3. Deploy contract
      setUploadStep("deploying");
      const deadline = Math.floor(Date.now() / 1000) + Number(days) * 86400;
      const hash = await writeContractAsync({
        address: FACTORY,
        abi: FactoryAbi.abi,
        functionName: "createCampaign",
        args: [BigInt(Number(target) * 1e6), deadline, metadataCID],
      });

      setTxHash(hash);
      setUploadStep("done");
      // Reset form
      setTitle(""); setDescription(""); setTarget(""); setDays("");
      setPhotoFile(null); setPhotoPreview(null);
    } catch (err) {
      const parsed = parseError(err);
      // Silent dismiss — don't show an error banner for intentional cancels
      if (parsed.category !== "user-rejected") {
        setUploadError(parsed);
      }
      setUploadStep("idle");
    }
  }

  const isBusy   = uploadStep !== "idle" && uploadStep !== "done";
  const isValid  = title.trim().length > 0 && Number(target) > 0 && Number(days) > 0;

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

  return (
    <main className="narrow">
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
        ← Back to campaigns
      </Link>

      <h1 className="page-title">
        Launch a <span className="gradient-text">Campaign</span>
      </h1>
      <p className="page-subtitle" style={{ marginBottom: 32 }}>
        Deploy your fundraising campaign on Polygon Amoy
      </p>

      {/* Success */}
      {txHash && (
        <div style={{ padding: "16px 20px", borderRadius: "var(--radius-md)", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", marginBottom: 24 }}>
          <div style={{ fontWeight: 600, color: "var(--green)", marginBottom: 4 }}>✓ Campaign created!</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)", wordBreak: "break-all" }}>Tx: {txHash}</div>
        </div>
      )}

      {/* Error */}
      {uploadError && (
        <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)", marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--red)", marginBottom: uploadError.hint ? 4 : 0 }}>
            ✕ {uploadError.message}
          </div>
          {uploadError.hint && (
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {uploadError.hint}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="create-form">

          {/* Title */}
          <div className="input-group">
            <label className="input-label">Campaign Title *</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Help build a community garden"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea
              className="input input-textarea"
              placeholder="Tell your story — what are you raising funds for?"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Photo */}
          <div className="input-group">
            <label className="input-label">Campaign Photo</label>
            <div className="photo-upload-zone" onClick={() => fileInputRef.current?.click()}>
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="photo-preview-img" />
              ) : (
                <div className="photo-upload-placeholder">
                  <span style={{ fontSize: 28, color: "var(--text-muted)" }}>+</span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Click to upload photo</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>PNG, JPG, WEBP · recommended 800×450</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            {photoFile && (
              <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", marginTop: 6 }} onClick={removePhoto}>
                Remove photo
              </button>
            )}
          </div>

          {/* Target */}
          <div className="input-group">
            <label className="input-label">Target Amount (USDC) *</label>
            <input className="input" type="number" min="1" step="0.01" placeholder="e.g. 5000" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>

          {/* Duration */}
          <div className="input-group">
            <label className="input-label">Duration (days) *</label>
            <input className="input" type="number" min="1" step="1" placeholder="e.g. 30" value={days} onChange={(e) => setDays(e.target.value)} />
          </div>

          {/* Preview summary */}
          {isValid && (
            <div style={{ padding: "14px 16px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--text-secondary)", display: "grid", gap: 4 }}>
              <span>Title: <b style={{ color: "var(--text-primary)" }}>{title}</b></span>
              <span>Goal: <b style={{ color: "var(--text-primary)" }}>{Number(target).toLocaleString()} USDC</b></span>
              <span>Deadline: <b style={{ color: "var(--text-primary)" }}>{new Date(Date.now() + Number(days) * 86400 * 1000).toLocaleDateString()}</b></span>
              {photoFile && <span>Photo: <b style={{ color: "var(--text-primary)" }}>{photoFile.name}</b></span>}
            </div>
          )}

          {/* Upload progress */}
          {isBusy && (
            <div className="upload-progress-bar">
              <div className="upload-progress-fill" style={{ width: STEP_PROGRESS[uploadStep] }} />
            </div>
          )}

          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={create}
            disabled={!isValid || isBusy}
          >
            {isBusy ? (
              <><span className="spinner" />{STEP_LABELS[uploadStep]}</>
            ) : (
              STEP_LABELS[uploadStep]
            )}
          </button>

        </div>
      </div>
    </main>
  );
}
