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
    'rgx:/learn.*': ['learn'],
    'rgx:/learn/wallets/add-network/.*': ['networks'],
    'rgx:/token-approval-checker/.*': ['networks', 'token_approval_checker'],
    'rgx:/blog.*': ['blog'],
  },
};
