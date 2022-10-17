import { getLanguageEmoji } from 'lib/utils/languages';
import useTranslation from 'next-translate/useTranslation';
import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { locales } from '../../i18n';
import ChangeLanguageButton from './ChangeLanguageButton';

const ChangeLanguageDropdown = () => {
  const { lang } = useTranslation();

  return (
    <Dropdown>
      <Dropdown.Toggle variant="outline-primary" style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
        {getLanguageEmoji(lang)}
      </Dropdown.Toggle>
      <Dropdown.Menu style={{ minWidth: '0', padding: '0' }}>
        {locales.map((locale) => (
          <ChangeLanguageButton locale={locale} key={locale} />
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ChangeLanguageDropdown;
