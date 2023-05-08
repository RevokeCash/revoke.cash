module.exports = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'ru', 'zh'],
  pages: {
    '*': ['common'],
    '/': ['landing', 'faq'],
    '/faq': ['faq'],
    '/extension': ['extension'],
    'rgx:/address/.*': ['address'],
  },
};
