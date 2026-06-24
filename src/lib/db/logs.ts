
'use server';

import type { Log } from '@/lib/types';
import { db } from './sqlite';
import { randomUUID } from 'crypto';

export async function createLog(data: Omit<Log, 'id' | 'timestamp'>): Promise<void> {
    try {
        db.prepare(`
            INSERT INTO logs (
                id, accountId, cookieId, pageAccessed, resourceType, method, statusCode,
                referrer, userAgent, ipAddress, timestamp, isBot, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            randomUUID(),
            (data as any).accountId || null,
            data.cookieId,
            data.pageAccessed,
            data.resourceType,
            data.method || null,
            data.statusCode || null,
            data.referrer || null,
            data.userAgent,
            data.ipAddress || null,
            new Date().toISOString(),
            data.isBot ? 1 : 0,
            JSON.stringify(data.metadata || null)
        );
    } catch (error) {
        console.error('Failed to create log in SQLite:', error);
    }
}

function ensureLogsTable() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY,
            accountId TEXT,
            cookieId TEXT,
            pageAccessed TEXT NOT NULL,
            resourceType TEXT NOT NULL,
            method TEXT,
            statusCode INTEGER,
            referrer TEXT,
            userAgent TEXT NOT NULL,
            ipAddress TEXT,
            timestamp TEXT NOT NULL,
            isBot INTEGER DEFAULT 0,
            metadata TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_logs_cookieId ON logs(cookieId);
    `);
}

function mapLog(row: any): Log {
    return {
        ...row,
        isBot: Boolean(row.isBot),
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    } as Log;
}

function buildWhere(options?: {
    cookieId?: string;
    resourceType?: 'page' | 'api' | 'static' | 'redirect';
    isBot?: boolean;
}) {
    const conditions: string[] = [];
    const params: any[] = [];
    if (options?.cookieId) {
        conditions.push('cookieId = ?');
        params.push(options.cookieId);
    }
    if (options?.resourceType) {
        conditions.push('resourceType = ?');
        params.push(options.resourceType);
    }
    if (options?.isBot !== undefined) {
        conditions.push('isBot = ?');
        params.push(options.isBot ? 1 : 0);
    }
    return {
        clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
        params,
    };
}

export async function getLogs(options?: {
    limit?: number;
    page?: number;
    cookieId?: string;
    resourceType?: 'page' | 'api' | 'static' | 'redirect';
    isBot?: boolean;
}): Promise<{ logs: Log[]; hasMore: boolean; totalPages: number }> {
    ensureLogsTable();
    const limit = options?.limit || 10;
    const page = options?.page || 1;
    const offset = (page - 1) * limit;
    const where = buildWhere(options);
    const totalCount = (db.prepare(`SELECT COUNT(*) as count FROM logs ${where.clause}`).get(...where.params) as { count: number }).count;
    const totalPages = Math.ceil(totalCount / limit);
    const rows = db.prepare(`
        SELECT * FROM logs ${where.clause}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
    `).all(...where.params, limit, offset) as any[];
    return { logs: rows.map(mapLog), hasMore: page < totalPages, totalPages };
}

export async function getLogCount(options?: {
    cookieId?: string;
    resourceType?: 'page' | 'api' | 'static' | 'redirect';
    isBot?: boolean;
}): Promise<number> {
    ensureLogsTable();
    const where = buildWhere(options);
    return (db.prepare(`SELECT COUNT(*) as count FROM logs ${where.clause}`).get(...where.params) as { count: number }).count;
}

export async function deleteLog(id: string): Promise<void> {
    ensureLogsTable();
    db.prepare('DELETE FROM logs WHERE id = ?').run(id);
}

export async function clearOldLogs(daysToKeep: number = 30): Promise<number> {
    ensureLogsTable();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return db.prepare('DELETE FROM logs WHERE timestamp < ?').run(cutoffDate.toISOString()).changes;
}

export async function getUniquePageLogs(options?: {
    limit?: number;
    page?: number;
    resourceType?: 'page' | 'api' | 'static' | 'redirect';
    isBot?: boolean;
}): Promise<{ logs: Log[]; hasMore: boolean; totalPages: number }> {
    ensureLogsTable();
    const where = buildWhere(options);
    const rows = db.prepare(`
        SELECT * FROM logs ${where.clause}
        ORDER BY timestamp DESC
    `).all(...where.params) as any[];
    const uniquePagesMap = new Map<string, Log>();

    rows.forEach(row => {
        const log = mapLog(row);
        const pageKey = log.pageAccessed;
        if (!uniquePagesMap.has(pageKey)) {
            uniquePagesMap.set(pageKey, log);
        }
    });

    const allUniqueLogs = Array.from(uniquePagesMap.values()).sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());

    const limit = options?.limit || 10;
    const page = options?.page || 1;
    const totalCount = allUniqueLogs.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const logs = allUniqueLogs.slice(startIndex, startIndex + limit);

    return { logs, hasMore: page < totalPages, totalPages };
}
