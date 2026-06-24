import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trekComparisons } from "@/lib/growth-content";

export default function ComparisonsPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto py-16 space-y-10">
        <div className="max-w-4xl space-y-4">
          <Badge variant="secondary">Trek Comparisons</Badge>
          <h1 className="text-4xl md:text-5xl font-bold !font-headline">
            Compare Nepal's most popular treks side by side
          </h1>
          <p className="text-lg text-muted-foreground">
            If you are torn between two routes, start here. Compare difficulty,
            style, altitude, and overall feel before you decide.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {trekComparisons.map((comparison) => (
            <Link key={comparison.slug} href={`/comparisons/${comparison.slug}`}>
              <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-3">
                  <Badge variant="outline">{comparison.decisionStage}</Badge>
                  <CardTitle className="text-2xl !font-headline">
                    {comparison.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>{comparison.summary}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="font-medium text-foreground">
                        {comparison.left.name}
                      </p>
                      <p>{comparison.left.bestFor}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {comparison.right.name}
                      </p>
                      <p>{comparison.right.bestFor}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
