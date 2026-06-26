import { NextRequest, NextResponse } from 'next/server';
import { addTimeInvested } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { activityLogId, seconds } = body as {
            activityLogId?: string;
            seconds?: number;
        };

        if (!activityLogId) {
            return NextResponse.json({ error: 'Missing activityLogId' }, { status: 400 });
        }

        const secondsToAdd = seconds === 10 ? 10 : 10;
        const totalSeconds = await addTimeInvested(activityLogId, secondsToAdd);

        return NextResponse.json({ success: true, totalSeconds });
    } catch (error) {
        console.error('Time invested update error:', error);
        return NextResponse.json(
            { error: 'Failed to update time invested' },
            { status: 500 }
        );
    }
}
