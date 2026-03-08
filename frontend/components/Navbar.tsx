"use client";

import Link from "next/link";
import { WalletButton } from "./WalletButton";
import { useAccount } from "wagmi";

export function Navbar() {
  const { isConnected } = useAccount();

  return (
    <nav className="nav">
      {/* Logo */}
      <Link href="/" className="nav-logo">
        ◈ FundChain
      </Link>

      {/* Nav links */}
      <Link href="/" className="nav-link">
        Campaigns
      </Link>

      {isConnected && (
        <Link href="/create" className="nav-link">
          + Create
        </Link>
      )}

      <div className="nav-spacer" />

      <WalletButton />
    </nav>
  );
}
