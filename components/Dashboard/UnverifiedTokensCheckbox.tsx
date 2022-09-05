import React, { ChangeEvent } from 'react';
import { TokenStandard } from '../common/interfaces';

interface Props {
  tokenStandard: TokenStandard;
  checked: boolean;
  update: (checked: boolean) => void;
}

const UnverifiedTokensCheckbox: React.FC<Props> = ({ tokenStandard, checked, update }) => {
  // Don't check verification for NFTs
  if (tokenStandard === 'ERC721') return null;

  // TODO: If no token data mapping, we hide the checkbox
  // if (!tokenMapping) return null;

  const onChange = (event: ChangeEvent<HTMLInputElement>) => update(event.target.checked);

  return (
    <div>
      Include unverified tokens
      <sup>
        <a href="https://tokenlists.org/" target="_blank">
          ?
        </a>
      </sup>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </div>
  );
};

export default UnverifiedTokensCheckbox;
