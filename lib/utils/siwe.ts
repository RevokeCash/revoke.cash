import { SiweMessage } from 'siwe-viem';

export const siweGetNonce = async () => {
  const response = await fetch('/api/auth/siwe/nonce');
  return response.text();
};

export const siweCreateMessage = async (address: string, statement = 'Sign in with Ethereum to Revoke.cash.') => {
  const nonce = await siweGetNonce();

  // Create the SIWE message
  const message = new SiweMessage({
    domain: window.location.hostname,
    address,
    statement,
    uri: window.origin,
    version: '1',
    chainId: 1,
    nonce,
  }).prepareMessage();
  return message;
};

export const siweVerifyMessage = async (message: string, signature: string) => {
  const verifyResponse = await fetch('/api/auth/siwe/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, signature }),
  });

  if (!verifyResponse.ok) throw new Error('Error verifying SIWE message');
};
