import { track } from '@amplitude/analytics-browser';
import AllowanceControls from 'components/common/AllowanceControls';
import { displayTransactionSubmittedToast } from 'components/common/transaction-submitted-toast';
import { Contract } from 'ethers';
import { useEthereum } from 'lib/hooks/useEthereum';
import React, { useRef } from 'react';
import { useAsync } from 'react-async-hook';
import { Form } from 'react-bootstrap';
import { ClipLoader } from 'react-spinners';
import { ADDRESS_ZERO } from '../common/constants';
import { Erc721TokenData } from '../common/interfaces';
import { getChainExplorerUrl, shortenAddress } from '../common/util';
import { Allowance } from './interfaces';
import { addressToAppName, formatAllowance } from './util';

interface Props {
  token: Erc721TokenData;
  allowance: Allowance;
  inputAddress: string;
  openSeaProxyAddress?: string;
  onRevoke: (allowance: Allowance) => void;
}

function Erc721Allowance({ token, allowance, inputAddress, openSeaProxyAddress, onRevoke }: Props) {
  const { spender, tokenId } = allowance;

  const toastRef = useRef();
  const { signer, account, selectedChainId } = useEthereum();
  const { result: spenderName, loading } = useAsync(
    () => addressToAppName(spender, selectedChainId, openSeaProxyAddress),
    []
  );

  const revoke = async () => {
    const writeContract = new Contract(token.contract.address, token.contract.interface, signer);

    let tx;
    try {
      tx =
        tokenId === undefined
          ? await writeContract.functions.setApprovalForAll(spender, false)
          : await writeContract.functions.approve(ADDRESS_ZERO, tokenId);
    } catch (e) {
      // Ignore issues
      console.log('Ran into issue while revoking', e);
    }

    if (tx) {
      displayTransactionSubmittedToast(toastRef);

      track('Revoked ERC721 allowance', {
        chainId: selectedChainId,
        account,
        spender,
        token: token.contract.address,
        tokenId,
      });

      await tx.wait(1);

      onRevoke(allowance);
    }
  };

  if (loading) {
    return (
      <div>
        <ClipLoader size={10} color={'#000'} loading={loading} />
      </div>
    );
  }

  const spenderDisplay = spenderName || spender;
  const shortenedSpenderDisplay = spenderName || shortenAddress(spender);
  const explorerBaseUrl = getChainExplorerUrl(selectedChainId);

  const shortenedLink = explorerBaseUrl ? (
    <a className="monospace" href={`${explorerBaseUrl}/address/${spender}`}>
      {shortenedSpenderDisplay}
    </a>
  ) : (
    shortenedSpenderDisplay
  );

  const regularLink = explorerBaseUrl ? (
    <a className="monospace" href={`${explorerBaseUrl}/address/${spender}`}>
      {spenderDisplay}
    </a>
  ) : (
    spenderDisplay
  );

  const canUpdate = inputAddress === account;

  return (
    <Form inline className="Allowance" key={spender}>
      {/* Display separate spans for the regular and shortened versions of the spender address */}
      {/* The correct one is selected using CSS media-queries */}
      <Form.Label className="AllowanceText">
        <span className="only-mobile-inline">
          {formatAllowance(tokenId)} to&nbsp;{shortenedLink}
        </span>
        <span className="only-desktop-inline">
          {formatAllowance(tokenId)} to&nbsp;{regularLink}
        </span>
      </Form.Label>
      <AllowanceControls revoke={revoke} inputAddress={inputAddress} id={`${token.symbol}-${spender}`} />
    </Form>
  );
}

export default Erc721Allowance;
