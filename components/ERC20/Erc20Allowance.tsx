import { track } from '@amplitude/analytics-browser';
import { displayTransactionSubmittedToast } from 'components/common/transaction-submitted-toast';
import { BigNumber, Contract } from 'ethers';
import React, { useEffect, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import { ClipLoader } from 'react-spinners';
import { toast } from 'react-toastify';
import { useEthereum } from 'utils/hooks/useEthereum';
import { Erc20TokenData } from '../common/interfaces';
import RevokeButton from '../common/RevokeButton';
import UpdateInputGroup from '../common/UpdateInputGroup';
import {
  addressToAppName,
  fromFloat,
  getChainExplorerUrl,
  lookupEnsName,
  lookupUnsName,
  shortenAddress,
} from '../common/util';
import { formatAllowance } from './util';

interface Props {
  spender: string;
  allowance: string;
  inputAddress: string;
  token: Erc20TokenData;
  onRevoke: (spender: string) => void;
}

function Erc20Allowance({ spender, allowance, inputAddress, token, onRevoke }: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [spenderName, setSpenderName] = useState<string | undefined>();
  const [updatedAllowance, setUpdatedAllowance] = useState<string | undefined>();
  const toastRef = useRef();

  const { signer, chainId, provider, account } = useEthereum();

  useEffect(() => {
    loadData();
  }, [spender, allowance]);

  const loadData = async () => {
    setLoading(true);

    const [ensSpender, unsSpender, spenderAppName] = await Promise.all([
      lookupEnsName(spender),
      lookupUnsName(spender),
      addressToAppName(spender, chainId),
    ]);

    setSpenderName(spenderAppName ?? ensSpender ?? unsSpender);

    setLoading(false);
  };

  const revoke = async () => update('0');

  const update = async (newAllowance: string) => {
    const bnNew = BigNumber.from(fromFloat(newAllowance, token.decimals));
    const writeContract = new Contract(token.contract.address, token.contract.interface, signer ?? provider);

    let tx;
    // Not all ERC20 contracts allow for simple changes in approval to be made
    // https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    // so we tell the user to revoke instead if the contract doesn't allow the simple use
    // of contract.approve(0)
    try {
      console.debug(`Calling contract.approve(${spender}, ${bnNew.toString()})`);
      tx = await writeContract.functions.approve(spender, bnNew);
    } catch (e) {
      const code = e.error?.code ?? e.code;
      console.debug(`failed, code ${code}`);
      if (code === -32000) {
        toast.error('This token does not support updating allowances, please revoke instead', {
          position: 'top-left',
        });
      }

      // ignore other errors
      console.log('Ran into issue while revoking', e);
    }

    if (tx) {
      displayTransactionSubmittedToast(toastRef);

      if (newAllowance === '0') {
        track('Revoked ERC20 allowance', { account, spender, token: token.contract.address });
      } else {
        track('Updated ERC20 allowance', { account, spender, token: token.contract.address, amount: newAllowance });
      }

      await tx.wait(1);
      console.debug('Reloading data');

      if (newAllowance === '0') {
        onRevoke(spender);
      } else {
        // TODO: Update allowance order after update
        setUpdatedAllowance(fromFloat(newAllowance, token.decimals));
      }
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
          {formatAllowance(updatedAllowance ?? allowance, token.decimals, token.totalSupply)} allowance to&nbsp;
          {shortenedLink}
        </span>

        <span className="only-desktop-inline">
          {formatAllowance(updatedAllowance ?? allowance, token.decimals, token.totalSupply)} allowance to&nbsp;
          {regularLink}
        </span>
      </Form.Label>
      {<RevokeButton canRevoke={canUpdate} revoke={revoke} id={`revoke-${token.symbol}-${spender}`} />}
      {<UpdateInputGroup canUpdate={canUpdate} update={update} id={`update-${token.symbol}-${spender}`} />}
    </Form>
  );
}

export default Erc20Allowance;
