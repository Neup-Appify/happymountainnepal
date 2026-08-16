import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ManageLinksContent } from './ManageLinksContent';
import { getLinkReport } from '@/services/links/get-link-report';

function ManageLinksLoadingFallback() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold !font-headline">Link Scanner</h1>
        <p className="mt-2 text-muted-foreground">Scanning blog links and checking known targets.</p>
      </div>
      <Card>
        <CardContent className="py-8">
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ManageLinksPage() {
  const report = await getLinkReport();

  return <ManageLinksContent report={report} />;
}
