import { redirect } from 'lib/i18n/navigation';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

const AccountPage = async ({ params }: Props) => {
  const { locale } = await params;
  redirect({ href: '/account/subscription', locale });
};

export default AccountPage;
