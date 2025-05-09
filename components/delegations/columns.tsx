'use client';

import type { CellContext } from '@tanstack/react-table';
import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import ContractCell from './cells/ContractCell';
import ControlsCell from './cells/ControlsCell';
import DelegateCell from './cells/DelegateCell';
import DelegationTypeCell from './cells/DelegationTypeCell';
import DelegatorCell from './cells/DelegatorCell';
import PlatformCell from './cells/PlatformCell';

interface UseColumnsOptions {
  incoming?: boolean;
  onRevoke?: (delegation: Delegation) => void;
}

/**
 * Hook to generate table columns for delegation tables
 * @param options Configuration options
 * @param options.incoming Whether to generate columns for incoming delegations
 * @param options.onRevoke Callback function to revoke a delegation
 * @returns Array of column definitions
 */
export const useColumns = ({ incoming = false, onRevoke }: UseColumnsOptions = {}) => {
  const t = useTranslations();

  return useMemo(() => {
    // Common columns for both tables
    const columns = [
      // Type column
      {
        id: 'type',
        header: () => t('address.delegations.columns.type'),
        accessorFn: (row: Delegation) => row.type,
        cell: (info: CellContext<Delegation, unknown>) => <DelegationTypeCell delegation={info.row.original} />,
      },

      // Dynamic delegator/delegate column based on table type
      incoming
        ? {
            id: 'delegator',
            header: () => t('address.delegations.columns.delegator'),
            accessorFn: (row: Delegation) => row.delegator,
            cell: (info: CellContext<Delegation, unknown>) => <DelegatorCell delegation={info.row.original} />,
          }
        : {
            id: 'delegate',
            header: () => t('address.delegations.columns.delegate'),
            accessorFn: (row: Delegation) => row.delegate,
            cell: (info: CellContext<Delegation, unknown>) => <DelegateCell delegation={info.row.original} />,
          },

      // Contract column
      {
        id: 'contract',
        header: () => t('address.delegations.columns.contract'),
        accessorFn: (row: Delegation) => row.contract,
        cell: (info: CellContext<Delegation, unknown>) => <ContractCell delegation={info.row.original} />,
      },

      // Platform column
      {
        id: 'platform',
        header: () => t('address.delegations.columns.platform'),
        accessorFn: (row: Delegation) => row.platform,
        cell: (info: CellContext<Delegation, unknown>) => <PlatformCell delegation={info.row.original} />,
      },
    ];

    // Add controls column only for outgoing delegations
    if (!incoming && onRevoke) {
      columns.push({
        id: 'controls',
        header: () => '',
        accessorFn: (row: Delegation) => row.delegate, // Using delegate as accessor for controls column
        cell: (info: CellContext<Delegation, unknown>) => (
          <ControlsCell delegation={info.row.original} onRevoke={onRevoke} />
        ),
      });
    }

    return columns;
  }, [t, incoming, onRevoke]);
};

// Backward compatibility functions for legacy code
export const useOutgoingColumns = (onRevoke?: (delegation: Delegation) => void) => {
  return useColumns({ incoming: false, onRevoke });
};

export const useIncomingColumns = () => {
  return useColumns({ incoming: true });
};

// Aliases for backward compatibility
export const useTableColumns = useColumns;
