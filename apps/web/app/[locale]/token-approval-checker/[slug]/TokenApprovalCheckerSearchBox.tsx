'use client';

import AddressSearchBox from 'components/common/AddressSearchBox';
import Button from 'components/common/Button';
import { useCsrRouter } from 'lib/i18n/csr-navigation';
import type { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useAccount } from 'wagmi';

interface Props {
  chainId: number;
  placeholder: string;
}

const TokenApprovalCheckerSearchBox: NextPage<Props> = ({ chainId, placeholder }) => {
  const t = useTranslations();
  const router = useCsrRouter();
  const [value, setValue] = useState<string>('');

  const [isFocused, setIsFocused] = useState<boolean>(false);
  const { address } = useAccount();
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const onFocus = () => {
    clearTimeout(timerRef.current);
    setIsFocused(true);
  };

  const onBlur = () => {
    timerRef.current = setTimeout(() => setIsFocused(false), 200);
  };

  const onClick = () => {
    if (address) {
      setValue(address);
      router.push(`/address/${address}`, { retainSearchParams: ['chainId'] });
    }
  };

  return (
    <div className="relative w-full max-w-3xl">
      <AddressSearchBox
        id="tac-search"
        onSubmit={() => router.push(`/address/${value}?chainId=${chainId}`)}
        onChange={(ev) => setValue(ev.target.value.trim())}
        value={value}
        placeholder={placeholder}
        className="w-full text-base sm:text-lg"
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <div className={twMerge('absolute mt-2', (!isFocused || !address) && 'hidden')}>
        <Button style="secondary" size="md" onClick={onClick}>
          {t('common.buttons.check_connected_address')}
        </Button>
      </div>
    </div>
  );
};

export default TokenApprovalCheckerSearchBox;
