
'use server';

import type { SiteProfile } from '@/lib/types';
import { logError } from './errors';
import { db } from './sqlite';

const SITE_PROFILE_ID = "happymountainnepal";

function parseJSON<T>(value: string | null | undefined, fallback: T): T {
    if (!value) return fallback;
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

export async function getSiteProfile(): Promise<SiteProfile | null> {
    const row = db.prepare('SELECT * FROM profile WHERE id = ?').get(SITE_PROFILE_ID) as any;
    if (!row) return null;
    return {
        ...row,
        heroImages: parseJSON(row.heroImages, []),
        socials: parseJSON(row.socials, {}),
        whyUs: parseJSON(row.whyUs, []),
        chatbot: parseJSON(row.chatbot, {}),
    } as SiteProfile;
}

export async function updateSiteProfile(data: Partial<Omit<SiteProfile, 'id'>>) {
    try {
        const existing = await getSiteProfile();
        const merged = { id: SITE_PROFILE_ID, ...(existing || {}), ...data };
        db.prepare(`
            INSERT INTO profile (
                id, basePath, reviewCount, contactEmail, phone, address,
                heroTitle, heroDescription, footerTagline, location, locationUrl,
                heroImage, heroImages, heroTransitionInterval, socials, whyUs, chatbot
            ) VALUES (
                @id, @basePath, @reviewCount, @contactEmail, @phone, @address,
                @heroTitle, @heroDescription, @footerTagline, @location, @locationUrl,
                @heroImage, @heroImages, @heroTransitionInterval, @socials, @whyUs, @chatbot
            )
            ON CONFLICT(id) DO UPDATE SET
                basePath = excluded.basePath,
                reviewCount = excluded.reviewCount,
                contactEmail = excluded.contactEmail,
                phone = excluded.phone,
                address = excluded.address,
                heroTitle = excluded.heroTitle,
                heroDescription = excluded.heroDescription,
                footerTagline = excluded.footerTagline,
                location = excluded.location,
                locationUrl = excluded.locationUrl,
                heroImage = excluded.heroImage,
                heroImages = excluded.heroImages,
                heroTransitionInterval = excluded.heroTransitionInterval,
                socials = excluded.socials,
                whyUs = excluded.whyUs,
                chatbot = excluded.chatbot
        `).run({
            ...merged,
            reviewCount: merged.reviewCount || 0,
            heroTransitionInterval: merged.heroTransitionInterval || 5000,
            heroImages: JSON.stringify(merged.heroImages || []),
            socials: JSON.stringify(merged.socials || {}),
            whyUs: JSON.stringify(merged.whyUs || []),
            chatbot: JSON.stringify(merged.chatbot || {}),
        });
    } catch (error: any) {
        console.error("Error updating site profile: ", error);
        await logError({ message: `Failed to update site profile: ${error.message}`, stack: error.stack, pathname: `/manage/profile`, context: { data } });
        throw new Error("Could not update site profile.");
    }
}
