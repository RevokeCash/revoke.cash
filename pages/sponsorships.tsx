import Divider from 'components/common/Divider';
import Href from 'components/common/Href';
import ContentPageLayout from 'layouts/ContentPageLayout';
import { defaultSEO } from 'lib/next-seo.config';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Image from 'next/image';

// No need to translate this page tbh
const Sponsorships: NextPage = () => {
  return (
    <>
      <NextSeo
        {...defaultSEO}
        title="Revoke.cash Sponsorships"
        description="Sponsor Revoke.cash to help us grow and improve the platform."
      />
      <ContentPageLayout>
        <div className="flex flex-col gap-3 text-lg leading-none">
          <h1>Sponsorships</h1>

          <Divider className="my-2" />

          <div className="flex flex-col gap-3">
            <div>
              Thank you for considering sponsoring Revoke.cash! We try to keep our product free and accessible to
              everyone. To do so, we rely on donations and sponsorships.
            </div>

            <div>
              Our website has 80k+ unique monthly users with a combined 300k+ page views. So displaying your banner on
              our landing page will get you valuable exposure.
            </div>

            <Image src="/assets/images/pageviews.png" width={1200} height={600} />

            <div>
              We have three different sponsorship tiers, each of which gets to display their banner on our landing page
              and gets a special role in our Discord server, with associated sponsors-only channel. Our{' '}
              <span className="text-yellow-600">Gold</span> tier is $2500/m,{' '}
              <span className="text-slate-400">Silver</span> is $1000/m and{' '}
              <span className="text-amber-600">Bronze</span> is $500/m.
            </div>

            <div>
              If you're interested in sponsoring Revoke.cash, please reach out at{' '}
              <Href href="mailto:rosco@revoke.cash" html underline="hover">
                rosco@revoke.cash
              </Href>
              .
            </div>
          </div>
        </div>
      </ContentPageLayout>
    </>
  );
};

export default Sponsorships;
