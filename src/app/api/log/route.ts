import { NextRequest, NextResponse } from 'next/server';
import { createLog } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            accountId,
            cookieId,
            pageAccessed,
            resourceType,
            method,
            statusCode,
            referrer,
            userAgent,
            ipAddress,
            isBot,
            metadata
        } = body;

        let finalCookieId = cookieId;

        // If cookieId is not provided in body, try to get it from cookies
        if (!finalCookieId) {
            finalCookieId = request.cookies.get('temp_account')?.value;
        }

        // Fallback if cookie is completely missing (e.g. cookies blocked)
        if (!finalCookieId) {
            finalCookieId = "notdefined";
        }

        const finalUserAgent = userAgent || request.headers.get('user-agent');
        const finalReferrer = referrer || request.headers.get('referer') || undefined;
        const finalIpAddress =
            ipAddress ||
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            request.headers.get('x-real-ip') ||
            undefined;
        const finalAccountId = accountId || request.cookies.get('account_id')?.value || undefined;

        if (!pageAccessed || !resourceType || !finalUserAgent) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const logId = await createLog({
            accountId: finalAccountId,
            cookieId: finalCookieId,
            pageAccessed,
            resourceType,
            method,
            statusCode,
            referrer: finalReferrer,
            userAgent: finalUserAgent,
            ipAddress: finalIpAddress,
            isBot,
            metadata,
        });

        return NextResponse.json({ success: true, logId });
    } catch (error) {
        console.error('Log creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create log' },
            { status: 500 }
        );
    }
}
