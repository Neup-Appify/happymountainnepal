import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BlogContent } from './BlogContent';
import { getPosts } from '@/lib/db/sqlite';

function BlogLoadingFallback() {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold">Travel Journal</h1>
        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
          Guides, stories, and practical advice from our adventures in the Himalayas.
        </p>
      </div>
      <div className="max-w-xl mx-auto mb-12">
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[400px] w-full rounded-lg" />)}
      </div>
    </div>
  );
}

export default async function BlogPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string, search?: string, tags?: string }> 
}) {
  const { page, search, tags: tagsRaw } = await searchParams;
  // Fetch initial data on the server
  const currentPage = parseInt(page || '1', 10);
  const tags = tagsRaw ? tagsRaw.split(',') : undefined;

  const { posts, totalCount, totalPages, hasMore } = getPosts({
    limit: 12,
    page: currentPage,
    status: 'published',
    search,
    tags
  });

  // Map createdAt to date if needed by BlogPost type, though getPosts usually handles it.
  // The getPosts helper in sqlite.ts maps `date: row.createdAt`.
  // However, we need to ensure the data is serializable (no Date objects, only strings/numbers).
  // getPosts returns plain objects, so it should be fine.

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold">Travel Journal</h1>
        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
          Guides, stories, and practical advice from our adventures in the Himalayas.
        </p>
      </div>

      <Suspense fallback={<BlogLoadingFallback />}>
        <BlogContent 
          initialPosts={posts as any[]} 
          initialTotalCount={totalCount}
          initialTotalPages={totalPages}
          initialHasMore={hasMore}
        />
      </Suspense>
    </div>
  );
}
