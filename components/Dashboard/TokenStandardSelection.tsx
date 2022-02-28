
import React from 'react'
import Switch from 'react-switch'
import { TokenStandard } from '../common/interfaces'

interface Props {
  tokenStandard: TokenStandard
  setTokenStandard: (tokenStandard: TokenStandard) => void
}

const TokenStandardSelection: React.FC<Props> = ({ tokenStandard, setTokenStandard }) => (
  <div style={{
    marginBottom: '10px',
    display: 'flex',
    flexDirection: 'row', gap: 10,
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <div>Tokens</div>
    <div>
      <Switch
        checked={tokenStandard === 'ERC721'}
        onChange={(checked: boolean) => setTokenStandard(checked ? 'ERC721' : 'ERC20')}
        onColor="#000"
        offColor="#000"
        checkedIcon={false}
        uncheckedIcon={false}
        activeBoxShadow="0 0 2px 3px #aaa"
      />
    </div>
    <div>NFTs</div>
  </div>
)

export default TokenStandardSelection
