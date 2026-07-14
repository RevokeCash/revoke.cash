import {
  CHROME_EXTENSION_URL,
  DISCORD_URL,
  DONATION_ADDRESS,
  GITHUB_URL,
  TELEGRAM_URL,
  TWITTER_URL,
} from '@revoke.cash/core/constants';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import Href from 'components/common/Href';
import ColorThemeSelect from 'components/footer/ColorThemeSelect';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import LanguageSelect from './LanguageSelect';

const Footer = () => {
  const t = useTranslations();

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 mt-24">
      <h2 className="sr-only">Footer</h2>

      <div className="mx-auto max-w-7xl px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <FooterSection heading={t('common.footer.product')}>
            <FooterLink href="/token-approval-checker/ethereum" router>
              {t('common.footer.token_approval_checker')}
            </FooterLink>
            <FooterLink href={CHROME_EXTENSION_URL} external>
              {t('common.footer.extension')}
            </FooterLink>
            <FooterLink href="/exploits" router>
              {t('common.footer.exploit_checker')}
            </FooterLink>
            <FooterLink href="/premium" router>
              {t('common.footer.premium')}
            </FooterLink>
          </FooterSection>
          <FooterSection heading={t('common.footer.learn')}>
            <FooterLink href="/learn" router>
              {t('common.footer.knowledgebase')}
            </FooterLink>
            <FooterLink href="/learn/approvals/what-are-token-approvals" router>
              {t('common.footer.what_are_token_approvals')}
            </FooterLink>
            <FooterLink href="/learn/security/what-to-do-when-scammed" router>
              {t('common.footer.what_to_do_when_scammed')}
            </FooterLink>
            <FooterLink href="/learn/faq" router>
              {t('common.footer.faq')}
            </FooterLink>
          </FooterSection>
          <FooterSection heading={t('common.footer.company')}>
            <FooterLink href="/blog" router>
              {t('common.footer.blog')}
            </FooterLink>
            <FooterLink href="/about" router>
              {t('common.footer.about')}
            </FooterLink>
            <FooterLink href="https://github.com/RevokeCash/brand-assets" external>
              {t('common.footer.brand_assets')}
            </FooterLink>
            <FooterLink href="/merchandise" router>
              {t('common.nav.merchandise')}
            </FooterLink>
          </FooterSection>
          <FooterSection heading={t('common.footer.community')}>
            <FooterLink href={TWITTER_URL} external>
              Twitter
            </FooterLink>
            <FooterLink href={DISCORD_URL} external>
              Discord
            </FooterLink>
            <FooterLink href={TELEGRAM_URL} external>
              Telegram
            </FooterLink>
            <FooterLink href={GITHUB_URL} external>
              GitHub
            </FooterLink>
          </FooterSection>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex flex-col gap-px text-center md:text-left">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">&copy; 2026 Revoke.cash</div>
            <ul className="flex justify-center md:justify-start items-center gap-1 text-sm">
              <FooterLink href="/acknowledgements">{t('common.footer.acknowledgements')}</FooterLink>
              <span className="text-zinc-400">•</span>
              <FooterLink href="/privacy-policy">{t('common.footer.privacy')}</FooterLink>
              <span className="text-zinc-400">•</span>
              <FooterLink href="/terms">{t('common.footer.terms')}</FooterLink>
            </ul>
            <div className="flex justify-center md:justify-start items-center gap-1 text-xs text-zinc-500 dark:text-zinc-500">
              {t('common.footer.donations')}:
              <FooterLink href={`https://etherscan.io/address/${DONATION_ADDRESS}`} external>
                {shortenAddress(DONATION_ADDRESS)}
              </FooterLink>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
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
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{heading}</h3>
      <ul className="flex flex-col gap-2">{children}</ul>
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
        className="text-sm text-zinc-500 dark:text-zinc-400 visited:text-zinc-500 dark:visited:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
        router={router}
        external={external}
      >
        {children}
      </Href>
    </li>
  );
};

export default Footer;
