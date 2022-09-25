import { track } from '@amplitude/analytics-browser';
import { displayTransactionSubmittedToast } from 'components/common/transaction-submitted-toast';
import { Contract } from 'ethers';
import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { ClipLoader } from 'react-spinners';
import { useEthereum } from 'utils/hooks/useEthereum';
import { ADDRESS_ZERO } from '../common/constants';
import { Erc721TokenData } from '../common/interfaces';
import RevokeButton from '../common/RevokeButton';
import { getChainExplorerUrl, lookupEnsName, lookupUnsName, shortenAddress } from '../common/util';
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
  const [loading, setLoading] = useState<boolean>(true);
  const [spenderName, setSpenderName] = useState<string>();
  const { signer, provider, account, chainId } = useEthereum();

  const { spender, tokenId } = allowance;

  useEffect(() => {
    loadData();
  }, [spender, allowance]);

  const loadData = async () => {
    setLoading(true);

    const [ensSpender, unsSpender, spenderAppName] = await Promise.all([
      lookupEnsName(spender),
      lookupUnsName(spender),
      addressToAppName(spender, chainId, openSeaProxyAddress),
    ]);

    setSpenderName(spenderAppName ?? ensSpender ?? unsSpender);

    setLoading(false);
  };

  const revoke = async () => {
    const writeContract = new Contract(token.contract.address, token.contract.interface, signer ?? provider);

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

      track('Revoked ERC721 allowance', { account, spender, token: token.contract.address, tokenId });

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
  const explorerBaseUrl = getChainExplorerUrl(chainId);

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
      {<RevokeButton canRevoke={canUpdate} revoke={revoke} id={`revoke-${token.symbol}-${spender}`} />}
    </Form>
  );
}

export default Erc721Allowance;
