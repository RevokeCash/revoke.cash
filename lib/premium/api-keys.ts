import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { getDb } from 'lib/db/client';
import { premiumApiKeys } from 'lib/db/schema/premium';

export type PremiumApiKeyScope = 'reconcile';

const parseBearerToken = (authorizationHeader: string | null): string | null => {
  if (!authorizationHeader) return null;

  const [scheme, token, ...rest] = authorizationHeader.trim().split(/\s+/);
  if (rest.length > 0) return null;
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;

  return token;
};

export const getPremiumApiKeyFromHeaders = (headers: Headers): string | null => {
  return parseBearerToken(headers.get('authorization'));
};

export const hashPremiumApiKey = (apiKey: string): string => {
  return createHash('sha256').update(apiKey).digest('hex');
};

export const hasPremiumApiKeyAccess = async (apiKey: string | null, scope: PremiumApiKeyScope): Promise<boolean> => {
  if (!apiKey) return false;

  const db = getDb();
  const keyHash = hashPremiumApiKey(apiKey);

  const apiKeyRow = await db.query.premiumApiKeys.findFirst({
    where: and(eq(premiumApiKeys.keyHash, keyHash), eq(premiumApiKeys.scope, scope), eq(premiumApiKeys.isActive, true)),
    columns: { id: true },
  });

  if (!apiKeyRow) return false;

  await db.update(premiumApiKeys).set({ lastUsedAt: new Date() }).where(eq(premiumApiKeys.id, apiKeyRow.id));

  return true;
};
