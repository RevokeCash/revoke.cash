
import React, { ChangeEvent } from 'react'

interface Props {
  checked: boolean
  update: (checked: boolean) => void
}

const UnregisteredTokensCheckbox: React.FC<Props> = ({ checked, update }) => {
  const onChange = (event: ChangeEvent<HTMLInputElement>) => update(event.target.checked)

  return (
    <div>
      <span style={{ marginRight: 5 }}>Include zero balances</span>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </div>
  )
}

export default UnregisteredTokensCheckbox
