'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { useTranslations } from 'next-intl';

export const useColumns = (): ColumnDef<Delegation>[] => {
  const t = useTranslations();

  return [
    {
      id: 'type',
      header: () => t('address.delegations.columns.type'),
      accessorKey: 'type',
      cell: () => null,
      enableSorting: true,
    },
    {
      id: 'delegate',
      header: () => t('address.delegations.columns.delegate'),
      accessorKey: 'delegate',
      cell: () => null,
      enableSorting: true,
    },
    {
      id: 'contract',
      header: () => t('address.delegations.columns.contract'),
      accessorKey: 'contract',
      cell: () => null,
      enableSorting: true,
    },
    {
      id: 'platform',
      header: () => t('address.delegations.columns.platform'),
      accessorKey: 'platform',
      cell: () => null,
      enableSorting: true,
    },
    {
      id: 'controls',
      header: '',
      cell: () => null,
      enableSorting: false,
    },
  ];
};

export const useIncomingColumns = (): ColumnDef<Delegation>[] => {
  const t = useTranslations();

  return [
    {
      id: 'type',
      header: () => t('address.delegations.columns.type'),
      accessorKey: 'type',
      cell: () => null,
      enableSorting: true,
    },
    {
      id: 'delegator',
      header: t('address.delegations.columns.delegator'),
      accessorKey: 'delegator',
      cell: () => null,
      enableSorting: true,
    },
    {
      id: 'contract',
      header: () => t('address.delegations.columns.contract'),
      accessorKey: 'contract',
      cell: () => null,
      enableSorting: true,
    },
    {
      id: 'platform',
      header: () => t('address.delegations.columns.platform'),
      accessorKey: 'platform',
      cell: () => null,
      enableSorting: true,
    },
  ];
};
