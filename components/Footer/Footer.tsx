import LogoLink from 'components/common/LogoLink';
import { DISCORD_URL } from 'lib/constants';
import LanguageSelect from './LanguageSelect';

const Footer = () => {
  return (
    <footer className="py-2 mt-auto">
      <div className="flex space-x-2 h-12 justify-center align-middle">
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
