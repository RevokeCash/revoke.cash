import { isNullish } from '@revoke.cash/core/utils';
import type { NextRequest } from 'next/server';
import type { z } from 'zod';
import { ValidationError } from './errors';

type ParsedRequest<ParamsSchema extends z.ZodType, BodySchema extends z.ZodType, QuerySchema extends z.ZodType> = {
  params: z.infer<ParamsSchema>;
  body: z.infer<BodySchema>;
  query: z.infer<QuerySchema>;
};

export async function parseRequest<
  ParamsSchema extends z.ZodType,
  BodySchema extends z.ZodType,
  QuerySchema extends z.ZodType = z.ZodUndefined,
>(
  req: NextRequest,
  props: { params: Promise<unknown> | unknown } | undefined,
  schemas: { params: ParamsSchema; body: BodySchema; query?: QuerySchema },
): Promise<ParsedRequest<ParamsSchema, BodySchema, QuerySchema>> {
  const params = await parseRouteParams(props?.params, schemas.params);
  const body = await parseJsonBody(req, schemas.body);
  const query = parseQueryString(req, schemas.query);

  return { params, body, query };
}

async function parseRouteParams<Schema extends z.ZodType>(
  params: Promise<unknown> | unknown,
  schema: Schema,
): Promise<z.infer<Schema>> {
  const resolvedParams = await params;
  const parsed = schema.safeParse(resolvedParams);

  if (!parsed.success) {
    throw buildValidationError(parsed.error, 'Invalid route params');
  }

  return parsed.data;
}

async function parseJsonBody<Schema extends z.ZodType>(req: NextRequest, schema: Schema): Promise<z.infer<Schema>> {
  const bodyText = await req.text();
  const body = parseBodyText(bodyText);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw buildValidationError(parsed.error, 'Invalid request body');
  }

  return parsed.data;
}

function parseQueryString<Schema extends z.ZodType>(req: NextRequest, schema: Schema | undefined): z.infer<Schema> {
  if (!schema) return undefined as z.infer<Schema>;

  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    throw buildValidationError(parsed.error, 'Invalid query string');
  }

  return parsed.data;
}

const parseBodyText = (bodyText?: string) => {
  if (isNullish(bodyText) || bodyText.length === 0) return undefined;

  try {
    return JSON.parse(bodyText);
  } catch {
    throw new ValidationError(400, 'Invalid JSON body');
  }
};

const buildValidationError = (error: z.ZodError, fallbackMessage: string): ValidationError => {
  const taggedIssue = error.issues.find((issue) => !isNullish(getIssueStatusCode(issue)));
  const status = taggedIssue ? (getIssueStatusCode(taggedIssue) ?? 400) : 400;
  const message = taggedIssue?.message ?? fallbackMessage;
  return new ValidationError(status, message, error.issues);
};

// Schemas can attach `params: { status: <code> }` to a `.refine()` to signal a specific HTTP status
const getIssueStatusCode = (issue: z.core.$ZodIssue): number | undefined => {
  if (issue.code !== 'custom') return undefined;
  const status = (issue as { params?: { status?: unknown } }).params?.status;
  return typeof status === 'number' ? status : undefined;
};
