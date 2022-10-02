import { CHAIN_SELECT_MAINNETS, DISCORD_URL } from 'components/common/constants';
import LogoLink from 'components/common/LogoLink';
import ChainLogoLink from 'components/Footer/ChainLogoLink';
import React from 'react';

const Footer: React.FC = () => (
  <>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'start',
        gap: '10px',
        padding: '20px',
        width: '100%',
        margin: 'auto',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
        <LogoLink
          src="/assets/images/vendor/github.png"
          alt="Source Code"
          href="https://github.com/rkalis/revoke.cash"
        />
        <LogoLink
          src="/assets/images/vendor/twitter.png"
          alt="Official Twitter"
          href="https://twitter.com/RevokeCash"
        />
        <LogoLink src="/assets/images/vendor/discord.png" alt="Official Discord" href={DISCORD_URL} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
        {CHAIN_SELECT_MAINNETS.map((chainId) => (
          <ChainLogoLink chainId={chainId} />
        ))}
      </div>
    </div>
  </>
);

export default Footer;
