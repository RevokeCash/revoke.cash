import Divider from 'components/common/Divider';
import Href from 'components/common/Href';
import ProseLayout from 'layouts/ProseLayout';
import { defaultSEO } from 'lib/next-seo.config';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Image from 'next/image';

// No need to translate this page tbh
const SponsorshipsPage: NextPage = () => {
  return (
    <>
      <NextSeo
        {...defaultSEO}
        title="Revoke.cash Sponsorships"
        description="Consider sponsoring Revoke.cash to help us grow and improve the platform. There are three tiers of sponsorships available: Gold, Silver & Bronze."
      />
      <ProseLayout>
        <h1>Become a Sponsor</h1>
        <Divider className="my-4" />

        <p>
          Thank you for considering sponsoring Revoke.cash! We want to provide everyone with free and accessible
          security tooling. To do so, we rely on donations and sponsorships.
        </p>

        <p>
          Revoke.cash averages 350k+ page views per month and is used by beginners and seasoned crypto users alike. So
          displaying your banner in the Sponsors section of our landing page will get you valuable exposure.
        </p>

        <Image
          src="/assets/images/pageviews.png"
          alt="Revoke.cash Pageview Graph"
          width="1985"
          height="736"
          className="rounded-lg border border-black dark:border-white"
        />

        <p>
          We have three different sponsorship tiers, each of which gets to display their banner on our landing page. As
          an extra, you will get a special role in our Discord server and access to a sponsors-only channel. Our{' '}
          <span className="text-yellow-600">Gold</span> tier is $2500/m, <span className="text-slate-400">Silver</span>{' '}
          is $1000/m and <span className="text-amber-600">Bronze</span> is $500/m.
        </p>

        <p>
          If you're interested in sponsoring Revoke.cash, please reach out to{' '}
          <Href href="mailto:rosco@revoke.cash" html underline="hover">
            rosco@revoke.cash
          </Href>
          .
        </p>
      </ProseLayout>
    </>
  );
};

export default SponsorshipsPage;
