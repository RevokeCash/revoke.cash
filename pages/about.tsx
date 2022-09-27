import Divider from 'components/common/Divider';
import Heading from 'components/common/Heading';
import ImageLink from 'components/common/ImageLink';
import { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Link from 'next/link';
import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { defaultSEO } from 'utils/next-seo.config';

const About: NextPage = () => {
  return (
    <>
      <NextSeo {...defaultSEO} />
      <div
        style={{
          textAlign: 'left',
          fontSize: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '800px',
          margin: 'auto',
        }}
      >
        <Heading text="About" type="h2" center />

        <div>
          <Heading text="Token allowances" type="h4" />
          To use ERC20, ERC721 and ERC1155 tokens (i.e. fungible tokens and NFTs) in decentralised applications such as{' '}
          Uniswap or OpenSea you have to grant the application permission to spend tokens on your behalf - known as an{' '}
          <span style={{ fontStyle: 'italic' }}>allowance</span>. Allowances are an important part of using these apps,
          but can be dangerous if left unchecked.
        </div>

        <div>
          <Heading text="Risks of allowances" type="h4" />
          Bugs can exists and exploits can happen even in established projects, and by approving token allowances you
          are potentially exposing your wallet to these exploits. To keep yourself safe from allowance exploits it is a
          good practice to regularly inspect and revoke your allowances. Besides revoking you should also be mindful of
          the allowances that you approve in the first place.
        </div>

        <div>
          <Heading text="Revoke.cash" type="h4" />
          Revoke.cash comes in as a preventative tool to manage your token allowances and practice proper wallet
          hygiene. By regularly revoking active allowances you reduce the chances of becoming the victim of allowance
          exploits.
        </div>

        <div>
          <Heading text="Read more" type="h4" />
          To read about Ethereum token allowances in more depth, make sure to read the article{' '}
          <a href="https://kalis.me/unlimited-erc20-allowances/" target="_blank">
            <span style={{ fontStyle: 'italic' }}>Unlimited ERC20 allowances considered harmful</span>
          </a>
          . Also check out the{' '}
          <Link href="/faq">
            <a>FAQ</a>
          </Link>{' '}
          for a quick overview of the most frequently asked questions about allowances and Revoke.cash.
        </div>

        <div>
          <Heading text="Credits" type="h4" />
          Revoke.cash was created by{' '}
          <a href="https://twitter.com/RoscoKalis" target="_blank">
            Rosco Kalis
          </a>{' '}
          in 2019, and since then it has grown to be a staple in web3 security. For the Ethereum chain and several other
          chains allowance data is retrieved directly from the blockchain. For most other chains a combination of{' '}
          <a href="https://etherscan.io/" target="_blank">
            Etherscan
          </a>{' '}
          and{' '}
          <a href="https://www.covalenthq.com/" target="_blank">
            Covalent
          </a>{' '}
          APIs are used.
        </div>

        <div>
          <Heading text="Sponsors" type="h4" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              To keep Revoke.cash free, we rely on donations and sponsorships for revenue. If you want to support us
              with a monthly sponsorship, please reach out through{' '}
              <a href="https://twitter.com/RevokeCash" target="_blank">
                Twitter
              </a>{' '}
              and join the list of these awesome companies and individuals that have committed to a monthly sponsorship
              of Revoke.cash:
            </div>
            <div
              style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
            >
              <ImageLink
                src="/assets/images/vendor/earnifi.png"
                alt="Earni.fi"
                href="https://earni.fi/"
                height={75}
                width={225}
                label="Earni.fi"
              />
            </div>
          </div>
        </div>

        <Divider />

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
          <Link href="/privacy-policy">Privacy Policy</Link>
        </div>
      </div>
    </>
  );
};

export default About;
