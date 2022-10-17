import { track } from '@amplitude/analytics-browser';
import { getLanguageEmoji, getLanguageNameNative } from 'lib/utils/languages';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import React from 'react';
import { Dropdown } from 'react-bootstrap';

interface Props {
  locale: string;
}

const ChangeLanguageButton = ({ locale }: Props) => {
  const { asPath, replace } = useRouter();
  const { lang } = useTranslation();

  const changeLanguage = () => {
    track('Changed language', { from: lang, to: locale });
    replace(asPath, undefined, { locale, scroll: false });
  };

  return (
    <Dropdown.Item
      style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'black', padding: '0.5rem' }}
      onSelect={changeLanguage}
    >
      <div>{getLanguageEmoji(locale)}</div>
      <div>{getLanguageNameNative(locale)}</div>
    </Dropdown.Item>
  );
};

export default ChangeLanguageButton;
