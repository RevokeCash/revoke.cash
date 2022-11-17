import { Switch } from '@headlessui/react';
import type { TokenStandard } from 'lib/interfaces';
import { classNames } from 'lib/utils/classNames';

interface Props {
  tokenStandard: TokenStandard;
  setTokenStandard: (tokenStandard: TokenStandard) => void;
}

const TokenStandardSelection = ({ tokenStandard, setTokenStandard }: Props) => (
  <Switch.Group as="div" className="flex items-center">
    <Switch.Label as="span" className="mr-3">
      <span className="text-sm font-medium text-gray-600">Tokens</span>
    </Switch.Label>
    <Switch
      checked={tokenStandard === 'ERC721'}
      onChange={(checked: boolean) => setTokenStandard(checked ? 'ERC721' : 'ERC20')}
      className={classNames(
        'bg-black relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none '
      )}
    >
      <span
        aria-hidden="true"
        className={classNames(
          tokenStandard === 'ERC721' ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
        )}
      />
    </Switch>
    <Switch.Label as="span" className="ml-3">
      <span className="text-sm font-medium text-gray-600">NFTs</span>
    </Switch.Label>
  </Switch.Group>

  // <div
  //   style={{
  //     marginBottom: '10px',
  //     display: 'flex',
  //     flexDirection: 'row',
  //     gap: 10,
  //     justifyContent: 'center',
  //     alignItems: 'center',
  //   }}
  // >
  //   <div>Tokens</div>
  //   <div>
  //     <Switch
  //       checked={tokenStandard === 'ERC721'}
  //       onChange={(checked: boolean) => setTokenStandard(checked ? 'ERC721' : 'ERC20')}
  //       onColor="#000"
  //       offColor="#000"
  //       checkedIcon={false}
  //       uncheckedIcon={false}
  //       activeBoxShadow="0 0 2px 3px #aaa"
  //     />
  //   </div>
  //   <div>NFTs</div>
  // </div>
);

export default TokenStandardSelection;
