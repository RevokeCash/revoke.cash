import React, { useState } from 'react'
import { Button, Form, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap'

interface Props {
  update: (newAllowance: string) => Promise<void>
  canUpdate: boolean
  id: string
}

const UpdateInputGroup = ({ canUpdate, update, id }: Props) => {
  const [value, setValue] = useState<string>('0')

  let inputGroup = (<InputGroup size="sm">
    <Form.Control type="text" size="sm"
      className="NewAllowance"
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
      }}/>
    <InputGroup.Append>
    <Button disabled={!canUpdate} className="UpdateButton" onClick={() => update(value)}>Update</Button>
    </InputGroup.Append>
  </InputGroup>)

  // Add tooltip if the button is disabled
  if (!canUpdate) {
    const tooltip = (<Tooltip id={id}>You can only update allowances of the connected account</Tooltip>)
    inputGroup = (<OverlayTrigger overlay={tooltip}><span>{inputGroup}</span></OverlayTrigger>)
  }

  return inputGroup
}

export default UpdateInputGroup
