import Href from 'components/common/Href';
import { DISCORD_URL, GITHUB_URL, TWITTER_URL } from 'lib/constants';
import useTranslation from 'next-translate/useTranslation';
import LanguageSelect from './LanguageSelect';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="w-full flex flex-col sm:flex-row gap-2 items-center justify-between p-4 md:p-8 bg-black text-gray-300">
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <div>© Revoke.cash 2022</div>
        <div className="flex gap-2 items-center">
          <Href href="/privacy-policy" underline="hover" router>
            {t('common:footer.privacy')}
          </Href>
          <Href href={GITHUB_URL} underline="hover" external>
            GitHub
          </Href>
          <Href href={TWITTER_URL} underline="hover" external>
            Twitter
          </Href>
          <Href href={DISCORD_URL} underline="hover" external>
            Discord
          </Href>
          <LanguageSelect />
        </div>
      </div>
      <div className="flex gap-2 items-center ">
        <div>{t('common:footer.sponsors')}</div>
        <Href href="https://earni.fi/" underline="hover" external>
          Earni.fi
        </Href>
      </div>
    </footer>
  );
};

export default Footer;
