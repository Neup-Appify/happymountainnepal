import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllPublishedTours } from "@/lib/db/tours";
import { findToursByKeywords, getInquiryLink, trekHubs } from "@/lib/growth-content";

type TrekHubPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return trekHubs.map((hub) => ({ slug: hub.slug }));
}

export default async function TrekHubDetailPage({ params }: TrekHubPageProps) {
  const { slug } = await params;
  const hub = trekHubs.find((item) => item.slug === slug);

  if (!hub) {
    notFound();
  }

  const tours = await getAllPublishedTours();
  const relatedTours = findToursByKeywords(tours, hub.tourKeywords).slice(0, 4);

  return (
    <div className="bg-background">
      <div className="container mx-auto py-16 space-y-10">
        <div className="max-w-4xl space-y-4">
          <Badge variant="secondary">{hub.audience}</Badge>
          <h1 className="text-4xl md:text-5xl font-bold !font-headline">
            {hub.title}
          </h1>
          <p className="text-lg text-muted-foreground">{hub.summary}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl !font-headline">
                Helpful Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {hub.topics.map((topic) => (
                <div key={topic} className="rounded-lg bg-secondary/70 p-4">
                  {topic}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl !font-headline">
                Questions Travelers Often Ask
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hub.decisionQuestions.map((question) => (
                <div key={question}>
                  <p className="font-medium">{question}</p>
                </div>
              ))}
              <div className="rounded-lg bg-secondary/70 p-4 text-sm text-muted-foreground">
                Use this page as your starting point, then contact us if you
                want advice tailored to your dates, fitness, and trip goals.
              </div>
              <Button asChild>
                <Link
                  href={getInquiryLink(
                    `${hub.title} planning help`,
                    `I am researching ${hub.title}. Please help me narrow the right route, timing, and budget for this trek.`
                  )}
                >
                  Ask for trek advice
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {relatedTours.length > 0 ? (
          <div className="space-y-5">
            <h2 className="text-3xl font-bold !font-headline">
              Recommended Treks
            </h2>
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
