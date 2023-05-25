import { readFileSync } from 'fs';
import { join } from 'path';
import rehypeStringify from 'rehype-stringify';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';

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
