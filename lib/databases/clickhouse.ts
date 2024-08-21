import { createClient } from '@clickhouse/client';

let client: undefined | ReturnType<typeof createClient>;

export const getClickHouse = () => {
  if (!client) {
    client = createClient({
      url: process.env.CLICKHOUSE_URL,
    });
  }
  return client;
};
