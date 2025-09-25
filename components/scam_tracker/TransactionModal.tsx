'use client';

import ChainOverlayLogo from 'components/common/ChainOverlayLogo';
import Href from 'components/common/Href';
import Modal from 'components/common/Modal';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { formatBalance, shortenAddress } from 'lib/utils/formatting';
import type { TransactionInfo } from 'lib/utils/token-tracking';
import { useLayoutEffect, useRef, useState } from 'react';
import { type Log, formatEther } from 'viem';

interface ExtendedLog extends Log<bigint, number, false> {
  blockTimestamp: number;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionInfo | null;
}

const TransactionModal = ({ isOpen, onClose, transaction }: TransactionModalProps) => {
  if (!transaction) return null;

  const linkRef = useRef<HTMLAnchorElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useLayoutEffect(() => {
    if (!linkRef.current) return;
    if (linkRef.current.clientWidth < linkRef.current.scrollWidth) {
      setShowTooltip(true);
    }
  }, []);

  const txExplorerUrl = `${getChainExplorerUrl(transaction.chainId ?? 1)}/tx/${transaction.hash}`;

  let txHashLink = (
    <Href href={txExplorerUrl} underline="hover" external ref={linkRef} className="truncate">
      {shortenAddress(transaction.hash)}
    </Href>
  );

  if (showTooltip) {
    txHashLink = <WithHoverTooltip tooltip={transaction.hash}>{txHashLink}</WithHoverTooltip>;
  }

  return (
    <Modal open={isOpen} setOpen={onClose} className="max-w-[90vw] md:max-w-md lg:max-w-xl">
      <div className="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Transaction Details</h2>
          <ChainOverlayLogo chainId={transaction.chainId} size={32} overlaySize={24} alt={''} />
        </div>

        {/* Transaction Overview */}
        <div className="border rounded-md border-zinc-400 dark:border-zinc-600 p-3 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm md:text-base text-gray-600 dark:text-gray-300">Transaction Hash</div>
                <div className="font-mono mt-1 text-sm md:text-base text-gray-900 dark:text-white">{txHashLink}</div>
              </div>
              <div>
                <div className="text-sm md:text-base text-gray-600 dark:text-gray-300">Status</div>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs md:text-sm font-medium ${transaction.receipt.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}
                  >
                    {transaction.receipt.status === 'success' ? 'Success' : 'Failed'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm md:text-base text-gray-600 dark:text-gray-300">Block</div>
                <div className="mt-1 text-sm md:text-base text-gray-900 dark:text-white">
                  {transaction.receipt.blockNumber}
                </div>
              </div>
              <div>
                <div className="text-sm md:text-base text-gray-600 dark:text-gray-300">Timestamp</div>
                <div className="mt-1 text-sm md:text-base text-gray-900 dark:text-white">
                  {new Date((transaction.receipt.logs[0] as ExtendedLog).blockTimestamp * 1000).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Details */}
        <div className="border rounded-md border-zinc-400 dark:border-zinc-600 rounded-lg p-3 md:p-4">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-900 dark:text-white">
            Address Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <div className="text-sm md:text-base text-gray-600 dark:text-gray-300">From</div>
              <div className="font-mono mt-1 text-sm md:text-base text-gray-900 dark:text-white">
                <Href
                  href={`${getChainExplorerUrl(transaction.chainId ?? 1)}/address/${transaction.receipt.from}`}
                  underline="hover"
                  external
                >
                  {shortenAddress(transaction.receipt.from)}
                </Href>
              </div>
            </div>
            <div>
              <div className="text-sm md:text-base text-gray-600 dark:text-gray-300">To</div>
              <div className="font-mono mt-1 text-sm md:text-base text-gray-900 dark:text-white">
                <Href
                  href={`${getChainExplorerUrl(transaction.chainId ?? 1)}/address/${transaction.receipt.to}`}
                  underline="hover"
                  external
                >
                  {shortenAddress(transaction.receipt.to)}
                </Href>
              </div>
            </div>
          </div>
        </div>

        {/* Value and Gas Details */}
        <div className="border rounded-md border-zinc-400 dark:border-zinc-600 rounded-lg p-3 md:p-4">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-900 dark:text-white">
            Transaction Value & Gas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <div className="text-sm md:text-base text-gray-600 dark:text-gray-300">Value</div>
              <div className="mt-1 text-sm md:text-base text-gray-900 dark:text-white">
                {formatEther(BigInt(transaction.receipt.cumulativeGasUsed), 'gwei')} ETH
              </div>
            </div>
            <div>
              <div className="text-sm md:text-base text-gray-600 dark:text-gray-300">Gas Used</div>
              <div className="mt-1 text-sm md:text-base text-gray-900 dark:text-white">
                {transaction.receipt.gasUsed?.toString() ?? 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Token Transfers */}
        {transaction.transfers && transaction.transfers.length > 0 && (
          <div className="border rounded-md border-zinc-400 dark:border-zinc-600 rounded-lg p-3 md:p-4">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-900 dark:text-white">
              Token Transfers
            </h3>
            <div className="space-y-3">
              {transaction.transfers.map((transfer, index) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  key={index}
                  className={`flex items-center justify-between p-3 ${index === transaction.transfers.length - 1 ? '' : 'border-b'} border-gray-200 dark:border-gray-700`}
                >
                  <div className="flex items-center gap-3">
                    <ChainOverlayLogo
                      src={transfer.metadata.icon}
                      alt={transfer.metadata.symbol}
                      size={24}
                      overlaySize={16}
                    />
                    <div>
                      <div className="font-medium text-sm md:text-base text-gray-900 dark:text-white">
                        {transfer.metadata.symbol}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        {transfer.metadata.symbol}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm md:text-base text-gray-900 dark:text-white">
                      {formatBalance(
                        transfer.metadata.symbol,
                        transfer.event.payload.amount,
                        transfer.metadata.decimals,
                      )}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      {shortenAddress(transfer.event.payload.from)} → {shortenAddress(transfer.event.payload.to)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TransactionModal;
