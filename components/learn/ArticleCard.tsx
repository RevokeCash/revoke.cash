import Card from 'components/common/Card';
import Href from 'components/common/Href';
import ImageWithFallback from 'components/common/ImageWithFallback';
import { ISidebarEntry } from 'lib/interfaces';

const ArticleCard = ({ title, description, path, date }: ISidebarEntry) => (
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
      {date && (
        <p className="text-sm text-right text-zinc-500 dark:text-zinc-400">
          {new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
      )}
    </Card>
  </Href>
);

export default ArticleCard;
