'use client';

import { useAdminQuery } from 'lib/hooks/admin/useAdminQuery';
import { useAuthSession } from 'lib/hooks/auth/useAuthSession';

interface AdminSessionResponse {
  isAdmin: boolean;
}

export const ADMIN_SESSION_QUERY_KEY = ['admin', 'session'] as const;

export const useAdminSession = () => {
  const { siweAddress } = useAuthSession();

  const { data, isLoading } = useAdminQuery<AdminSessionResponse>(
    [...ADMIN_SESSION_QUERY_KEY, siweAddress],
    '/api/admin/session',
  );

  return { isAdmin: data?.isAdmin ?? false, isLoading };
};
