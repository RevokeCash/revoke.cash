import Href from 'components/common/Href';
import type { ISidebarEntry } from 'lib/interfaces';
import { formatDate } from 'lib/utils/time';
import { useTranslations } from 'next-intl';

const ArticleCard = ({ title, description, path, date, readingTime, author }: ISidebarEntry) => {
  const t = useTranslations();

  return (
    <Href href={path} router underline="none">
      <div className="h-full flex flex-col gap-3 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-brand dark:hover:border-brand hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 grow">{description}</p>
        {date && readingTime ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {author ? `${author.name?.split(' ')?.[0]} · ` : ''}
            {formatDate(date)}
            {' · '}
            {t('common.article_meta.reading_time', { readingTime })}
          </p>
        ) : null}
      </div>
    </Href>
  );
};
export default ArticleCard;
