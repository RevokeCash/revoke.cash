import { createAPISession, getSession } from 'lib/api/auth';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') return res.status(405).end();

  await createAPISession(req, res);

  const session = await getSession(req, res);

  console.log('Session:', session);

  return res.send({ ok: true });
};

export default handler;
