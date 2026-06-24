
'use server';

import type { Redirect } from '@/lib/types';
import { logError } from './errors';
import { db } from './sqlite';
import { randomUUID } from 'crypto';

export async function getRedirects(): Promise<Redirect[]> {
    try {
        const rows = db.prepare('SELECT * FROM redirects ORDER BY createdAt DESC').all() as Array<Omit<Redirect, 'permanent'> & { permanent: number }>;
        return rows.map(row => ({ ...row, permanent: Boolean(row.permanent) }));
    } catch (error: any) {
        console.error("Error fetching redirects:", error);
        await logError({ message: `Failed to fetch redirects: ${error.message}`, stack: error.stack, pathname: '/manage/redirects' });
        throw new Error("Could not fetch redirects from the database.");
    }
}

export async function addRedirect(data: Omit<Redirect, 'id' | 'createdAt'>): Promise<string> {
    try {
        const id = randomUUID();
        db.prepare(`
            INSERT INTO redirects (id, source, destination, permanent, createdAt)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, data.source, data.destination, data.permanent ? 1 : 0, new Date().toISOString());
        return id;
    } catch (error: any) {
        console.error("Error adding redirect: ", error);
        await logError({ message: `Failed to add redirect: ${error.message}`, stack: error.stack, pathname: '/manage/redirects', context: { data } });
        throw new Error("Could not add redirect.");
    }
}

export async function deleteRedirect(id: string): Promise<void> {
    try {
        db.prepare('DELETE FROM redirects WHERE id = ?').run(id);
    } catch (error: any) {
        console.error("Error deleting redirect: ", error);
        await logError({ message: `Failed to delete redirect ${id}: ${error.message}`, stack: error.stack, pathname: `/manage/redirects`, context: { redirectId: id } });
        throw new Error("Could not delete redirect.");
    }
}
