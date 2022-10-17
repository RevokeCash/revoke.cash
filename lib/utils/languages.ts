export const getLanguageNameNative = (language: string): string | undefined => {
  const mapping = {
    en: 'English',
    es: 'Español',
  };

  return mapping[language];
};

export const getLanguageEmoji = (language: string): string | undefined => {
  const mapping = {
    en: '🇬🇧',
    es: '🇪🇸',
  };

  return mapping[language];
};
