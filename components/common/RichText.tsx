import { DISCORD_URL, DONATION_ADDRESS, TWITTER_URL } from 'lib/constants';
import { FAIRSIDE_APP_URL } from 'lib/coverage/fairside';
import type { ReactNode } from 'react';
import Href from './Href';

interface Props {
  children(tags: Record<Tag, (chunks: ReactNode) => ReactNode>): ReactNode;
}

type Tag = keyof typeof tags;

const tags = {
  i: (children: ReactNode) => <span className="italic">{children}</span>,
  b: (children: ReactNode) => <span className="font-bold">{children}</span>,
  br: () => <br />,
  ul: (children: ReactNode) => <ul className="list-disc list-inside">{children}</ul>,
  li: (children: ReactNode) => <li className="list-item">{children}</li>,
  'rosco-twitter-link': (children: ReactNode) => (
    <Href href="https://twitter.com/RoscoKalis" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'extension-link': (children: ReactNode) => (
    <Href href="/extension" className="font-medium" underline="hover" html router>
      {children}
    </Href>
  ),
  'learn-link': (children: ReactNode) => (
    <Href href="/learn" className="font-medium" underline="hover" html router>
      {children}
    </Href>
  ),
  'gashawk-link': (children: ReactNode) => (
    <Href href="https://gashawk.io" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'twitter-link': (children: ReactNode) => (
    <Href href={TWITTER_URL} className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'discord-link': (children: ReactNode) => (
    <Href href={DISCORD_URL} className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'ens-link': (children: ReactNode) => (
    <Href href="https://ens.domains" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'uns-link': (children: ReactNode) => (
    <Href href="https://unstoppabledomains.com" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'avvy-link': (children: ReactNode) => (
    <Href href="https://avvy.domains" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'faq-link': (children: ReactNode) => (
    <Href href="/learn/faq" className="font-medium" html underline="hover" router>
      {children}
    </Href>
  ),
  'revoking-approvals': (children: ReactNode) => (
    <Href href="/learn/approvals/how-to-revoke-token-approvals" className="font-medium" html underline="hover" router>
      {children}
    </Href>
  ),
  'what-are-token-approvals': (children: ReactNode) => (
    <Href href="/learn/approvals/what-are-token-approvals" className="font-medium" html underline="hover" router>
      {children}
    </Href>
  ),
  'what-is-a-cold-wallet': (children: ReactNode) => (
    <Href href="/learn/wallets/what-is-a-cold-wallet" className="font-medium" html underline="hover" router>
      {children}
    </Href>
  ),
  'fairside-link': (children: ReactNode) => (
    <Href href={FAIRSIDE_APP_URL} className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'nexus-link': (children: ReactNode) => (
    <Href href="https://nexusmutual.io" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'bright-union-link': (children: ReactNode) => (
    <Href href="https://brightunion.io" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'donations-link': (children: ReactNode) => (
    <Href
      href={`https://etherscan.io/address/${DONATION_ADDRESS}`}
      className="font-medium"
      underline="hover"
      html
      external
    >
      {children}
    </Href>
  ),
  'kerberus-link': (children: ReactNode) => (
    <Href
      href="https://www.kerberus.com/extension/?ref=REVOKECASH"
      className="font-medium"
      underline="hover"
      html
      external
    >
      {children}
    </Href>
  ),
  'pudgy-sbt-link': (children: ReactNode) => (
    <Href
      href="https://opensea.io/item/matic/0xd0eb70639146909a5ee1439da1124cb80af2d0b9/11"
      className="font-medium"
      underline="hover"
      html
      external
    >
      {children}
    </Href>
  ),
} as const;

const RichText = ({ children }: Props) => {
  return <>{children(tags)}</>;
};

export default RichText;
