import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { rdfaTypeof } from 'lib/utils/rdfa';
import Href from './Href';

interface Props {
  pages: {
    name: string;
    href?: string;
  }[];
}

const Breadcrumb = ({ pages }: Props) => {
  return (
    <nav className="flex mb-4 text-sm md:text-base font-medium">
      <ol className="flex items-center gap-2 flex-wrap" vocab="https://schema.org/" {...rdfaTypeof('BreadcrumbList')}>
        <li>
          <Href
            underline="none"
            href="/"
            className="hover:cursor-pointer hover:opacity-50 hover:bg-zinc-100 duration-100"
            router
            aria-label="Home Page"
          >
            <HomeIcon className="h-5 w-5 shrink-0" />
          </Href>
        </li>
        {pages.map((page, i) => (
          <li
            key={page.name}
            className="flex items-center gap-2"
            property="itemListElement"
            {...rdfaTypeof('ListItem')}
          >
            <ChevronRightIcon className="h-5 w-5 shrink-0" />
            {page.href ? (
              <Href underline="hover" href={page.href} router property="item" {...rdfaTypeof('WebPage')}>
                <span property="name">{page.name}</span>
              </Href>
            ) : (
              <span property="item" {...rdfaTypeof('WebPage')}>
                <span property="name">{page.name}</span>
              </span>
            )}
            <div hidden className="hidden" property="position" content={String(i + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
