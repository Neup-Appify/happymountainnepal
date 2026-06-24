'use client';

import { useEffect } from 'react';
import { classifyUserAgent } from '@/lib/log-classification';
import { usePathname } from 'next/navigation';

// Log a page view
export async function logPageView(pathname: string) {
    try {
        const userAgent = navigator.userAgent;
        await fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // The cookieId will be extracted from headers on the server-side via the middleware
                pageAccessed: pathname,
                resourceType: 'page',
                method: 'GET',
                statusCode: 200,
                referrer: document.referrer || undefined,
                userAgent,
                isBot: classifyUserAgent(userAgent).isBot,
                metadata: {
                    source: 'client-navigation',
                    screenWidth: window.innerWidth,
                    screenHeight: window.innerHeight,
                },
            }),
        });
    } catch (error) {
        console.error('Failed to log page view:', error);
    }
}

// Component to track page views on client-side navigation
export function PageViewTracker() {
    const pathname = usePathname();

    useEffect(() => {
        // Log page view on client-side navigation
        logPageView(pathname);
    }, [pathname]);

    return null;
}
