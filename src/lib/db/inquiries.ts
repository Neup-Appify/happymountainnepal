
'use server';

import { v4 as uuidv4 } from 'uuid';
import type { CustomizeTripInput } from "@/ai/flows/customize-trip-flow";
import { logError } from './errors';
import { db } from './sqlite';

// This is a union type to represent both kinds of inquiries
export type Inquiry = {
    id: string;
    createdAt: string;
    type: 'customization' | 'contact' | 'booking';
    page?: string;
    temporary_id?: string;
    // Optional fields depending on type
    conversation?: CustomizeTripInput;
    data?: any; // Generic data field for contact and booking
};


export async function saveInquiry(inquiryData: Omit<Inquiry, 'id' | 'createdAt'>): Promise<string> {
    try {
        const id = uuidv4();
        const createdAt = new Date().toISOString();

        db.prepare(`
            INSERT INTO inquiries (id, type, page, temporary_id, conversation, data, createdAt)
            VALUES (@id, @type, @page, @temporary_id, @conversation, @data, @createdAt)
        `).run({
            id,
            type: inquiryData.type,
            page: inquiryData.page ?? null,
            temporary_id: inquiryData.temporary_id ?? null,
            conversation: inquiryData.conversation ? JSON.stringify(inquiryData.conversation) : null,
            data: inquiryData.data ? JSON.stringify(inquiryData.data) : null,
            createdAt,
        });

        return id;
    } catch (error: any) {
        console.error("[DB saveInquiry] Error saving inquiry: ", error);
        await logError({
            message: `Failed to save inquiry of type ${inquiryData.type}: ${error.message}`,
            stack: error.stack,

            pathname: inquiryData.page || 'unknown',
            context: { inquiryData }
        });
        throw new Error("Could not save inquiry to the database.");
    }
}



export async function getInquiries(): Promise<Inquiry[]> {
    try {
        const rows = db.prepare('SELECT * FROM inquiries ORDER BY createdAt DESC').all() as Array<{
            id: string;
            type: 'customization' | 'contact' | 'booking';
            page: string | null;
            temporary_id: string | null;
            conversation: string | null;
            data: string | null;
            createdAt: string;
        }>;

        return rows.map((row) => {
            return {
                id: row.id,
                type: row.type,
                page: row.page ?? undefined,
                temporary_id: row.temporary_id ?? undefined,
                conversation: row.conversation ? JSON.parse(row.conversation) as CustomizeTripInput : undefined,
                data: row.data ? JSON.parse(row.data) : undefined,
                createdAt: row.createdAt,
            } as Inquiry;
        });
    } catch (error: any) {
        console.error("Error fetching inquiries: ", error);
        await logError({ message: `Failed to fetch inquiries: ${error.message}`, stack: error.stack, pathname: '/manage/inquiries' });
        throw new Error("Could not fetch inquiries from the database.");
    }
}

export async function saveContactInquiry(data: { page: string, temporary_id: string, data: any }): Promise<string> {
    return saveInquiry({
        ...data,
        type: 'contact'
    });
}

