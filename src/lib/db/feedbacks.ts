'use server';

import { logError } from './errors';
import { db } from './sqlite';
import { randomUUID } from 'crypto';

export type FeedbackEntry = {
    id: string;
    type: 'task' | 'discussion';
    title?: string;
    description: string;
    status?: 'open' | 'in-progress' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    deadline?: string; // ISO string 
    createdAt: string; // ISO string
    createdBy?: string;
    parentId?: string | null; // For threading
    mentions?: string[]; // Array of user IDs or names mentioned
};

export type Feedback = {
    id: string;
    createdAt: string;
    title: string;
    description?: string;
    deadline?: string;
    status?: 'open' | 'in-progress' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    issuedTo?: string[]; // Array of team member IDs
    entries: FeedbackEntry[]; // Unified list of subtasks and discussions
};

export async function saveFeedback(feedbackData: Omit<Feedback, 'id' | 'createdAt' | 'entries'>): Promise<string> {
    try {
        const id = randomUUID();
        db.prepare(`
            INSERT INTO feedbacks (id, title, description, deadline, status, priority, issuedTo, entries, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            feedbackData.title,
            feedbackData.description || null,
            feedbackData.deadline || null,
            feedbackData.status || 'open',
            feedbackData.priority || 'medium',
            JSON.stringify(feedbackData.issuedTo || []),
            JSON.stringify([]),
            new Date().toISOString()
        );
        return id;
    } catch (error: any) {
        console.error("[DB saveFeedback] Error saving feedback: ", error);
        await logError({
            message: `Failed to save feedback: ${error.message}`,
            stack: error.stack,
            pathname: 'manage/feedbacks',
            context: { feedbackData }
        });
        throw new Error("Could not save feedback to the database.");
    }
}

function mapFeedback(row: any): Feedback {
    return {
        ...row,
        issuedTo: row.issuedTo ? JSON.parse(row.issuedTo) : [],
        entries: row.entries ? JSON.parse(row.entries) : [],
    } as Feedback;
}

export async function getFeedbacks(limitCount: number = 10): Promise<Feedback[]> {
    try {
        const rows = db.prepare('SELECT * FROM feedbacks ORDER BY createdAt DESC LIMIT ?').all(limitCount) as any[];
        return rows.map(mapFeedback);
    } catch (error: any) {
        console.error("Error fetching feedbacks: ", error);
        await logError({ message: `Failed to fetch feedbacks: ${error.message}`, stack: error.stack, pathname: '/manage/feedbacks' });
        throw new Error("Could not fetch feedbacks from the database.");
    }
}

export async function getFeedback(id: string): Promise<Feedback | null> {
    try {
        const row = db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(id) as any;
        return row ? mapFeedback(row) : null;
    } catch (error: any) {
        console.error(`Error fetching feedback ${id}: `, error);
        await logError({ message: `Failed to fetch feedback ${id}: ${error.message}`, stack: error.stack, pathname: `/manage/feedbacks/${id}` });
        throw new Error("Could not fetch feedback details.");
    }
}

export async function updateFeedback(id: string, updateData: Partial<Feedback>): Promise<void> {
    try {
        const current = await getFeedback(id);
        if (!current) throw new Error("Feedback not found");
        const merged = { ...current, ...updateData, id, createdAt: current.createdAt };
        db.prepare(`
            UPDATE feedbacks
            SET title = ?, description = ?, deadline = ?, status = ?, priority = ?, issuedTo = ?, entries = ?
            WHERE id = ?
        `).run(
            merged.title,
            merged.description || null,
            merged.deadline || null,
            merged.status || 'open',
            merged.priority || 'medium',
            JSON.stringify(merged.issuedTo || []),
            JSON.stringify(merged.entries || []),
            id
        );
    } catch (error: any) {
        console.error(`Error updating feedback ${id}: `, error);
        await logError({
            message: `Failed to update feedback ${id}: ${error.message}`,
            stack: error.stack,
            pathname: `/manage/feedbacks/${id}`,
            context: { updateData }
        });
        throw new Error("Could not update feedback.");
    }
}

export async function addFeedbackEntry(id: string, entry: FeedbackEntry): Promise<void> {
    try {
        const feedback = await getFeedback(id);
        if (!feedback) throw new Error("Feedback not found");
        await updateFeedback(id, { entries: [...(feedback.entries || []), entry] });
    } catch (error: any) {
        console.error(`Error adding entry to feedback ${id}: `, error);
        throw error;
    }
}

export async function updateFeedbackEntry(feedbackId: string, entryId: string, updates: Partial<FeedbackEntry>): Promise<void> {
    try {
        const feedback = await getFeedback(feedbackId);
        if (!feedback) throw new Error("Feedback not found");
        const newEntries = (feedback.entries || []).map((e: FeedbackEntry) =>
            e.id === entryId ? { ...e, ...updates } : e
        );
        await updateFeedback(feedbackId, { entries: newEntries });
    } catch (error: any) {
        console.error(`Error updating entry in feedback ${feedbackId}: `, error);
        throw error;
    }
}
