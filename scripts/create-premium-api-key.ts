import { randomBytes } from 'node:crypto';
import { getDb } from 'lib/db/client';
import { premiumApiKeys } from 'lib/db/schema/premium';
import { hashPremiumApiKey } from 'lib/premium/api-keys';

const DEFAULT_NAME = 'premium-reconcile';

const main = async () => {
  const name = process.argv[2]?.trim() || DEFAULT_NAME;
  const apiKey = `pkey_live_${randomBytes(24).toString('hex')}`;
  const keyHash = hashPremiumApiKey(apiKey);

  const db = getDb();
  const [insertedKey] = await db
    .insert(premiumApiKeys)
    .values({
      name,
      scope: 'reconcile',
      keyHash,
      isActive: true,
    })
    .returning({
      id: premiumApiKeys.id,
      createdAt: premiumApiKeys.createdAt,
    });

  console.log(`Created premium API key "${name}"`);
  console.log(`id: ${insertedKey.id}`);
  console.log(`createdAt: ${insertedKey.createdAt.toISOString()}`);
  console.log('Copy this API key now (it is only shown once):');
  console.log(apiKey);
};

main().catch((error) => {
  console.error('Failed to create premium API key');
  console.error(error);
  process.exit(1);
});
