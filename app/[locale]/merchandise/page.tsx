import ProseLayout from 'app/layouts/ProseLayout';
import Divider from 'components/common/Divider';
import type { Metadata, NextPage } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import ClaimCodesSection from './ClaimCodesSection';

interface Props {
  params: {
    locale: string;
  };
}

export const dynamic = 'error';

export const generateMetadata = async ({ params: { locale } }): Promise<Metadata> => {
  // const t = await getTranslations({ locale });

  return {
    title: 'Revoke.cash Merchandise',
    description: 'Claim your limited edition Revoke.cash merchandise at in-person events.',
  };
};

const MerchandisePage: NextPage<Props> = ({ params }) => {
  unstable_setRequestLocale(params.locale);
  // const t = useTranslations();

  return (
    <ProseLayout>
      <h1>Revoke.cash Merchandise</h1>
      <Divider className="my-4" />

      <p>
        We believe in sustainability, which is why we do not want to produce merchandise that will end up in landfills.
        Instead, we are producing limited runs of high-quality Revoke.cash merchandise. Doing so, we want to produce
        something that can be worn every day and is not overly recognizable as crypto merch.
      </p>

      <div className="mx-auto my-2 md:my-4 flex flex-col items-center gap-2 not-prose">
        <Image
          src="/assets/images/merchandise/revoke-shirt.jpg"
          alt="First Edition Revoke T-shirt"
          height="1500"
          width="2000"
          className="rounded-lg border border-black dark:border-white"
          priority
          fetchPriority="high"
        />
        <figcaption className="text-base leading-none text-zinc-600 dark:text-zinc-400">
          First Edition Revoke T-shirt
        </figcaption>
      </div>

      <p>
        Since these are limited runs, we will only be giving these out to our users at crypto events that we attend. Our
        inaugural collection is a run of 100 high-quality Revoke t-shirts that will be given out at Devcon 7 in Bangkok,
        Thailand.
      </p>

      <h2>Claiming Your T-shirt at Devcon 7</h2>

      <p>
        In the week leading up to Devcon 7 in Bangkok, we will be generating unique codes for our users. These codes
        will be given out to users who use our new Batch Revoke functionality and add a tip while revoking. After doing
        your batch revoke and tipping, you will receive a unique code that you can use to claim your t-shirt from the
        Revoke team at the event.
      </p>

      <div className="mx-auto my-2 md:my-4 flex flex-col items-center gap-2 not-prose">
        <Image
          src="/assets/images/merchandise/revoke-team-devcon-7.jpg"
          alt="The Revoke Delegation at Devcon 7"
          height="1500"
          width="2000"
          className="rounded-lg border border-black dark:border-white"
        />
        <figcaption className="text-base leading-none text-zinc-600 dark:text-zinc-400">
          The Revoke Delegation at Devcon 7
        </figcaption>
      </div>

      <p>
        We will be wearing our identifiable Revoke team clothing at the event, so if you see us and have a code to
        claim, please come and say hi!
      </p>

      <h2>Future Merchandise</h2>

      <p>
        We don't have concrete plans for future merchandise, but we will update this page and announce on our social
        media when we do. Similar to the first edition, we will be giving them out at events that we attend, and they
        will have a claim code process linked to usage of our product. Let us know if you have anything on your wishlist
        for future merch!
      </p>

      <ClaimCodesSection />
    </ProseLayout>
  );
};

export default MerchandisePage;
