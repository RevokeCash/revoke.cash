import { Log } from '@ethersproject/abstract-provider';
import axios from 'axios';
import { hexZeroPad, Interface } from 'ethers/lib/utils';
import { ERC721Metadata } from 'lib/abis';
import { useEthereum } from 'lib/hooks/useEthereum';
import { DashboardSettings, TokenMapping } from 'lib/interfaces';
import { getLogs } from 'lib/utils';
import { isBackendSupportedChain } from 'lib/utils/chains';
import { getFullTokenMapping } from 'lib/utils/tokens';
import React, { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import Erc20TokenList from '../ERC20/Erc20TokenList';
import Erc721TokenList from '../ERC721/Erc721TokenList';

interface Props {
  settings: DashboardSettings;
  tokenStandard: string;
  inputAddress?: string;
}

function TokenList({ settings, tokenStandard, inputAddress }: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>(null);
  const [tokenMapping, setTokenMapping] = useState<TokenMapping>();
  const [transferEvents, setTransferEvents] = useState<Log[]>();
  const [approvalEvents, setApprovalEvents] = useState<Log[]>();
  const [approvalForAllEvents, setApprovalForAllEvents] = useState<Log[]>();

  const { selectedChainId, readProvider, logsProvider } = useEthereum();

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!inputAddress) return;
        if (!readProvider || !selectedChainId) return;

        setLoading(true);
        setError(undefined);

        const [latestBlockNumber, newTokenMapping] = await Promise.all([
          readProvider.getBlockNumber(),
          getFullTokenMapping(selectedChainId),
          // Create a backend session if needed
          isBackendSupportedChain(selectedChainId) && axios.post('/api/login'),
        ]);

        setTokenMapping(newTokenMapping);

        const erc721Interface = new Interface(ERC721Metadata);

        // NOTE: The Transfer and Approval events have a similar signature for ERC20 and ERC721
        // and the ApprovalForAll event has a similar signature for ERC721 and ERC1155
        // so we only request these events once here and pass them to the other components

        // Get all transfers sent to the input address
        const transferFilter = {
          topics: [erc721Interface.getEventTopic('Transfer'), undefined, hexZeroPad(inputAddress, 32)],
        };
        const foundTransferEvents = await getLogs(logsProvider, transferFilter, 0, latestBlockNumber);
        setTransferEvents(foundTransferEvents);
        console.log('Transfer events', foundTransferEvents);

        // Get all approvals made from the input address
        const approvalFilter = {
          topics: [erc721Interface.getEventTopic('Approval'), hexZeroPad(inputAddress, 32)],
        };
        const foundApprovalEvents = await getLogs(logsProvider, approvalFilter, 0, latestBlockNumber);
        setApprovalEvents(foundApprovalEvents);
        console.log('Approval events', foundApprovalEvents);

        // Get all "approvals for all indexes" made from the input address
        const approvalForAllFilter = {
          topics: [erc721Interface.getEventTopic('ApprovalForAll'), hexZeroPad(inputAddress, 32)],
        };
        const foundApprovalForAllEvents = await getLogs(logsProvider, approvalForAllFilter, 0, latestBlockNumber);
        setApprovalForAllEvents(foundApprovalForAllEvents);
        console.log('ApprovalForAll events', foundApprovalForAllEvents);

        setLoading(false);
      } catch (e) {
        console.log(e);
        setError(e);
      }
    };

    loadData();
  }, [inputAddress, selectedChainId]);

  if (!inputAddress) {
    return null;
  }

  if (error) {
    return <div style={{ marginTop: '20px' }}>{error.message}</div>;
  }

  if (loading || [transferEvents, approvalEvents, approvalForAllEvents].includes(undefined)) {
    return <ClipLoader css="margin: 10px;" size={40} color={'#000'} loading={loading} />;
  }

  if (tokenStandard === 'ERC20') {
    return (
      <Erc20TokenList
        inputAddress={inputAddress}
        settings={settings}
        tokenMapping={tokenMapping}
        transferEvents={transferEvents}
        approvalEvents={approvalEvents}
      />
    );
  } else {
    return (
      <Erc721TokenList
        inputAddress={inputAddress}
        settings={settings}
        tokenMapping={tokenMapping}
        transferEvents={transferEvents}
        approvalEvents={approvalEvents}
        approvalForAllEvents={approvalForAllEvents}
      />
    );
  }
}

export default TokenList;
