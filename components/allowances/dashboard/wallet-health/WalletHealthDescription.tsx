import Href from 'components/common/Href';
import Loader from 'components/common/Loader';
import { Nullable } from 'lib/interfaces';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  score: number;
  isLoading: boolean;
  error?: Nullable<Error>;
}

const WalletHealthDescription = ({ score, error, isLoading }: Props) => {
  const t = useTranslations();

  if (error) return null;

  const category = score > 75 ? 'high' : score > 25 ? 'medium' : 'low';

  return (
    <div className={twMerge('flex flex-col items-start', isLoading && 'gap-1')}>
      <Loader isLoading={isLoading} className="rounded-md">
        <div className="font-bold">
          {t('address.wallet_health.description')}: {t(`address.wallet_health.categories.${category}`)}
        </div>
      </Loader>
      <Loader isLoading={isLoading} className="rounded-md">
        <div className="text-xs">
          {t.rich('common.misc.powered_by', {
            name: 'Nefture',
            'powered-by-link': (children) => (
              <Href href="https://nefture.com" external className="font-medium" underline="hover">
                {children}
              </Href>
            ),
          })}
        </div>
      </Loader>
    </div>
  );
};

export default WalletHealthDescription;
