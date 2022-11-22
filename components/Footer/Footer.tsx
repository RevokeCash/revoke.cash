import LogoLink from 'components/common/LogoLink';
import { DISCORD_URL } from 'lib/constants';
import LanguageSelect from './LanguageSelect';

const Footer = () => {
  return (
    <footer className="py-4">
      <div className="flex gap-1 justify-center items-center">
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
    </footer>
  );
};

export default Footer;
