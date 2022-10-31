import { Log } from '@ethersproject/abstract-provider';
import axios from 'axios';
import { hexZeroPad, Interface } from 'ethers/lib/utils';
import { ERC721Metadata } from 'lib/abis';
import { useEthereum } from 'lib/hooks/useEthereum';
import { DashboardSettings, TokenMapping } from 'lib/interfaces';
import { getLogs } from 'lib/utils';
import { useAsync } from 'react-async-hook';
import { ClipLoader } from 'react-spinners';
import Erc20TokenList from '../ERC20/Erc20TokenList';
import Erc721TokenList from '../ERC721/Erc721TokenList';

interface Props {
  settings: DashboardSettings;
  tokenMapping?: TokenMapping;
  tokenStandard: string;
  inputAddress?: string;
}

function TokenList({ settings, tokenMapping, tokenStandard, inputAddress }: Props) {
  const { selectedChainId, readProvider, logsProvider } = useEthereum();

  const logIn = async () => {
    await axios.post('/api/login');
    return true;
  };

  const erc721Interface = new Interface(ERC721Metadata);

  const buildGetEventsFunction = (name: string, addressTopicIndex: number) => {
    // NOTE: these getXxxEvents() functions have an implicit dependency on logsProvider but we do not want to trigger
    // an update before latestBlockNumber has updated, so we do not add it to the dependency list.
    // The same goes for latestBlockNumber having a dependency on readProvider, but only triggering on selectedChain
    return async (inputAddress: string, latestBlockNumber: number, isLoggedIn: boolean): Promise<Log[]> => {
      if (!inputAddress || !logsProvider || !latestBlockNumber || !isLoggedIn) return undefined;

      // Start with an array of undefined topic strings and add the event topic + address topic to the right spots
      const filter = { topics: [undefined, undefined, undefined] };
      filter.topics[0] = erc721Interface.getEventTopic(name);
      filter.topics[addressTopicIndex] = hexZeroPad(inputAddress, 32);

      const events = await getLogs(logsProvider, filter, 0, latestBlockNumber);
      console.log(`${name} events`, events);
      return events;
    };
  };

  // NOTE: The Transfer and Approval events have a similar signature for ERC20 and ERC721 and the ApprovalForAll event
  // has a similar signature for ERC721 and ERC1155 so we only request these events once here and pass them to the
  // other components
  const getTransferEvents = buildGetEventsFunction('Transfer', 2);
  const getApprovalEvents = buildGetEventsFunction('Approval', 1);
  const getApprovalForAllEvents = buildGetEventsFunction('ApprovalForAll', 1);

  const { result: isLoggedIn, loading: loggingIn, error: loginError } = useAsync(logIn, []);
  const {
    result: latestBlockNumber,
    loading: loadingLatestBlockNumber,
    error: latestBlockNumberError,
  } = useAsync(() => readProvider.getBlockNumber(), [selectedChainId]);

  const {
    result: transferEvents = [],
    loading: loadingTransfers,
    error: transferError,
  } = useAsync(getTransferEvents, [inputAddress, latestBlockNumber, isLoggedIn]);
  const {
    result: approvalEvents = [],
    loading: loadingApprovals,
    error: approvalError,
  } = useAsync(getApprovalEvents, [inputAddress, latestBlockNumber, isLoggedIn]);
  const {
    result: approvalForAllEvents = [],
    loading: loadingApprovalsForAll,
    error: approvalForAllError,
  } = useAsync(getApprovalForAllEvents, [inputAddress, latestBlockNumber, isLoggedIn]);

  const error = loginError ?? latestBlockNumberError ?? transferError ?? approvalError ?? approvalForAllError;
  const loadingEvents = loadingTransfers || loadingApprovals || loadingApprovalsForAll;
  const loading = loggingIn || loadingLatestBlockNumber || loadingEvents;

  if (!inputAddress) {
    return null;
  }

  if (loading) {
    return <ClipLoader css="margin: 10px;" size={40} color={'#000'} loading={loading} />;
  }

  if (error) {
    console.log(error);
    return <div style={{ marginTop: '20px' }}>Error: {error.message}</div>;
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
