import { getSession } from 'lib/api/auth';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  switch (method) {
    case 'GET':
      const session = await getSession(req, res);
      delete session.userId;
      await session.save();
      return res.json({ ok: true });
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default handler;
