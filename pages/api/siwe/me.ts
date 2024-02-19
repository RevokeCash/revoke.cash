import { getSession } from 'lib/api/auth';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);

  const { method } = req;
  switch (method) {
    case 'GET':
      res.send({ session: session.siwe });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default handler;
