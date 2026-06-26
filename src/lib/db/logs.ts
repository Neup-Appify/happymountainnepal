
'use server';

import { classifyReferrerSource, classifyUserAgent } from '@/lib/log-classification';
import type { Log } from '@/lib/types';
import { db } from './sqlite';
import { randomUUID } from 'crypto';

const IPINFO_TOKEN = '9d68144669e6f0';
const IPINFO_LITE_URL = 'https://api.ipinfo.io/lite';

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
            countryCode TEXT,
            timestamp TEXT NOT NULL,
            isBot INTEGER DEFAULT 0,
            agentCategory TEXT,
            referrerSource TEXT,
            metadata TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_logs_cookieId ON logs(cookieId);
        CREATE TABLE IF NOT EXISTS timeInvested (
            id TEXT PRIMARY KEY,
            activityLogId TEXT NOT NULL UNIQUE,
            seconds INTEGER NOT NULL DEFAULT 0,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            FOREIGN KEY (activityLogId) REFERENCES logs(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_timeInvested_activityLogId ON timeInvested(activityLogId);
    `);

    const tableInfo = db.prepare('PRAGMA table_info(logs)').all() as Array<{ name: string }>;
    const columns = new Set(tableInfo.map((column) => column.name));

    if (!columns.has('accountId')) {
        db.prepare('ALTER TABLE logs ADD COLUMN accountId TEXT').run();
    }
    if (!columns.has('countryCode')) {
        db.prepare('ALTER TABLE logs ADD COLUMN countryCode TEXT').run();
    }
    if (!columns.has('agentCategory')) {
        db.prepare('ALTER TABLE logs ADD COLUMN agentCategory TEXT').run();
    }
    if (!columns.has('referrerSource')) {
        db.prepare('ALTER TABLE logs ADD COLUMN referrerSource TEXT').run();
    }
}

export async function createLog(data: Omit<Log, 'id' | 'timestamp'>): Promise<string> {
    try {
        ensureLogsTable();
        const classification = classifyUserAgent(data.userAgent);
        const referrerSource = classifyReferrerSource(data.referrer);
        const logId = randomUUID();

        db.prepare(`
            INSERT INTO logs (
                id, accountId, cookieId, pageAccessed, resourceType, method, statusCode,
                referrer, userAgent, ipAddress, countryCode, timestamp, isBot, agentCategory, referrerSource, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            logId,
            (data as any).accountId || null,
            data.cookieId,
            data.pageAccessed,
            data.resourceType,
            data.method || null,
            data.statusCode || null,
            data.referrer || null,
            data.userAgent,
            data.ipAddress || null,
            data.countryCode || null,
            new Date().toISOString(),
            classification.isBot ? 1 : 0,
            classification.agentCategory,
            referrerSource,
            JSON.stringify(data.metadata || null)
        );
        return logId;
    } catch (error) {
        console.error('Failed to create log in SQLite:', error);
        throw error;
    }
}

function isLookupableIp(ipAddress?: string | null) {
    if (!ipAddress) return false;

    const ip = ipAddress.trim();
    if (!ip) return false;

    const lower = ip.toLowerCase();
    if (lower === 'unknown' || lower === '127.0.0.1' || lower === '::1' || lower === 'localhost') {
        return false;
    }

    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(ip)) {
        return false;
    }

    if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:')) {
        return false;
    }

    return true;
}

async function lookupCountryCode(ipAddress: string): Promise<string | null> {
    try {
        const response = await fetch(`${IPINFO_LITE_URL}/${encodeURIComponent(ipAddress)}?token=${IPINFO_TOKEN}`, {
            method: 'GET',
            cache: 'no-store',
        });

        if (!response.ok) {
            return null;
        }

        const payload = await response.json() as { country_code?: string };
        return payload.country_code || null;
    } catch (error) {
        console.error('Failed to look up IP country code:', error);
        return null;
    }
}

export async function enrichRecentLogCountries(limit: number = 25): Promise<void> {
    ensureLogsTable();

    const rows = db.prepare(`
        SELECT ipAddress, MAX(timestamp) AS latestTimestamp
        FROM logs
        WHERE (countryCode IS NULL OR countryCode = '')
          AND ipAddress IS NOT NULL
          AND ipAddress != ''
        GROUP BY ipAddress
        ORDER BY latestTimestamp DESC
        LIMIT ?
    `).all(limit) as Array<{ ipAddress: string }>;

    for (const row of rows) {
        if (!isLookupableIp(row.ipAddress)) {
            continue;
        }

        const countryCode = await lookupCountryCode(row.ipAddress);
        if (!countryCode) {
            continue;
        }

        db.prepare(`
            UPDATE logs
            SET countryCode = ?
            WHERE ipAddress = ?
              AND (countryCode IS NULL OR countryCode = '')
        `).run(countryCode, row.ipAddress);
    }
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

export async function getLogsByIdentifier(identifier: string): Promise<Log[]> {
    ensureLogsTable();
    const rows = db.prepare(`
        SELECT *
        FROM logs
        WHERE COALESCE(accountId, cookieId) = ?
        ORDER BY timestamp DESC
    `).all(identifier) as any[];

    return rows.map(mapLog);
}

export async function getAllInteractionLogs(): Promise<Log[]> {
    ensureLogsTable();
    const rows = db.prepare(`
        SELECT *
        FROM logs
        ORDER BY timestamp DESC
    `).all() as any[];

    return rows.map(mapLog);
}

export async function addTimeInvested(activityLogId: string, secondsToAdd: number): Promise<number> {
    ensureLogsTable();

    const now = new Date().toISOString();
    db.prepare(`
        INSERT INTO timeInvested (id, activityLogId, seconds, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(activityLogId) DO UPDATE SET
            seconds = timeInvested.seconds + excluded.seconds,
            updatedAt = excluded.updatedAt
    `).run(randomUUID(), activityLogId, secondsToAdd, now, now);

    const row = db.prepare(`
        SELECT seconds
        FROM timeInvested
        WHERE activityLogId = ?
    `).get(activityLogId) as { seconds: number } | undefined;

    return row?.seconds || 0;
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
