
'use server';

import type { Account, Activity, DisplayUser } from '@/lib/types';
import { logError } from './errors';
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

    const registeredUsers = new Map<string, Account>();
    const accounts = db.prepare('SELECT * FROM accounts').all() as Account[];
    accounts.forEach(account => {
        registeredUsers.set(account.id, account);
    });

    const logs = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC').all() as any[];
    const userActivityMap = new Map<string, { activityCount: number; lastSeen: string; identifier: string; type: 'Permanent' | 'Temporary' }>();

    logs.forEach(log => {
        const id = log.accountId || log.cookieId;
        if (!id) return;

        if (!userActivityMap.has(id)) {
            const account = registeredUsers.get(id);
            userActivityMap.set(id, {
                activityCount: 0,
                lastSeen: log.timestamp,
                identifier: account ? account.email : log.cookieId,
                type: account ? 'Permanent' : 'Temporary',
            });
        }

        const userData = userActivityMap.get(id)!;
        userData.activityCount += 1;
        // The first log we see for a user is the latest one due to sorting
    });

    // 4. Convert map to array for sorting and pagination
    const allUsers = Array.from(userActivityMap.entries()).map(([id, data]) => ({
        id,
        ...data,
    }));

    // Sort by last seen date
    allUsers.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    // 5. Apply pagination
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
