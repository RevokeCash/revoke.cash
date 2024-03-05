import { alert_trigger } from '@prisma/client';
import { newAlertRuleSchema } from 'components/account/AddAlertRuleForm';
import { RevokeDB } from 'lib';
import { getSession } from 'lib/api/auth';
import { NextApiRequest, NextApiResponse } from 'next';

const client = RevokeDB;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);
  const user = await client.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  if (!user) {
    return res.status(200).json(null);
  }

  const { method } = req;
  switch (method) {
    case 'POST':
      try {
        const body = await newAlertRuleSchema.validate(req.body);

        const newAlertRule = await client.alert_rule.create({
          data: {
            transport: body.transport,
            trigger: body.trigger as alert_trigger,
            user: {
              connect: {
                id: session.userId,
              },
            },
            wallet: {
              connectOrCreate: {
                create: {
                  address: user.siwe_address,
                  chain_id: 1,
                },
                where: {
                  address_chain_id: {
                    address: user.siwe_address,
                    chain_id: 1,
                  },
                },
              },
            },
          },
        });

        res.json(newAlertRule);
      } catch (_error) {
        console.error(_error);
        res.json({ ok: false });
      }
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
};

export default handler;
