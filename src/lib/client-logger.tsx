'use client';

import { useEffect, useRef } from 'react';
import { classifyUserAgent } from '@/lib/log-classification';
import { usePathname } from 'next/navigation';

const ACTIVITY_INTERVAL_MS = 10_000;
const PASSIVE_ALLOWANCE_SECONDS = 60;

type PageViewLogResponse = {
    success: boolean;
    logId?: string;
};

// Log a page view
export async function logPageView(pathname: string): Promise<string | null> {
    try {
        const userAgent = navigator.userAgent;
        const response = await fetch('/api/log', {
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

        if (!response.ok) {
            return null;
        }

        const payload = await response.json() as PageViewLogResponse;
        return payload.logId || null;
    } catch (error) {
        console.error('Failed to log page view:', error);
        return null;
    }
}

// Component to track page views on client-side navigation
export function PageViewTracker() {
    const pathname = usePathname();
    const activeLogIdRef = useRef<string | null>(null);
    const loggedSecondsRef = useRef(0);
    const hasRecentInteractionRef = useRef(true);
    const isWindowFocusedRef = useRef(true);

    useEffect(() => {
        let cancelled = false;

        activeLogIdRef.current = null;
        loggedSecondsRef.current = 0;
        hasRecentInteractionRef.current = true;

        logPageView(pathname).then((logId) => {
            if (!cancelled) {
                activeLogIdRef.current = logId;
            }
        });

        return () => {
            cancelled = true;
            activeLogIdRef.current = null;
            loggedSecondsRef.current = 0;
            hasRecentInteractionRef.current = true;
        };
    }, [pathname]);

    useEffect(() => {
        const markInteraction = () => {
            hasRecentInteractionRef.current = true;
        };

        const handleFocus = () => {
            isWindowFocusedRef.current = true;
            hasRecentInteractionRef.current = true;
        };

        const handleBlur = () => {
            isWindowFocusedRef.current = false;
        };

        window.addEventListener('mousemove', markInteraction, { passive: true });
        window.addEventListener('scroll', markInteraction, { passive: true });
        window.addEventListener('keydown', markInteraction);
        window.addEventListener('click', markInteraction, { passive: true });
        window.addEventListener('touchstart', markInteraction, { passive: true });
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('mousemove', markInteraction);
            window.removeEventListener('scroll', markInteraction);
            window.removeEventListener('keydown', markInteraction);
            window.removeEventListener('click', markInteraction);
            window.removeEventListener('touchstart', markInteraction);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    useEffect(() => {
        const intervalId = window.setInterval(async () => {
            const activityLogId = activeLogIdRef.current;
            if (!activityLogId) return;
            if (document.visibilityState !== 'visible') return;
            if (!isWindowFocusedRef.current) return;

            const canLog =
                loggedSecondsRef.current < PASSIVE_ALLOWANCE_SECONDS ||
                hasRecentInteractionRef.current;

            if (!canLog) return;

            try {
                const response = await fetch('/api/log/time-invested', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        activityLogId,
                        seconds: 10,
                    }),
                });

                if (!response.ok) {
                    return;
                }

                loggedSecondsRef.current += 10;
                if (loggedSecondsRef.current >= PASSIVE_ALLOWANCE_SECONDS) {
                    hasRecentInteractionRef.current = false;
                }
            } catch (error) {
                console.error('Failed to update time invested:', error);
            }
        }, ACTIVITY_INTERVAL_MS);

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

    return null;
}
