import { PageViewSchema, trackPageView } from 'lib/databases/analytics';

export const POST = async (req: Request) => {
  const _body = await req.json();

  const data = await PageViewSchema.validate(_body, { stripUnknown: true }).catch(() => {});

  if (data) {
    await trackPageView(data).catch(() => {});
  }

  return new Response('OK');
};
