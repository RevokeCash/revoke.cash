module.exports = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'zh'],
  pages: {
    '*': ['common'],
    '/about': ['about'],
    '/faq': ['faq'],
    '/extension': ['extension'],
    'rgx:/address/.*': ['address'],
  },
};
