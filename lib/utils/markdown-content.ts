import axios from 'axios';
import { readFileSync } from 'fs';
import matter from 'gray-matter';
import { ContentFile, ISidebarEntry, RawContentFile } from 'lib/interfaces';
import getT from 'next-translate/getT';
import { join } from 'path';

const walk = require('walkdir');

export const contentDirectory = join(process.cwd(), 'content');

export const readContentFile = (
  slug: string | string[],
  locale: string,
  directory: string = 'learn'
): RawContentFile | null => {
  const normalisedSlug = Array.isArray(slug) ? slug.join('/') : slug;
  try {
    const content = readFileSync(join(contentDirectory, locale, directory, `${normalisedSlug}.md`), 'utf8');
    return { content, language: locale };
  } catch {
    try {
      const content = readFileSync(join(contentDirectory, 'en', directory, `${normalisedSlug}.md`), 'utf8');
      return { content, language: 'en' };
    } catch {
      return null;
    }
  }
};

export const readAndParseContentFile = (
  slug: string | string[],
  locale: string,
  directory: string = 'learn'
): ContentFile | null => {
  const { content: rawContent, language } = readContentFile(slug, locale, directory) ?? {};
  if (!rawContent) return null;

  const { content, data } = matter(rawContent);
  const meta = {
    title: data.title,
    description: data.description,
    language,
  };

  return { content, meta };
};

export const getSidebar = async (locale: string, directory: string = 'learn'): Promise<ISidebarEntry[] | null> => {
  const t = await getT(locale, directory);

  if (directory === 'learn') {
    const sidebar: ISidebarEntry[] = [
      {
        title: t('learn:sidebar.basics'),
        path: '/learn/basics',
        children: [
          getSidebarEntry('basics/what-is-a-crypto-wallet', locale, directory),
          getSidebarEntry('basics/what-are-tokens', locale, directory),
          getSidebarEntry('basics/what-are-nfts', locale, directory),
        ],
      },
      {
        title: t('learn:sidebar.approvals'),
        path: '/learn/approvals',
        children: [
          getSidebarEntry('approvals/what-are-token-approvals', locale, directory),
          getSidebarEntry('approvals/how-to-revoke-token-approvals', locale, directory),
        ],
      },
      {
        title: t('learn:sidebar.wallets'),
        path: '/learn/wallets',
        children: [{ title: t('learn:add_network.sidebar_title'), path: '/learn/wallets/add-network' }],
      },
    ];

    return sidebar;
  }
  return null;
};

const getSidebarEntry = (slug: string | string[], locale: string, directory: string = 'learn'): ISidebarEntry => {
  const { meta } = readAndParseContentFile(slug, locale, directory) ?? {};
  if (!meta) return null;

  const normalisedSlug = Array.isArray(slug) ? slug.join('/') : slug;
  const path = ['', directory, normalisedSlug].join('/');

  return { title: meta.title, path };
};

export const getAllContentSlugs = (directory: string = 'learn'): string[][] => {
  const subdirectory = join(contentDirectory, 'en', directory);
  const slugs: string[][] = walk
    .sync(subdirectory)
    .filter((path: string) => path.endsWith('.md'))
    .map((path: string) => path.replace(`${subdirectory}/`, ''))
    .map((path: string) => path.replace(/\.md$/, ''))
    .map((path: string) => path.split('/'));

  return slugs;
};

export const getTranslationUrl = async (
  slug: string | string[],
  locale: string,
  directory: string = 'learn'
): Promise<string | null> => {
  if (!process.env.LOCALAZY_API_KEY || locale === 'en') return null;

  const normalisedSlug = Array.isArray(slug) ? slug : [slug];

  const baseUrl = 'https://api.localazy.com/projects/_a7784910611832258237';

  const { data: files } = await axios.get(`${baseUrl}/files`, {
    headers: {
      Authorization: `Bearer ${process.env.LOCALAZY_API_KEY}`,
    },
  });

  const targetFileName = `${normalisedSlug.at(-1)}.md`;
  const targetPath = `${directory}/${normalisedSlug.slice(0, -1).join('/')}`;
  const file = files.find((file) => file.name === targetFileName && file.path === targetPath);

  if (!file) {
    throw new Error(`Could not find translation file for ${targetPath}/${targetFileName}`);
  }

  const {
    data: {
      keys: [key],
    },
  } = await axios.get(`${baseUrl}/files/${file.id}/keys/en`, {
    headers: {
      Authorization: `Bearer ${process.env.LOCALAZY_API_KEY}`,
    },
  });

  const languageCodes = {
    zh: 1,
    ru: 1105,
    ja: 717,
    es: 458,
  };

  return `https://localazy.com/p/revoke-cash-markdown-content/phrases/${languageCodes[locale]}/edit/${key.id}`;
};
