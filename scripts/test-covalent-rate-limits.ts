import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testCovalentRateLimits = async (chainId: number, rps: number) => {
  const params = {
    'starting-block': 0,
    'ending-block': 1_000_000,
  };

  const auth = {
    username: process.env.COVALENT_API_KEY,
    password: '',
  };

  const send = async (_: any, i: number) => {
    console.log(i);
    return await axios.get(
      `https://api.covalenthq.com/v1/${chainId}/events/topics/0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef/`,
      { params, auth },
    );
  };

  await Promise.all([Array(rps).fill(0).map(send)]);
  console.log('Done');
};

testCovalentRateLimits(Number.parseInt(process.argv[2]), Number.parseInt(process.argv[3]));
