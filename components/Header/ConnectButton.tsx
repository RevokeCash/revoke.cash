import React from "react";
import { Button } from "react-bootstrap";
import { useAccount, useConnect } from 'wagmi'
import { shortenAddress } from "../common/util";

const ConnectButton: React.FC = () => {
  const [{ data: connectData }, connect] = useConnect()
  const [{ data: accountData }] = useAccount({ fetchEns: true })

  const buttonText = accountData?.ens?.name ?? shortenAddress(accountData?.address) ?? 'Connect wallet'

  return (
    <Button style={{ float: 'right' }} variant="outline-primary" onClick={() => connect(connectData.connectors[0])}>{buttonText}</Button>
  )
}

export default ConnectButton
