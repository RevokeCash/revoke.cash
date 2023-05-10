import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import Href from './Href';

interface Props {
  pages: {
    name: string;
    href: string;
  }[];
}

const Breadcrump = ({ pages }: Props) => {
  return (
    <nav className="flex mb-5" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-4">
        <li>
          <div>
            <Href
              underline="none"
              href="/"
              className="hover:cursor-pointer hover:opacity-50 hover:bg-gray-100 duration-100"
            >
              <HomeIcon className="h-5 w-5 flex-shrink-0 text-black" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Href>
          </div>
        </li>
        {pages.map((page) => (
          <li key={page.name}>
            <div className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-black" aria-hidden="true" />
              <Href underline="hover" href={page.href} className="ml-4 text-md font-medium ">
                {page.name}
              </Href>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrump;
