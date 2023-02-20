import { Dialog } from '@headlessui/react';
import Button from 'components/common/Button';
import Logo from 'components/common/Logo';
import Modal from 'components/common/Modal';
import { getWalletIcon } from 'lib/utils/wallet';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Connector, useAccount, useConnect } from 'wagmi';

interface Props {
  text?: string;
  size: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
}

const ConnectButton = ({ size, style, className, text }: Props) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  const { address } = useAccount();
  const { connectAsync, connectors } = useConnect();

  const handleClick = () => {
    if (address) {
      router.push(`/address/${address}`);
    } else {
      setOpen(true);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const connectAndRedirect = async (connector: Connector) => {
    handleClose();
    try {
      const { account } = await connectAsync({ connector });
      if (account) {
        router.push(`/address/${account}`);
      }
    } catch {
      // ignored
    }
  };

  return (
    <>
      <Button style={style ?? 'primary'} size={size ?? 'md'} className={className} onClick={handleClick}>
        {text ?? t('common:buttons.connect')}
      </Button>

      <Modal open={open} setOpen={(open) => (open ? handleOpen() : handleClose())}>
        <div className="sm:flex sm:items-start">
          <div className="text-center sm:text-left w-full flex flex-col gap-2">
            <Dialog.Title as="h3" className="text-center">
              {t('common:connect_wallet.title')}
            </Dialog.Title>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
              {connectors
                .filter((connector) => connector.ready)
                .map((connector) => (
                  <Button
                    style="secondary"
                    size="none"
                    className="flex flex-col justify-center items-center gap-2 p-2 border border-black rounded-lg w-full sm:w-48"
                    key={connector.id}
                    onClick={() => connectAndRedirect(connector)}
                  >
                    <Logo src={getWalletIcon(connector.name)} alt={connector.name} size={64} />
                    {connector.name}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ConnectButton;
