

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFileUploads, deleteFileUpload } from '@/lib/db';
import { UploadDialog } from '@/components/upload/UploadDialog';
import { formatDistanceToNow } from 'date-fns';
import { PictureInPicture, ChevronLeft, ChevronRight, Trash2, Plus, Link as LinkIcon, Upload, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { FileUpload } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { SmartImage } from '@/components/ui/smart-image';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const ITEMS_PER_PAGE = 10;

export function UploadsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialSearch = searchParams.get('search') || '';
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    // We keep local state for input to avoid UI lag, but actual search triggers via effect on URL or debounce
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [fileItems, setFileItems] = useState<FileUpload[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeletingSelected, setIsDeletingSelected] = useState(false);

    const { toast } = useToast();

    const fetchData = async (page: number, search: string) => {
        setIsLoading(true);
        try {
            const result = await getFileUploads({
                limit: ITEMS_PER_PAGE,
                page: page,
                searchTerm: search
            });
            setFileItems(result.uploads);
            setHasMore(result.hasMore);
            setTotalCount(result.totalCount || 0);
            setTotalPages(result.totalPages || 0);
            setSelectedIds([]);
        } catch (error) {
            console.error('Error fetching uploads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Refetch when page or search param in URL changes
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        fetchData(currentPage, urlSearch);
        // We also sync local state if it differs (e.g. back button navigation)
        if (urlSearch !== searchTerm) {
            setSearchTerm(urlSearch);
        }
    }, [currentPage, searchParams]);

    // Update URL when user types (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentUrlSearch = searchParams.get('search') || '';
            if (searchTerm !== currentUrlSearch) {
                const params = new URLSearchParams(searchParams.toString());
                if (searchTerm) {
                    params.set('search', searchTerm);
                } else {
                    params.delete('search');
                }
                params.set('page', '1'); // Reset to page 1 on new search
                router.push(`/manage/uploads?${params.toString()}`);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, router, searchParams]);


    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', page.toString());
            router.push(`/manage/uploads?${params.toString()}`);
        }
    };

    const handleUploadComplete = () => {
        fetchData(1, searchTerm);
        if (currentPage !== 1) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', '1');
            router.push(`/manage/uploads?${params.toString()}`);
        }
    };

    const allVisibleSelected = fileItems.length > 0 && fileItems.every((item) => selectedIds.includes(item.id));

    const toggleSelected = (fileId: string, checked: boolean) => {
        setSelectedIds((current) => {
            if (checked) {
                return current.includes(fileId) ? current : [...current, fileId];
            }

            return current.filter((id) => id !== fileId);
        });
    };

    const toggleSelectAllVisible = (checked: boolean) => {
        setSelectedIds(checked ? fileItems.map((item) => item.id) : []);
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) {
            return;
        }

        const message = `Are you sure you want to delete ${selectedIds.length} selected ${selectedIds.length === 1 ? 'file' : 'files'}? This action cannot be undone.`;
        if (!confirm(message)) {
            return;
        }

        setIsDeletingSelected(true);
        try {
            await Promise.all(selectedIds.map((fileId) => deleteFileUpload(fileId)));
            toast({
                title: 'Files Deleted',
                description: `${selectedIds.length} ${selectedIds.length === 1 ? 'file has' : 'files have'} been removed.`,
            });
            await fetchData(currentPage, searchTerm);
        } catch (error) {
            console.error('Failed to delete selected files:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete the selected files. Please try again.',
            });
        } finally {
            setIsDeletingSelected(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold !font-headline">Uploads Library</h1>
                    <p className="text-muted-foreground mt-2">
                        {totalCount} {totalCount === 1 ? 'file' : 'files'} uploaded
                    </p>
                </div>
                <div className="flex flex-col items-end">
                </div>
            </div>

            <UploadDialog
                open={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
                onUploadComplete={handleUploadComplete}
            />

            {isLoading ? (
                <div className="space-y-4 mb-8">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 p-4 border rounded-lg bg-card animate-pulse"
                        >
                            <div className="h-16 w-24 rounded-md bg-muted flex-shrink-0"></div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="h-5 bg-muted rounded w-3/4"></div>
                                <div className="flex items-center gap-3">
                                    <div className="h-4 bg-muted rounded w-20"></div>
                                    <div className="h-4 bg-muted rounded w-24"></div>
                                </div>
                            </div>
                            <div className="h-9 w-20 bg-muted rounded flex-shrink-0"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4 mb-8">
                    {/* Action Cards (Only on Page 1) */}
                    {currentPage === 1 && (
                        <Card className="mb-6 overflow-hidden border-blue-200/50">
                            {/* Search Section */}
                            <div className="p-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search files by name..."
                                        className="pl-10 py-6 text-base bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Upload New File */}
                            <div
                                className="hover:bg-muted/50 transition-colors cursor-pointer group"
                                onClick={() => setIsUploadDialogOpen(true)}
                            >
                                <div className="p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <Upload className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-base text-primary">Upload New File</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Drag & drop or click to upload from your device.
                                        </p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Plus className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Add from URL (Bulk) */}
                            <Link href="/manage/uploads/linked" className="block hover:bg-muted/50 transition-colors group">
                                <div className="p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <LinkIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-base text-primary">Add from URL (Bulk)</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Add images by pasting their URLs into a list.
                                        </p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Plus className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                            </Link>
                        </Card>
                    )}

                    {/* File List */}
                    {fileItems.length > 0 ? (
                        <Card className="overflow-hidden">
                            <div className="flex flex-col gap-3 border-b bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="select-all-uploads"
                                        checked={allVisibleSelected}
                                        onCheckedChange={(checked) => toggleSelectAllVisible(checked === true)}
                                        aria-label="Select all uploads on this page"
                                    />
                                    <label htmlFor="select-all-uploads" className="text-sm font-medium cursor-pointer">
                                        Select all on this page
                                    </label>
                                    {selectedIds.length > 0 && (
                                        <span className="text-sm text-muted-foreground">
                                            {selectedIds.length} selected
                                        </span>
                                    )}
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteSelected}
                                    disabled={selectedIds.length === 0 || isDeletingSelected}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {isDeletingSelected ? 'Deleting...' : `Delete Selected${selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}`}
                                </Button>
                            </div>
                            <div className="flex flex-col">
                                {fileItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "flex items-center gap-4 p-4 hover:bg-accent/5 transition-colors",
                                            index !== fileItems.length - 1 && "border-b"
                                        )}
                                    >
                                        <Checkbox
                                            checked={selectedIds.includes(item.id)}
                                            onCheckedChange={(checked) => toggleSelected(item.id, checked === true)}
                                            aria-label={`Select ${item.name}`}
                                        />
                                        <Link
                                            href={`/manage/uploads/${item.id}`}
                                            className="flex-1 flex items-center gap-4 min-w-0 group"
                                        >
                                            <div className="h-20 w-20 bg-muted rounded flex items-center justify-center overflow-hidden border">
                                                <div className="relative w-full h-full bg-white flex items-center justify-center">
                                                    {item.type?.startsWith('image/') ? (
                                                        <SmartImage
                                                            src={item.url}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-secondary text-secondary-foreground text-xs font-medium uppercase px-2 text-center">
                                                            {item.type?.split('/')[1] || 'File'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate text-base group-hover:text-primary transition-colors">{item.name}</p>
                                                <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap mt-1">
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 lowercase">
                                                        {item.type?.split('/')[1] || 'file'}
                                                    </Badge>
                                                    <span>{item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'UNK'}</span>
                                                    <span>&bull;</span>
                                                    <span title={item.uploadedOn}>
                                                        {item.uploadedAt ? formatDistanceToNow(new Date(item.uploadedAt)) : 'Unknown time'} ago
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                                                <ChevronRight className="h-5 w-5" />
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground border rounded-lg">
                            <PictureInPicture className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No Files Found</h3>
                            <p>{searchTerm ? `No files match "${searchTerm}"` : "Uploaded files will appear here as they are added."}</p>
                        </div>
                    )}
                </div>
            )}

            {
                totalCount > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between border-t pt-6">
                        <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={!hasMore}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

