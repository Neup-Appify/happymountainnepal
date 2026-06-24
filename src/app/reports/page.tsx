import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trailReports } from "@/lib/growth-content";

export default function ReportsPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto py-16 space-y-10">
        <div className="max-w-4xl space-y-4">
          <Badge variant="secondary">Trail Reports</Badge>
          <h1 className="text-4xl md:text-5xl font-bold !font-headline">
            Trail updates for travelers planning their next trek
          </h1>
          <p className="text-lg text-muted-foreground">
            Check route conditions, weather-related notes, and practical travel
            updates before you choose your dates or finalize your itinerary.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {trailReports.map((report) => (
            <Card key={report.slug} className="h-full">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">{report.region}</Badge>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {report.updatedLabel}
                  </span>
                </div>
                <CardTitle className="text-2xl !font-headline">
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{report.summary}</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {report.highlights.map((highlight) => (
                    <p key={highlight}>{highlight}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-2xl bg-secondary/70 p-8">
          <h2 className="text-2xl font-bold !font-headline">
            Need the latest advice?
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            If you are deciding between months, worried about flights, or want
            help understanding current route conditions, contact our team and we
            will point you in the right direction.
          </p>
          <Button asChild className="mt-6">
            <Link href="/contact?subject=Trail%20report%20question&message=I%20have%20a%20question%20about%20current%20trail%20conditions%20for%20my%20planned%20trek.">
              Ask About Current Conditions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
