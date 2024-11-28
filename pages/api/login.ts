import { storeSession } from 'lib/api/auth';
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') return res.status(405).end();

  await storeSession(req, res);

  return res.send({ ok: true });
};

export default handler;
