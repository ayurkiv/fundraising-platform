/**
 * Centralized error parser for FundChain.
 *
 * Returns a short, human-friendly message for every known failure mode.
 * Falls back to a generic message so raw technical errors never reach the UI.
 */

// ─── Error categories ─────────────────────────────────────
export type ErrorCategory =
  | "user-rejected"    // User cancelled MetaMask popup
  | "already-exists"   // Contract: one campaign per address
  | "wrong-network"    // Not on Polygon Amoy
  | "no-funds"         // Not enough MATIC for gas
  | "pinata-auth"      // Bad Pinata JWT
  | "pinata-limit"     // Pinata rate limit / quota exceeded
  | "pinata-size"      // File too large for Pinata
  | "ipfs-upload"      // Generic Pinata/IPFS upload failure
  | "network"          // No internet / fetch failed
  | "timeout"          // Request timed out
  | "unknown";         // Catch-all

export interface ParsedError {
  category: ErrorCategory;
  /** Short message shown to the user */
  message: string;
  /** Optional hint shown below the message */
  hint?: string;
}

// ─── Message map ──────────────────────────────────────────
const MESSAGES: Record<ErrorCategory, { message: string; hint?: string }> = {
  "user-rejected": {
    message: "Transaction cancelled",
    hint:    "You rejected the transaction in MetaMask. Try again when ready.",
  },
  "already-exists": {
    message: "Campaign already exists",
    hint:    "Each wallet can have only one active campaign.",
  },
  "wrong-network": {
    message: "Wrong network",
    hint:    "Switch MetaMask to Polygon Amoy (chain ID 80002) and try again.",
  },
  "no-funds": {
    message: "Not enough MATIC for gas",
    hint:    "Get free testnet MATIC at faucet.polygon.technology.",
  },
  "pinata-auth": {
    message: "IPFS upload failed — invalid API key",
    hint:    "Check that NEXT_PUBLIC_PINATA_JWT is set correctly in .env.local.",
  },
  "pinata-limit": {
    message: "IPFS upload failed — rate limit reached",
    hint:    "Pinata free plan limit hit. Wait a moment and try again.",
  },
  "pinata-size": {
    message: "Photo is too large",
    hint:    "Please use an image under 10 MB.",
  },
  "ipfs-upload": {
    message: "IPFS upload failed",
    hint:    "Could not upload to Pinata. Check your connection and try again.",
  },
  "network": {
    message: "Network error",
    hint:    "Check your internet connection and try again.",
  },
  "timeout": {
    message: "Request timed out",
    hint:    "The IPFS gateway took too long. Try again in a moment.",
  },
  "unknown": {
    message: "Something went wrong",
    hint:    "Please try again. If the issue persists, check the browser console.",
  },
};

// ─── Parser ───────────────────────────────────────────────
export function parseError(err: unknown): ParsedError {
  const msg = extractMessage(err);
  const category = classify(msg, err);
  return { category, ...MESSAGES[category] };
}

// ─── Helpers ──────────────────────────────────────────────

function extractMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    // Viem / wagmi wraps the real cause inside .cause.shortMessage or .cause.message
    const e = err as Record<string, unknown>;
    if (typeof e.shortMessage === "string") return e.shortMessage;
    if (e.cause && typeof e.cause === "object") {
      const c = e.cause as Record<string, unknown>;
      if (typeof c.shortMessage === "string") return c.shortMessage;
      if (typeof c.message === "string") return c.message;
    }
    if (typeof e.message === "string") return e.message;
  }
  return "";
}

function classify(msg: string, err: unknown): ErrorCategory {
  const low = msg.toLowerCase();

  // ── User rejected ──────────────────────────────────────
  if (
    low.includes("user denied") ||
    low.includes("user rejected") ||
    low.includes("rejected the request") ||
    low.includes("denied transaction") ||
    matchCode(err, 4001)          // EIP-1193 user rejected
  ) return "user-rejected";

  // ── Contract reverts ───────────────────────────────────
  if (
    low.includes("already has a campaign") ||
    low.includes("campaign already") ||
    low.includes("execution reverted") && low.includes("campaign")
  ) return "already-exists";

  // ── Wrong network ──────────────────────────────────────
  if (
    low.includes("chain") && (low.includes("mismatch") || low.includes("unsupported")) ||
    low.includes("wrong network") ||
    matchCode(err, 4902)          // EIP-1193 chain not added
  ) return "wrong-network";

  // ── Gas / funds ────────────────────────────────────────
  if (
    low.includes("insufficient funds") ||
    low.includes("not enough funds") ||
    low.includes("gas required exceeds") ||
    low.includes("intrinsic gas too low")
  ) return "no-funds";

  // ── Pinata auth ────────────────────────────────────────
  if (
    low.includes("401") ||
    low.includes("unauthorized") ||
    low.includes("invalid api key") ||
    low.includes("jwt")
  ) return "pinata-auth";

  // ── Pinata rate limit ──────────────────────────────────
  if (
    low.includes("429") ||
    low.includes("rate limit") ||
    low.includes("too many requests") ||
    low.includes("quota")
  ) return "pinata-limit";

  // ── File size ──────────────────────────────────────────
  if (
    low.includes("413") ||
    low.includes("file too large") ||
    low.includes("payload too large") ||
    low.includes("max file size")
  ) return "pinata-size";

  // ── Generic Pinata/IPFS upload ─────────────────────────
  if (
    low.includes("pinata") ||
    low.includes("pinfiletoipfs") ||
    low.includes("pinjsontoi") ||
    low.includes("ipfs upload") ||
    low.includes("pin failed")
  ) return "ipfs-upload";

  // ── Timeout ────────────────────────────────────────────
  if (
    low.includes("timeout") ||
    low.includes("aborted") ||
    low.includes("timed out")
  ) return "timeout";

  // ── Network ────────────────────────────────────────────
  if (
    low.includes("network error") ||
    low.includes("failed to fetch") ||
    low.includes("networkerror") ||
    low.includes("net::err") ||
    low.includes("econnrefused") ||
    low.includes("enotfound") ||
    low.includes("no internet")
  ) return "network";

  return "unknown";
}

function matchCode(err: unknown, code: number): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  if (e.code === code) return true;
  if (e.cause && typeof e.cause === "object") {
    return (e.cause as Record<string, unknown>).code === code;
  }
  return false;
}
