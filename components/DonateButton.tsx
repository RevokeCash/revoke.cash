import { track } from '@amplitude/analytics-browser';
import { utils } from 'ethers';
import { DONATION_ADDRESS, GITCOIN_URL } from 'lib/constants';
import { useEthereum } from 'lib/hooks/useEthereum';
import { getChainNativeToken, getDefaultDonationAmount } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';
import React, { MutableRefObject, ReactText, useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Button, Form, InputGroup, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';

interface Props {
  size?: 'sm' | 'lg';
  parentToastRef?: MutableRefObject<ReactText>;
}

const DonateButton: React.FC<Props> = ({ size, parentToastRef }) => {
  const { t } = useTranslation();
  const { signer, connectedChainId } = useEthereum();

  const nativeToken = getChainNativeToken(connectedChainId);
  const [amount, setAmount] = useState<string>(getDefaultDonationAmount(nativeToken));

  const [show, setShow] = useState<boolean>(false);
  const handleShow = () => {
    if (parentToastRef) {
      toast.update(parentToastRef.current, { autoClose: false, closeButton: false, draggable: false });
    }
    setShow(true);
  };
  const handleClose = () => {
    if (parentToastRef) toast.dismiss(parentToastRef.current);
    setShow(false);
  };

  useEffect(() => {
    setAmount(getDefaultDonationAmount(nativeToken));
  }, [nativeToken]);

  const sendDonation = async () => {
    if (!signer || !connectedChainId) {
      alert('Please connect your web3 wallet to donate');
    }

    try {
      await signer.sendTransaction({
        to: DONATION_ADDRESS,
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

      track('Donated', { chainId: connectedChainId, amount: Number(amount) });

      handleClose();
    } catch (err) {
      if (err.code && err.code === 'INVALID_ARGUMENT') {
        alert('Input is not a valid number');
      }

      console.log(err);
    }
  };

  const { execute, loading } = useAsyncCallback(sendDonation);

  return (
    <>
      <Button variant="outline-primary" size={size} onClick={handleShow}>
        {t('common:buttons.donate')}
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
              <Button disabled={loading} variant="secondary" onClick={execute}>
                {loading ? t('common:buttons.sending') : t('common:buttons.send')}
              </Button>
            </InputGroup.Append>
          </InputGroup>
        </Modal.Body>

        <Modal.Footer>
          Or contribute to our{' '}
          <a href={GITCOIN_URL} target="_blank">
            Gitcoin Grant
          </a>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DonateButton;
