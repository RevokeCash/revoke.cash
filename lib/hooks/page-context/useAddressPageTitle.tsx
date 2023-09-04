import { shortenAddress } from 'lib/utils';
import { getChainName } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { useNameLookup } from '../ethereum/useNameLookup';
import { Address } from 'viem';

export const useAddressPageTitle = (ssrDomainName: string, address: Address) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { domainName } = useNameLookup(address);
  const chainName = getChainName(Number(router.query.chainId || 1));
  const addressDisplay = ssrDomainName ?? domainName ?? shortenAddress(address);

  const title = !!router.query.chainId
    ? t('address:meta.title_chain', { addressDisplay, chainName })
    : t('address:meta.title', { addressDisplay });

  return title;
};
