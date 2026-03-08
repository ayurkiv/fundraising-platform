import { http, createConfig } from "wagmi";
import { polygonAmoy } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_AMOY_RPC),
  },
});
