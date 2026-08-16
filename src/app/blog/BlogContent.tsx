
'use client';

import { BlogCard } from '@/components/BlogCard';
import type { BlogPost } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 12;

interface BlogContentProps {
    initialPosts?: BlogPost[];
    initialTotalCount?: number;
    initialTotalPages?: number;
    initialHasMore?: boolean;
}

export function BlogContent({ 
    initialPosts = [], 
    initialTotalCount = 0, 
    initialTotalPages = 0, 
    initialHasMore = false 
}: BlogContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read state from URL
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const initialSearch = searchParams.get('search') || '';
    const initialTags = searchParams.get('tags')?.split(',').map(tag => tag.trim()).filter(Boolean) || [];

    // State
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialPosts);
    // If we have initial posts and we are on page 1 with no search/filters, we are not loading.
    // Otherwise, we might be navigating, but we should handle that gracefully.
    // Ideally, for the very first render on the server, we have data. 
    // If the user navigates, we fetch.
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [totalCount, setTotalCount] = useState(initialTotalCount);
    const [totalPages, setTotalPages] = useState(initialTotalPages);
    
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [activeTags, setActiveTags] = useState<string[]>(initialTags);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Effect to update URL when filters change (Client-side navigation)
    useEffect(() => {
        // ... (URL update logic remains same)
        const params = new URLSearchParams(window.location.search);
        // ...
        if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
        else params.delete('search');

        if (activeTags.length > 0) params.set('tags', activeTags.join(','));
        else params.delete('tags');

        // Only reset page if search/tags CHANGED. 
        // But here we are just syncing URL.
        // Actually, let's keep it simple. If we change search/tags, we reset page.
        // But we need to distinguish between initial load (where URL matches state) and user interaction.
    }, [debouncedSearchTerm, activeTags, router]); // This effect is tricky to get right without causing loops or double fetches.

    // Let's simplify: fetchPosts should only run if the params CHANGE from what was passed initially,
    // OR if we are doing client-side navigation.
    
    // Actually, for a fully server-rendered approach with client interactivity:
    // 1. Initial load: Props provide data.
    // 2. User searches/filters: We update URL -> Router pushes new URL -> Server Component re-renders? 
    //    NO, Next.js partial rendering might happen, or we handle it client-side.
    //    The user asked for "compiled on server then sent".
    //    If we use client-side fetching for filtering, that's fine for subsequent interactions.
    //    The critical part is the INITIAL load.

    useEffect(() => {
        // If it's the initial render and we have data matching the URL, don't fetch.
        // But how do we know if the current props match the current URL state?
        // We can assume they do for the first render.
        
        // We only fetch if we are NOT on the initial state provided by server, OR if we navigated.
        const isInitialState = 
            currentPage === 1 && 
            !debouncedSearchTerm && 
            activeTags.length === 0 &&
            initialPosts.length > 0;

        if (isInitialState && !isLoading) return; // Skip fetch on initial load if we have data

        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                const queryParams = new URLSearchParams({
                    limit: String(ITEMS_PER_PAGE),
                    page: String(currentPage),
                    search: debouncedSearchTerm,
                    tags: activeTags.join(','),
                    status: 'published',
                });

                const response = await fetch(`/api/blog?${queryParams.toString()}`);
                const data = await response.json();

                if (response.ok && data.posts) {
                    setBlogPosts(data.posts);
                    setHasMore(data.hasMore);
                    setTotalCount(data.totalCount);
                    setTotalPages(data.totalPages);
                } else {
                    setBlogPosts([]);
                }
            } catch (error) {
                console.error("Failed to fetch posts", error);
                setBlogPosts([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, [currentPage, debouncedSearchTerm, activeTags]);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            const params = new URLSearchParams(searchParams);
            params.set('page', page.toString());
            router.push(`/blog?${params.toString()}`);
            window.scrollTo(0, 0);
        }
    };

    const removeTag = (tagToRemove: string) => {
        setActiveTags(prev => prev.filter(t => t !== tagToRemove));
    };

    return (
        <>
            <div className="max-w-xl mx-auto mb-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search articles by title first, then description..."
                        className="pl-10 h-12 text-base rounded-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {activeTags.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                    <span className="text-sm font-semibold">Filtered by:</span>
                    {activeTags.map(tag => (
                        <Badge key={tag} variant="default" className="py-1 px-3">
                            {tag}
                            <button onClick={() => removeTag(tag)} className="ml-2 rounded-full hover:bg-background/20 p-0.5">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}


            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[400px] w-full rounded-lg" />)}
                </div>
            ) : blogPosts.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                        {blogPosts.map((post) => (
                            <BlogCard key={post.id} post={post} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t pt-8 mt-8">
                            <div className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages || 1}
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1 || isLoading}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={!hasMore || isLoading}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-20">
                    <p className="text-muted-foreground text-lg">No posts found for your search or filter.</p>
                </div>
            )}
        </>
    );
}
