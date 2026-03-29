"use client";

import { getAppKit } from "./wagmi";

// Initialize AppKit eagerly on client side (module-level side effect)
if (typeof window !== "undefined") {
  getAppKit();
}
