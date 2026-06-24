
'use server';

import type { SiteError } from '@/lib/types';
import { db } from './sqlite';
import { randomUUID } from 'crypto';

export async function logError(errorData: Omit<SiteError, 'id' | 'createdAt'>): Promise<void> {
    try {
        db.prepare(`
            INSERT INTO errors (id, message, stack, componentStack, pathname, createdAt, context)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            randomUUID(),
            errorData.message,
            errorData.stack || null,
            errorData.componentStack || null,
            errorData.pathname,
            new Date().toISOString(),
            JSON.stringify(errorData.context || null)
        );
    } catch (error) {
        console.error('Failed to log error to SQLite:', error);
    }
}

export async function getErrors(): Promise<SiteError[]> {
    try {
        const rows = db.prepare('SELECT * FROM errors ORDER BY createdAt DESC').all() as any[];
        return rows.map(row => ({
            ...row,
            context: row.context ? JSON.parse(row.context) : undefined,
        })) as SiteError[];
    } catch (error: any) {
        console.error("Error fetching errors:", error);
        await logError({ message: `Failed to fetch errors: ${error.message}`, stack: error.stack, pathname: '/manage/site/errors' });
        throw new Error("Could not fetch errors from the database.");
    }
}

export async function getErrorById(id: string): Promise<SiteError | null> {
    const row = db.prepare('SELECT * FROM errors WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
        ...row,
        context: row.context ? JSON.parse(row.context) : undefined,
    } as SiteError;
}
