
import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug, getPosts, savePost } from '@/lib/db/sqlite';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const slug = searchParams.get('slug');
        const excludeId = searchParams.get('excludeId');

        if (slug) {
            const existingPost = getPostBySlug(slug);
            const available = !existingPost || (excludeId ? existingPost.id === excludeId : false);
            return NextResponse.json({ available });
        }

        const limit = parseInt(searchParams.get('limit') || '10');
        const page = parseInt(searchParams.get('page') || '1');
        const rawStatus = searchParams.get('status');
        const status = rawStatus === 'all' ? undefined : (rawStatus || 'published');
        const search = searchParams.get('search') || undefined;
        const items = searchParams.get('tags');
        const tags = items ? items.split(',').map(tag => tag.trim()) : undefined;

        const result = getPosts({ limit, page, status, search, tags });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, slug, content, excerpt, author, authorPhoto, image, tags, metaInformation, status, searchKeywords } = body;

        const id = uuidv4();
        const now = new Date().toISOString();

        const newPost = {
            id,
            title,
            slug: slug || uuidv4(),
            content: content || '',
            excerpt: excerpt || '',
            author: author || 'Admin',
            authorPhoto: authorPhoto || '',
            image: image || '',
            tags: tags || [],
            metaInformation: metaInformation || '',
            status: status || 'draft',
            searchKeywords: searchKeywords || [],
            createdAt: now
        };

        savePost(newPost);

        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating post:', error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return NextResponse.json({ error: 'Slug must be unique' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
