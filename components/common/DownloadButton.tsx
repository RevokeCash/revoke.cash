import useTranslation from 'next-translate/useTranslation';
import type { ReactNode } from 'react';

interface Props {
  href: string;
  children: ReactNode;
}

const DownloadButton = ({ href, children }: Props) => {
  const { t } = useTranslation();

  return (
    <a
      href={href}
      target="_blank"
      className="flex justify-center items-center gap-x-3  h-10 duration-100 disabled:hover:bg-current rounded border border-black bg-white px-4 py-1.5 text-sm font-medium text-black hover:text-white  hover:bg-gray-900 focus:outline-none"
    >
      <div>{t('common:buttons.download')}</div>
      <div className="flex gap-x-2">{children}</div>
    </a>
  );
};

export default DownloadButton;
