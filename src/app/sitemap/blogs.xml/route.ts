// src/app/sitemap/blogs.xml/route.ts
import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/db/sqlite';

const BASE_URL = 'https://happymountainnepal.com';

export async function GET() {
  const posts = getAllPosts('published');

  const urls = posts.map((post) => {
    const date = typeof post.date === 'string' ? post.date : post.date.toDate().toISOString();
    const lastMod = new Date(date).toISOString();

    return `
    <url>
      <loc>${`${BASE_URL}/blog/${post.slug}`}</loc>
      <lastmod>${lastMod}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
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
