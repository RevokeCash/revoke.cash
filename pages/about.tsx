import Heading from 'components/common/Heading';
import { NextPage } from 'next';
import Link from 'next/link';
import React from 'react';
import 'react-toastify/dist/ReactToastify.css';

const About: NextPage = () => {
  return (
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
      <div>
        <Heading text="Token allowances" type="h2" />
        To use ERC20, ERC721 and ERC1155 tokens (i.e. fungible tokens and NFTs) in decentralised applications such as{' '}
        Uniswap or OpenSea you have to grant the application permission to spend tokens on your behalf - known as an{' '}
        <span style={{ fontStyle: 'italic' }}>allowance</span>. Allowances are an important part of using these apps,
        but can be dangerous if left unchecked.
      </div>

      <div>
        <Heading text="Risks of allowances" type="h2" />
        Bugs can exists and exploits can happen even in established projects, and by approving token allowances you are
        potentially exposing your wallet to these exploits. To keep yourself safe from allowance exploits it is a good
        practice to regularly inspect and revoke your allowances. Besides revoking you should also be mindful of the
        allowances that you approve in the first place.
      </div>

      <div>
        <Heading text="Revoke.cash" type="h2" />
        Revoke.cash comes in as a preventative tool to manage your token allowances and practice proper wallet hygiene.{' '}
        By regularly revoking active allowances you reduce the chances of becoming the victim of allowance exploits.
      </div>

      <div>
        <Heading text="Read more" type="h2" />
        To read about Ethereum token allowances in more depth, make sure to read the article{' '}
        <a href="https://kalis.me/unlimited-erc20-allowances/">
          <span style={{ fontStyle: 'italic' }}>Unlimited ERC20 allowances considered harmful</span>
        </a>
        . Also check out the{' '}
        <Link href="/faq">
          <a>FAQ</a>
        </Link>{' '}
        for a quick overview of the most frequently asked questions about allowances and Revoke.cash.
      </div>

      <div>
        <Heading text="Credits" type="h2" />
        Revoke.cash was created by <a href="https://twitter.com/RoscoKalis">Rosco Kalis</a> in 2019 and is actively
        maintained by him. For the Ethereum chain and several other chains allowance data is retrieved directly from the
        blockchain. For most other chains a combination of <a href="https://etherscan.io/">Etherscan</a> and{' '}
        <a href="https://www.covalenthq.com/">Covalent</a> APIs are used.
      </div>
    </div>
  );
};

export default About;
