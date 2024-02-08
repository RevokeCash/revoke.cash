import { NextApiRequest, NextApiResponse } from 'next';
import { SiweMessage } from 'siwe';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  switch (method) {
    case 'POST':
      try {
        const { message, signature } = req.body;
        const siweMessage = new SiweMessage(message);
        console.log('SiweMessage:', siweMessage);

        const siweResponse = await siweMessage.verify(signature);

        const verifiedSiweMessage = siweResponse.data;

        console.log('Verified SiweMessage:', verifiedSiweMessage);

        // // Verify the domain when running in production
        // if (process.env.NODE_ENV === 'production' && verifiedSiweMessage.domain !== 'revoke.cash') {
        //   throw new Error();
        // }

        // await storeSession(req, res, verifiedSiweMessage);
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
