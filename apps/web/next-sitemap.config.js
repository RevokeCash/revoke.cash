const SITE_URL = 'https://revoke.cash';

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateIndexSitemap: false,
  alternateRefs: [
    {
      href: SITE_URL,
      hreflang: 'x-default',
    },
    {
      href: SITE_URL,
      hreflang: 'en',
    },
    {
      href: `${SITE_URL}/zh`,
      hreflang: 'zh',
    },
    {
      href: `${SITE_URL}/ru`,
      hreflang: 'ru',
    },
    {
      href: `${SITE_URL}/ja`,
      hreflang: 'ja',
    },
    {
      href: `${SITE_URL}/es`,
      hreflang: 'es',
    },
  ],
  exclude: [
    // 404 pages should not be in the sitemap
    '/**404',
    // Images and static files should not be in the sitemap
    '**/og.jpg/**',
    '**.jpg',
    '**.png',
    '**.json',
    '**.txt',
  ],
  // Custom transform function to de-duplicate path locale strings in alternateRefs
  // Without this we get things like https://<domain>/es/es/about rather than https://<domain>/es/about
  // NOTE: This is made to work for path-based localisation scheme (https://<domain>/<locale>/<path>). It may not
  // work if you're using subdomains or separate domains for localisation.
  transform: async (config, originalPath) => {
    // Remove the leading /en/ from the default path (added for i18n in App Router + next-intl)
    const path = `${originalPath}/`.replace(/^\/en\//, '/').replace(/\/+$/, '');

    // Remove the locale part of the path (e.g. /es/about -> /about)
    const extractLocaleIndependentPath = (path) => {
      const matches = config.alternateRefs.map((alt) =>
        `${config.siteUrl}${path}/`.replace(`${alt.href}/`, '/').replace(/\/+$/, ''),
      );
      return matches.sort((a, b) => a.length - b.length)[0];
    };

    const localeIndependentPath = extractLocaleIndependentPath(path);

    // Map the locale independent path onto the locale paths
    const alternateRefs = config.alternateRefs.map((alt) => {
      return { ...alt, href: `${alt.href}${localeIndependentPath}`, hrefIsAbsolute: true };
    });

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs,
    };
  },
};
