'use client';

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  Bot,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  Info,
  Search,
  Shield,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { clearUnrealAccountsAction } from '@/app/actions/accounts';
import { getAllInteractionLogs, getUsersSummary } from '@/lib/db';
import { classifyUserAgent, normalizeStoredReferrerSource } from '@/lib/log-classification';
import type { DisplayUser, Log } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
const VIEW_MODES = ['users', 'page', 'bots', 'referrer'] as const;
const AI_AGENT_CATEGORIES = new Set(['ChatGPT AI', 'Perplexity AI', 'Other AI']);

type ViewMode = typeof VIEW_MODES[number];
type UserSortMode = 'activity' | 'lowactivity' | 'lastseen' | 'firstseen';

type PageSummary = {
  id: string;
  pageAccessed: string;
  totalRequests: number;
  uniqueIdentifiers: number;
  last24Hours: number;
  aiRequests: number;
  humanRequests: number;
  otherBotRequests: number;
  lastSeen: string;
};

type BotSummary = {
  id: string;
  name: string;
  totalRequests: number;
  uniqueIdentifiers: number;
  uniquePages: number;
  lastSeen: string;
  resourceTypes: string[];
  topPages: string[];
};

type ReferrerSummary = {
  id: string;
  name: string;
  totalRequests: number;
  uniqueIdentifiers: number;
  last24Hours: number;
  otherBotRequests: number;
  lastSeen: string;
};

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

function normalizeQuery(rawQuery: string) {
  return rawQuery
    .replace(/&/g, ' ')
    .replace(/\b([a-z]+):\s+/gi, '$1:')
    .trim();
}

function getQueryTokens(rawQuery: string) {
  const normalized = normalizeQuery(rawQuery);
  return normalized ? normalized.split(/\s+/) : [];
}

function parseQueryToken(token: string) {
  const tokenMatch = token.match(/^([a-z]+)([:=])(.*)$/i);
  if (!tokenMatch) return null;

  const [, rawKey, , rawValue] = tokenMatch;
  return {
    key: rawKey.toLowerCase(),
    value: rawValue.trim(),
  };
}

function getQueryPageSize(rawQuery: string) {
  let pageSize = DEFAULT_PAGE_SIZE;

  for (const token of getQueryTokens(rawQuery)) {
    const parsedToken = parseQueryToken(token);
    if (!parsedToken || parsedToken.key !== 'pagesize') continue;

    const parsed = parsePageSizeValue(parsedToken.value);
    if (parsed) {
      pageSize = parsed;
    }
  }

  return pageSize;
}

function getViewMode(rawQuery: string, fallbackValue?: string | null): ViewMode {
  for (const token of getQueryTokens(rawQuery)) {
    const parsedToken = parseQueryToken(token);
    if (!parsedToken || parsedToken.key !== 'viewas') continue;
    if (VIEW_MODES.includes(parsedToken.value as ViewMode)) {
      return parsedToken.value as ViewMode;
    }
  }

  return VIEW_MODES.includes((fallbackValue || '') as ViewMode) ? (fallbackValue as ViewMode) : 'users';
}

function getLogIdentifier(log: Log) {
  return log.accountId || log.cookieId || 'unknown';
}

function getAgentCategory(log: Log) {
  return log.agentCategory || classifyUserAgent(log.userAgent).agentCategory;
}

function isAiCategory(category: string) {
  return AI_AGENT_CATEGORIES.has(category);
}

function isHumanCategory(category: string) {
  return category === 'Person';
}

function getReferrerSource(log: Log) {
  return normalizeStoredReferrerSource(log.referrerSource, log.referrer) || 'Direct';
}

function getTimestampValue(timestamp: Log['timestamp']) {
  return typeof timestamp === 'string' ? new Date(timestamp).getTime() : new Date(timestamp as any).getTime();
}

