'use server';

import type { BlogPost, ImportedBlogData } from '@/lib/types';
import { slugify } from "@/lib/utils";
import { logError } from './errors';
import {
    checkPostSlugAvailability,
    deletePost,
    getAllPosts,
    getPostById,
    getPostBySlug,
    getPosts,
    savePost,
} from './sqlite';

function generateKeywords(post: Pick<BlogPost, 'title' | 'author'> & { tags?: string[] }) {
    const keywords = new Set<string>();
    post.title.toLowerCase().split(' ').forEach(word => keywords.add(word.replace(/[^a-z0-9]/gi, '')));
    post.author.toLowerCase().split(' ').forEach(word => keywords.add(word.replace(/[^a-z0-9]/gi, '')));
    post.tags?.forEach(tag => keywords.add(tag.toLowerCase()));
    return Array.from(keywords).filter(Boolean);
}

export async function checkBlogSlugAvailability(slug: string, excludePostId?: string): Promise<boolean> {
    return checkPostSlugAvailability(slug, excludePostId);
}

export async function createBlogPost(): Promise<string | null> {
    try {
        const id = `post_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const title = 'New Untitled Post';
        savePost({
            id,
            slug: slugify(`${title}-${id}`),
            title,
            content: '<p>Start writing your amazing blog post here...</p>',
            excerpt: '',
            author: 'Admin',
            authorPhoto: 'https://picsum.photos/seed/admin-avatar/400/400',
            createdAt: new Date().toISOString(),
            image: 'https://picsum.photos/seed/blog-placeholder/800/500',
            status: 'draft',
            tags: [],
            metaInformation: '',
            searchKeywords: [],
        });
        return id;
    } catch (error: any) {
        await logError({ message: error.message, stack: error.stack, pathname: 'createBlogPost' });
        return null;
    }
}

export async function createBlogPostWithData(data: ImportedBlogData): Promise<string | null> {
    const slug = slugify(data.title);
    if (!await checkBlogSlugAvailability(slug)) {
        throw new Error(`A blog post with the slug '${slug}' already exists.`);
    }

    const id = `post_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    savePost({
        id,
        slug,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        author: data.author || 'Admin',
        authorPhoto: '',
        createdAt: new Date().toISOString(),
        image: data.image,
        status: 'draft',
        tags: [],
        metaInformation: '',
        searchKeywords: generateKeywords({ title: data.title, author: data.author || 'Admin' }),
    });
    return id;
}

export async function saveBlogPost(id: string | undefined, data: Omit<BlogPost, 'id' | 'date' | 'searchKeywords'> & { date?: string }): Promise<string> {
    const postId = id || `post_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const existing = id ? getPostById(id) : null;
    savePost({
        id: postId,
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        author: data.author,
        authorPhoto: data.authorPhoto,
        createdAt: data.date || (existing?.date as string) || new Date().toISOString(),
        image: data.image,
        tags: data.tags || [],
        metaInformation: data.metaInformation || '',
        status: data.status,
        searchKeywords: generateKeywords({ title: data.title, author: data.author, tags: data.tags }),
    });
    return postId;
}

export async function updateBlogPost(id: string, data: Partial<Omit<BlogPost, 'id'>>) {
    const existing = getPostById(id);
    if (!existing) throw new Error('Blog post not found.');
    await saveBlogPost(id, {
        slug: data.slug || existing.slug,
        title: data.title || existing.title,
        excerpt: data.excerpt || existing.excerpt,
        content: data.content || existing.content,
        author: data.author || existing.author,
        authorPhoto: data.authorPhoto || existing.authorPhoto,
        date: (data.date as string) || (existing.date as string),
        image: data.image || existing.image,
        tags: data.tags || existing.tags || [],
        metaInformation: data.metaInformation || existing.metaInformation || '',
        status: data.status || existing.status,
    });
}

export async function deleteBlogPost(id: string) {
    deletePost(id);
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
    return getPostById(id);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    return getPostBySlug(slug);
}

export async function getBlogPosts(options?: {
    limit?: number;
    page?: number;
    status?: 'published' | 'draft';
    search?: string;
    tags?: string[];
}): Promise<{ posts: BlogPost[]; hasMore: boolean; totalPages: number; totalCount: number; }> {
    return getPosts(options);
}

export async function getBlogPostCount(status?: 'published' | 'draft'): Promise<number> {
    return getPosts({ limit: 1, page: 1, status }).totalCount;
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
    return getAllPosts();
}
