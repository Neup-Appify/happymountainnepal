
'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getLogsByIdentifier } from '@/lib/db';
import { classifyUserAgent, normalizeStoredReferrerSource } from '@/lib/log-classification';
import type { Log } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity as ActivityIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ActivityPageProps = {
    params: Promise<{
        accountId: string;
    }>
}

export default function AccountActivityPage({ params }: ActivityPageProps) {
  const { accountId } = use(params);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const fetchedLogs = await getLogsByIdentifier(accountId);
        setLogs(fetchedLogs);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load activities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [accountId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='mb-4'>
            <Button asChild variant="outline" size="sm">
                <Link href="/manage/accounts">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to All Accounts
                </Link>
            </Button>
        </div>
        <CardTitle>User Activity</CardTitle>
        <CardDescription className="font-mono text-xs break-all">
          Showing logged activity for identifier: {accountId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const agentCategory = log.agentCategory || classifyUserAgent(log.userAgent).agentCategory;
                const referrerSource = normalizeStoredReferrerSource(log.referrerSource, log.referrer);
                const timestamp =
                  typeof log.timestamp === 'string'
                    ? new Date(log.timestamp)
                    : log.timestamp?.toDate
                      ? log.timestamp.toDate()
                      : null;

                return (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge>{log.resourceType}</Badge>
                      <div className="text-xs text-muted-foreground">
                        {log.method || 'GET'} {log.pageAccessed}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={agentCategory === 'Person' ? 'default' : 'secondary'}>
                        {agentCategory}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {log.statusCode ? `Status ${log.statusCode}` : 'No status'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {log.ipAddress || 'Unknown'}
                      {log.countryCode ? ` (${log.countryCode})` : ''}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="space-y-1">
                      <div>{referrerSource}</div>
                      {log.referrer ? (
                        <div className="max-w-[18rem] break-all text-muted-foreground">
                          {log.referrer}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {timestamp ? formatDistanceToNow(timestamp, { addSuffix: true }) : 'N/A'}
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <ActivityIcon className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">No Activities Found</h3>
            <p>This identifier has no logged activity yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
