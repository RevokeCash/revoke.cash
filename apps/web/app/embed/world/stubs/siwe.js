// Stub for `siwe` — dynamically imported by @worldcoin/minikit-js but never
// reached in our code path. We use the worldApp() wagmi connector for wallet
// connection, not MiniKit's SIWE-based walletAuth command.
export class SiweMessage {
  constructor() {
    throw new Error('siwe is not available — this code path should not be reached');
  }
}
