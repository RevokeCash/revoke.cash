import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { http, createConfig } from "wagmi";
import { arbitrum, base, mainnet, optimism, polygon } from "wagmi/chains";
import { walletConnect, injected } from "wagmi/connectors";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "e6593110d7a265b92770d7ec009e1910";

export const config = createConfig({
  chains: [base, mainnet, polygon, arbitrum, optimism],
  connectors: [
    farcasterMiniApp(),
    // Injected connector for browser extension wallets (MetaMask, etc)
    injected(),
    // WalletConnect for mobile wallets
    walletConnect({
      projectId,
      metadata: {
        name: "Revoke.cash Mini App",
        description: "Take control of your token approvals",
        url: "https://revoke.cash",
        icons: ["https://revoke.cash/assets/images/revoke-icon-orange-black.png"]
      }
    })
  ],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
