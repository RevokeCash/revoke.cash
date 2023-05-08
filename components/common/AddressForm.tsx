import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Input from 'components/common/Input';
import { parseInputAddress } from 'lib/utils';
import { useState } from 'react';
import Button from './Button';
import ChainSelect from './ChainSelect';

type Props = {
  chainIds?: number[];
  onSubmit: (data: { address: string; chainId: number }) => void;
};

export const AddressForm = (props: Props) => {
  const [selectedChainId, setSelectedChainId] = useState<number>(1);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const address = event.target[0].value;
    const parsedAddress = await parseInputAddress(address);

    props.onSubmit({
      address: parsedAddress,
      chainId: selectedChainId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 ">
      <Input
        className="w-full rounded-lg"
        size="lg"
        type="text"
        id="address"
        placeholder="Enter your address and check if you are vulnerable"
      />

      <ChainSelect chainIds={props.chainIds} selected={selectedChainId} onSelect={setSelectedChainId} />

      <Button icon={ChevronRightIcon} style="primary" size="lg" type="submit">
        Check
      </Button>
    </form>
  );
};

export default AddressForm;
