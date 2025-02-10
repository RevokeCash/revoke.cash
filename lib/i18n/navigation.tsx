import { createNavigation } from 'next-intl/navigation';
import nProgress from 'nprogress';
import { routing } from './config';

export const { Link, redirect, usePathname, useRouter: useNextRouter } = createNavigation(routing);

export function useRouter() {
  const router = useNextRouter();

  const push = (
    href: string,
    options?: Parameters<typeof router.push>[1] & { showProgress?: boolean },
  ): ReturnType<typeof router.push> => {
    if (options?.showProgress !== false) nProgress.start();
    return router.push(href, options);
  };

  const replace = (
    href: string,
    options?: Parameters<typeof router.replace>[1] & { showProgress?: boolean },
  ): ReturnType<typeof router.replace> => {
    if (options?.showProgress !== false) nProgress.start();
    return router.replace(href, options);
  };

  return { ...router, push, replace };
}
