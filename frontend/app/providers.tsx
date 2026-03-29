"use client";

import "@/lib/appkit"; // Initialize AppKit before any hooks

import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/lib/apolloClient";

import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={apolloClient}>
          {children}
        </ApolloProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
