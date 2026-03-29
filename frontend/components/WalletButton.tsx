"use client";

import { useAccount, useDisconnect } from "wagmi";
import { getAppKit } from "@/lib/wagmi";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
    return (
      <button className="wallet-btn wallet-btn-connected" onClick={() => disconnect()}>
        <span className="wallet-dot" />
        <span className="wallet-addr">{short}</span>
      </button>
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
