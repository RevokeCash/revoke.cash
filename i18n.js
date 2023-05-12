module.exports = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'zh'],
  pages: {
    '*': ['common'],
    '/': ['landing', 'faq'],
    '/faq': ['faq'],
    '/extension': ['extension'],
    'rgx:/address/.*': ['address'],
    'rgx:/exploits.*': ['exploits'],
  },
};
