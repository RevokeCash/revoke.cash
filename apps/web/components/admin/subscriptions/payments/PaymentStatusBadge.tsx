import { ChainId } from '@revoke.cash/chains';
import type { PremiumPaymentStatus } from '@revoke.cash/core/premium/payments';
import StatusLabel, { type Status } from 'components/common/StatusLabel';

interface Props {
  status: PremiumPaymentStatus;
  chainId: number;
}

const STATUS_STYLES: Record<PremiumPaymentStatus, Status> = {
  confirmed: 'success',
  pending: 'info',
  expired: 'neutral',
  failed: 'danger',
  reversed: 'danger',
};

const PaymentStatusBadge = ({ status, chainId }: Props) => (
  <div className="flex items-center gap-1.5">
    <StatusLabel status={STATUS_STYLES[status]} className="py-0.75 capitalize">
      {status}
    </StatusLabel>
    {chainId === ChainId.EthereumSepolia && (
      <StatusLabel status="danger" className="py-0.75 font-bold">
        TESTNET
      </StatusLabel>
    )}
  </div>
);

export default PaymentStatusBadge;
