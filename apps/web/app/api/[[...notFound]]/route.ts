import { NextResponse } from 'next/server';

export const runtime = 'edge';

const handleUnmatchedApiRoute = () => NextResponse.json({ message: 'Not Found' }, { status: 404 });

export const GET = handleUnmatchedApiRoute;
export const POST = handleUnmatchedApiRoute;
export const PUT = handleUnmatchedApiRoute;
export const PATCH = handleUnmatchedApiRoute;
export const DELETE = handleUnmatchedApiRoute;
export const HEAD = handleUnmatchedApiRoute;
export const OPTIONS = handleUnmatchedApiRoute;
