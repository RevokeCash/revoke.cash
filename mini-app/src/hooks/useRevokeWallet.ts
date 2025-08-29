import { useMemo } from "react";
import { type Connector, useAccount, useConnect } from "wagmi";
import {
  filterAndSortConnectors,
  getConnectorName,
  getWalletIcon,
} from "@revoke-lib/utils/wallet";

/**
 * Small helper hook that wraps the Wagmi wallet connection hooks but follows
 * Revoke.cash design patterns (sorted connector list, wallet utils, etc.).
 */
export const useRevokeWallet = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectAsync, connectors } = useConnect();

  // Revoke.cash shows wallets in a deterministic, UX-friendly order.
  const sortedConnectors = useMemo(
    () => filterAndSortConnectors(connectors as any),
    [connectors],
  );

  return {
    address,
    isConnected,
    connect,
    connectAsync,
    connectors: sortedConnectors,
  } as const;
};

export type RevokeConnector = Connector;
export { getConnectorName, getWalletIcon };