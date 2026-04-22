// Type declarations for @worldcoin/minikit-js subpath exports
// Needed because moduleResolution: "node" does not support package.json "exports"

declare module '@worldcoin/minikit-js/wagmi' {
  type WorldAppConnectorOptions = {
    name?: string;
  };

  export function worldApp(options?: WorldAppConnectorOptions): import('wagmi').CreateConnectorFn;
}
