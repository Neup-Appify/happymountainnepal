// src/app/sitemap/packages.xml/route.ts
import { NextResponse } from 'next/server';
import { getAllPackages } from '@/lib/db/sqlite';

const BASE_URL = 'https://happymountainnepal.com';

export async function GET() {
  const tours = getAllPackages('published');

  const urls = tours.map((tour) => {
    const datedTour = tour as typeof tour & { updatedAt?: string; createdAt?: string };
    const lastMod = new Date(datedTour.updatedAt || datedTour.createdAt || new Date().toISOString()).toISOString();
    return `
    <url>
      <loc>${`${BASE_URL}/tours/${tour.slug}`}</loc>
      <lastmod>${lastMod}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.9</priority>
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
