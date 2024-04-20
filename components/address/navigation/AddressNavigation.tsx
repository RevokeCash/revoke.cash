import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useTranslations } from 'next-intl';
import AddressNavigationTab from './AddressNavigationTab';

const AddressNavigation = () => {
  const { address } = useAddressPageContext();
  const t = useTranslations();

  const basePath = `/address/${address}`;
  const signaturesPath = `${basePath}/signatures`;

  return (
    <div className="flex overflow-x-scroll scrollbar-hide overflow-y-hidden w-full justify-center sm:justify-start">
      <nav className="flex gap-4">
        <AddressNavigationTab name={t('address.navigation.allowances')} href={basePath} />
        <AddressNavigationTab name={t('address.navigation.signatures')} href={signaturesPath} />
      </nav>
    </div>
  );
};

export default AddressNavigation;
