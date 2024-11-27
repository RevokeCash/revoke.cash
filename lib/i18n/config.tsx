import Href from 'components/common/Href';
import { DISCORD_URL, TWITTER_URL } from 'lib/constants';
import { RichTranslationValues } from 'next-intl';

export const locales = ['en', 'es', 'ja', 'ru', 'zh'] as const;
export const localePrefix = 'as-needed' as const; // Default
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

export const defaultTranslationValues: RichTranslationValues = {
  i: (children) => <span className="italic">{children}</span>,
  b: (children) => <span className="font-bold">{children}</span>,
  'rosco-twitter-link': (children) => (
    <Href href="https://twitter.com/RoscoKalis" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'extension-link': (children) => (
    <Href href="/extension" className="font-medium" underline="hover" html router>
      {children}
    </Href>
  ),
  'learn-link': (children) => (
    <Href href="/learn" className="font-medium" underline="hover" html router>
      {children}
    </Href>
  ),
  'gashawk-link': (children) => (
    <Href href="https://gashawk.io" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'twitter-link': (children) => (
    <Href href={TWITTER_URL} className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'discord-link': (children) => (
    <Href href={DISCORD_URL} className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'ens-link': (children) => (
    <Href href="https://ens.domains" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'uns-link': (children) => (
    <Href href="https://unstoppabledomains.com" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'avvy-link': (children) => (
    <Href href="https://avvy.domains" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'faq-link': (children) => (
    <Href href="/learn/faq" className="font-medium" html underline="hover" router>
      {children}
    </Href>
  ),
  'revoking-approvals': (children) => (
    <Href href="/learn/approvals/how-to-revoke-token-approvals" className="font-medium" html underline="hover" router>
      {children}
    </Href>
  ),
  'what-are-token-approvals': (children) => (
    <Href href="/learn/approvals/what-are-token-approvals" className="font-medium" html underline="hover" router>
      {children}
    </Href>
  ),
};
