import { isNullish } from '@revoke.cash/core/utils';
import { type NextRequest, NextResponse } from 'next/server';
import type { z } from 'zod';

type ParseResult<T> = { data: T; error?: never } | { data?: never; error: NextResponse };

export async function parseRequest<
  ParamsSchema extends z.ZodTypeAny,
  BodySchema extends z.ZodTypeAny,
  QuerySchema extends z.ZodTypeAny = z.ZodUndefined,
>(
  req: NextRequest,
  props: { params: Promise<unknown> | unknown } | undefined,
  schemas: { params: ParamsSchema; body: BodySchema; query?: QuerySchema },
): Promise<ParseResult<{ params: z.infer<ParamsSchema>; body: z.infer<BodySchema>; query: z.infer<QuerySchema> }>> {
  const params = await parseRouteParams(props?.params, schemas.params);
  if (params.error) return params;

  const body = await parseJsonBody(req, schemas.body);
  if (body.error) return body;

  const query = parseQueryString(req, schemas.query);
  if (query.error) return query;

  return { data: { params: params.data, body: body.data, query: query.data } };
}

async function parseRouteParams<Schema extends z.ZodTypeAny>(
  params: Promise<unknown> | unknown,
  schema: Schema,
): Promise<ParseResult<z.infer<Schema>>> {
  const resolvedParams = await params;
  const parsed = schema.safeParse(resolvedParams);

  if (!parsed.success) {
    return {
      error: buildValidationErrorResponse(parsed.error, 'Invalid route params'),
    };
  }

  return { data: parsed.data };
}

async function parseJsonBody<Schema extends z.ZodTypeAny>(
  req: NextRequest,
  schema: Schema,
): Promise<ParseResult<z.infer<Schema>>> {
  const bodyText = await req.text();

  const body = parseBodyText(bodyText);
  if (!isNullish(body) && 'error' in body) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: buildValidationErrorResponse(parsed.error, 'Invalid request body'),
    };
  }

  return { data: parsed.data };
}

function parseQueryString<Schema extends z.ZodTypeAny>(
  req: NextRequest,
  schema: Schema | undefined,
): ParseResult<z.infer<Schema> | undefined> {
  if (!schema) return { data: undefined };

  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return { error: buildValidationErrorResponse(parsed.error, 'Invalid query string') };
  }

  return { data: parsed.data };
}

const parseBodyText = (bodyText?: string) => {
  if (isNullish(bodyText) || bodyText.length === 0) return undefined;

  try {
    return JSON.parse(bodyText);
  } catch {
    return { error: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }) };
  }
};

const buildValidationErrorResponse = (error: z.ZodError, fallbackMessage: string): NextResponse => {
  const taggedIssue = error.issues.find((issue) => !isNullish(getIssueStatusCode(issue)));
  const status = taggedIssue ? getIssueStatusCode(taggedIssue) : 400;
  const message = taggedIssue?.message ?? fallbackMessage;
  return NextResponse.json({ message, issues: error.issues }, { status });
};

// Schemas can attach `params: { status: <code> }` to a `.refine()` to signal a specific HTTP status
const getIssueStatusCode = (issue: z.ZodIssue): number | undefined => {
  if (issue.code !== 'custom') return undefined;
  const status = (issue as z.ZodCustomIssue).params?.status;
  return typeof status === 'number' ? status : undefined;
};
