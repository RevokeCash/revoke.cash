import axios from 'axios';
import { readFileSync } from 'fs';
import matter from 'gray-matter';
import { ISidebarEntry } from 'lib/interfaces';
import getT from 'next-translate/getT';
import { join } from 'path';
import rehypeStringify from 'rehype-stringify';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';

const walk = require('walkdir');

export const markdownToHtml = (markdown: string) => {
  const result = remark().use(remarkGfm).use(remarkRehype).use(rehypeStringify).processSync(markdown);
  return result.toString();
};

export const contentDirectory = join(process.cwd(), 'content');

export const readContentFile = (
  slug: string | string[],
  locale: string,
  directory: string = 'learn'
): string | null => {
  const normalisedSlug = Array.isArray(slug) ? slug.join('/') : slug;
  try {
    return readFileSync(join(contentDirectory, locale, directory, `${normalisedSlug}.md`), 'utf8');
  } catch {
    try {
      return readFileSync(join(contentDirectory, 'en', directory, `${normalisedSlug}.md`), 'utf8');
    } catch {
      return null;
    }
  }
};

export const getSidebar = async (locale: string, directory: string = 'learn'): Promise<ISidebarEntry[] | null> => {
  const t = await getT(locale, directory);

  if (directory === 'learn') {
    const sidebar: ISidebarEntry[] = [
      {
        title: t('sidebar.basics'),
        path: '/learn/basics',
        children: [
          getSidebarEntry('basics/what-is-a-crypto-wallet', locale, directory),
          getSidebarEntry('basics/what-are-tokens', locale, directory),
          getSidebarEntry('basics/what-are-nfts', locale, directory),
        ],
      },
      {
        title: t('sidebar.approvals'),
        path: '/learn/approvals',
        children: [
          getSidebarEntry('approvals/what-are-token-approvals', locale, directory),
          getSidebarEntry('approvals/how-to-revoke-token-approvals', locale, directory),
        ],
      },
    ];

    return sidebar;
  }
  return null;
};

const getSidebarEntry = (slug: string | string[], locale: string, directory: string = 'learn'): ISidebarEntry => {
  const content = readContentFile(slug, locale, directory);
  if (!content) return null;

  const { title } = matter(content).data;
  const normalisedSlug = Array.isArray(slug) ? slug.join('/') : slug;
  const path = ['', directory, normalisedSlug].join('/');

  return { title, path };
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
