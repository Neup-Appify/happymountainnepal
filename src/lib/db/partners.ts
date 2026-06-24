
'use server';

import type { Partner } from '@/lib/types';
import { db } from './sqlite';
import { randomUUID } from 'crypto';

export async function addPartner(data: Omit<Partner, 'id'>): Promise<string> {
    const id = randomUUID();
    db.prepare(`
        INSERT INTO partners (id, name, logo, description, link)
        VALUES (?, ?, ?, ?, ?)
    `).run(id, data.name, data.logo, data.description, data.link || null);
    return id;
}

export async function updatePartner(id: string, data: Omit<Partner, 'id'>) {
    db.prepare(`
        UPDATE partners
        SET name = ?, logo = ?, description = ?, link = ?
        WHERE id = ?
    `).run(data.name, data.logo, data.description, data.link || null, id);
}

export async function deletePartner(id: string) {
    db.prepare('DELETE FROM partners WHERE id = ?').run(id);
}

export async function getPartnerById(id: string): Promise<Partner | null> {
    return (db.prepare('SELECT * FROM partners WHERE id = ?').get(id) as Partner | undefined) || null;
}
