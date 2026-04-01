"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { WalletButton } from "./WalletButton";
import { useAccount } from "wagmi";

export function Navbar() {
  const { isConnected } = useAccount();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <nav className="nav">
      {/* Logo */}
      <Link href="/" className="nav-logo">
        ◈ FundChain
      </Link>

      <div className="nav-spacer" />

      {/* Desktop links */}
      <div className="nav-desktop">
        <Link href="/" className={`nav-link ${pathname === "/" ? "nav-link-active" : ""}`}>
          Campaigns
        </Link>
        {isConnected && (
          <Link href="/my-campaigns" className={`nav-link ${pathname === "/my-campaigns" ? "nav-link-active" : ""}`}>
            My Campaigns
          </Link>
        )}
        {isConnected && (
          <Link href="/create" className={`nav-link nav-link-create ${pathname === "/create" ? "nav-link-active" : ""}`}>
            + Create
          </Link>
        )}
        <WalletButton />
      </div>

      {/* Mobile: wallet + burger */}
      <div className="nav-mobile-right">
        <WalletButton />
        <button
          className={`burger ${menuOpen ? "burger-open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile overlay */}
      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}

      {/* Mobile slide-out menu */}
      <div className={`nav-drawer ${menuOpen ? "nav-drawer-open" : ""}`}>
        <Link href="/" className={`nav-drawer-link ${pathname === "/" ? "nav-drawer-link-active" : ""}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Campaigns
        </Link>
        {isConnected && (
          <Link href="/my-campaigns" className={`nav-drawer-link ${pathname === "/my-campaigns" ? "nav-drawer-link-active" : ""}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            My Campaigns
          </Link>
        )}
        {isConnected && (
          <Link href="/create" className={`nav-drawer-link ${pathname === "/create" ? "nav-drawer-link-active" : ""}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Create Campaign
          </Link>
        )}
      </div>
    </nav>
  );
}
