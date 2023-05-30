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

  const frontMatter = matter(content).data;
  const title = frontMatter.sidebar_title || frontMatter.title;

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
