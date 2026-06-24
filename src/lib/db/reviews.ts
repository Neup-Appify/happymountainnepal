'use server';

import type { ManagedReview } from '@/lib/types';
import { db } from './sqlite';
import { randomUUID } from 'crypto';

interface ReviewRow {
    id: string;
    type: 'onSite' | 'offSite' | null;
    rating: number;
    author: string;
    userRole: string | null;
    comment: string;
    date: string;
    status: string;
    source: string;
    packageId: string | null;
    userId: string | null;
    originalReviewUrl: string | null;
    reviewMedia: string | null;
    createdAt: string;
}

function toIsoDate(value: unknown): string {
    if (!value) return new Date().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    if (typeof (value as any).toDate === 'function') return (value as any).toDate().toISOString();
    return new Date(value as any).toISOString();
}

function mapReview(row: ReviewRow): ManagedReview {
    const type = row.type || (row.source === 'website' ? 'onSite' : 'offSite');
    const base = {
        id: row.id,
        type,
        reviewedOn: row.date,
        userName: row.author,
        userRole: row.userRole || undefined,
        reviewFor: row.packageId,
        reviewBody: row.comment,
        reviewMedia: row.reviewMedia ? JSON.parse(row.reviewMedia) : undefined,
        stars: row.rating as 1 | 2 | 3 | 4 | 5,
    };

    if (type === 'onSite') {
        return {
            ...base,
            type: 'onSite',
            userId: row.userId || 'anonymous',
            reviewFor: row.packageId || 'general',
        };
    }

    return {
        ...base,
        type: 'offSite',
        originalReviewUrl: row.originalReviewUrl || '',
    };
}

function reviewToRow(id: string, data: Partial<ManagedReview>, existing?: ReviewRow) {
    return {
        id,
        type: data.type || existing?.type || 'offSite',
        rating: data.stars || existing?.rating || 5,
        author: data.userName || existing?.author || '',
        userRole: data.userRole || existing?.userRole || null,
        comment: data.reviewBody || existing?.comment || '',
        date: data.reviewedOn ? toIsoDate(data.reviewedOn) : existing?.date || new Date().toISOString(),
        status: existing?.status || 'approved',
        source: data.type === 'onSite' ? 'website' : existing?.source || 'external',
        packageId: data.reviewFor || existing?.packageId || null,
        userId: data.type === 'onSite' ? data.userId : existing?.userId || null,
        originalReviewUrl: data.type === 'offSite' ? data.originalReviewUrl : existing?.originalReviewUrl || null,
        reviewMedia: JSON.stringify(data.reviewMedia || (existing?.reviewMedia ? JSON.parse(existing.reviewMedia) : [])),
        createdAt: existing?.createdAt || new Date().toISOString(),
    };
}

export async function addReview(data: Omit<ManagedReview, 'id'>): Promise<string> {
    const id = randomUUID();
    const row = reviewToRow(id, data as Partial<ManagedReview>);
    db.prepare(`
        INSERT INTO reviews (
            id, type, rating, author, userRole, comment, date, status, source,
            packageId, userId, originalReviewUrl, reviewMedia, createdAt
        ) VALUES (
            @id, @type, @rating, @author, @userRole, @comment, @date, @status, @source,
            @packageId, @userId, @originalReviewUrl, @reviewMedia, @createdAt
        )
    `).run(row);
    return id;
}

export async function updateReview(id: string, data: Partial<Omit<ManagedReview, 'id'>>) {
    const existing = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as ReviewRow | undefined;
    if (!existing) throw new Error('Review not found.');
    const row = reviewToRow(id, data as Partial<ManagedReview>, existing);
    db.prepare(`
        UPDATE reviews
        SET type = @type, rating = @rating, author = @author, userRole = @userRole,
            comment = @comment, date = @date, status = @status, source = @source,
            packageId = @packageId, userId = @userId, originalReviewUrl = @originalReviewUrl,
            reviewMedia = @reviewMedia
        WHERE id = @id
    `).run(row);
}

export async function deleteReview(id: string): Promise<void> {
    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
}

export async function getReviewById(id: string): Promise<ManagedReview | null> {
    const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as ReviewRow | undefined;
    return row ? mapReview(row) : null;
}

export async function getAllReviews(): Promise<ManagedReview[]> {
    const rows = db.prepare('SELECT * FROM reviews ORDER BY date DESC').all() as ReviewRow[];
    return rows.map(mapReview);
}

export async function getFiveStarReviews(): Promise<ManagedReview[]> {
    const rows = db.prepare(`
        SELECT * FROM reviews
        WHERE rating = 5
        ORDER BY date DESC
        LIMIT 10
    `).all() as ReviewRow[];
    return rows.map(mapReview);
}

interface PaginatedReviewsResult {
    reviews: ManagedReview[];
    lastDocId: string | null;
    hasMore: boolean;
}

const REVIEWS_PER_PAGE = 5;

function paginateRows(rows: ReviewRow[], lastDocId?: string | null): PaginatedReviewsResult {
    const start = lastDocId ? rows.findIndex(row => row.id === lastDocId) + 1 : 0;
    const page = rows.slice(Math.max(start, 0), Math.max(start, 0) + REVIEWS_PER_PAGE + 1);
    const hasMore = page.length > REVIEWS_PER_PAGE;
    const reviews = (hasMore ? page.slice(0, REVIEWS_PER_PAGE) : page).map(mapReview);
    return {
        reviews,
        lastDocId: reviews.length > 0 ? reviews[reviews.length - 1].id : null,
        hasMore,
    };
}

export async function getReviewsForPackage(packageId: string, lastDocId?: string | null): Promise<PaginatedReviewsResult> {
    const rows = db.prepare(`
        SELECT * FROM reviews
        WHERE packageId = ?
        ORDER BY date DESC
    `).all(packageId) as ReviewRow[];
    return paginateRows(rows, lastDocId);
}

export async function getGeneralReviews(excludePackageId: string, lastDocId?: string | null): Promise<PaginatedReviewsResult> {
    const rows = db.prepare(`
        SELECT * FROM reviews
        WHERE packageId IS NULL OR packageId != ?
        ORDER BY date DESC
    `).all(excludePackageId) as ReviewRow[];
    return paginateRows(rows, lastDocId);
}
