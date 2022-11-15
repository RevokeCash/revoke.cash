import { track } from '@amplitude/analytics-browser';
import { utils } from 'ethers';
import { DONATION_ADDRESS } from 'lib/constants';
import { useEthereum } from 'lib/hooks/useEthereum';
import { getChainNativeToken, getDefaultDonationAmount } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';
import type { MutableRefObject, ReactText } from 'react';
import { useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
// import { Button, Form, InputGroup, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';

interface Props {
  size?: 'sm' | 'lg';
  parentToastRef?: MutableRefObject<ReactText>;
}

const DonateButton = ({ size, parentToastRef }: Props) => {
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
      <button type="button" className="btn-primary h-full" onClick={handleShow}>
        {t('common:buttons.donate')}
      </button>

      {/* TODO modal for donations */}

      {/* <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t('dashboard:donate_to_revoke')}</Modal.Title>
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
          <Trans i18nKey="dashboard:or_contribute_to_gitcoin" components={[<a href={GITCOIN_URL} target="_blank" />]} />
        </Modal.Footer>
      </Modal> */}
    </>
  );
};

export default DonateButton;
