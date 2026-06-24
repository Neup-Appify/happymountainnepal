

'use client';

import { FormEvent, Suspense, useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Clock, Activity, ChevronLeft, ChevronRight, Trash2, Globe, Shield, UserRound, Search, Info } from 'lucide-react';
import { clearUnrealAccountsAction } from '@/app/actions/accounts';
import { getUsersSummary } from '@/lib/db';
import type { DisplayUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const DEFAULT_PAGE_SIZE = 20;
const MIN_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 500;

type SortMode = 'activity' | 'lowactivity' | 'lastseen' | 'firstseen';

function normalizeTokenValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseDayValue(value: string) {
  const match = value.trim().match(/^(\d+)d$/i);
  if (!match) return null;
  return Number(match[1]);
}

function parseActivityValue(value: string) {
  const match = value.trim().match(/^(over|under)\s*(\d+)$/i);
  if (!match) return null;
  return { operator: match[1].toLowerCase() as 'over' | 'under', count: Number(match[2]) };
}

function parsePageSizeValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'max') return MAX_PAGE_SIZE;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;

  return Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, parsed));
}

function filterAndSortUsers(users: DisplayUser[], rawQuery: string) {
  const normalizedQuery = rawQuery
    .replace(/&/g, ' ')
    .replace(/\b([a-z]+):\s+/gi, '$1:')
    .trim();
  const tokens = normalizedQuery ? normalizedQuery.split(/\s+/) : [];
  const now = Date.now();
  let sortMode: SortMode = 'lastseen';
  let pageSize = DEFAULT_PAGE_SIZE;

  const filteredUsers = users.filter((user) => {
    const freeText: string[] = [];

    for (const token of tokens) {
      const tokenMatch = token.match(/^([a-z]+):(.*)$/i);
      if (!tokenMatch) {
        freeText.push(token.toLowerCase());
        continue;
      }

      const [, rawKey, rawValue] = tokenMatch;
      const key = rawKey.toLowerCase();
      const value = rawValue.trim();

      if (!value) continue;

      if (key === 'sortby' || key === 'soryby') {
        const sortValue = normalizeTokenValue(value);
        if (sortValue === 'activity' || sortValue === 'lowactivity' || sortValue === 'lastseen' || sortValue === 'firstseen') {
          sortMode = sortValue;
        }
        continue;
      }

      if (key === 'pagesize') {
        const parsed = parsePageSizeValue(value);
        if (parsed) {
          pageSize = parsed;
        }
        continue;
      }

      if (key === 'referrer') {
        const referrer = normalizeTokenValue(user.referrerSource);
        const isNegated = value.trim().startsWith('!');
        const referrerQuery = normalizeTokenValue(isNegated ? value.trim().slice(1) : value);
        if (!referrerQuery) continue;
        if (referrerQuery === 'direct') {
          if (isNegated ? referrer === 'direct' : referrer !== 'direct') return false;
          continue;
        }
        if (referrerQuery === 'site') {
          if (isNegated ? referrer !== 'direct' : referrer === 'direct') return false;
          continue;
        }
        const matches = referrer.includes(referrerQuery);
        if (isNegated ? matches : !matches) return false;
        continue;
      }

      if (key === 'ip') {
        if (!user.ipAddress.toLowerCase().includes(value.toLowerCase())) return false;
        continue;
      }

      if (key === 'activitycount') {
        const parsed = parseActivityValue(value);
        if (!parsed) continue;
        if (parsed.operator === 'over' && !(user.activityCount > parsed.count)) return false;
        if (parsed.operator === 'under' && !(user.activityCount < parsed.count)) return false;
        continue;
      }

      if (key === 'lastseen') {
        const days = parseDayValue(value);
        if (days === null) continue;
        const ageInDays = (now - new Date(user.lastSeen).getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays > days) return false;
        continue;
      }

      if (key === 'type') {
        const category = normalizeTokenValue(user.userAgentCategory);
        const isNegated = value.trim().startsWith('!');
        const requested = normalizeTokenValue(isNegated ? value.trim().slice(1) : value);
        if (!requested) continue;
        if (isNegated ? category === requested : category !== requested) return false;
        continue;
      }

      freeText.push(token.toLowerCase());
    }

    if (freeText.length === 0) {
      return true;
    }

    const haystack = [
      user.identifier,
      user.userAgentCategory,
      user.referrerSource,
      user.ipAddress,
      user.type,
    ]
      .join(' ')
      .toLowerCase();

    return freeText.every((term) => haystack.includes(term));
  });

  filteredUsers.sort((a, b) => {
    if (sortMode === 'activity') return b.activityCount - a.activityCount;
    if (sortMode === 'lowactivity') return a.activityCount - b.activityCount;
    if (sortMode === 'firstseen') return new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime();
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });

  return {
    users: filteredUsers,
    pageSize,
  };
}

