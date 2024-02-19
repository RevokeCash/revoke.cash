import { config } from 'dotenv';
config();

export const env = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Could not find .env key: ${key}`);
  }
  return value;
};

export const envNotThrow = (key: string): string | undefined => {
  return process.env[key];
};

export const isDev = () => {
  return env('NODE_ENV') !== 'production';
};

export const isProd = () => {
  return !isDev();
};

/**
 * Get the URL of the current deployment
 * Works with Vercel deployments without using the window object.
 */
export const getURL = (path?: string): URL => {
  const vercelUrl = envNotThrow('NEXT_PUBLIC_URL');
  const envUrl = envNotThrow('URL');
  const branchUrl = envNotThrow('VERCEL_BRANCH_URL');

  if (vercelUrl) {
    return new URL(path, 'https://' + vercelUrl);
  }

  if (branchUrl) {
    return new URL(path, 'http://' + branchUrl);
  }

  if (envUrl) {
    return new URL(path, 'http://' + envUrl);
  }

  throw new Error('Could not find URL');
};

export const isVercel = () => {
  return env('VERCEL') === '1';
};
