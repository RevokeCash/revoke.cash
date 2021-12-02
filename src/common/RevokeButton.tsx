import React from 'react'
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap'

interface Props {
  revoke: () => Promise<void>
  canRevoke: boolean
  id: string
}

const RevokeButton = ({ canRevoke, revoke, id }: Props) => {
  let button = (<Button size="sm" disabled={!canRevoke} className="RevokeButton" onClick={revoke}>Revoke</Button>)

  // Add tooltip if the button is disabled
  if (!canRevoke) {
    const tooltip = (<Tooltip id={id}>You can only revoke allowances of the connected account</Tooltip>)
    button = (<OverlayTrigger overlay={tooltip}><span>{button}</span></OverlayTrigger>)
  }

  return button
}

export default RevokeButton
