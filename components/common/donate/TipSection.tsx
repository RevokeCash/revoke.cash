'use client';

import { Radio, RadioGroup } from '@headlessui/react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useNativeTokenPrice } from 'lib/hooks/ethereum/useNativeTokenPrice';
import { formatDonationTokenAmount } from 'lib/utils/formatting';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import WithHoverTooltip from '../WithHoverTooltip';
import Select from '../select/Select';

interface Props {
  chainId: number;
  nativeToken: string;
  onSelect: (amount: string) => void;
}

const TipSection = ({ chainId, nativeToken, onSelect }: Props) => {
  const t = useTranslations();
  const [selectedTip, setSelectedTip] = useState<string | null>(null);
  const { nativeTokenPrice } = useNativeTokenPrice(chainId);

  const onChange = (dollarAmount: string) => {
    setSelectedTip(dollarAmount);
    onSelect(dollarAmount);
  };

  // React Select does not support pure string values, so we need to use an object
  const options = [{ value: '0' }, { value: '3' }, { value: '5' }, { value: '10' }];

  // If we cannot get the native token price, we should not show the tip section
  if (!nativeTokenPrice) return null;

  const whyTipTooltip = (
    <div>
      <div className="font-semibold mb-2">{t('address.tooltips.why_tip.title')}</div>
      <div>{t('address.tooltips.why_tip.description')}</div>
    </div>
  );

  const formatOptionLabel = (option: { value: string }) => {
    if (option.value === '0') return t('address.batch_revoke.no_tip');

    const tokenAmount = Number(option.value) / nativeTokenPrice;

    return (
      <div className="flex justify-between">
        <div>{`$${option.value}`}</div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400 shrink-0 whitespace-nowrap">
          ({formatDonationTokenAmount(tokenAmount, nativeToken)})
        </div>
      </div>
    );
  };

  return (
    <>
      <div>
        <div className="inline-flex items-center gap-1 text-sm font-medium mb-2">
          {t('address.batch_revoke.add_tip')}
          <WithHoverTooltip tooltip={whyTipTooltip}>
            <InformationCircleIcon className="w-4 h-4 inline-block" />
          </WithHoverTooltip>
        </div>
        <RadioGroup value={selectedTip ?? ''} onChange={onChange} className="flex gap-3 justify-between max-sm:hidden">
          <TipOption dollarAmount="0" nativeToken={nativeToken} nativeTokenPrice={nativeTokenPrice}>
            {t('address.batch_revoke.no_tip')}
          </TipOption>
          <TipOption dollarAmount="3" nativeToken={nativeToken} nativeTokenPrice={nativeTokenPrice} />
          <TipOption dollarAmount="5" nativeToken={nativeToken} nativeTokenPrice={nativeTokenPrice} />
          <TipOption dollarAmount="10" nativeToken={nativeToken} nativeTokenPrice={nativeTokenPrice} />
        </RadioGroup>
        <Select
          options={options}
          value={selectedTip ? { value: selectedTip } : null}
          onChange={(option) => onChange(option!.value)}
          placeholder={'Select tip amount'}
          formatOptionLabel={formatOptionLabel}
          className="w-full sm:hidden"
          isMulti={false}
          isSearchable={false}
          menuPlacement="top"
        />
      </div>
    </>
  );
};

export default TipSection;

interface TipOptionProps {
  dollarAmount: string;
  children?: React.ReactNode;
  nativeToken: string;
  nativeTokenPrice: number;
}

const TipOption = ({ dollarAmount, children, nativeToken, nativeTokenPrice }: TipOptionProps) => {
  const nativeTokenAmount = useMemo(() => {
    if (!nativeTokenPrice) return undefined;
    return String(Number(dollarAmount) / nativeTokenPrice);
  }, [nativeTokenPrice, dollarAmount]);

  const className = twMerge(
    'group flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold cursor-pointer whitespace-nowrap min-w-20',
    'ring-1 ring-zinc-300',
    'focus:outline-hidden data-focus:ring-2 data-focus:ring-black',
    'hover:bg-zinc-50 dark:hover:bg-zinc-900',
    'data-checked:text-zinc-900 data-checked:bg-brand dark:data-checked:bg-brand data-checked:ring-0',
  );

  if (children) {
    return (
      <Radio value={dollarAmount} className={twMerge(className, 'uppercase')}>
        {children}
      </Radio>
    );
  }

  return (
    <Radio value={dollarAmount} className={className}>
      <div className="flex items-center flex-col">
        <div>${dollarAmount}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 group-data-checked:text-zinc-600 dark:group-data-checked:text-zinc-600">
          ({formatDonationTokenAmount(Number(nativeTokenAmount), nativeToken)})
        </div>
      </div>
    </Radio>
  );
};
