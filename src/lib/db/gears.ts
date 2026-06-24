'use server';

import type { GearItem } from '@/lib/types';
import { db } from './sqlite';
import { randomUUID } from 'crypto';

/**
 * Fetches all global gears from the 'gears' collection.
 */
export async function getGears(): Promise<GearItem[]> {
    try {
        const rows = db.prepare('SELECT * FROM gears ORDER BY name ASC').all() as Array<Omit<GearItem, 'provided'> & { provided: number }>;
        return rows.map(row => ({ ...row, provided: Boolean(row.provided) }));
    } catch (error) {
        console.error("Error fetching gears:", error);
        return [];
    }
}

/**
 * Creates a new global gear item.
 */
export async function createGear(data: Omit<GearItem, 'id'>): Promise<string | null> {
    try {
        const id = randomUUID();
        db.prepare(`
            INSERT INTO gears (id, name, description, image, provided)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, data.name, data.description || null, data.image || null, data.provided ? 1 : 0);
        return id;
    } catch (error) {
        console.error("Error creating gear:", error);
        return null;
    }
}

/**
 * Updates an existing global gear item.
 */
export async function updateGear(id: string, data: Partial<Omit<GearItem, 'id'>>) {
    const existing = db.prepare('SELECT * FROM gears WHERE id = ?').get(id) as GearItem | undefined;
    if (!existing) throw new Error("Gear not found.");
    const merged = { ...existing, ...data };
    db.prepare(`
        UPDATE gears
        SET name = ?, description = ?, image = ?, provided = ?
        WHERE id = ?
    `).run(merged.name, merged.description || null, merged.image || null, merged.provided ? 1 : 0, id);
}

/**
 * Deletes a global gear item.
 */
export async function deleteGear(id: string) {
    db.prepare('DELETE FROM gears WHERE id = ?').run(id);
}
