
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { PlusCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { BlogManagementCard } from '@/components/manage/BlogTableRow';
import type { BlogPost } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';

const ITEMS_PER_PAGE = 10;

interface ManageBlogContentProps {
    status?: 'published' | 'draft';
}

export function ManageBlogContent({ status = 'published' }: ManageBlogContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        hasMore: false,
    });

    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    useEffect(() => {
        const fetchPosts = async (page: number, search: string) => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams({
                    limit: String(ITEMS_PER_PAGE),
                    page: String(page),
                    search: search,
                    status: status,
                });

                const response = await fetch(`/api/blog?${queryParams.toString()}`);
                const data = await response.json();

                setPosts(data.posts || []);
                setPagination({
                    currentPage: page,
                    totalPages: data.totalPages || 0,
                    totalCount: data.totalCount || 0,
                    hasMore: data.hasMore || false,
                });

            } catch (error) {
                console.error("Failed to fetch posts", error);
                setPosts([]);
                setPagination({
                    currentPage: 1,
                    totalPages: 0,
                    totalCount: 0,
                    hasMore: false,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPosts(currentPage, debouncedSearchTerm);
    }, [debouncedSearchTerm, currentPage, status]);

    // Update URL when search term changes
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (debouncedSearchTerm) {
            params.set('search', debouncedSearchTerm);
            params.set('page', '1'); // Reset to page 1 on new search
        } else {
            params.delete('search');
        }

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        router.replace(newUrl, { scroll: false });
    }, [debouncedSearchTerm, router]);


    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            const params = new URLSearchParams();

            if (debouncedSearchTerm) {
                params.set('search', debouncedSearchTerm);
            }

            if (newPage > 1) {
                params.set('page', String(newPage));
            }

            const basePath = status === 'draft' ? '/manage/blog/drafts' : '/manage/blog';
            const newUrl = params.toString() ? `${basePath}?${params.toString()}` : basePath;
            router.push(newUrl, { scroll: false });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold !font-headline">
                        {status === 'draft' ? 'Draft Blog Posts' : 'Blog Posts'}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {status === 'draft' ? 'Manage your unpublished drafts.' : 'Create and manage your articles.'}
                    </p>
                </div>
            </div>
            {/* Action Card */}
            <Card className="overflow-hidden border-blue-200/50">
                {/* Create New Post */}
                <Link href="/manage/blog/create" className="block hover:bg-muted/50 transition-colors">
                    <div className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <PlusCircle className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base text-primary">Create New Post</h3>
                            <p className="text-sm text-muted-foreground">
                                Write a new article for your blog.
                            </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <ChevronRight className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                </Link>

                <Separator />

                {/* Drafts / Published Toggle Link */}
                <Link
                    href={status === 'published' ? "/manage/blog/drafts" : "/manage/blog"}
                    className="block hover:bg-muted/50 transition-colors"
                >
                    <div className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
                            {status === 'published' ? (
                                <span className="font-bold text-lg">D</span>
                            ) : (
                                <span className="font-bold text-lg">P</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base text-foreground">
                                {status === 'published' ? 'View Drafts' : 'View Published Posts'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {status === 'published'
                                    ? 'Check your unpublished articles.'
                                    : 'Go back to your published articles.'}
                            </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center">
                            <ChevronRight className="h-5 w-5 text-secondary-foreground" />
                        </div>
                    </div>
                </Link>

                <Separator />

                {/* Search */}
                <div className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 relative">
                        <Input
                            placeholder="Search by title first, then description..."
                            className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground text-base"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {/* Visual indicator that this is an input field if needed, but text-base usually implies it.
                             Actually, let's make it look like a list item but with an input inside.
                             To make it feel 'clickable' or active, maybe just the input is fine.
                             Let's match the style: Title/Desc structure?
                             No, search is an action. Let's make it look like the rows but with an input.
                         */}
                    </div>
                </div>
            </Card>

            {/* List Card */}
            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                    </div>
                ) : posts.length > 0 ? (
                    <Card className="overflow-hidden">
                        <div className="flex flex-col">
                            {posts.map((post) => (
                                <BlogManagementCard key={post.id} post={post} />
                            ))}
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="text-center py-16 text-muted-foreground">
                            <Search className="mx-auto h-12 w-12 opacity-50 mb-4" />
                            <h3 className="text-lg font-semibold">No posts found</h3>
                            <p>Try adjusting your search terms.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-6 mt-6">
                    <div className="text-sm text-muted-foreground">
                        Page {pagination.currentPage} of {pagination.totalPages}
                        {pagination.totalCount > 0 && (
                            <span className="ml-2">({pagination.totalCount} total {pagination.totalCount === 1 ? 'post' : 'posts'})</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1 || loading}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={!pagination.hasMore || loading}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
