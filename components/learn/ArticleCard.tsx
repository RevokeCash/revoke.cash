import Card from 'components/common/Card';
import Href from 'components/common/Href';
import ImageWithFallback from 'components/common/ImageWithFallback';
import type { ISidebarEntry } from 'lib/interfaces';
import { useTranslations } from 'next-intl';

const ArticleCard = ({ title, description, path, date, readingTime, coverImage, author }: ISidebarEntry) => {
  const t = useTranslations();

  return (
    <Href href={path} router underline="none">
      <Card
        hover="scale"
        className="flex flex-col justify-between gap-4"
        image={
          <ImageWithFallback
            src={coverImage ?? '/opengraph-image.jpg'}
            alt={`${title} Cover Image`}
            width={1200}
            height={630}
            className="rounded-t-[calc(var(--radius-lg)-1px)]"
            fallbackSrc="/opengraph-image.jpg"
          />
        }
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-xl leading-none">{title}</h2>
          <p>{description}</p>
        </div>
        {date && readingTime ? (
          <p className="text-sm text-right text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            {author ? `${author.name?.split(' ')?.[0]} • ` : ''}
            {new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            {' • '}
            {t('common.article_meta.reading_time', { readingTime })}
          </p>
        ) : null}
      </Card>
    </Href>
  );
};
export default ArticleCard;
