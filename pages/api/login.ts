import { wrapIronSessionApiRoute } from 'lib/api/auth';
import { NextApiRequest, NextApiResponse } from 'next';
import requestIp from 'request-ip';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') return res.status(405).end();

  // Store the user's IP as an identifier
  const detectedIp = requestIp.getClientIp(req);
  req.session.ip = detectedIp;
  await req.session.save();

  return res.send({ ok: true });
};

export default wrapIronSessionApiRoute(handler);
