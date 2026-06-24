
import { NextResponse } from 'next/server';
import { getAllPackages } from '@/lib/db/sqlite';
import { resolveUrlTemplates } from '@/lib/url-utils';

const BASE_URL = 'https://happymountainnepal.com'; // Replace with your actual domain

// Function to escape XML special characters
function escapeXml(unsafe: string): string {
    if (typeof unsafe !== 'string') {
        return '';
    }
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
}

export async function GET() {
    try {
        const tours = getAllPackages('published');

        const itemsXml = tours.map(tour => {
            // Use the mainImage object, which has url and caption
            const mainImage = tour.mainImage;
            const imageUrl = mainImage?.url ? resolveUrlTemplates(mainImage.url, BASE_URL) : '';

            return `
        <item>
            <g:id>${escapeXml(tour.id)}</g:id>
            <g:title>${escapeXml(tour.name)}</g:title>
            <g:description>${escapeXml(stripHtml(tour.description))}</g:description>
            <g:link>${`${BASE_URL}/tours/${tour.slug}`}</g:link>
            <g:image_link>${escapeXml(imageUrl)}</g:image_link>
            <g:availability>in stock</g:availability>
            <g:price>${tour.price} USD</g:price>
            <g:brand>Happy Mountain Nepal</g:brand>
            <g:identifier_exists>no</g:identifier_exists>
        </item>`;
        }).join('');

        const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
    <channel>
        <title>Happy Mountain Nepal - Product Feed</title>
        <link>${BASE_URL}</link>
        <description>Tour and trekking packages from Happy Mountain Nepal.</description>
        ${itemsXml}
    </channel>
</rss>`;

        return new NextResponse(feed, {
            headers: {
                'Content-Type': 'application/xml',
            },
        });
    } catch (error) {
        console.error("Failed to generate products.xml:", error);
        return new NextResponse('<error>Failed to generate product feed</error>', {
            status: 500,
            headers: {
                'Content-Type': 'application/xml',
            },
        });
    }
}
