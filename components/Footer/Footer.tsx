import LogoLink from 'components/common/LogoLink';
import { DISCORD_URL } from 'lib/constants';
import LanguageSelect from './LanguageSelect';

const Footer = () => (
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
        <LanguageSelect />
      </div>
    </div>
  </>
);

export default Footer;
