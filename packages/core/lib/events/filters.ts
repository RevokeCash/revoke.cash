import {
  ERC721_APPROVAL_FOR_ALL_TOPIC,
  ERC721_APPROVAL_TOPIC,
  ERC721_TRANSFER_TOPIC,
  type NamedFilter,
  PERMIT2_APPROVAL_TOPIC,
  PERMIT2_LOCKDOWN_TOPIC,
  PERMIT2_PERMIT_TOPIC,
} from '@revoke.cash/core/events';
import { addressToTopic } from '@revoke.cash/core/events/utils';
import type { Address } from 'viem';

export const buildTokenEventFilters = (address: Address, fromBlock: number, toBlock: number): NamedFilter[] => {
  const addressTopic = addressToTopic(address);
  return [
    { topics: [ERC721_TRANSFER_TOPIC, addressTopic], fromBlock, toBlock, name: 'Transfer (from)' },
    { topics: [ERC721_TRANSFER_TOPIC, null, addressTopic], fromBlock, toBlock, name: 'Transfer (to)' },
    { topics: [ERC721_APPROVAL_TOPIC, addressTopic], fromBlock, toBlock, name: 'Approval' },
    { topics: [ERC721_APPROVAL_FOR_ALL_TOPIC, addressTopic], fromBlock, toBlock, name: 'ApprovalForAll' },
    { topics: [PERMIT2_APPROVAL_TOPIC, addressTopic], fromBlock, toBlock, name: 'Permit2 Approval' },
    { topics: [PERMIT2_PERMIT_TOPIC, addressTopic], fromBlock, toBlock, name: 'Permit2 Permit' },
    { topics: [PERMIT2_LOCKDOWN_TOPIC, addressTopic], fromBlock, toBlock, name: 'Permit2 Lockdown' },
  ];
};
