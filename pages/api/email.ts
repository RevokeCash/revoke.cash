import { getSession } from 'lib/api/auth';
import { NextApiRequest, NextApiResponse } from 'next';
import * as Yup from 'yup';

const PostSchema = Yup.object({
  email: Yup.string().email().required(),
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);

  const { method } = req;
  switch (method) {
    case 'POST':
      try {
        const body = await PostSchema.validate(req.body);

        if (!session?.userId) {
          throw new Error('No SIWE session');
        }

        res.json({ ok: true });
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
