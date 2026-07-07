import { Img, staticFile } from 'remotion';
import { ShowcaseFrame } from '../components/ShowcaseFrame';
import { TokenIcon } from '../components/TokenIcon';

// Still image for the premium pricing page's feature showcase (1200x630): a dark-mode mockup of
// the multichain dashboard, with approvals from different networks side by side in one list.
// Rendered to apps/web/public/assets/images/premium/multichain-dashboard.jpg.

interface ApprovalRow {
  chainLogo: string;
  symbol: string;
  spender: string;
}

const APPROVAL_ROWS: ApprovalRow[] = [
  { chainLogo: 'images/chains/ethereum.svg', symbol: 'USDC', spender: 'Uniswap Permit2' },
  { chainLogo: 'images/chains/base.svg', symbol: 'WETH', spender: 'Seaport 1.5 (OpenSea)' },
  { chainLogo: 'images/chains/polygon.svg', symbol: 'UNI', spender: 'SushiSwap Router' },
  { chainLogo: 'images/chains/arbitrum.svg', symbol: 'LINK', spender: '1inch Router v4' },
];

const HEADER_CHAIN_LOGOS = [
  'images/chains/ethereum.svg',
  'images/chains/base.svg',
  'images/chains/arbitrum.svg',
  'images/chains/optimism.svg',
  'images/chains/polygon.svg',
];

export const MultichainDashboardStill = () => {
  return (
    <ShowcaseFrame title="Approvals" headerRight={<HeaderChainCluster />}>
      <div className="divide-y divide-zinc-800">
        {APPROVAL_ROWS.map((row) => (
          <div key={row.symbol} className="flex items-center justify-between gap-5 px-10 py-5">
            <div className="flex items-center gap-3">
              <Img src={staticFile(row.chainLogo)} className="h-8 w-8 rounded-full" />
              <TokenIcon symbol={row.symbol} size={36} />
              <span className="text-2xl font-medium text-zinc-100">{row.symbol}</span>
              <span className="text-2xl text-zinc-400">{row.spender}</span>
            </div>
            <div className="rounded-lg border border-white px-6 py-2 text-lg font-medium text-white">Revoke</div>
          </div>
        ))}
      </div>
    </ShowcaseFrame>
  );
};

const HeaderChainCluster = () => {
  return (
    <div className="flex -space-x-3">
      {HEADER_CHAIN_LOGOS.map((logo) => (
        <Img key={logo} src={staticFile(logo)} className="h-9 w-9 rounded-full border-2 border-black" />
      ))}
      <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-zinc-800 text-xs font-semibold text-zinc-300">
        99+
      </div>
    </div>
  );
};
