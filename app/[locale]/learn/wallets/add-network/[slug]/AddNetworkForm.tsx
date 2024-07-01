import CopyButton from 'components/common/CopyButton';
import { getChainExplorerUrl, getChainFreeRpcUrl, getChainName, getChainNativeToken } from 'lib/utils/chains';
import { useTranslations } from 'next-intl';
import AddNetworkButton from './AddNetworkButton';

interface Props {
  chainId: number;
}

const AddNetworkForm = ({ chainId }: Props) => {
  const chainName = getChainName(chainId);
  const t = useTranslations();

  return (
    <div property="step" typeof="HowToStep">
      <h3 property="name">{t('learn.add_network.step_2.title')}</h3>
      <div property="text">
        <p>{t('learn.add_network.step_2.paragraph_1', { chainName })}</p>
        <div className="flex flex-col gap-1 my-4">
          <FormElement label="Network name" content={chainName} />
          <FormElement label="New RPC URL" content={getChainFreeRpcUrl(chainId)} />
          <FormElement label="Chain ID" content={String(chainId)} />
          <FormElement label="Currency symbol" content={getChainNativeToken(chainId)} />
          <FormElement label="Block explorer URL (Optional)" content={getChainExplorerUrl(chainId)} />
        </div>
        <p>{t('learn.add_network.step_2.paragraph_2')}</p>
        <AddNetworkButton chainId={chainId} label={t.rich('learn.add_network.title', { chainName })} />
      </div>
    </div>
  );
};

const FormElement = ({ label, content }: { label: string; content: string }) => {
  return (
    <>
      <div className="font-bold">{label}</div>
      <div className="w-full max-w-sm border px-2 py-2 border-zinc-400 dark:border-zinc-500 rounded-md text-sm flex justify-between gap-4">
        <span className="truncate">{content}</span>
        <CopyButton content={content} />
      </div>
    </>
  );
};

export default AddNetworkForm;