function formatTimestamp(timestamp: string) {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

function extractBotName(log: Log) {
  const category = getAgentCategory(log);
  if (category && category !== 'Other Bot') {
    return category;
  }

  const userAgent = (log.userAgent || '').trim();
  if (!userAgent) return 'Other Bot';

  const firstToken = userAgent.split(/\s+/)[0] || '';
  const cleaned = firstToken.split('/')[0]?.trim();
  return cleaned || 'Other Bot';
}

function matchesFreeText(values: Array<string | number | undefined>, tokens: string[]) {
  if (tokens.length === 0) return true;

  const haystack = values
    .filter((value): value is string | number => value !== undefined && value !== null)
    .join(' ')
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

function filterAndSortUsers(users: DisplayUser[], rawQuery: string) {
  const tokens = getQueryTokens(rawQuery);
  const now = Date.now();
  let sortMode: UserSortMode = 'lastseen';
  let pageSize = DEFAULT_PAGE_SIZE;

  const filteredUsers = users.filter((user) => {
    const freeText: string[] = [];

    for (const token of tokens) {
      const parsedToken = parseQueryToken(token);
      if (!parsedToken) {
        freeText.push(token.toLowerCase());
        continue;
      }

      const { key, value } = parsedToken;

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

      if (key === 'viewas') {
        continue;
      }

      if (key === 'referrer') {
        const referrer = normalizeTokenValue(user.referrerSource);
        const isNegated = value.startsWith('!');
        const referrerQuery = normalizeTokenValue(isNegated ? value.slice(1) : value);
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
        const isNegated = value.startsWith('!');
        const requested = normalizeTokenValue(isNegated ? value.slice(1) : value);
        if (!requested) continue;
        if (isNegated ? category === requested : category !== requested) return false;
        continue;
      }

      freeText.push(token.toLowerCase());
    }

    return matchesFreeText(
      [user.identifier, user.userAgentCategory, user.referrerSource, user.ipAddress, user.type],
      freeText,
    );
  });

  filteredUsers.sort((a, b) => {
    if (sortMode === 'activity') return b.activityCount - a.activityCount;
    if (sortMode === 'lowactivity') return a.activityCount - b.activityCount;
    if (sortMode === 'firstseen') return new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime();
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });

  return {
    items: filteredUsers,
    pageSize,
  };
}

function buildPageSummaries(logs: Log[]) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const summaries = new Map<string, PageSummary>();

  for (const log of logs) {
    if (log.resourceType !== 'page') continue;

    const key = log.pageAccessed || '(unknown page)';
    const category = getAgentCategory(log);
    const identifier = getLogIdentifier(log);
    const timestamp = typeof log.timestamp === 'string' ? log.timestamp : new Date(log.timestamp as any).toISOString();
    const timestampValue = getTimestampValue(log.timestamp);
    const current = summaries.get(key);

    if (!current) {
      summaries.set(key, {
        id: key,
        pageAccessed: key,
        totalRequests: 1,
        uniqueIdentifiers: identifier ? 1 : 0,
        last24Hours: timestampValue >= cutoff ? 1 : 0,
        aiRequests: isAiCategory(category) ? 1 : 0,
        humanRequests: isHumanCategory(category) ? 1 : 0,
        otherBotRequests: !isHumanCategory(category) && !isAiCategory(category) ? 1 : 0,
        lastSeen: timestamp,
      });
      continue;
    }

    current.totalRequests += 1;
    if (timestampValue >= cutoff) current.last24Hours += 1;
    if (isAiCategory(category)) current.aiRequests += 1;
    else if (isHumanCategory(category)) current.humanRequests += 1;
    else current.otherBotRequests += 1;
    if (new Date(timestamp).getTime() > new Date(current.lastSeen).getTime()) {
      current.lastSeen = timestamp;
    }
  }

  for (const summary of summaries.values()) {
    const identifiers = new Set(
      logs
        .filter((log) => log.resourceType === 'page' && (log.pageAccessed || '(unknown page)') === summary.pageAccessed)
        .map((log) => getLogIdentifier(log)),
    );
    summary.uniqueIdentifiers = identifiers.size;
  }

  return Array.from(summaries.values()).sort((a, b) => b.totalRequests - a.totalRequests);
}

function buildBotSummaries(logs: Log[]) {
  const summaries = new Map<string, {
    totalRequests: number;
    identifiers: Set<string>;
    pages: Map<string, number>;
    resourceTypes: Set<string>;
    lastSeen: string;
  }>();

  for (const log of logs) {
    const category = getAgentCategory(log);
    if (category === 'Person') continue;

    const name = extractBotName(log);
    const timestamp = typeof log.timestamp === 'string' ? log.timestamp : new Date(log.timestamp as any).toISOString();
    const entry = summaries.get(name) || {
      totalRequests: 0,
      identifiers: new Set<string>(),
      pages: new Map<string, number>(),
      resourceTypes: new Set<string>(),
      lastSeen: timestamp,
    };

    entry.totalRequests += 1;
    entry.identifiers.add(getLogIdentifier(log));
    entry.pages.set(log.pageAccessed || '(unknown page)', (entry.pages.get(log.pageAccessed || '(unknown page)') || 0) + 1);
    entry.resourceTypes.add(log.resourceType || 'unknown');
    if (new Date(timestamp).getTime() > new Date(entry.lastSeen).getTime()) {
      entry.lastSeen = timestamp;
    }

    summaries.set(name, entry);
  }

  return Array.from(summaries.entries())
    .map(([name, entry]) => ({
      id: name,
      name,
      totalRequests: entry.totalRequests,
      uniqueIdentifiers: entry.identifiers.size,
      uniquePages: entry.pages.size,
      lastSeen: entry.lastSeen,
      resourceTypes: Array.from(entry.resourceTypes.values()),
      topPages: Array.from(entry.pages.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([page, count]) => `${page} (${count})`),
    }))
    .sort((a, b) => b.totalRequests - a.totalRequests);
}

function buildReferrerSummaries(logs: Log[]) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const summaries = new Map<string, {
    totalRequests: number;
    identifiers: Set<string>;
    last24Hours: number;
    otherBotRequests: number;
    lastSeen: string;
  }>();

  for (const log of logs) {
    const name = getReferrerSource(log);
    const category = getAgentCategory(log);
    const timestamp = typeof log.timestamp === 'string' ? log.timestamp : new Date(log.timestamp as any).toISOString();
    const timestampValue = getTimestampValue(log.timestamp);
    const entry = summaries.get(name) || {
      totalRequests: 0,
      identifiers: new Set<string>(),
      last24Hours: 0,
      otherBotRequests: 0,
      lastSeen: timestamp,
    };

    entry.totalRequests += 1;
    entry.identifiers.add(getLogIdentifier(log));
    if (timestampValue >= cutoff) entry.last24Hours += 1;
    if (!isHumanCategory(category)) entry.otherBotRequests += 1;
    if (new Date(timestamp).getTime() > new Date(entry.lastSeen).getTime()) {
      entry.lastSeen = timestamp;
    }

    summaries.set(name, entry);
  }

  return Array.from(summaries.entries())
    .map(([name, entry]) => ({
      id: name,
      name,
      totalRequests: entry.totalRequests,
      uniqueIdentifiers: entry.identifiers.size,
      last24Hours: entry.last24Hours,
      otherBotRequests: entry.otherBotRequests,
      lastSeen: entry.lastSeen,
    }))
    .sort((a, b) => b.totalRequests - a.totalRequests);
}

