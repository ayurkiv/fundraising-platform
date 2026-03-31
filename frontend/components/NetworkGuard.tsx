"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";

const POLYGON_AMOY_CHAIN_ID = 80002;

export function NetworkGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  if (!isConnected || chainId === POLYGON_AMOY_CHAIN_ID) {
    return null;
  }

  return (
    <div className="network-banner">
      <span>Wrong network. Please switch to Polygon Amoy.</span>
      <button onClick={() => switchChain({ chainId: POLYGON_AMOY_CHAIN_ID })}>
        Switch Network
      </button>
    </div>
  );
}
