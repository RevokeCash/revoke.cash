import { user } from '@prisma/client';
import { RevokeDB } from 'lib';
import { getSession } from 'lib/api/auth';
import { NextApiRequest, NextApiResponse } from 'next';

const client = RevokeDB;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);
  if (!session.userId) {
    return res.status(200).json(null);
  }

  const { method } = req;
  switch (method) {
    case 'GET':
      const account = await client.user.findUnique({
        where: {
          id: session.userId,
        },
        include: {
          alert_rules: true,
        },
      });

      if (!account) {
        return res.status(200).json(null);
      }

      return res.json(account);

    case 'PUT':
      // TODO: Add validation, this is super dangerous of course
      const body: Partial<user> = req.body;

      const updatedUser = await client.user.update({
        where: {
          id: session.userId,
        },
        data: body,
      });

      return res.json(updatedUser);

    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default handler;
