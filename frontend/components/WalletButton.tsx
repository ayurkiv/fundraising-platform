"use client";

import { useAccount, useDisconnect } from "wagmi";
import { getAppKit } from "@/lib/wagmi";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuOpen]);

  if (isConnected && address) {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
    return (
      <div className="wallet-menu-wrapper" ref={menuRef}>
        <button
          className="wallet-btn wallet-btn-connected"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="wallet-dot" />
          <span className="wallet-addr">{short}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {menuOpen && (
          <div className="wallet-dropdown">
            <Link
              href={`/profile/${address}`}
              className="wallet-dropdown-item"
              onClick={() => setMenuOpen(false)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profile
            </Link>
            <Link
              href="/my-campaigns"
              className="wallet-dropdown-item"
              onClick={() => setMenuOpen(false)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              My Campaigns
            </Link>
            <div className="wallet-dropdown-divider" />
            <button
              className="wallet-dropdown-item wallet-dropdown-danger"
              onClick={() => { disconnect(); setMenuOpen(false); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  const handleConnect = () => {
    const appKit = getAppKit();
    appKit.open();
  };

  return (
    <button
      className="wallet-btn wallet-btn-connect"
      onClick={handleConnect}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M20 12V8H6a2 2 0 0 1 0-4h14v4"/>
        <path d="M20 12v4H6a2 2 0 0 0 0 4h14v-4"/>
      </svg>
      Connect Wallet
    </button>
  );
}
