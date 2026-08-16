'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle2, ExternalLink, Link2, Search, ShieldQuestion } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LinkReport, LinkStatus, LinkTargetType } from '@/services/links/get-link-report';

interface ManageLinksContentProps {
  report: LinkReport;
}

type FilterValue = 'all' | LinkTargetType | 'missing';

const filterLabels: Record<FilterValue, string> = {
  all: 'All Links',
  'internal-blog': 'Blog Links',
  'internal-tour': 'Tour Links',
  'internal-other': 'Same-Site Other',
  external: 'External Links',
  missing: 'Missing Only',
};

const statusStyles: Record<LinkStatus, string> = {
  valid: 'border-green-200 bg-green-50 text-green-700',
  missing: 'border-red-200 bg-red-50 text-red-700',
  untracked: 'border-amber-200 bg-amber-50 text-amber-700',
  external: 'border-slate-200 bg-slate-50 text-slate-700',
};

const typeStyles: Record<LinkTargetType, string> = {
  'internal-blog': 'border-sky-200 bg-sky-50 text-sky-700',
  'internal-tour': 'border-indigo-200 bg-indigo-50 text-indigo-700',
  'internal-other': 'border-orange-200 bg-orange-50 text-orange-700',
  external: 'border-violet-200 bg-violet-50 text-violet-700',
};

function formatStatus(status: LinkStatus) {
  if (status === 'valid') return 'Valid';
  if (status === 'missing') return 'Missing';
  if (status === 'untracked') return 'Unchecked';
  return 'External';
}

function formatType(type: LinkTargetType) {
  if (type === 'internal-blog') return 'Blog';
  if (type === 'internal-tour') return 'Tour';
  if (type === 'internal-other') return 'Same Site';
  return 'External';
}

export function ManageLinksContent({ report }: ManageLinksContentProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return report.entries.filter((entry) => {
      if (activeFilter === 'missing' && entry.status !== 'missing') {
        return false;
      }

      if (activeFilter !== 'all' && activeFilter !== 'missing' && entry.targetType !== activeFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [entry.page, entry.pageTitle, entry.anchor, entry.target]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [activeFilter, deferredQuery, report.entries]);

  const filteredMissingCount = useMemo(
    () => filteredEntries.filter((entry) => entry.status === 'missing').length,
    [filteredEntries]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold !font-headline">Link Scanner</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Scan all links used inside blog articles. Blog and tour targets on `happymountainnepal.com`
            are checked against the local database. Other same-site pages and external domains are shown for review.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Updated {formatDistanceToNow(new Date(report.generatedAt), { addSuffix: true })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Links</CardDescription>
            <CardTitle className="text-3xl">{report.summary.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Blog HTML links scanned across all articles.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Internal Blog + Tour</CardDescription>
            <CardTitle className="text-3xl">
              {report.summary.internalBlog + report.summary.internalTour}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {report.summary.valid} valid, {report.summary.missing} missing
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>External Links</CardDescription>
            <CardTitle className="text-3xl">{report.summary.external}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Outbound links to domains outside your site.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Same-Site Other</CardDescription>
            <CardTitle className="text-3xl">{report.summary.internalOther}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Internal links outside `/blog/[slug]` and `/tours/[slug]`.
          </CardContent>
        </Card>
      </div>

      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Missing Targets
          </CardTitle>
          <CardDescription className="text-red-700/80">
            These are internal blog or tour links whose target slug does not exist in the current database.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-red-700">
          <span className="font-semibold">{report.summary.missing} missing links found</span>
          <span>Current filtered view: {filteredMissingCount}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Link Inventory</CardTitle>
            <CardDescription>
              Filter by target type and search by source page, anchor text, or URL.
            </CardDescription>
          </div>
          <div className="relative w-full lg:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search links"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterValue)}>
            <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
              {Object.entries(filterLabels).map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <ScrollArea className="max-h-[70vh] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="min-w-[240px]">Page</TableHead>
                  <TableHead className="min-w-[180px]">Anchor</TableHead>
                  <TableHead className="min-w-[280px]">Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No links match the current filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={`${entry.page}:${entry.anchor}:${entry.target}`}>
                      <TableCell>
                        <div className="space-y-1">
                          <Link href={entry.page} target="_blank" className="font-medium text-primary hover:underline">
                            {entry.page}
                          </Link>
                          <p className="text-xs text-muted-foreground">{entry.pageTitle}</p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <span className="text-sm text-foreground">
                          {entry.anchor || <span className="italic text-muted-foreground">No anchor text</span>}
                        </span>
                      </TableCell>
                      <TableCell className="align-top">
                        {entry.targetType === 'external' ? (
                          <a
                            href={entry.target}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-start gap-2 break-all text-primary hover:underline"
                          >
                            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{entry.target}</span>
                          </a>
                        ) : (
                          <Link href={entry.target} target="_blank" className="break-all text-primary hover:underline">
                            {entry.target}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant="outline" className={statusStyles[entry.status]}>
                          {entry.status === 'valid' && <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
                          {entry.status === 'missing' && <AlertCircle className="mr-1 h-3.5 w-3.5" />}
                          {entry.status === 'untracked' && <ShieldQuestion className="mr-1 h-3.5 w-3.5" />}
                          {entry.status === 'external' && <ExternalLink className="mr-1 h-3.5 w-3.5" />}
                          {formatStatus(entry.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant="outline" className={typeStyles[entry.targetType]}>
                          <Link2 className="mr-1 h-3.5 w-3.5" />
                          {formatType(entry.targetType)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
