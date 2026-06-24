import type { Tour, BlogPost, TeamMember, Destination, Partner } from './types';
import { slugify } from './utils';

// All data is now fetched from SQLite-backed helpers. This file is kept for type imports and utility functions if needed.

export const tours: Tour[] = [];
export const blogPosts: BlogPost[] = [];
export const teamMembers: TeamMember[] = [];
export const destinations: Destination[] = [];
export const partners: Partner[] = [];
