'use client';

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import Image from 'next/image';
import Link from 'next/link';
import { useConnection } from 'wagmi';
import { useEmbedConfig } from '../lib/context';

const EmbedHeader = () => {
  const { address } = useConnection();
  const { routePrefix } = useEmbedConfig();

  return (
    <header className="w-full bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex justify-between items-center px-4 py-3 max-w-7xl mx-auto">
        <Link href={routePrefix} className="flex items-center">
          <Image
            src="/assets/images/revoke-wordmark-black.svg"
            alt="Revoke.cash"
            width={130}
            height={30}
            className="block dark:hidden shrink-0"
          />
          <Image
            src="/assets/images/revoke-wordmark-white.svg"
            alt="Revoke.cash"
            width={130}
            height={30}
            className="hidden dark:block shrink-0"
          />
        </Link>

        <Button
          style="secondary"
          size="md"
          href={address ? `/address/${address}` : '/'}
          external
          rel="noopener noreferrer"
          className="gap-2 text-sm"
        >
          <span>Open Full App</span>
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default EmbedHeader;
