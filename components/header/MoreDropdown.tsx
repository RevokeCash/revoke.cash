import Button from 'components/common/Button';
import DropdownMenu from 'components/common/DropdownMenu';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { twMerge } from 'tailwind-merge';

// This is currently unused, but we can use it to expand the menu beyond what's in the header.
const MoreDropdown = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const isCurrent = router.asPath.startsWith('/learn') || router.asPath.startsWith('/about');

  const menuButton = (
    <div className={twMerge(isCurrent && 'underline underline-offset-8 decoration-2')}>{t('common:nav.more')}</div>
  );

  return (
    <DropdownMenu menuButton={menuButton} style="nav" align="left">
      <Button size="menu" style="secondary" href="/learn" className="text-lg">
        {t('common:nav.learn')}
      </Button>
      <Button size="menu" style="secondary" href="/learn/faq" className="text-lg">
        {t('common:nav.faq')}
      </Button>
      <Button size="menu" style="secondary" href="/about" className="text-lg">
        {t('common:nav.about')}
      </Button>
    </DropdownMenu>
  );
};

export default MoreDropdown;
