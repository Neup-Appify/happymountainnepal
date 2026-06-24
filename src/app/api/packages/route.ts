import { NextRequest, NextResponse } from 'next/server';
import { getAllPackages } from '@/lib/db/sqlite';
import { getPackagesPaginated } from '@/lib/db/tours';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const search = searchParams.get('search')?.trim() || undefined;
  const status = searchParams.get('status')?.trim() || 'published';

  if (pageParam !== null || limitParam !== null || search !== undefined || status !== 'published') {
    const page = Number.parseInt(pageParam || '1', 10);
    const limit = Number.parseInt(limitParam || '10', 10);

    const result = await getPackagesPaginated({
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
      search,
      status,
    });

    return NextResponse.json(result);
  }

  return NextResponse.json({ packages: getAllPackages('published') });
}
