// ─── Types ───────────────────────────────────────────────
export type CampaignMetadata = {
  title: string;
  description: string;
  image: string; // "ipfs://Qm..." or ""
};

// ─── Config ──────────────────────────────────────────────
const GATEWAY = "https://ipfs.io/ipfs";
const PINATA_API = "https://api.pinata.cloud";

// ─── Helpers ─────────────────────────────────────────────

/** Convert ipfs:// URI → HTTP gateway URL for <img> src */
export function ipfsToHttp(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return `${GATEWAY}/${uri.slice(7)}`;
  // Bare CID passed directly
  return `${GATEWAY}/${uri}`;
}

// ─── Upload ──────────────────────────────────────────────

/** Upload a File to Pinata. Returns the IPFS CID (string). */
export async function uploadFileToPinata(file: File): Promise<string> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  if (!jwt) throw new Error("NEXT_PUBLIC_PINATA_JWT is not configured");

  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "pinataMetadata",
    JSON.stringify({ name: `campaign-image-${Date.now()}` })
  );
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const res = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata image upload failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  return json.IpfsHash as string;
}

/** Upload a metadata JSON object to Pinata. Returns the IPFS CID. */
export async function uploadJsonToPinata(data: CampaignMetadata): Promise<string> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  if (!jwt) throw new Error("NEXT_PUBLIC_PINATA_JWT is not configured");

  const res = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataMetadata: { name: `campaign-metadata-${Date.now()}` },
      pinataOptions: { cidVersion: 1 },
      pinataContent: data,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata metadata upload failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  return json.IpfsHash as string;
}

// ─── Fetch ───────────────────────────────────────────────

/**
 * Fetch and parse campaign metadata JSON from IPFS gateway.
 * Returns null on any failure (network error, timeout, wrong format).
 * Uses an 8-second timeout to avoid hanging the UI.
 */
export async function fetchMetadata(
  cid: string
): Promise<CampaignMetadata | null> {
  if (!cid || cid.trim() === "") return null;

  const url = `${GATEWAY}/${cid}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;

    const json = await res.json();

    return {
      title:       typeof json.title === "string"       ? json.title       : "",
      description: typeof json.description === "string" ? json.description : "",
      image:       typeof json.image === "string"       ? json.image       : "",
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
}
