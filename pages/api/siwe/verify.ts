import { getSession } from 'lib/api/auth';
import { NextApiRequest, NextApiResponse } from 'next';
import { SiweMessage } from 'siwe';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession(req, res);

  const { method } = req;
  switch (method) {
    case 'POST':
      try {
        const { message, signature } = req.body;
        const siweMessage = new SiweMessage(message);

        const siweResponse = await siweMessage.verify({
          signature,

          // @rkalis: Apparently, we can verify on more that just the signature, should we?
          domain: siweMessage.domain,
          nonce: siweMessage.nonce,
          time: siweMessage.issuedAt,
        });

        const verifiedSiweMessage = siweResponse.data;

        // Verify the domain when running in production
        if (process.env.NODE_ENV === 'production' && verifiedSiweMessage.domain !== 'revoke.cash') {
          throw new Error();
        }

        session.siwe = verifiedSiweMessage;
        await session.save();

        res.json({ ok: true, siwe: verifiedSiweMessage });
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
