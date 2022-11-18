import { useAppContext } from 'lib/hooks/useAppContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import ReactTooltip from 'react-tooltip';
import RevokeButton from './RevokeButton';
import SwitchChainButton from './SwitchChainButton';
import UpdateControls from './UpdateControls';

interface Props {
  revoke: () => Promise<void>;
  update?: (newAllowance: string) => Promise<void>;
  id: string;
}

const AllowanceControls = ({ revoke, update, id }: Props) => {
  const { account, selectedChainId, connectedChainId, connectionType } = useEthereum();
  const { inputAddress } = useAppContext();

  const isConnected = account !== undefined;
  const isConnectedAddress = isConnected && inputAddress === account;
  const needsToSwitchChain = isConnected && selectedChainId !== connectedChainId;
  const canSwitchChain = connectionType === 'injected';
  const disabled = !isConnectedAddress || (needsToSwitchChain && !canSwitchChain);

  if (needsToSwitchChain && canSwitchChain) {
    return <SwitchChainButton />;
  }

  let tooltipText: undefined | string = undefined;

  if (account !== inputAddress) {
    tooltipText = 'You can only revoke allowances of the connected account';
  }

  if (!account) {
    tooltipText = 'Please connect your wallet in order to revoke';
  }

  if (needsToSwitchChain && !canSwitchChain) {
    tooltipText = `Please switch your connected chain to <strong>{getChainName(selectedChainId)}</strong> inside your wallet in
    order to revoke`;
  }

  // if (!isConnected) {
  //   const tooltip = <Tooltip id={`revoke-${id}`}>Please connect your wallet in order to revoke</Tooltip>;
  //   return <WithHoverTooltip tooltip={tooltip}>{controls}</WithHoverTooltip>;
  // }

  // if (!isConnectedAddress) {
  //   const tooltip = <Tooltip id={`revoke-${id}`}>You can only revoke allowances of the connected account</Tooltip>;
  //   return <WithHoverTooltip tooltip={tooltip}>{controls}</WithHoverTooltip>;
  // }

  // if (needsToSwitchChain && !canSwitchChain) {
  //   const tooltip = (
  //     <Tooltip id={`switch-${id}`}>
  //       Please switch your connected chain to <strong>{getChainName(selectedChainId)}</strong> inside your wallet in
  //       order to revoke
  //     </Tooltip>
  //   );

  //   return <WithHoverTooltip tooltip={tooltip}>{controls}</WithHoverTooltip>;
  // }

  return (
    <>
      <div data-tip={tooltipText} className="flex h-6">
        <RevokeButton revoke={revoke} disabled={true} />

        {update && <UpdateControls update={update} disabled={disabled} />}
      </div>

      <ReactTooltip />
    </>
  );
};

export default AllowanceControls;
