import dotenv from 'dotenv';
import ky from 'lib/ky';

dotenv.config();

const testCovalentRateLimits = async (chainId: number, rps: number) => {
  const searchParams = {
    'starting-block': 'earliest',
    'ending-block': 1_000_000,
  };

  const headers = {
    Authorization: `Basic ${Buffer.from(`${process.env.COVALENT_API_KEY}:`).toString('base64')}`,
  };

  const send = async (_: any, i: number) => {
    console.log(i);
    try {
      return await ky
        .get(
          `https://api.covalenthq.com/v1/${chainId}/events/topics/0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef/`,
          { searchParams, headers },
        )
        .json<any>();
    } catch (e) {
      console.error((e as any).data);
      return null;
    }
  };

  await Promise.all([Array(rps).fill(0).map(send)]);
  console.log('Done');
};

testCovalentRateLimits(Number.parseInt(process.argv[2]), Number.parseInt(process.argv[3]));
