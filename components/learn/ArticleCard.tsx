import Card from 'components/common/Card';
import Href from 'components/common/Href';
import ImageWithFallback from 'components/common/ImageWithFallback';
import { ISidebarEntry } from 'lib/interfaces';
import { useTranslations } from 'next-intl';

const ArticleCard = ({ title, description, path, date, readingTime }: ISidebarEntry) => {
  const t = useTranslations();

  return (
    <Href href={path} router underline="none">
      <Card
        hover="scale"
        className="flex flex-col justify-between gap-4"
        image={
          <ImageWithFallback
            src={`/assets/images${path}/cover.jpg`}
            alt={`${title} Cover Image`}
            width={1600}
            height={900}
            className="rounded-t-[calc(theme(borderRadius.lg)-1px)]"
            fallbackSrc="/assets/images/revoke-og-image.jpg"
          />
        }
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-xl leading-none">{title}</h2>
          <p>{description}</p>
        </div>
        {date && readingTime ? (
          <p className="text-sm text-right text-zinc-500 dark:text-zinc-400 flex gap-1 justify-end">
            {new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            <span>•</span>
            {t('common.article_meta.reading_time', { readingTime })}
          </p>
        ) : null}
      </Card>
    </Href>
  );
};
export default ArticleCard;
