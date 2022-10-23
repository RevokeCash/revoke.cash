export const getLanguageNameNative = (language: string): string | undefined => {
  const mapping = {
    en: 'English',
    es: 'Español',
    zh: '中文',
  };

  return mapping[language];
};

export const getLanguageEmoji = (language: string): string | undefined => {
  const mapping = {
    en: '🇬🇧',
    es: '🇪🇸',
    zh: '🇨🇳',
  };

  return mapping[language];
};
