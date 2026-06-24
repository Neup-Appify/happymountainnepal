import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllPublishedTours } from "@/lib/db/tours";
import { getInquiryLink } from "@/lib/growth-content";

export default async function DeparturesPage() {
  const tours = await getAllPublishedTours();
  const departures = tours
    .flatMap((tour) =>
      (tour.departureDates || []).map((departure, index) => ({
        id: `${tour.id}-${index}`,
        tour,
        departure,
      }))
    )
    .sort((a, b) => String(a.departure.date).localeCompare(String(b.departure.date)));

  return (
    <div className="bg-background">
      <div className="container mx-auto py-16 space-y-10">
        <div className="max-w-4xl space-y-4">
          <Badge variant="secondary">Departure Calendar</Badge>
          <h1 className="text-4xl md:text-5xl font-bold !font-headline">
            Find your next departure date
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse upcoming departures, then contact us for availability,
            route advice, and help choosing the right date for your trip.
          </p>
        </div>

        {departures.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {departures.map(({ id, tour, departure }) => (
              <Card key={id}>
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-2xl !font-headline">
                      {tour.name}
                    </CardTitle>
                    <Badge variant={departure.guaranteed ? "default" : "outline"}>
                      {departure.guaranteed ? "Guaranteed" : "Open"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p>
                    <span className="font-semibold">Departure date:</span>{" "}
                    {String(departure.date)}
                  </p>
                  <p>
                    <span className="font-semibold">Price from:</span> $
                    {departure.price}
                  </p>
                  <p className="text-muted-foreground">
                    Ask the team about remaining seats, route conditions, and
                    whether this departure is the right fit for your fitness and schedule.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="sm">
                      <Link
                        href={getInquiryLink(
                          `Departure question for ${tour.name}`,
                          `I want details about the ${tour.name} departure on ${String(departure.date)}. Please tell me about availability, remaining seats, and whether this date is a good fit.`
                        )}
                      >
                        Ask about seats
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/tours/${tour.slug}`}>View trek</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-muted-foreground">
              Departure dates will be listed here as they are confirmed. If you
              already know which trek you want, contact us and we can suggest the best dates.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