function AccountsContent() {
  const [allUsers, setAllUsers] = useState<DisplayUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, startClearing] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const searchQuery = searchParams.get('q') || '';
  const [draftQuery, setDraftQuery] = useState(searchQuery);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUsersSummary();
      setAllUsers(result);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setDraftQuery(searchQuery);
  }, [searchQuery]);

  const { users: filteredUsers, pageSize } = filterAndSortUsers(allUsers, searchQuery);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedUsers = filteredUsers.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const buildAccountsUrl = (page: number, query: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (query.trim()) params.set('q', query.trim());
    const nextQuery = params.toString();
    return nextQuery ? `/manage/accounts?${nextQuery}` : '/manage/accounts';
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      router.push(buildAccountsUrl(newPage, searchQuery));
    }
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(buildAccountsUrl(1, draftQuery));
  };

  const handleClearUnrealAccounts = () => {
    startClearing(async () => {
      try {
        const result = await clearUnrealAccountsAction();

        toast({
          title: result.deletedCount > 0 ? 'Accounts cleared' : 'No accounts cleared',
          description:
            result.deletedCount > 0
              ? `Deleted ${result.deletedCount} identifier${result.deletedCount === 1 ? '' : 's'} with exactly 1 activity.`
              : 'No user identifiers with exactly 1 activity were found.',
        });

        await fetchUsers();
        router.push(buildAccountsUrl(1, searchQuery));
      } catch (err) {
        console.error(err);
        toast({
          variant: 'destructive',
          title: 'Failed to clear unreal accounts',
          description: 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          A combined list of registered users and anonymous visitors.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex w-full max-w-3xl items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                className="border-white bg-white pl-9"
                placeholder="referrer:direct ip:127.0.0.1 activityCount:over100 lastseen:9d type:googlebot sortby:activity"
              />
            </div>
          </form>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="bg-white">
                <Info className="h-4 w-4" />
                <span className="sr-only">Search help</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Search Queries</AlertDialogTitle>
                <AlertDialogDescription>
                  Use queries like `referrer:direct`, `referrer:site`, `ip:127.0.0.1`, `activityCount:over100`, `activityCount:under10`, `lastseen:9d`, `type:googlebot`, `type:person`, `type:otherbot`, `sortby:activity`, `sortby:lowactivity`, `sortby:lastseen`, or `sortby:firstseen`.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>Close</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : paginatedUsers.length > 0 ? (
          <>
            <div className="space-y-4">
              {paginatedUsers.map((user) => (
                <Card key={user.id} className="bg-white">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          Identifier
                        </p>
                        <Link
                          href={`/manage/accounts/${encodeURIComponent(user.id)}`}
                          className="break-all font-mono text-sm underline-offset-4 hover:underline"
                        >
                          {user.identifier}
                        </Link>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={user.userAgentCategory === 'Person' ? 'default' : 'secondary'}>
                          <UserRound className="mr-1 h-3 w-3" />
                          {user.userAgentCategory}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                          <Globe className="h-3.5 w-3.5" />
                          Referrer Source
                        </div>
                        <p className="break-all text-sm font-medium">{user.referrerSource}</p>
                      </div>
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                          <Shield className="h-3.5 w-3.5" />
                          IP
                        </div>
                        <p className="break-all font-mono text-sm">
                          {user.ipAddress}
                          {user.countryCode ? ` (${user.countryCode})` : ''}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                          <Activity className="h-3.5 w-3.5" />
                          Activity Count
                        </div>
                        <p className="text-sm font-medium">{user.activityCount}</p>
                      </div>
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          Last Seen
                        </div>
                        <p className="text-sm font-medium">
                          {formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isClearing}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isClearing ? 'Clearing...' : 'Clear Unreal Account.'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear unreal accounts?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete every user identifier with exactly 1 logged activity.
                        If the identifier belongs to a registered account, its linked account record and activities will also be deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearUnrealAccounts} disabled={isClearing}>
                        {isClearing ? 'Clearing...' : 'Clear Unreal Account.'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {safeCurrentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">No Users Found</h3>
            <p>No identifiers matched the current search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            A combined list of registered users and anonymous visitors.
          </p>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full max-w-3xl" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    }>
      <AccountsContent />
    </Suspense>
  );
}
