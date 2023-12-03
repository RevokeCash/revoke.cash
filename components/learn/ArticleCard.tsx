import Card from 'components/common/Card';
import Href from 'components/common/Href';
import { ISidebarEntry } from 'lib/interfaces';
import Image from 'next/image';

const ArticleCard = ({ title, description, path, date }: ISidebarEntry) => (
  <Href href={path} router underline="none">
    <Card
      className="flex flex-col justify-between gap-4"
      image={
        <Image
          src={`/assets/images${path}/cover.jpg`}
          alt={`${title} Cover Image`}
          width={1600}
          height={900}
          className="rounded-t-[calc(theme(borderRadius.lg)-1px)]"
        />
      }
    >
      <h2 className="text-xl leading-none">{title}</h2>
      <p>{description}</p>
      {date && (
        <p className="text-sm text-right text-zinc-500 dark:text-zinc-400">
          {new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
      )}
    </Card>
  </Href>
);

export default ArticleCard;
