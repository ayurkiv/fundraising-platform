import { http, cookieStorage, createStorage } from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID as string;
if (!projectId) throw new Error("NEXT_PUBLIC_WC_PROJECT_ID is missing in .env.local");

export { projectId };

const metadata = {
  name: "FundChain",
  description: "Decentralized Fundraising Platform",
  url: typeof window !== "undefined" ? window.location.origin : "https://fundchain.app",
  icons: ["/logo.svg"],
};

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_AMOY_RPC),
  },
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Initialize AppKit (singleton — safe to call at module level)
let appKitInstance: ReturnType<typeof createAppKit> | null = null;

export function getAppKit() {
  if (!appKitInstance) {
    appKitInstance = createAppKit({
      adapters: [wagmiAdapter],
      projectId,
      networks: [polygonAmoy],
      metadata,
      features: {
        analytics: false,
      },
    });
  }
  return appKitInstance;
}
