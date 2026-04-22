'use client';

import type { Nullable } from '@revoke.cash/core/types';
import { type ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import nProgress from 'nprogress';
import { type ComponentProps, type ForwardedRef, forwardRef } from 'react';
import type { UrlObject } from 'url';
import { Link, useRouter } from './navigation';

const getHrefRetainingCurrentSearchParams = (
  href: string | UrlObject,
  currentSearchParams?: Nullable<ReadonlyURLSearchParams | URLSearchParams>,
  retainSearchParams?: boolean | string[],
) => {
  const hrefString = typeof href === 'string' ? href : href.toString();
  if (!retainSearchParams) return hrefString;

  const searchParamsToRetain = Array.from(currentSearchParams ?? []).filter(([key]) =>
    Array.isArray(retainSearchParams) ? retainSearchParams.includes(key) : true,
  );

  const [path, search] = hrefString.split('?');
  const mergedSearchParams = new URLSearchParams({
    ...Object.fromEntries(new URLSearchParams(search)),
    ...Object.fromEntries(searchParamsToRetain),
  });
  return `${path}?${mergedSearchParams.toString()}`;
};

type CsrLinkProps = ComponentProps<typeof Link> & { retainSearchParams?: boolean | string[] };

export const CsrLink = forwardRef(
  ({ retainSearchParams, ...props }: CsrLinkProps, ref: ForwardedRef<HTMLAnchorElement>) => {
    const searchParams = useSearchParams();
    const resolvedHref = getHrefRetainingCurrentSearchParams(props.href, searchParams, retainSearchParams);
    return <Link {...props} href={resolvedHref} ref={ref} />;
  },
);

export function useCsrRouter() {
  const router = useRouter();

  const push = (
    href: string,
    options?: Parameters<typeof router.push>[1] & { showProgress?: boolean; retainSearchParams?: boolean | string[] },
  ): ReturnType<typeof router.push> => {
    if (options?.showProgress !== false) nProgress.start();
    const searchParams = new URLSearchParams(window.location.search);
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
    const searchParams = new URLSearchParams(window.location.search);
    const resolvedHref = getHrefRetainingCurrentSearchParams(href, searchParams, options?.retainSearchParams);
    return router.replace(resolvedHref, options);
  };

  return { ...router, push, replace };
}

// Silently remove a query param from the URL without triggering a Next.js navigation
export const removeSearchParam = (key: string) => {
  const searchParams = new URLSearchParams(window.location.search);
  if (!searchParams.has(key)) return;
  searchParams.delete(key);
  const query = searchParams.toString();
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
};
