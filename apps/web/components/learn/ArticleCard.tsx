import { formatDate } from '@revoke.cash/core/utils/time';
import Href from 'components/common/Href';
import type { ISidebarEntry } from 'lib/types';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface Props extends ISidebarEntry {
  featured?: boolean;
}

const ArticleCard = ({ featured, ...entry }: Props) => {
  if (featured && entry.coverImage) {
    return <FeaturedArticleCard {...entry} />;
  }

  return (
    <Href href={entry.path} router underline="none">
      <div className="h-full flex flex-col gap-3 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-brand dark:hover:border-brand hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition">
        <h3 className="text-lg font-semibold font-heading">{entry.title}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 grow">{entry.description}</p>
        <ArticleCardMeta date={entry.date} readingTime={entry.readingTime} author={entry.author} />
      </div>
    </Href>
  );
};

export default ArticleCard;

const FeaturedArticleCard = ({ title, description, path, date, readingTime, author, coverImage }: ISidebarEntry) => {
  return (
    <Href href={path} router underline="none">
      <div className="flex flex-col sm:flex-row overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-brand dark:hover:border-brand transition">
        <div className="sm:w-1/2 shrink-0 overflow-hidden border-b sm:border-b-0 sm:border-r border-zinc-200 dark:border-zinc-800">
          <Image
            src={coverImage!}
            alt={title}
            width={600}
            height={315}
            className="w-full h-full object-cover"
            priority
            fetchPriority="high"
          />
        </div>
        <div className="flex flex-col gap-3 justify-center p-6">
          <h3 className="text-xl font-semibold font-heading">{title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
          <ArticleCardMeta date={date} readingTime={readingTime} author={author} />
        </div>
      </div>
    </Href>
  );
};

const ArticleCardMeta = ({ date, readingTime, author }: Pick<ISidebarEntry, 'date' | 'readingTime' | 'author'>) => {
  const t = useTranslations();

  if (!date || !readingTime) return null;

  return (
    <p className="text-xs text-zinc-500 dark:text-zinc-400">
      {author ? `${author.name?.split(' ')?.[0]} · ` : ''}
      {formatDate(date)}
      {' · '}
      {t('common.article_meta.reading_time', { readingTime })}
    </p>
  );
};
