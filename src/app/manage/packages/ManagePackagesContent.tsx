'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PackageManagementCard } from '@/components/manage/PackageTableRow';
import type { Tour } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { useRouter, useSearchParams } from 'next/navigation';

const ITEMS_PER_PAGE = 10;

interface ManagePackagesContentProps {
    status?: 'published' | 'draft' | 'hidden';
}

export function ManagePackagesContent({ status = 'published' }: ManagePackagesContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
    });

    const emptyPagination = {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
    };

    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    useEffect(() => {
        const fetchPackages = async (page: number, search: string) => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: ITEMS_PER_PAGE.toString(),
                    search: search,
                    status: status,
                });
                const response = await fetch(`/api/packages?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch packages');

                const data = await response.json();
                setTours(Array.isArray(data.packages) ? data.packages : []);
                setPagination(data.pagination ?? {
                    ...emptyPagination,
                    currentPage: page,
                    totalCount: Array.isArray(data.packages) ? data.packages.length : 0,
                });
            } catch (error) {
                console.error('Error fetching packages:', error);
                setTours([]);
                setPagination(emptyPagination);
            } finally {
                setLoading(false);
            }
        };

        fetchPackages(currentPage, debouncedSearchTerm);
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

            let basePath = '/manage/packages';
            if (status === 'draft') basePath = '/manage/packages/draft';
            if (status === 'hidden') basePath = '/manage/packages/hidden';

            const newUrl = params.toString() ? `${basePath}?${params.toString()}` : basePath;
            router.push(newUrl, { scroll: false });
        }
    };

    const getTitle = () => {
        if (status === 'draft') return 'Draft Packages';
        if (status === 'hidden') return 'Hidden Packages';
        return 'Tour Packages';
    };

    const getDescription = () => {
        if (status === 'draft') return 'Manage your unpublished draft packages.';
        if (status === 'hidden') return 'Manage packages that are hidden from public view.';
        return 'Create, edit, and manage your published tour packages.';
    };

    const getToggleLink = () => {
        if (status === 'published') return { href: '/manage/packages/draft', label: 'View Drafts', desc: 'Check your unpublished packages.' };
        if (status === 'draft') return { href: '/manage/packages/hidden', label: 'View Hidden', desc: 'Check your hidden packages.' };
        return { href: '/manage/packages', label: 'View Published', desc: 'Go back to published packages.' };
    };

    const toggleLink = getToggleLink();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold !font-headline">{getTitle()}</h1>
                    <p className="text-muted-foreground mt-2">{getDescription()}</p>
                </div>
            </div>

            <Card className="overflow-hidden border-blue-200/50">
                {/* Create New Package */}
                <Link href="/manage/packages/create" className="block hover:bg-muted/50 transition-colors">
                    <div className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <PlusCircle className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base text-primary">Create New Package</h3>
                            <p className="text-sm text-muted-foreground">
                                Create, edit, and manage your tour packages.
                            </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <ChevronRight className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                </Link>

                <Separator />

                {/* Toggle Link */}
                <Link href={toggleLink.href} className="block hover:bg-muted/50 transition-colors">
                    <div className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-lg">
                                {status === 'published' ? 'D' : status === 'draft' ? 'H' : 'P'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base text-foreground">{toggleLink.label}</h3>
                            <p className="text-sm text-muted-foreground">{toggleLink.desc}</p>
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
                            placeholder="Search by name..."
                            className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground text-base"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Skeleton key={index} className="h-20 w-full" />
                        ))}
                    </div>
                ) : tours.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-16 text-muted-foreground">
                            <Search className="mx-auto h-12 w-12 opacity-50 mb-4" />
                            <h3 className="text-lg font-semibold">No packages found</h3>
                            <p>Try adjusting your search terms.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="flex flex-col">
                            {tours.map((tour) => (
                                <PackageManagementCard key={tour.id} tour={tour} />
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-6 mt-6">
                    <div className="text-sm text-muted-foreground">
                        Page {pagination.currentPage} of {pagination.totalPages}
                        {pagination.totalCount > 0 && (
                            <span className="ml-2">({pagination.totalCount} total {pagination.totalCount === 1 ? 'package' : 'packages'})</span>
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
                            disabled={pagination.currentPage >= pagination.totalPages || loading}
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
