import { type NextRequest, NextResponse } from 'next/server';
import type { z } from 'zod';

type ParseResult<T> = { data: T; error?: never } | { data?: never; error: NextResponse };

export async function parseJsonBody<Schema extends z.ZodTypeAny>(
  req: NextRequest,
  schema: Schema,
): Promise<ParseResult<z.infer<Schema>>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }) };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: NextResponse.json({ message: 'Invalid request body', issues: parsed.error.issues }, { status: 400 }),
    };
  }

  return { data: parsed.data };
}

export function parseRouteParams<Schema extends z.ZodTypeAny>(
  params: unknown,
  schema: Schema,
): ParseResult<z.infer<Schema>> {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return {
      error: NextResponse.json({ message: 'Invalid route params', issues: parsed.error.issues }, { status: 400 }),
    };
  }
  return { data: parsed.data };
}
