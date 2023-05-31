import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import Href from './Href';

interface Props {
  pages: {
    name: string;
    href?: string;
  }[];
}

const Breadcrumb = ({ pages }: Props) => {
  return (
    <nav className="flex mb-5">
      <ol role="list" className="flex items-center gap-2">
        <li>
          <Href
            underline="none"
            href="/"
            className="hover:cursor-pointer hover:opacity-50 hover:bg-zinc-100 duration-100"
            router
            aria-label="Home"
          >
            <HomeIcon className="h-5 w-5 flex-shrink-0" />
          </Href>
        </li>
        {pages.map((page) => (
          <li key={page.name} className="flex items-center gap-2">
            <ChevronRightIcon className="h-5 w-5 shrink-0" />
            {page.href ? (
              <Href underline="hover" href={page.href} className="text-md font-medium" router>
                {page.name}
              </Href>
            ) : (
              <span className="text-md font-medium">{page.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
