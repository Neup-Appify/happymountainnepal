import { NextResponse } from 'next/server';
import { getAllPackages } from '@/lib/db/sqlite';

export async function GET() {
  return NextResponse.json({ packages: getAllPackages('published') });
}
