import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientStories, getInquiryLink } from "@/lib/growth-content";

export default function StoriesPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto py-16 space-y-10">
        <div className="max-w-4xl space-y-4">
          <Badge variant="secondary">Client Stories</Badge>
          <h1 className="text-4xl md:text-5xl font-bold !font-headline">
            Hear from travelers who explored Nepal with our team
          </h1>
          <p className="text-lg text-muted-foreground">
            Every trip has its own rhythm. These stories share the route, the
            guide, the challenges along the way, and the moments that made the journey special.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {clientStories.map((story) => (
            <Card key={story.slug} className="h-full">
              <CardHeader className="space-y-3">
                <Badge variant="outline">
                  {story.traveler} • {story.country}
                </Badge>
                <CardTitle className="text-2xl !font-headline">
                  {story.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-1 text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">Trek:</span>{" "}
                    {story.trek}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Guide:</span>{" "}
                    {story.guide}
                  </p>
                </div>
                <p className="text-muted-foreground">{story.summary}</p>
                <div className="rounded-lg bg-secondary/70 p-4">
                  <p className="font-semibold">What went wrong</p>
                  <p className="mt-1 text-muted-foreground">{story.challenge}</p>
                </div>
                <div>
                  <p className="font-semibold">How the team helped</p>
                  <p className="mt-1 text-muted-foreground">{story.support}</p>
                </div>
                <div>
                  <p className="font-semibold">Outcome</p>
                  <p className="mt-1 text-muted-foreground">{story.outcome}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-2xl bg-secondary/70 p-8">
          <h2 className="text-2xl font-bold !font-headline">
            Want a trip like this?
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Tell us what kind of experience you want and we will help you plan
            a similar trek around your own dates, budget, and fitness.
          </p>
          <Button asChild className="mt-6">
            <Link
              href={getInquiryLink(
                "I want a trip like these client stories",
                "I read the client stories and would like help planning a similar Nepal trek for my own dates and goals."
              )}
            >
              Plan a similar trip
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
