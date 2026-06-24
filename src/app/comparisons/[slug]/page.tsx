import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllPublishedTours } from "@/lib/db/tours";
import { findToursByKeywords, getInquiryLink, trekComparisons } from "@/lib/growth-content";

type ComparisonPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return trekComparisons.map((comparison) => ({ slug: comparison.slug }));
}

export default async function ComparisonDetailPage({ params }: ComparisonPageProps) {
  const { slug } = await params;
  const comparison = trekComparisons.find((item) => item.slug === slug);

  if (!comparison) {
    notFound();
  }

  const tours = await getAllPublishedTours();
  const relatedTours = findToursByKeywords(tours, comparison.tourKeywords).slice(0, 4);

  return (
    <div className="bg-background">
      <div className="container mx-auto py-16 space-y-10">
        <div className="max-w-4xl space-y-4">
          <Badge variant="secondary">{comparison.decisionStage}</Badge>
          <h1 className="text-4xl md:text-5xl font-bold !font-headline">
            {comparison.title}
          </h1>
          <p className="text-lg text-muted-foreground">{comparison.summary}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {[comparison.left, comparison.right].map((side) => (
            <Card key={side.name}>
              <CardHeader>
                <CardTitle className="text-3xl !font-headline">{side.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold">Best for</p>
                  <p className="text-muted-foreground">{side.bestFor}</p>
                </div>
                <div>
                  <p className="font-semibold">Pace</p>
                  <p className="text-muted-foreground">{side.pace}</p>
                </div>
                <div>
                  <p className="font-semibold">Altitude</p>
                  <p className="text-muted-foreground">{side.altitude}</p>
                </div>
                <div>
                  <p className="font-semibold">Style</p>
                  <p className="text-muted-foreground">{side.style}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl !font-headline">
              Our take
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">{comparison.winner}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link
                  href={getInquiryLink(
                    `Help me choose: ${comparison.title}`,
                    `I am comparing ${comparison.title}. Please help me decide which trek is the better fit for my dates, fitness, and budget.`
                  )}
                >
                  Ask us which one fits you
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/tools/trek-planner">Try the Trek Planner</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {relatedTours.length > 0 ? (
          <div className="space-y-5">
            <h2 className="text-3xl font-bold !font-headline">Explore These Treks</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {relatedTours.map((tour) => (
                <Card key={tour.id}>
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold">{tour.name}</h3>
                      <Badge variant="outline">{tour.duration} days</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tour.shortDescription || tour.description.replace(/<[^>]+>/g, "").slice(0, 160)}
                    </p>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/tours/${tour.slug}`}>View trek</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
