import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import AddressNavigationTab from './AddressNavigationTab';

// TODO: This will be improved when we switch to Next.js App Directory (nested layouts)
const AddressNavigation = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const basePath = `/address/${router.query.address}`;
  const morePath = `${basePath}/more`;

  return (
    <div className="flex overflow-x-scroll overflow-y-hidden w-full justify-center sm:justify-start">
      <nav className="flex gap-4">
        <AddressNavigationTab name={t('address:navigation.allowances')} href={basePath} />
        <AddressNavigationTab name={t('address:navigation.more')} href={morePath} />
      </nav>
    </div>
  );
};

export default AddressNavigation;
