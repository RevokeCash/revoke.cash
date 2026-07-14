'use client';

import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import CopyButton from 'components/common/CopyButton';
import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { Address } from 'viem';

interface Props {
  address: Address;
}

// Truncated address that links to the admin lookup page instead of a block explorer
const AdminAddressLink = ({ address }: Props) => (
  <div className="flex items-center gap-2">
    <WithHoverTooltip tooltip={<span className="font-mono">{address}</span>}>
      <Href href={`/admin/lookup/${address}`} router underline="always" className="font-mono text-sm">
        {shortenAddress(address, 6)}
      </Href>
    </WithHoverTooltip>
    <CopyButton content={address} className="text-zinc-500 dark:text-zinc-400" />
  </div>
);

export default AdminAddressLink;
