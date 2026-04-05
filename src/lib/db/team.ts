
'use server';

import { v4 as uuidv4 } from 'uuid';
import type { TeamMember, TeamGroup } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { db } from './sqlite';

type TeamMemberRow = {
    id: string;
    slug: string;
    name: string;
    role: string;
    bio: string;
    image: string;
    groupId: string | null;
    orderIndex: number | null;
    shortDescription: string | null;
    story: string | null;
    gallery: string | null;
    socials: string | null;
};

type TeamGroupRow = {
    id: string;
    name: string;
    description: string | null;
    orderIndex: number;
};

function toTeamMember(row: TeamMemberRow): TeamMember {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        role: row.role,
        bio: row.bio,
        image: row.image,
        groupId: row.groupId ?? undefined,
        orderIndex: row.orderIndex ?? undefined,
        shortDescription: row.shortDescription ?? undefined,
        story: row.story ?? undefined,
        gallery: row.gallery ? JSON.parse(row.gallery) : undefined,
        socials: row.socials ? JSON.parse(row.socials) : undefined,
    };
}

function toTeamGroup(row: TeamGroupRow): TeamGroup {
    return {
        id: row.id,
        name: row.name,
        description: row.description ?? undefined,
        orderIndex: row.orderIndex,
    };
}

export async function addTeamMember(data: Omit<TeamMember, 'id' | 'slug'>) {
    const id = uuidv4();
    const slug = slugify(data.name);
    let orderIndex = data.orderIndex ?? 0;

    if (data.groupId) {
        const result = db
            .prepare('SELECT COUNT(*) as count FROM teamMembers WHERE groupId = ?')
            .get(data.groupId) as { count: number };
        orderIndex = data.orderIndex ?? result.count;
    }

    db.prepare(`
        INSERT INTO teamMembers (id, slug, name, role, bio, image, groupId, orderIndex, shortDescription, story, gallery, socials)
        VALUES (@id, @slug, @name, @role, @bio, @image, @groupId, @orderIndex, @shortDescription, @story, @gallery, @socials)
    `).run({
        id,
        slug,
        name: data.name,
        role: data.role,
        bio: data.bio,
        image: data.image,
        groupId: data.groupId ?? null,
        orderIndex,
        shortDescription: data.shortDescription ?? null,
        story: data.story ?? null,
        gallery: JSON.stringify(data.gallery ?? []),
        socials: JSON.stringify(data.socials ?? {}),
    });

    return id;
}

export async function updateTeamMember(id: string, data: Partial<Omit<TeamMember, 'id' | 'slug'>>) {
    const current = await getTeamMemberById(id);
    if (!current) {
        throw new Error('Team member not found.');
    }

    const merged: TeamMember = {
        ...current,
        ...data,
        slug: data.name ? slugify(data.name) : current.slug,
    };

    if (data.groupId !== undefined && data.groupId !== current.groupId && data.orderIndex === undefined) {
        if (!data.groupId) {
            merged.orderIndex = 0;
        } else {
            const result = db
                .prepare('SELECT COUNT(*) as count FROM teamMembers WHERE groupId = ?')
                .get(data.groupId) as { count: number };
            merged.orderIndex = result.count;
        }
    }

    db.prepare(`
        UPDATE teamMembers
        SET slug = @slug,
            name = @name,
            role = @role,
            bio = @bio,
            image = @image,
            groupId = @groupId,
            orderIndex = @orderIndex,
            shortDescription = @shortDescription,
            story = @story,
            gallery = @gallery,
            socials = @socials
        WHERE id = @id
    `).run({
        id,
        slug: merged.slug,
        name: merged.name,
        role: merged.role,
        bio: merged.bio,
        image: merged.image,
        groupId: merged.groupId ?? null,
        orderIndex: merged.orderIndex ?? null,
        shortDescription: merged.shortDescription ?? null,
        story: merged.story ?? null,
        gallery: JSON.stringify(merged.gallery ?? []),
        socials: JSON.stringify(merged.socials ?? {}),
    });
}

export async function deleteTeamMember(id: string) {
    db.prepare('DELETE FROM teamMembers WHERE id = ?').run(id);
}

export async function getTeamMemberById(id: string): Promise<TeamMember | null> {
    const row = db.prepare('SELECT * FROM teamMembers WHERE id = ?').get(id) as TeamMemberRow | undefined;
    return row ? toTeamMember(row) : null;
}

export async function getTeamMemberBySlug(slug: string): Promise<TeamMember | null> {
    const row = db.prepare('SELECT * FROM teamMembers WHERE slug = ? LIMIT 1').get(slug) as TeamMemberRow | undefined;
    return row ? toTeamMember(row) : null;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
    const rows = db.prepare('SELECT * FROM teamMembers ORDER BY COALESCE(orderIndex, 999999) ASC, name ASC').all() as TeamMemberRow[];
    return rows.map(toTeamMember);
}

export async function createTeamGroup(data: Omit<TeamGroup, 'id'>): Promise<string> {
    const id = uuidv4();
    db.prepare('INSERT INTO teamGroups (id, name, description, orderIndex) VALUES (?, ?, ?, ?)')
        .run(id, data.name, data.description ?? null, data.orderIndex);
    return id;
}

export async function updateTeamGroup(id: string, data: Partial<Omit<TeamGroup, 'id'>>): Promise<void> {
    const current = db.prepare('SELECT * FROM teamGroups WHERE id = ?').get(id) as TeamGroupRow | undefined;
    if (!current) {
        throw new Error('Team group not found.');
    }

    db.prepare('UPDATE teamGroups SET name = ?, description = ?, orderIndex = ? WHERE id = ?')
        .run(
            data.name ?? current.name,
            data.description ?? current.description,
            data.orderIndex ?? current.orderIndex,
            id
        );
}

export async function deleteTeamGroup(id: string): Promise<void> {
    const trx = db.transaction((groupId: string) => {
        db.prepare('UPDATE teamMembers SET groupId = NULL, orderIndex = NULL WHERE groupId = ?').run(groupId);
        db.prepare('DELETE FROM teamGroups WHERE id = ?').run(groupId);
    });

    trx(id);
}

export async function getTeamGroups(): Promise<TeamGroup[]> {
    const rows = db.prepare('SELECT * FROM teamGroups ORDER BY orderIndex ASC').all() as TeamGroupRow[];
    return rows.map(toTeamGroup);
}

export async function updateTeamMemberPosition(id: string, groupId: string | null, orderIndex: number): Promise<void> {
    db.prepare('UPDATE teamMembers SET groupId = ?, orderIndex = ? WHERE id = ?').run(groupId, orderIndex, id);
}

export async function batchUpdateTeamMemberPositions(updates: { id: string; groupId: string | null; orderIndex: number }[]): Promise<void> {
    const trx = db.transaction((items: { id: string; groupId: string | null; orderIndex: number }[]) => {
        const stmt = db.prepare('UPDATE teamMembers SET groupId = ?, orderIndex = ? WHERE id = ?');
        for (const item of items) {
            stmt.run(item.groupId, item.orderIndex, item.id);
        }
    });

    trx(updates);
}

export async function batchUpdateTeamGroupOrder(updates: { id: string; orderIndex: number }[]): Promise<void> {
    const trx = db.transaction((items: { id: string; orderIndex: number }[]) => {
        const stmt = db.prepare('UPDATE teamGroups SET orderIndex = ? WHERE id = ?');
        for (const item of items) {
            stmt.run(item.orderIndex, item.id);
        }
    });

    trx(updates);
}
