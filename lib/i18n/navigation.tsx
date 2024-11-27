import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import nProgress from 'nprogress';

// For *some reason*, Next.js won't compile if we import thesse values from './config', so they're repeated here
const locales = ['en', 'es', 'ja', 'ru', 'zh'] as const;
const localePrefix = 'as-needed' as const; // Default

export const {
  Link,
  redirect,
  usePathname,
  useRouter: useNextRouter,
} = createSharedPathnamesNavigation({ locales, localePrefix });

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
