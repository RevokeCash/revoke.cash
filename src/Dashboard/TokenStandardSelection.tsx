
import React from 'react'
import BootstrapSwitchButton from 'bootstrap-switch-button-react'
import { TokenStandard } from '../common/interfaces'

interface Props {
  tokenStandard: TokenStandard
  setTokenStandard: (tokenStandard: TokenStandard) => void
}

const TokenStandardSelection: React.FC<Props> = ({ tokenStandard, setTokenStandard }) => (
  <div style={{ marginBottom: '10px' }}>
    <BootstrapSwitchButton
      checked={tokenStandard === 'ERC20'}
      onlabel='ERC20'
      offlabel='ERC721'
      onstyle="primary"
      offstyle="primary"
      width={100}
      onChange={(checked: boolean) => setTokenStandard(checked ? 'ERC20' : 'ERC721')}
    />
  </div>
)

export default TokenStandardSelection
