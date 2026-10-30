'use client';

import { DialogTitle } from '@headlessui/react';
import { isRequestAlreadyPendingError, isUserRejectionError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import Button from 'components/common/Button';
import Logo from 'components/common/Logo';
import Modal from 'components/common/Modal';
import Spinner from 'components/common/Spinner';
import { useCsrRouter } from 'lib/i18n/csr-navigation';
import analytics from 'lib/utils/analytics';
import { filterAndSortConnectors, getConnectorName, getWalletIcon, isMobileDevice } from 'lib/utils/wallet';
import { withOathWalletOption } from 'lib/utils/walletOptions';
import { useTranslations } from 'next-intl';
import { type ReactNode, useMemo, useState } from 'react';
import type { Address } from 'viem';
import { type Connector, useConnect, useConnection, useConnectors } from 'wagmi';

interface Props {
  text?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
  redirect?: boolean;
  onClick?: () => void;
  onConnect?: (account: Address) => void;
}

const ConnectButton = ({ size, style, className, text, redirect, onClick, onConnect }: Props) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations();
  const router = useCsrRouter();

  const { address } = useConnection();
  const { mutateAsync: connectAsync, isPending, error, reset } = useConnect();
  const connectors = useConnectors();

  const handleClick = () => {
    onClick?.();

    if (address && redirect) {
      router.push(`/address/${address}`, { retainSearchParams: ['chainId'] });
    } else {
      setOpen(true);
    }
  };

  const handleOpen = () => setOpen(true);

  // Resetting the mutation also detaches it from an in-flight connection attempt, so closing the modal abandons it
  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const connectAndRedirect = async (connector: Connector) => {
    try {
      const {
        accounts: [account],
      } = await connectAsync({ connector });

      analytics.track('Wallet Connected', { wallet: getConnectorName(connector) });
      handleClose();

      if (account && redirect) {
        router.push(`/address/${account}`, { retainSearchParams: ['chainId'] });
      }
      if (account) {
        onConnect?.(account);
      }
    } catch (connectionError) {
      if (isUserRejectionError(connectionError)) return;

      analytics.track('Wallet Connection Failed', {
        wallet: getConnectorName(connector),
        message: parseErrorMessage(connectionError),
        isMobile: isMobileDevice(),
      });
    }
  };

  const walletOptions = useMemo(
    () =>
      withOathWalletOption(
        filterAndSortConnectors(connectors).map((connector) => ({
          id: connector.id,
          name: getConnectorName(connector),
          icon: getWalletIcon(connector),
          connector,
        })),
      ),
    [connectors],
  );

  const getDisplayedError = (): string | null => {
    if (!error || isUserRejectionError(error)) return null;
    if (isRequestAlreadyPendingError(error)) return t('common.connect_wallet.request_already_pending');
    return t('common.connect_wallet.failed', { message: parseErrorMessage(error) });
  };

  const displayedError = getDisplayedError();

  return (
    <>
      <Button style={style ?? 'primary'} size={size ?? 'md'} className={className} onClick={handleClick}>
        {text ?? t('common.buttons.connect')}
      </Button>

      <Modal open={open} setOpen={(open) => (open ? handleOpen() : handleClose())}>
        <div className="sm:flex sm:items-start">
          <div className="text-center sm:text-left w-full flex flex-col gap-2">
            <DialogTitle as="h2" className="text-2xl text-center">
              {t('common.connect_wallet.title')}
            </DialogTitle>

            <div className="relative">
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
                {walletOptions.map(({ id, name, icon, connector }) => (
                  <Button
                    style="secondary"
                    size="none"
                    className="flex justify-start items-center gap-2 p-2 rounded-lg w-full text-lg"
                    key={`${id} / ${name}`}
                    onClick={() => connectAndRedirect(connector)}
                  >
                    <Logo src={icon} alt={name} size={48} square border className="rounded-md" />
                    {name}
                  </Button>
                ))}
              </div>

              {isPending && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/80 dark:bg-black/80">
                  <Spinner className="w-8 h-8" />
                  <p className="text-sm text-center">{t('common.connect_wallet.check_wallet')}</p>
                  <Button style="secondary" size="sm" onClick={reset}>
                    {t('common.buttons.cancel')}
                  </Button>
                </div>
              )}
            </div>

            {displayedError && <p className="text-sm text-center text-red-600 dark:text-red-400">{displayedError}</p>}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ConnectButton;
