import { http, createConfig, cookieStorage, createStorage } from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
if (!projectId) throw new Error("NEXT_PUBLIC_WC_PROJECT_ID is missing in .env.local");

export { projectId };

export const wagmiConfig = createConfig({
  chains: [polygonAmoy],
  connectors: [
    walletConnect({ projectId, showQrModal: true }),
    injected(),
    coinbaseWallet({ appName: "FundChain" }),
  ],
  transports: {
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_AMOY_RPC),
  },
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
});
