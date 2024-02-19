import { SiweMessage } from 'siwe';
import { getURL } from './env';

export const siweGetNonce = async () => {
  const response = await fetch('/api/siwe/nonce');
  return response.text();
};

export const siweCreateMessage = async (address: string, statement = 'Sign in with Ethereum to Revoke.cash.') => {
  const nonce = await siweGetNonce();

  const url = getURL();

  // Create the SIWE message
  const message = new SiweMessage({
    domain: url.host,
    address,
    statement,
    uri: url.origin,
    version: '1',
    chainId: 1,
    nonce,
  }).prepareMessage();
  return message;
};

export const siweVerifyMessage = async (message: string, signature: string) => {
  const verifyResponse = await fetch('/api/siwe/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, signature }),
  });

  if (!verifyResponse.ok) throw new Error('Error verifying SIWE message');
};
