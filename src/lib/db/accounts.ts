
'use server';

import { classifyUserAgent, normalizeStoredReferrerSource } from '@/lib/log-classification';
import type { Account, Activity, DisplayUser } from '@/lib/types';
import { logError } from './errors';
import { enrichRecentLogCountries } from './logs';
import { db } from './sqlite';
import { randomUUID } from 'crypto';

export async function getAccountById(id: string): Promise<Account | null> {
    try {
        return (db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as Account | undefined) || null;
    } catch (error: any) {
        console.error(`Error fetching account ${id}:`, error);
        await logError({ message: `Failed to fetch account ${id}: ${error.message}`, stack: error.stack, pathname: `/accounts/${id}` });
        throw new Error("Could not fetch account.");
    }
}

export async function saveAccount(data: Omit<Account, 'createdAt'> & { createdAt?: string }) {
    db.prepare(`
        INSERT INTO accounts (id, fullName, email, phone, ipAddress, passwordHash, createdAt)
        VALUES (@id, @fullName, @email, @phone, @ipAddress, @passwordHash, @createdAt)
        ON CONFLICT(id) DO UPDATE SET
            fullName = excluded.fullName,
            email = excluded.email,
            phone = excluded.phone,
            ipAddress = excluded.ipAddress,
            passwordHash = COALESCE(excluded.passwordHash, accounts.passwordHash)
    `).run({
        ...data,
        phone: data.phone || null,
        ipAddress: data.ipAddress || null,
        passwordHash: (data as any).passwordHash || null,
        createdAt: data.createdAt || new Date().toISOString(),
    });
}

export async function getAccountByEmail(email: string): Promise<(Account & { passwordHash?: string }) | null> {
    return (db.prepare('SELECT * FROM accounts WHERE lower(email) = lower(?)').get(email) as (Account & { passwordHash?: string }) | undefined) || null;
}

export async function addActivity(data: Omit<Activity, 'id' | 'activityTime'> & { activityTime?: string }) {
    const id = randomUUID();
    db.prepare(`
        INSERT INTO activities (id, accountId, activityName, activityInfo, fromIp, fromLocation, activityTime)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        id,
        data.accountId,
        data.activityName,
        JSON.stringify(data.activityInfo || {}),
        data.fromIp || null,
        data.fromLocation || null,
        data.activityTime || new Date().toISOString()
    );
    return id;
}

export async function getActivitiesByAccountId(accountId: string): Promise<Activity[]> {
    try {
        const rows = db.prepare('SELECT * FROM activities WHERE accountId = ? ORDER BY activityTime DESC').all(accountId) as any[];
        return rows.map(row => ({ ...row, activityInfo: row.activityInfo ? JSON.parse(row.activityInfo) : {} })) as Activity[];
    } catch (error: any) {
        console.error(`Error fetching activities for account ${accountId}:`, error);
        await logError({ message: `Failed to fetch activities for account ${accountId}: ${error.message}`, stack: error.stack, pathname: `/manage/accounts/${accountId}` });
        throw new Error("Could not fetch activities from the database.");
    }
}

export async function clearUnrealAccounts(): Promise<{ deletedCount: number }> {
    try {
        const identifiers = (
            db.prepare(`
                SELECT
                    COALESCE(accountId, cookieId) AS identifier,
                    MAX(accountId) AS accountId
                FROM logs
                WHERE COALESCE(accountId, cookieId) IS NOT NULL
                GROUP BY COALESCE(accountId, cookieId)
                HAVING
                    COUNT(*) = 1
                    OR SUM(
                        CASE
                            WHEN lower(COALESCE(ipAddress, '')) IN ('127.0.0.1', '::1', 'localhost')
                            THEN 1
                            ELSE 0
                        END
                    ) > 0
            `).all() as Array<{ identifier: string; accountId: string | null }>
        );

        if (identifiers.length === 0) {
            return { deletedCount: 0 };
        }

        const identifierValues = identifiers.map((row) => row.identifier);
        const accountIds = identifiers
            .map((row) => row.accountId)
            .filter((value): value is string => Boolean(value));

        const identifierPlaceholders = identifierValues.map(() => '?').join(', ');
        const accountPlaceholders = accountIds.map(() => '?').join(', ');

        const clearIdentifiers = db.transaction(() => {
            db.prepare(`
                DELETE FROM logs
                WHERE COALESCE(accountId, cookieId) IN (${identifierPlaceholders})
            `).run(...identifierValues);

            if (accountIds.length > 0) {
                db.prepare(`DELETE FROM activities WHERE accountId IN (${accountPlaceholders})`).run(...accountIds);
                db.prepare(`DELETE FROM accounts WHERE id IN (${accountPlaceholders})`).run(...accountIds);
            }
        });

        clearIdentifiers();

        return { deletedCount: identifierValues.length };
    } catch (error: any) {
        console.error('Error clearing unreal accounts:', error);
        await logError({
            message: `Failed to clear unreal accounts: ${error.message}`,
            stack: error.stack,
            pathname: '/manage/accounts',
        });
        throw new Error("Could not clear unreal accounts.");
    }
}


export async function getUsersSummary(): Promise<DisplayUser[]> {
    await enrichRecentLogCountries();

    const registeredUsers = new Map<string, Account>();
    const accounts = db.prepare('SELECT * FROM accounts').all() as Account[];
    accounts.forEach(account => {
        registeredUsers.set(account.id, account);
    });

    const logs = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC').all() as any[];
    const userActivityMap = new Map<string, {
        activityCount: number;
        lastSeen: string;
        firstSeen: string;
        identifier: string;
        type: 'Permanent' | 'Temporary';
        userAgentCategory: string;
        referrerSource: string;
        ipAddress: string;
        countryCode?: string;
    }>();

    logs.forEach(log => {
        const id = log.accountId || log.cookieId;
        if (!id) return;

        if (!userActivityMap.has(id)) {
            const account = registeredUsers.get(id);
            const agentCategory = log.agentCategory || classifyUserAgent(log.userAgent).agentCategory;
            userActivityMap.set(id, {
                activityCount: 0,
                lastSeen: log.timestamp,
                firstSeen: log.timestamp,
                identifier: account ? account.email : log.cookieId,
                type: account ? 'Permanent' : 'Temporary',
                userAgentCategory: agentCategory,
                referrerSource: normalizeStoredReferrerSource(log.referrerSource, log.referrer),
                ipAddress: log.ipAddress || account?.ipAddress || 'Unknown',
                countryCode: log.countryCode || undefined,
            });
        }

        const userData = userActivityMap.get(id)!;
        userData.activityCount += 1;
        userData.firstSeen = log.timestamp;
    });

    const allUsers = Array.from(userActivityMap.entries()).map(([id, data]) => ({
        id,
        ...data,
    }));

    allUsers.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    return allUsers;
}

export async function getPaginatedUsers(options: { page: number, limit: number }): Promise<{
    users: DisplayUser[],
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    }
}> {
    const { page, limit } = options;
    const allUsers = await getUsersSummary();
    const totalCount = allUsers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedUsers = allUsers.slice(startIndex, startIndex + limit);

    return {
        users: paginatedUsers,
        pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
}
