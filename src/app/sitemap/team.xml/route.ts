// src/app/sitemap/team.xml/route.ts
import { NextResponse } from 'next/server';
import { getTeamMembers } from '@/lib/db/team';

const BASE_URL = 'https://happymountainnepal.com';

export async function GET() {
  const members = await getTeamMembers();

  const urls = members.map((member) => {
    return `
    <url>
      <loc>${`${BASE_URL}/about/teams/${member.slug}`}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>yearly</changefreq>
      <priority>0.6</priority>
    </url>`;
  }).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
