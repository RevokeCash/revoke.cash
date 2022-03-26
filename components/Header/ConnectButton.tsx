import React from "react";
import { Button } from "react-bootstrap";
import { useAccount, useConnect } from 'wagmi'
import { shortenAddress } from "../common/util";

const ConnectButton: React.FC = () => {
  const [{ data: connectData }, connect] = useConnect()
  const [{ data: accountData }] = useAccount({ fetchEns: true })

  console.log(connectData)

  const buttonText = accountData?.ens?.name ?? shortenAddress(accountData?.address) ?? 'Connect wallet'

  return (
    <Button variant="outline-primary" onClick={() => connect(connectData.connectors[0])}>{buttonText}</Button>
  )
}

export default ConnectButton
