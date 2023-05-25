import useTranslation from 'next-translate/useTranslation';
import StickyBox from 'react-sticky-box';
import SidebarLink from './SidebarLink';
import SidebarSection from './SidebarSection';

const Sidebar = () => {
  const { t } = useTranslation();

  return (
    <aside>
      <StickyBox offsetTop={16} offsetBottom={16}>
        <ul className="border border-black dark:border-white rounded-lg bg-white dark:bg-black w-full lg:w-80 px-4 py-2 flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
          <SidebarSection title="Basics" path="/learn/basics" href="/learn/basics/what-is-a-crypto-wallet">
            <SidebarLink href="/learn/basics/what-is-a-crypto-wallet" title="What Is a Crypto Wallet?" />
            <SidebarLink href="/learn/basics/what-are-tokens" title="What Are Tokens?" />
            <SidebarLink href="/learn/basics/what-are-nfts" title="What Are NFTs?" />
          </SidebarSection>
          <SidebarSection
            title="Token Approvals"
            path="/learn/approvals"
            href="/learn/approvals/what-are-token-approvals"
          >
            <SidebarLink href="/learn/approvals/what-are-token-approvals" title="What Are Token Approvals?" />
            <SidebarLink href="/learn/approvals/how-to-revoke-token-approvals" title="How to Revoke Token Approvals" />
          </SidebarSection>
          <SidebarSection title={t('common:nav.faq')} path="/learn/faq" href="/learn/faq" />
        </ul>
      </StickyBox>
    </aside>
  );
};

export default Sidebar;
