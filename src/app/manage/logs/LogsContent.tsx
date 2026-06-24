'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLogs, getLogCount, deleteLog, clearOldLogs, getUniquePageLogs } from '@/lib/db';
import { Log } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, RefreshCw, Download, Filter, Bot, User, Globe, FileText, Link as LinkIcon, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function LogsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const { toast } = useToast();

    // Filters
    const [resourceTypeFilter, setResourceTypeFilter] = useState<'all' | 'page' | 'api' | 'static' | 'redirect'>('all');
    const [botFilter, setBotFilter] = useState<'all' | 'bots' | 'humans'>('all');
    const [searchCookie, setSearchCookie] = useState('');
    const [showUniquePages, setShowUniquePages] = useState(false);

    useEffect(() => {
        const page = parseInt(searchParams.get('page') || '1', 10);
        setCurrentPage(page);
    }, [searchParams]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const options: any = {
                limit: 10,
                page: currentPage,
            };

            if (resourceTypeFilter !== 'all') {
                options.resourceType = resourceTypeFilter;
            }
            if (botFilter === 'bots') {
                options.isBot = true;
            } else if (botFilter === 'humans') {
                options.isBot = false;
            }
            if (searchCookie) {
                options.cookieId = searchCookie;
            }

            // Use getUniquePageLogs if showUniquePages is enabled, but not with cookieId filter
            const { logs: fetchedLogs, hasMore, totalPages: pages } = showUniquePages && !searchCookie
                ? await getUniquePageLogs(options)
                : await getLogs(options);

            setLogs(fetchedLogs);
            setTotalPages(pages);

            // Get total count
            if (showUniquePages && !searchCookie) {
                // For unique pages, the count is already calculated in getUniquePageLogs
                // We can estimate it from the pagination info
                setTotalCount(fetchedLogs.length + (pages - currentPage) * 10);
            } else {
                const countOptions: any = {};
                if (resourceTypeFilter !== 'all') countOptions.resourceType = resourceTypeFilter;
                if (botFilter === 'bots') countOptions.isBot = true;
                else if (botFilter === 'humans') countOptions.isBot = false;
                if (searchCookie) countOptions.cookieId = searchCookie;

                const count = await getLogCount(countOptions);
                setTotalCount(count);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch logs',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [currentPage, resourceTypeFilter, botFilter, searchCookie, showUniquePages]);

    const handleDeleteLog = async (id: string) => {
        if (!confirm('Are you sure you want to delete this log?')) return;

        try {
            await deleteLog(id);
            setLogs(logs.filter(log => log.id !== id));
            toast({
                title: 'Success',
                description: 'Log deleted successfully',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete log',
                variant: 'destructive',
            });
        }
    };

    const handleClearOldLogs = async (days: number) => {
        if (!confirm(`Are you sure you want to delete all logs older than ${days} days?`)) return;

        try {
            const deletedCount = await clearOldLogs(days);
            toast({
                title: 'Success',
                description: `Deleted ${deletedCount} old logs`,
            });
            fetchLogs();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to clear old logs',
                variant: 'destructive',
            });
        }
    };

    const exportLogs = () => {
        const csv = [
            ['Timestamp', 'Cookie ID', 'Page', 'Type', 'Method', 'Status', 'User Agent', 'IP', 'Is Bot', 'Referrer'].join(','),
            ...logs.map(log => {
                // Handle timestamp as either timestamp-like object or ISO string
                const timestamp = typeof log.timestamp === 'string'
                    ? new Date(log.timestamp)
                    : typeof (log.timestamp as any).toDate === 'function'
                        ? (log.timestamp as any).toDate()
                        : new Date();

                return [
                    format(timestamp, 'yyyy-MM-dd HH:mm:ss'),
                    log.cookieId,
                    log.pageAccessed,
                    log.resourceType,
                    log.method || '',
                    log.statusCode || '',
                    `"${log.userAgent}"`,
                    log.ipAddress || '',
                    log.isBot ? 'Yes' : 'No',
                    log.referrer || '',
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'page': return <Globe className="h-4 w-4" />;
            case 'api': return <FileText className="h-4 w-4" />;
            case 'static': return <ImageIcon className="h-4 w-4" />;
            case 'redirect': return <LinkIcon className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const goToPage = (page: number) => {
        router.push(`/manage/logs?page=${page}`);
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">
                        {showUniquePages ? 'Unique Pages Visited' : 'Access Logs'}
                    </h1>
                    <p className="text-muted-foreground">
                        {showUniquePages
                            ? `Showing ${totalCount} unique pages | Page ${currentPage} of ${totalPages}`
                            : `Total: ${totalCount} logs | Page ${currentPage} of ${totalPages}`
                        }
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowUniquePages(!showUniquePages)}
                        variant={showUniquePages ? "default" : "outline"}
                    >
                        <Globe className="h-4 w-4 mr-2" />
                        {showUniquePages ? 'Show All Logs' : 'Unique Pages Only'}
                    </Button>
                    <Button onClick={fetchLogs} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={exportLogs} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Select onValueChange={(value) => handleClearOldLogs(parseInt(value))}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Clear old logs" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Older than 7 days</SelectItem>
                            <SelectItem value="30">Older than 30 days</SelectItem>
                            <SelectItem value="90">Older than 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium mb-2 block">Resource Type</label>
                        <Select value={resourceTypeFilter} onValueChange={(value: any) => setResourceTypeFilter(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="page">Pages</SelectItem>
                                <SelectItem value="api">API</SelectItem>
                                <SelectItem value="static">Static Files</SelectItem>
                                <SelectItem value="redirect">Redirects</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium mb-2 block">Visitor Type</label>
                        <Select value={botFilter} onValueChange={(value: any) => setBotFilter(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Visitors</SelectItem>
                                <SelectItem value="humans">Humans Only</SelectItem>
                                <SelectItem value="bots">Bots Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium mb-2 block">Cookie ID</label>
                        <Input
                            placeholder="Search by cookie ID..."
                            value={searchCookie}
                            onChange={(e) => setSearchCookie(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Logs List */}
            <div className="space-y-2">
                {loading && logs.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Loading logs...
                        </CardContent>
                    </Card>
                ) : logs.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            No logs found
                        </CardContent>
                    </Card>
                ) : (
                    logs.map((log) => (
                        <Card key={log.id} className="hover:bg-accent/50 transition-colors">
                            <CardContent className="py-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getResourceIcon(log.resourceType)}
                                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                                {log.pageAccessed}
                                            </code>
                                            <Badge variant={log.resourceType === 'page' ? 'default' : 'secondary'}>
                                                {log.resourceType}
                                            </Badge>
                                            {log.method && (
                                                <Badge variant="outline">{log.method}</Badge>
                                            )}
                                            {log.statusCode && (
                                                <Badge variant={log.statusCode < 400 ? 'default' : 'destructive'}>
                                                    {log.statusCode}
                                                </Badge>
                                            )}
                                            {log.isBot ? (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Bot className="h-3 w-3" />
                                                    Bot
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="gap-1">
                                                    <User className="h-3 w-3" />
                                                    Human
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Cookie:</span>
                                                <code className="text-xs">{log.cookieId}</code>
                                            </div>
                                            {log.ipAddress && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">IP:</span>
                                                    <code className="text-xs">{log.ipAddress}</code>
                                                </div>
                                            )}
                                            {log.referrer && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Referrer:</span>
                                                    <code className="text-xs truncate max-w-md">{log.referrer}</code>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">User Agent:</span>
                                                <code className="text-xs truncate max-w-2xl">{log.userAgent}</code>
                                            </div>
                                            {log.timestamp && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Time:</span>
                                                    <span className="text-xs">
                                                        {format(
                                                            typeof log.timestamp === 'string'
                                                                ? new Date(log.timestamp)
                                                                : typeof (log.timestamp as any).toDate === 'function'
                                                                    ? (log.timestamp as any).toDate()
                                                                    : new Date(),
                                                            'PPpp'
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <div className="flex items-start gap-2">
                                                    <span className="font-medium">Metadata:</span>
                                                    <code className="text-xs">{JSON.stringify(log.metadata)}</code>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteLog(log.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                    <Button
                        onClick={handlePrevious}
                        disabled={currentPage === 1 || loading}
                        variant="outline"
                        size="sm"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </Button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    onClick={() => goToPage(pageNum)}
                                    variant={currentPage === pageNum ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={loading}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        onClick={handleNext}
                        disabled={currentPage === totalPages || loading}
                        variant="outline"
                        size="sm"
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}
