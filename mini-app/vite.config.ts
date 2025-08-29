import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars from current directory
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@revoke-lib": resolve(__dirname, "../lib"),
        // Allow root project imports like "lib/ky" to resolve inside the mini-app
        lib: resolve(__dirname, "../lib"),
        // Main app absolute imports
        components: resolve(__dirname, "../components"),
        "@/shared-lib": resolve(__dirname, "src/shared-lib"),
        "@/shared-components": resolve(__dirname, "src/shared-components"),
        "@/components": resolve(__dirname, "src/components"),
        "@/hooks": resolve(__dirname, "src/hooks"),
        "@/lib": resolve(__dirname, "src/lib"),
      },
    },
    server: {
      allowedHosts: true,
    },
    define: {
      // Add process global for browser environment
      global: 'globalThis',
      'process.env': JSON.stringify({
        VITE_ETHERSCAN_API_KEYS: env.VITE_ETHERSCAN_API_KEYS,
        VITE_ETHERSCAN_RATE_LIMITS: env.VITE_ETHERSCAN_RATE_LIMITS,
        VITE_NODE_URLS: env.VITE_NODE_URLS,
        VITE_ALCHEMY_API_KEY: env.VITE_ALCHEMY_API_KEY,
        VITE_INFURA_API_KEY: env.VITE_INFURA_API_KEY,
        VITE_SKIP_API_LOGIN: env.VITE_SKIP_API_LOGIN,
        VITE_WALLETCONNECT_PROJECT_ID: env.VITE_WALLETCONNECT_PROJECT_ID,
      }),
    },
  };
});
