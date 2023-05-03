module.exports = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'zh', 'ru'],
  pages: {
    '*': ['common'],
    '/': ['landing', 'faq'],
    '/faq': ['faq'],
    '/extension': ['extension'],
    'rgx:/address/.*': ['address'],
  },
};
