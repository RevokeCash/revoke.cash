'use client';

import { Radio, RadioGroup } from '@headlessui/react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import Select from '../select/Select';
import WithHoverTooltip from '../WithHoverTooltip';

interface Props {
  midAmount: string;
  nativeToken: string;
  onSelect: (amount: string) => void;
}

const TipSection = ({ midAmount, nativeToken, onSelect }: Props) => {
  const t = useTranslations();
  const [selectedTip, setSelectedTip] = useState<string | null>(null);

  const onChange = (amount: string) => {
    setSelectedTip(amount);
    onSelect(amount);
  };

  const lowAmount = String(Number(midAmount) * 0.5);
  const highAmount = String(Number(midAmount) * 2);

  // React Select does not support pure string values, so we need to use an object
  const options = [{ value: '0' }, { value: lowAmount }, { value: midAmount }, { value: highAmount }];

  const whyTipTooltip = (
    <div>
      <div className="font-semibold mb-2">{t('address.tooltips.why_tip.title')}</div>
      <div>{t('address.tooltips.why_tip.description')}</div>
    </div>
  );

  return (
    <>
      <div>
        <div className="inline-flex items-center gap-1 text-sm font-medium mb-2">
          {t('address.batch_revoke.add_tip')}
          <WithHoverTooltip tooltip={whyTipTooltip}>
            <InformationCircleIcon className="w-4 h-4 inline-block" />
          </WithHoverTooltip>
        </div>
        <RadioGroup value={selectedTip} onChange={onChange} className="flex gap-3 justify-between max-sm:hidden">
          <TipOption amount={'0'} nativeToken={nativeToken}>
            {t('address.batch_revoke.no_tip')}
          </TipOption>
          <TipOption amount={lowAmount} nativeToken={nativeToken} />
          <TipOption amount={midAmount} nativeToken={nativeToken} />
          <TipOption amount={highAmount} nativeToken={nativeToken} />
        </RadioGroup>
        <Select
          options={options}
          value={selectedTip ? { value: selectedTip } : null}
          onChange={(option) => onChange(option!.value)}
          placeholder={'Select tip amount'}
          formatOptionLabel={(option) =>
            option.value === '0' ? t('address.batch_revoke.no_tip') : `${option.value} ${nativeToken}`
          }
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
  amount: string;
  children?: React.ReactNode;
  nativeToken: string;
}

const TipOption = ({ amount, children, nativeToken }: TipOptionProps) => {
  return (
    <Radio
      value={amount}
      className={twMerge(
        'flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold uppercase cursor-pointer focus:outline-none data-[focus]:ring-2 data-[focus]:ring-black ring-1 ring-gray-300 hover:bg-gray-50 data-[checked]:bg-brand data-[checked]:ring-0 whitespace-nowrap',
      )}
    >
      {children ?? `${amount} ${nativeToken}`}
    </Radio>
  );
};
