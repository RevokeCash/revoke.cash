import { utils } from 'ethers';
import React, { MutableRefObject, ReactText, useEffect, useState } from 'react';
import { Button, Form, InputGroup, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useEthereum } from 'utils/hooks/useEthereum';
import { emitAnalyticsEvent } from '../common/util';
import { getDefaultAmount, getNativeToken } from './util';

interface Props {
  size?: 'sm' | 'lg';
  parentToastRef?: MutableRefObject<ReactText>;
}

const DonateButton: React.FC<Props> = ({ size, parentToastRef }) => {
  const { signer, chainId } = useEthereum();

  const nativeToken = getNativeToken(chainId);
  const [amount, setAmount] = useState<string>(getDefaultAmount(nativeToken));

  const [show, setShow] = useState<boolean>(false);
  const handleShow = () => {
    if (parentToastRef)
      toast.update(parentToastRef.current, { autoClose: false, closeButton: false, draggable: false });
    setShow(true);
  };
  const handleClose = () => {
    if (parentToastRef) toast.dismiss(parentToastRef.current);
    setShow(false);
  };

  useEffect(() => {
    setAmount(getDefaultAmount(nativeToken));
  }, [nativeToken]);

  const sendDonation = async () => {
    if (!signer || !chainId) {
      alert('Please connect your web3 wallet to donate');
    }

    try {
      await signer.sendTransaction({
        to: '0xe126b3E5d052f1F575828f61fEBA4f4f2603652a',
        from: await signer.getAddress(),
        value: utils.parseEther(amount),
      });

      toast.info('💪 Thanks for the donation!', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      emitAnalyticsEvent(`donate_${nativeToken}`);
      handleClose();
    } catch (err) {
      if (err.code && err.code === 'INVALID_ARGUMENT') {
        alert('Input is not a valid number');
      }

      console.log(err);
    }
  };

  return (
    <>
      <Button variant="outline-primary" size={size} onClick={handleShow}>
        Donate
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Donate to Revoke.cash</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <InputGroup>
            <Form.Control value={amount} onChange={(event) => setAmount(event.target.value)} />
            <InputGroup.Append>
              <InputGroup.Text>{nativeToken}</InputGroup.Text>
            </InputGroup.Append>
            <InputGroup.Append>
              <Button variant="secondary" onClick={sendDonation}>
                Send
              </Button>
            </InputGroup.Append>
          </InputGroup>
        </Modal.Body>

        <Modal.Footer>
          Or contribute to my{' '}
          <a href="https://gitcoin.co/grants/259/rosco-kalis-crypto-software-engineer">Gitcoin Grant</a>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DonateButton;
