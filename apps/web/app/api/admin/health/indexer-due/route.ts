import { getDueIndexerScanRows } from '@revoke.cash/core/admin/health';
import { handleAdminRead } from 'lib/api/admin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return handleAdminRead(req, () => getDueIndexerScanRows());
}
