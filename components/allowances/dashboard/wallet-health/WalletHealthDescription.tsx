import Href from 'components/common/Href';
import Loader from 'components/common/Loader';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import { twMerge } from 'tailwind-merge';

interface Props {
  score: number;
  isLoading: boolean;
  error?: Error;
}

const WalletHealthDescription = ({ score, error, isLoading }: Props) => {
  const { t } = useTranslation();

  if (error) return null;

  const category = score > 75 ? 'high' : score > 25 ? 'medium' : 'low';

  return (
    <div className={twMerge('flex flex-col items-start', isLoading && 'gap-1')}>
      <Loader isLoading={isLoading} className="rounded-md">
        <div className="font-bold">
          {t('address:wallet_health.description')}: {t(`address:wallet_health.categories.${category}`)}
        </div>
      </Loader>
      <Loader isLoading={isLoading} className="rounded-md">
        <div className="text-xs">
          <Trans
            i18nKey="common:misc.powered_by"
            values={{ name: 'Nefture' }}
            components={[<Href href="https://nefture.com" external className="font-medium" underline="hover" />]}
          />
        </div>
      </Loader>
    </div>
  );
};

export default WalletHealthDescription;
