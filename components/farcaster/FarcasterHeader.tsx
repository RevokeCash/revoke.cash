'use client';

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useAccount } from 'wagmi';

const FarcasterHeader = () => {
  const { address } = useAccount();

  return (
    <header className="w-full bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex justify-between items-center px-4 py-3 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/farcaster" className="flex items-center">
          <Image
            src="/assets/images/revoke-wordmark-orange-black.svg"
            alt="Revoke.cash"
            width={120}
            height={32}
            className="dark:hidden"
          />
          <Image
            src="/assets/images/revoke-wordmark-orange-white.svg"
            alt="Revoke.cash"
            width={120}
            height={32}
            className="hidden dark:block"
          />
        </Link>

        {/* Open Full App Button */}
        <Link
          href={address ? `/address/${address}` : '/'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        >
          <span>Open Full App</span>
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
};

export default FarcasterHeader;
