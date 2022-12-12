import Href from 'components/common/Href';
import { DISCORD_URL, GITHUB_URL, TWITTER_URL } from 'lib/constants';
import LanguageSelect from './LanguageSelect';

const Footer = () => {
  return (
    <footer className="flex flex-col sm:flex-row gap-2 items-center justify-between">
      <div className="flex gap-2 items-center">
        <div>© Revoke.cash 2022</div>
        <Href href="/privacy-policy" style="black" underline="hover" router>
          Privacy
        </Href>
        <Href href={GITHUB_URL} style="black" underline="hover" external>
          GitHub
        </Href>
        <Href href={TWITTER_URL} style="black" underline="hover" external>
          Twitter
        </Href>
        <Href href={DISCORD_URL} style="black" underline="hover" external>
          Discord
        </Href>
        <LanguageSelect />
      </div>
      <div className="flex gap-2 items-center">
        <div>Sponsors:</div>
        <Href href="https://earni.fi/" style="black" underline="hover" external>
          Earni.fi
        </Href>
      </div>
    </footer>
  );
};

export default Footer;
