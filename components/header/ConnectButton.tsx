import { Dialog } from '@headlessui/react';
import Button from 'components/common/Button';
import Logo from 'components/common/Logo';
import Modal from 'components/common/Modal';
import { filterAndSortConnectors, getConnectorName, getWalletIcon } from 'lib/utils/wallet';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { Connector, useAccount, useConnect } from 'wagmi';

interface Props {
  text?: string;
  size: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
  redirect?: boolean;
}

const ConnectButton = ({ size, style, className, text, redirect }: Props) => {
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
      const {
        accounts: [account],
      } = await connectAsync({ connector });
      if (account && redirect) {
        router.push(`/address/${account}`);
      }
    } catch {
      // ignored
    }
  };

  const sortedConnectors = useMemo(() => filterAndSortConnectors(connectors), [connectors]);

  return (
    <>
      <Button style={style ?? 'primary'} size={size ?? 'md'} className={className} onClick={handleClick}>
        {text ?? t('common:buttons.connect')}
      </Button>

      <Modal open={open} setOpen={(open) => (open ? handleOpen() : handleClose())}>
        <div className="sm:flex sm:items-start">
          <div className="text-center sm:text-left w-full flex flex-col gap-2">
            <Dialog.Title as="h2" className="text-2xl text-center">
              {t('common:connect_wallet.title')}
            </Dialog.Title>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
              {sortedConnectors.map((connector) => (
                <Button
                  style="secondary"
                  size="none"
                  className="flex justify-start items-center gap-2 p-2 border border-black rounded-lg w-full text-lg"
                  key={`${connector.id} / ${connector.name}`}
                  onClick={() => connectAndRedirect(connector)}
                >
                  <Logo
                    src={getWalletIcon(connector)}
                    alt={getConnectorName(connector)}
                    size={48}
                    square
                    border
                    className="rounded-md"
                  />
                  {getConnectorName(connector)}
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
