
import React, { ChangeEvent } from 'react'
import { TokenMapping, TokenStandard } from '../common/interfaces'

interface Props {
  tokenStandard: TokenStandard
  tokenMapping?: TokenMapping
  checked: boolean
  update: (checked: boolean) => void
}

const UnregisteredTokensCheckbox: React.FC<Props> = ({ tokenStandard, tokenMapping, checked, update }) => {
  // Don't check registration for NFTs
  if (tokenStandard === 'ERC721') return null;

  // If no token data mapping, we hide the checkbox
  if (!tokenMapping) return null

  const onChange = (event: ChangeEvent<HTMLInputElement>) => update(event.target.checked)

  return (
    <div>
      Include unregistered tokens
      <sup><a href="https://tokenlists.org/" target="_blank" rel="noopener noreferrer">?</a></sup>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </div>
  )
}

export default UnregisteredTokensCheckbox
