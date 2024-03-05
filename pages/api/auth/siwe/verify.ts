import { RevokeDB } from 'lib';
import { getSession } from 'lib/api/auth';
import { getURL, isProd } from 'lib/utils/env';
import { NextApiRequest, NextApiResponse } from 'next';
import { SiweMessage } from 'siwe-viem';

const client = RevokeDB;

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
        if (isProd() && verifiedSiweMessage.domain !== getURL().hostname) {
          throw new Error();
        }

        let user = await client.user.findUnique({
          where: {
            siwe_address: verifiedSiweMessage.address,
          },
        });

        if (!user) {
          console.log(`Creating new user for ${verifiedSiweMessage.address}`);

          user = await client.user.create({
            data: {
              siwe_address: verifiedSiweMessage.address,
            },
          });
        }

        // Store the session
        session.userId = user.id;
        await session.save();

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
