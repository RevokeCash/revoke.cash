import { InformationCircleIcon } from '@heroicons/react/24/outline';
import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Button from 'components/common/Button';
import Logo from 'components/common/Logo';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useMounted } from 'lib/hooks/useMounted';
import type { Marketplace } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';
import { useSigner } from 'wagmi';

interface Props {
  marketplace: Marketplace;
}

const MarketplaceEntry = ({ marketplace }: Props) => {
  const { t } = useTranslation();
  const isMounted = useMounted();

  const { address, selectedChainId } = useAddressPageContext();
  const { data: signer } = useSigner();

  const onClick = () => marketplace?.cancelSignatures(signer);

  return (
    <div className="px-4 py-2 border-t first:border-none border-zinc-300 dark:border-zinc-500">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2 text-base leading-tight">
          <Logo src={marketplace.logo} alt={marketplace.name} size={24} border />
          <div>{marketplace.name}</div>
          <WithHoverTooltip tooltip={marketplace.tooltip}>
            <div>
              <InformationCircleIcon className="w-4 h-h-4" />
            </div>
          </WithHoverTooltip>
        </div>
        <ControlsWrapper chainId={selectedChainId} address={address} switchChainSize="sm">
          {(disabled) => (
            <div>
              <Button disabled={isMounted && disabled} size="sm" style="secondary" onClick={onClick}>
                {t('common:buttons.cancel_signatures')}
              </Button>
            </div>
          )}
        </ControlsWrapper>
      </div>
    </div>
  );
};

export default MarketplaceEntry;