function filterGroupedItems<T>(items: T[], rawQuery: string, toSearchValues: (item: T) => Array<string | number | undefined>) {
  const tokens = getQueryTokens(rawQuery)
    .filter((token) => {
      const parsedToken = parseQueryToken(token);
      if (!parsedToken) return true;
      return !['pagesize', 'sortby', 'soryby', 'viewas'].includes(parsedToken.key);
    });

  return items.filter((item) => matchesFreeText(toSearchValues(item), tokens.map((token) => token.toLowerCase())));
}

function InteractionsContent() {
  const [allUsers, setAllUsers] = useState<DisplayUser[]>([]);
  const [allLogs, setAllLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, startClearing] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const searchQuery = searchParams.get('q') || '';
  const viewMode = getViewMode(searchQuery, searchParams.get('viewAs'));
  const [draftQuery, setDraftQuery] = useState(searchQuery);

  const fetchInteractions = useCallback(async () => {
    setLoading(true);
    try {
      const [users, logs] = await Promise.all([getUsersSummary(), getAllInteractionLogs()]);
      setAllUsers(users);
      setAllLogs(logs);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load interactions. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  useEffect(() => {
    setDraftQuery(searchQuery);
  }, [searchQuery]);

  const pageSize = getQueryPageSize(searchQuery);

  const usersResult = useMemo(() => filterAndSortUsers(allUsers, searchQuery), [allUsers, searchQuery]);
  const pageResults = useMemo(
    () => filterGroupedItems(buildPageSummaries(allLogs), searchQuery, (item) => [
      item.pageAccessed,
      item.totalRequests,
      item.last24Hours,
      item.aiRequests,
      item.humanRequests,
      item.otherBotRequests,
      item.uniqueIdentifiers,
    ]),
    [allLogs, searchQuery],
  );
  const botResults = useMemo(
    () => filterGroupedItems(buildBotSummaries(allLogs), searchQuery, (item) => [
      item.name,
      item.totalRequests,
      item.uniqueIdentifiers,
      item.uniquePages,
      item.resourceTypes.join(' '),
      item.topPages.join(' '),
    ]),
    [allLogs, searchQuery],
  );
  const referrerResults = useMemo(
    () => filterGroupedItems(buildReferrerSummaries(allLogs), searchQuery, (item) => [
      item.name,
      item.totalRequests,
      item.uniqueIdentifiers,
      item.last24Hours,
      item.otherBotRequests,
    ]),
    [allLogs, searchQuery],
  );

  const activeItems = viewMode === 'users'
    ? usersResult.items
    : viewMode === 'page'
      ? pageResults
      : viewMode === 'bots'
        ? botResults
        : referrerResults;

  const totalPages = Math.max(1, Math.ceil(activeItems.length / (viewMode === 'users' ? usersResult.pageSize : pageSize)));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const offset = (safeCurrentPage - 1) * (viewMode === 'users' ? usersResult.pageSize : pageSize);
  const paginatedItems = activeItems.slice(offset, offset + (viewMode === 'users' ? usersResult.pageSize : pageSize));

  const buildInteractionsUrl = (page: number, query: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (query.trim()) params.set('q', query.trim());
    const nextQuery = params.toString();
    return nextQuery ? `/manage/interactions?${nextQuery}` : '/manage/interactions';
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      router.push(buildInteractionsUrl(newPage, searchQuery));
    }
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(buildInteractionsUrl(1, draftQuery));
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

        await fetchInteractions();
        router.push(buildInteractionsUrl(1, searchQuery));
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

  const heading = viewMode === 'users'
    ? 'Interactions by User'
    : viewMode === 'page'
      ? 'Interactions by Page'
      : viewMode === 'bots'
        ? 'Interactions by Bot'
        : 'Interactions by Referrer';

  const description = viewMode === 'users'
    ? 'Current identifier view, grouped by user or visitor.'
    : viewMode === 'page'
      ? 'Grouped by page path with 24-hour, AI, and human traffic counts.'
      : viewMode === 'bots'
        ? 'Grouped by detected bot name with request volume and page spread.'
        : 'Grouped by referring source with unique visitor and request counts.';

  const emptyTitle = viewMode === 'users'
    ? 'No Users Found'
    : viewMode === 'page'
      ? 'No Pages Found'
      : viewMode === 'bots'
        ? 'No Bots Found'
        : 'No Referrers Found';

  const emptyDescription = viewMode === 'users'
    ? 'No identifiers matched the current search.'
    : viewMode === 'page'
      ? 'No pages matched the current search.'
      : viewMode === 'bots'
        ? 'No bots matched the current search.'
        : 'No referrers matched the current search.';

  const searchHelpText = viewMode === 'users'
    ? 'Use queries like `viewAs:users`, `referrer:direct`, `referrer:site`, `ip:127.0.0.1`, `activityCount:over100`, `activityCount:under10`, `lastseen:9d`, `type:googlebot`, `type:person`, `type:otherbot`, `sortby:activity`, or `pagesize:50`.'
    : 'Use queries like `viewAs:page`, `viewAs:bots`, or `viewAs:referrer` to switch modes. Free text filters grouped results, and `pagesize:50` also works in every view.';

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-3">
        <div className="flex w-full max-w-4xl items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                className="border-white bg-white pl-9"
                placeholder={viewMode === 'users' ? 'viewAs:users referrer:direct ip:127.0.0.1 activityCount:over100 lastseen:9d' : `viewAs:${viewMode} search pagesize:50`}
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
                <AlertDialogDescription>{searchHelpText}</AlertDialogDescription>
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
          <div className="py-12 text-center">
            <p className="text-destructive">{error}</p>
          </div>
        ) : paginatedItems.length > 0 ? (
          <>
            <div className="space-y-4">
              {viewMode === 'users' && (paginatedItems as DisplayUser[]).map((user) => (
                <Card key={user.id} className="bg-white">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          Identifier
                        </p>
                        <Link
                          href={`/manage/interactions/${encodeURIComponent(user.id)}`}
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
                        <p className="text-sm font-medium">{formatTimestamp(user.lastSeen)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {viewMode === 'page' && (paginatedItems as PageSummary[]).map((item) => (
                <Card key={item.id} className="bg-white">
                  <CardContent className="space-y-4 p-5">
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Page</p>
                      <p className="break-all font-mono text-sm">{item.pageAccessed}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                      <Metric label="Total Requests" value={item.totalRequests} icon={Activity} />
                      <Metric label="Last 24 Hours" value={item.last24Hours} icon={Clock} />
                      <Metric label="AI Requests" value={item.aiRequests} icon={Bot} />
                      <Metric label="Human Requests" value={item.humanRequests} icon={Users} />
                      <Metric label="Other Bots" value={item.otherBotRequests} icon={Shield} />
                      <Metric label="Unique People" value={item.uniqueIdentifiers} icon={UserRound} />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {viewMode === 'bots' && (paginatedItems as BotSummary[]).map((item) => (
                <Card key={item.id} className="bg-white">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Bot</p>
                        <p className="break-all text-sm font-semibold">{item.name}</p>
                      </div>
                      <Badge variant="secondary">
                        <Bot className="mr-1 h-3 w-3" />
                        {item.resourceTypes.join(', ')}
                      </Badge>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <Metric label="Requests" value={item.totalRequests} icon={Activity} />
                      <Metric label="Last Seen" value={formatTimestamp(item.lastSeen)} icon={Clock} />
                      <Metric label="Unique Identifiers" value={item.uniqueIdentifiers} icon={UserRound} />
                      <Metric label="Unique Pages" value={item.uniquePages} icon={Globe} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Top Pages</p>
                      <div className="flex flex-wrap gap-2">
                        {item.topPages.map((page) => (
                          <Badge key={page} variant="outline">{page}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {viewMode === 'referrer' && (paginatedItems as ReferrerSummary[]).map((item) => (
                <Card key={item.id} className="bg-white">
                  <CardContent className="space-y-4 p-5">
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Referrer</p>
                      <p className="break-all text-sm font-semibold">{item.name}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                      <Metric label="Last Seen" value={formatTimestamp(item.lastSeen)} icon={Clock} />
                      <Metric label="Requests" value={item.totalRequests} icon={Activity} />
                      <Metric label="Unique People" value={item.uniqueIdentifiers} icon={Users} />
                      <Metric label="Last 24 Hours" value={item.last24Hours} icon={Clock} />
                      <Metric label="Other Bots" value={item.otherBotRequests} icon={Shield} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {viewMode === 'users' ? (
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
              ) : (
                <div className="text-sm text-muted-foreground">
                  Showing {paginatedItems.length} of {activeItems.length} grouped results.
                </div>
              )}

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
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
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            <ExternalLink className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">{emptyTitle}</h3>
            <p>{emptyDescription}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="break-all text-sm font-medium">{value}</p>
    </div>
  );
}

export default function InteractionsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Interactions</h1>
            <p className="text-sm text-muted-foreground">
              Loading grouped interaction views.
            </p>
          </div>
          <Skeleton className="h-10 w-full max-w-4xl" />
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-40 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <InteractionsContent />
    </Suspense>
  );
}
