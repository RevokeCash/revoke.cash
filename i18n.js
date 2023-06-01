module.exports = {
  defaultLocale: 'en',
  locales: ['en', 'zh', 'ru', 'ja', 'es'],
  pages: {
    '*': ['common'],
    '/': ['landing', 'faq'],
    '/learn/faq': ['faq'],
    '/extension': ['extension'],
    '/about': ['about'],
    'rgx:/address/.*': ['address'],
    'rgx:/exploits.*': ['exploits'],
    'rgx:/learn/.*': ['learn'],
  },
};
