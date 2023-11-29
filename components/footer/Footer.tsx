import Divider from 'components/common/Divider';
import Href from 'components/common/Href';
import ColorThemeSelect from 'components/footer/ColorThemeSelect';
import { DISCORD_URL, GITHUB_URL, TWITTER_URL } from 'lib/constants';
import useTranslation from 'next-translate/useTranslation';
import { ReactNode } from 'react';
import LanguageSelect from './LanguageSelect';
import NotCommonBadge from './NotCommonBadge';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-black dark:bg-zinc-900 mt-24" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto max-w-7xl px-8">
        <div className="my-16 grid grid-cols-2 gap-8 xl:col-span-2">
          <div className="md:grid md:grid-cols-2 md:gap-8">
            <FooterSection heading={t('common:footer.product')}>
              <FooterLink href="/token-approval-checker/ethereum" router>
                {t('common:footer.token_approval_checker')}
              </FooterLink>
              <FooterLink href="/extension" router>
                {t('common:footer.extension')}
              </FooterLink>
              <FooterLink href="/exploits" router>
                {t('common:footer.exploit_checker')}
              </FooterLink>
            </FooterSection>
            <FooterSection heading={t('common:footer.learn')}>
              <FooterLink href="/learn" router>
                {t('common:footer.knowledgebase')}
              </FooterLink>
              <FooterLink href="/learn/approvals/what-are-token-approvals" router>
                {t('common:footer.what_are_token_approvals')}
              </FooterLink>
              <FooterLink href="/learn/faq" router>
                {t('common:footer.faq')}
              </FooterLink>
            </FooterSection>
          </div>
          <div className="md:grid md:grid-cols-2 md:gap-8">
            <FooterSection heading={t('common:footer.company')}>
              <FooterLink href="/about" router>
                {t('common:footer.about')}
              </FooterLink>
              <FooterLink href="https://github.com/RevokeCash/brand-assets" external>
                {t('common:footer.brand_assets')}
              </FooterLink>
              <FooterLink href="/sponsorships" router>
                {t('common:footer.sponsors')}
              </FooterLink>
            </FooterSection>
            <FooterSection heading={t('common:footer.community')}>
              <FooterLink href={TWITTER_URL} external>
                Twitter
              </FooterLink>
              <FooterLink href={DISCORD_URL} external>
                Discord
              </FooterLink>
              <FooterLink href={GITHUB_URL} external>
                GitHub
              </FooterLink>
            </FooterSection>
          </div>
        </div>
        <Divider className="my-16 border-zinc-900 dark:border-zinc-800" />
        <div className="my-16 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex flex-col gap-px text-center md:text-left">
            <p className="leading-5 text-zinc-100 dark:text-zinc-100">&copy; 2023 Revoke.cash</p>
            <ul>
              <FooterLink href="/privacy-policy">{t('common:footer.privacy')}</FooterLink>
            </ul>
          </div>
          <div className="flex gap-2 shrink-0">
            <NotCommonBadge />
            <LanguageSelect />
            <ColorThemeSelect />
          </div>
        </div>
      </div>
    </footer>
  );
};

interface FooterSectionProps {
  heading: string;
  children: ReactNode;
}

const FooterSection = ({ heading, children }: FooterSectionProps) => {
  return (
    <div className="mt-8 flex flex-col gap-4">
      <h3 className="text-sm font-semibold leading-6 text-zinc-100">{heading}</h3>
      <ul role="list" className="space-y-2">
        {children}
      </ul>
    </div>
  );
};

interface FooterLinkProps {
  href: string;
  children: ReactNode;
  router?: boolean;
  external?: boolean;
}

const FooterLink = ({ href, children, router, external }: FooterLinkProps) => {
  return (
    <li key={href} className="list-none">
      <Href
        href={href}
        underline="hover"
        className="text-sm text-zinc-400 dark:text-zinc-400 visited:text-zinc-400"
        router={router}
        external={external}
      >
        {children}
      </Href>
    </li>
  );
};

export default Footer;
