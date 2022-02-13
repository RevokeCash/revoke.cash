import React, { ChangeEvent, useEffect, useState } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import { emitAnalyticsEvent, parseInputAddress } from '../common/util'
import { useAccount, useProvider } from 'wagmi'

interface Props {
  setInputAddress: (inputAddress: string) => void
}

const AddressInput: React.FC<Props> = ({ setInputAddress }) => {
  const [inputAddressOrName, setInputAddressOrName] = useState<string>()

  const provider = useProvider()
  const [{ data: accountData }] = useAccount({ fetchEns: true })
  const connectedAddress = accountData?.address
  const connectedEnsName = accountData?.ens?.name

  // Replace the input with the connected account if nothing was connected before
  // These checks make it so that you can still enter a new input afterwards
  useEffect(() => {
    if (connectedAddress && (inputAddressOrName === undefined || inputAddressOrName === connectedAddress)) {
      setInputAddressOrName(connectedEnsName ?? connectedAddress ?? inputAddressOrName)
    }
  }, [connectedEnsName, connectedAddress, inputAddressOrName])

  useEffect(() => {
    updateInputAddress()
  }, [inputAddressOrName])

  const handleFormInputChanged = async (event: ChangeEvent<HTMLInputElement>) => {
      // If no provider is set, this means that the browser is not web3 enabled
    // and the fallback Infura provider is currently rate-limited
    if (!provider) {
      alert('Please use a web3 enabled browser to use revoke.cash')
      return
    }

    // Update input value
    const newInput = event.target.value
    setInputAddressOrName(newInput)
  }

  const updateInputAddress = async () => {
    // Update input address if it is valid
    const inputAddress = await parseInputAddress(inputAddressOrName ?? '', provider)
    if (inputAddress) {
      emitAnalyticsEvent('update_address')
      setInputAddress(inputAddress)
    }
  }

  return (
    <Row>
      <Col></Col>
      <Col className="my-auto" lg="6" md="12" sm="12">
        <Form.Group>
          <Form.Control
            className="AddressInput text-center"
            placeholder="Enter Ethereum address or ENS name"
            value={inputAddressOrName}
            onChange={handleFormInputChanged}
            onDoubleClick={() => { return }} // Re-enable double-click to select
          ></Form.Control>
        </Form.Group>
      </Col>
      <Col></Col>
    </Row>
  )
}

export default AddressInput
