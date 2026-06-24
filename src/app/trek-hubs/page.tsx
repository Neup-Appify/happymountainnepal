import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trekHubs } from "@/lib/growth-content";

export default function TrekHubsPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto py-16 space-y-10">
        <div className="max-w-4xl space-y-4">
          <Badge variant="secondary">Trek Guides</Badge>
          <h1 className="text-4xl md:text-5xl font-bold !font-headline">
            Everything you need to know before choosing your trek
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore practical planning information for Everest, Annapurna,
            Manaslu, and Langtang, from weather and costs to route style and preparation.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {trekHubs.map((hub) => (
            <Link key={hub.slug} href={`/trek-hubs/${hub.slug}`}>
              <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-3">
                  <Badge variant="outline">{hub.audience}</Badge>
                  <CardTitle className="text-3xl !font-headline">
                    {hub.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{hub.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {hub.topics.slice(0, 4).map((topic) => (
                      <Badge key={topic} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
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
