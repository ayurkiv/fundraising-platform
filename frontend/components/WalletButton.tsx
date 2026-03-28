"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
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

  // Prefer WalletConnect (shows QR), fallback to first available
  const wcConnector = connectors.find((c) => c.id === "walletConnect");
  const connector = wcConnector ?? connectors[0];

  return (
    <button
      className="wallet-btn wallet-btn-connect"
      onClick={() => connector && connect({ connector })}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <span className="spinner" />
          Connecting…
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 12V8H6a2 2 0 0 1 0-4h14v4"/>
            <path d="M20 12v4H6a2 2 0 0 0 0 4h14v-4"/>
          </svg>
          Connect Wallet
        </>
      )}
    </button>
  );
}
