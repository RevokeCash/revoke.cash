import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { useMessages } from 'next-intl';
import SearchBar from './SearchBar';

interface Props {
  render?: boolean;
}

const HeaderAttachedSearchBar = ({ render = true }: Props) => {
  const messages = useMessages();

  if (!render) return null;

  return (
    <NextIntlClientProvider messages={{ common: messages.common }}>
      {/* We add a negative margin so the SearchBar is grouped with the header */}
      <div className="flex justify-center -mt-4 mb-8 px-4 lg:px-8">
        <SearchBar />
      </div>
    </NextIntlClientProvider>
  );
};

export default HeaderAttachedSearchBar;
