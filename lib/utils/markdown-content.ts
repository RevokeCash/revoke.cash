import { readFileSync } from 'fs';
import matter from 'gray-matter';
import type { ContentFile, ISidebarEntry, Person, RawContentFile } from 'lib/interfaces';
import ky from 'lib/ky';
import { getTranslations } from 'next-intl/server';
import { join } from 'path';
import { readingTime } from 'reading-time-estimator';
import { deduplicateArray } from '.';
import { getOpenGraphImageUrl } from './og';

const walk = require('walkdir');

export const readContentFile = (
  slug: string | string[],
  locale: string,
  directory: string = 'learn',
): RawContentFile | null => {
  try {
    const contentDirectory = join(process.cwd(), 'content');

    const normalisedSlug = Array.isArray(slug) ? slug.join('/') : slug;
    try {
      const content = readFileSync(join(contentDirectory, locale, directory, `${normalisedSlug}.md`), 'utf8');
      return { content, language: locale };
    } catch {
      if (locale === 'en') return null;

      return readContentFile(slug, 'en', directory);
    }
  } catch {
    return null;
  }
};

export const readAndParseContentFile = (
  slug: string | string[],
  locale: string,
  directory: string = 'learn',
): ContentFile | null => {
  const { content: rawContent, language } = readContentFile(slug, locale, directory) ?? {};
  if (!rawContent) return null;

  const { content, data } = matter(rawContent);
  const meta = {
    title: data.title,
    sidebarTitle: data.sidebarTitle ?? data.title,
    description: data.description,
    language,
    author: parsePerson(data.author),
    translator: parsePerson(data.translator),
    coverImage: getCoverImage(slug, directory, locale),
    date: data.date?.toISOString() ?? null,
    readingTime: calculateReadingTime(content),
    overlay: data.overlay ?? true,
  };

  return { content, meta };
};

const parsePerson = (person?: string): Person | null => {
  // Placeholders are denoted with < ... >
  if (person?.match(/^<.*>$/)) return null;

  const split = person?.split('|');

  if (!split) return null;

  return {
    name: split?.at(0)?.trim() ?? null,
    url: split?.at(1)?.trim() ?? null,
  };
};

const calculateReadingTime = (content: string): number => Math.round(Math.max(readingTime(content, 200).minutes, 1));

export const getSidebar = async (
  locale: string,
  directory: string = 'learn',
  extended: boolean = false,
): Promise<ISidebarEntry[] | null> => {
  const t = await getTranslations({ locale });

  if (directory === 'learn') {
    const sidebar: ISidebarEntry[] = [
      {
        title: t('learn.sidebar.basics'),
        path: '/learn/basics',
        children: [
          getSidebarEntry('basics/what-is-a-crypto-wallet', locale, directory, extended),
          getSidebarEntry('basics/what-are-tokens', locale, directory, extended),
          getSidebarEntry('basics/what-are-nfts', locale, directory, extended),
        ],
      },
      {
        title: t('learn.sidebar.approvals'),
        path: '/learn/approvals',
        children: [
          getSidebarEntry('approvals/what-are-token-approvals', locale, directory, extended),
          getSidebarEntry('approvals/how-to-revoke-token-approvals', locale, directory, extended),
          getSidebarEntry('approvals/what-are-eip2612-permit-signatures', locale, directory, extended),
          getSidebarEntry('approvals/what-is-permit2', locale, directory, extended),
        ],
      },
      {
        title: t('learn.sidebar.security'),
        path: '/learn/security',
        children: [
          getSidebarEntry('security/what-to-do-when-scammed', locale, directory, extended),
          getSidebarEntry('security/what-is-address-poisoning', locale, directory, extended),
        ],
      },
      {
        title: t('learn.sidebar.wallets'),
        path: '/learn/wallets',
        children: [
          {
            title: t('learn.add_network.sidebar_title'),
            description: extended ? t('learn.add_network.description', { chainName: 'Ethereum' }) : null,
            path: '/learn/wallets/add-network',
            coverImage: getOpenGraphImageUrl('/learn/wallets/add-network', locale),
          },
        ],
      },
      {
        title: t('learn.sidebar.faq'),
        path: '/learn/faq',
        children: [],
      },
    ];

    return sidebar;
  }

  if (directory === 'blog') {
    const allSlugs = getAllContentSlugs(directory);
    const sidebar: ISidebarEntry[] = allSlugs.map((slug) => getSidebarEntry(slug, locale, directory, extended));
    sidebar.sort((a, b) => (a.date > b.date ? -1 : 1));
    return sidebar;
  }

  return null;
};

const getSidebarEntry = (
  slug: string | string[],
  locale: string,
  directory: string = 'learn',
  extended: boolean = false,
): ISidebarEntry => {
  const { meta } = readAndParseContentFile(slug, locale, directory) ?? {};
  if (!meta) return null;

  const normalisedSlug = Array.isArray(slug) ? slug.join('/') : slug;
  const path = ['', directory, normalisedSlug].join('/');

  const entry: ISidebarEntry = { title: meta.sidebarTitle, path, date: meta.date };
  if (extended) {
    entry.description = meta.description;
    entry.coverImage = meta.coverImage;
  }
  if (directory === 'blog') entry.readingTime = meta.readingTime;

  return entry;
};

export const getAllContentSlugs = (directory: string = 'learn'): string[][] => {
  const contentDirectory = join(process.cwd(), 'content');

  const subdirectory = join(contentDirectory, 'en', directory);
  const slugs: string[][] = walk
    .sync(subdirectory)
    .filter((path: string) => path.endsWith('.md'))
    .map((path: string) => path.replace(`${subdirectory}/`, ''))
    .map((path: string) => path.replace(/\.md$/, ''))
    .map((path: string) => path.split('/'));

  return slugs;
};

export const getAllLearnCategories = (): string[] => {
  const slugs = getAllContentSlugs('learn');
  return deduplicateArray([...slugs.map((slug) => slug[0]), 'wallets']);
};

export const getTranslationUrl = async (
  slug: string | string[],
  locale: string,
  directory: string = 'learn',
): Promise<string | null> => {
  if (!process.env.LOCALAZY_API_KEY || locale === 'en') return null;

  const normalisedSlug = Array.isArray(slug) ? slug : [slug];

  const baseUrl = 'https://api.localazy.com/projects/_a7784910611832258237';

  const headers = {
    Authorization: `Bearer ${process.env.LOCALAZY_API_KEY}`,
  };

  const files = await ky.get(`${baseUrl}/files`, { headers }).json<any[]>();

  const targetFileName = `${normalisedSlug.at(-1)}.md`;
  const targetPath = `${directory}/${normalisedSlug.slice(0, -1).join('/')}`;
  const file = files.find((file) => file.name === targetFileName && file.path === targetPath);

  if (!file) {
    throw new Error(`Could not find translation file for ${targetPath}/${targetFileName}`);
  }

  const {
    keys: [key],
  } = await ky.get(`${baseUrl}/files/${file.id}/keys/en`, { headers }).json<any>();

  const languageCodes = {
    zh: 1,
    ru: 1105,
    ja: 717,
    es: 458,
  };

  return `https://localazy.com/p/revoke-cash-markdown-content/phrases/${languageCodes[locale]}/edit/${key.id}`;
};

export const getCoverImage = (
  slug: string | string[],
  directory: string = 'learn',
  locale: string = 'en',
): string | null => {
  return getOpenGraphImageUrl(`/${directory}/${[slug].flat().join('/')}`, locale);
};
