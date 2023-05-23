module.exports = {
  defaultLocale: 'en',
  locales: ['en', 'zh', 'ru', 'ja', 'es'],
  pages: {
    '*': ['common'],
    '/': ['landing', 'faq'],
    '/faq': ['faq'],
    '/extension': ['extension'],
    'rgx:/address/.*': ['address'],
    'rgx:/exploits.*': ['exploits'],
  },
};
