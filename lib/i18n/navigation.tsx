'use client';

import { Nullable } from 'lib/interfaces';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import nProgress from 'nprogress';
import { ComponentProps } from 'react';
import { UrlObject } from 'url';

// For *some reason*, Next.js won't compile if we import thesse values from './config', so they're repeated here
const locales = ['en', 'es', 'ja', 'ru', 'zh'] as const;
const localePrefix = 'as-needed' as const; // Default

export const {
  Link: NextLink,
  redirect,
  usePathname,
  useRouter: useNextRouter,
} = createSharedPathnamesNavigation({ locales, localePrefix });

const getHrefRetainingCurrentSearchParams = (
  href: string | UrlObject,
  currentSearchParams?: Nullable<ReadonlyURLSearchParams>,
  retainSearchParams?: boolean | string[],
) => {
  const hrefString = typeof href === 'string' ? href : href.toString();
  if (!retainSearchParams) return hrefString;

  const searchParamsToRetain = Array.from(currentSearchParams ?? []).filter(([key]) =>
    Array.isArray(retainSearchParams) ? retainSearchParams.includes(key) : true,
  );

  const [path, search] = hrefString.split('?');
  const mergedSearchParams = new URLSearchParams({
    ...Object.fromEntries(searchParamsToRetain),
    ...Object.fromEntries(new URLSearchParams(search)),
  });
  return `${path}?${mergedSearchParams.toString()}`;
};

export function Link(props: ComponentProps<typeof NextLink> & { retainSearchParams?: boolean | string[] }) {
  const searchParams = useSearchParams();
  const resolvedHref = getHrefRetainingCurrentSearchParams(props.href, searchParams, props.retainSearchParams);
  return <NextLink {...props} href={resolvedHref} />;
}

export function useRouter() {
  const router = useNextRouter();
  const searchParams = useSearchParams();

  const push = (
    href: string,
    options?: Parameters<typeof router.push>[1] & { showProgress?: boolean; retainSearchParams?: boolean | string[] },
  ): ReturnType<typeof router.push> => {
    if (options?.showProgress !== false) nProgress.start();
    const resolvedHref = getHrefRetainingCurrentSearchParams(href, searchParams, options?.retainSearchParams);
    return router.push(resolvedHref, options);
  };

  const replace = (
    href: string,
    options?: Parameters<typeof router.replace>[1] & {
      showProgress?: boolean;
      retainSearchParams?: boolean | string[];
    },
  ): ReturnType<typeof router.replace> => {
    if (options?.showProgress !== false) nProgress.start();
    const resolvedHref = getHrefRetainingCurrentSearchParams(href, searchParams, options?.retainSearchParams);
    return router.replace(resolvedHref, options);
  };

  return { ...router, push, replace };
}
