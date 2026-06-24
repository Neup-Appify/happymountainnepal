
import { NextRequest, NextResponse } from 'next/server';
import { saveContactInquiry } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, phone, subject, message, page } = body;

        if (!name || (!email && !phone) || !subject || !message || !page) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get user identifier from 'temp_account' cookie, fallback to 'unknown_user'
        const temporaryId = request.cookies.get('temp_account')?.value || 'unknown_user';
        
        const inquiryPayload = {
            page,
            temporary_id: temporaryId,
            data: { name, email, phone, subject, message }
        };

        await saveContactInquiry(inquiryPayload);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Error in /api/contact-inquiry:', error);
        return NextResponse.json({ error: 'Failed to process inquiry' }, { status: 500 });
    }
}
