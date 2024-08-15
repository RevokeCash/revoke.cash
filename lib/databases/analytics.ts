import { InferType, object, string } from 'yup';
import { getClickHouse } from './clickhouse';

const client = getClickHouse();

export const PageViewSchema = object({
  path: string().required(),
  affiliate: string(),
  referrer: string(),
  agent: string(),
  hostname: string().required(),
});

export type PageViewData = InferType<typeof PageViewSchema>;

const tableName = 'page_view';

export const trackPageView = async (data: PageViewData) => {
  await client.insert({
    table: tableName,
    values: [data],
    format: 'JSONEachRow',
  });
};
