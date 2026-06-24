import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Compass,
  CalendarRange,
  Headphones,
  MessageCircle,
  Mountain,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ManagedReview, SiteProfile, TeamMember, Tour } from "@/lib/types";
import {
  clientStories,
  computeTrustStats,
  getInquiryLink,
  getWhatsappHref,
  trailReports,
  trekComparisons,
  trekHubs,
} from "@/lib/growth-content";

const trustIcons = [Users, Mountain, Compass, ShieldCheck, Star, Headphones];

export function TrustConversionSection({
  profile,
  reviews,
  teamMembers,
}: {
  profile?: SiteProfile | null;
  reviews: ManagedReview[];
  teamMembers: TeamMember[];
}) {
  const stats = computeTrustStats(reviews, teamMembers);
  const primaryStats = stats.slice(0, 5);
  const whatsappHref = getWhatsappHref(
    profile,
    "Hi Happy Mountain Nepal, I would like a free consultation for my Nepal trip."
  );
  const trustImage =
    profile?.heroImages?.[0] ||
    profile?.heroImage ||
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80";
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length
        ).toFixed(1)
      : "5.0";

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge
              variant="secondary"
              className="border-0 bg-transparent px-0 text-sm font-semibold uppercase tracking-[0.18em] text-primary"
            >
              Why Travelers Choose Us
            </Badge>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-bold leading-[1.05] !font-headline text-foreground md:text-[2.5rem] lg:text-[2.9rem]">
                Trusted by 1,200+ Trekkers from 45+ Countries
              </h2>
              <p className="max-w-2xl text-lg leading-7 text-muted-foreground md:text-[1rem]">
                Because when you&apos;re spending thousands of dollars and flying
                across the world for a Himalayan adventure, you want a team
                that actually knows Nepal.
              </p>
              <ul className="max-w-2xl space-y-3 text-base leading-7 text-muted-foreground md:text-[0.95rem]">
                <li className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span>
                    Not a booking website. Not a middleman. A local team that&apos;s
                    on the ground before you arrive, during your trek, and still
                    available when plans change.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span>
                    For over 12 years, we&apos;ve been helping travelers explore the
                    best of Nepal with local expertise, genuine care, and complete
                    transparency.
                  </span>
                </li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <Button asChild size="lg" className="min-w-[220px] rounded-xl px-7">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Talk to a Local Expert
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-w-[220px] rounded-xl px-7">
                <Link
                  href={getInquiryLink(
                    "Plan my trek",
                    "I would like help planning the right Nepal trek for my dates, budget, and fitness."
                  )}
                >
                  <CalendarRange className="mr-2 h-4 w-4" />
                  Plan My Trek
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-card shadow-[0_25px_50px_rgba(20,20,43,0.14)]">
              <div className="relative aspect-[16/11] w-full">
                <Image
                  src={trustImage}
                  alt="Trekkers in the Himalayas with Happy Mountain Nepal"
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 42vw, 100vw"
                />
              </div>
            </div>

            <div className="absolute left-4 top-4 w-[190px] rounded-[1.5rem] bg-white/95 p-5 shadow-[0_16px_40px_rgba(20,20,43,0.16)] backdrop-blur md:left-[-28px] md:top-[18px]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div className="text-4xl font-bold leading-none text-foreground">
                  {averageRating}/5
                </div>
              </div>
              <div className="mt-3 flex gap-1 text-amber-400">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                Average Rating
              </p>
              <p className="text-sm text-muted-foreground">
                From Real Travelers
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-0 overflow-hidden rounded-[1.75rem] border border-border/70 bg-white shadow-[0_18px_40px_rgba(20,20,43,0.08)] lg:grid-cols-5">
          {primaryStats.map((stat, index) => {
            const Icon = trustIcons[index % trustIcons.length];
            return (
              <div
                key={stat.label}
                className="flex gap-4 p-6 lg:min-h-[160px] lg:border-l lg:border-border/60 lg:first:border-l-0"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-3xl font-bold leading-none text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {stat.label}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {stat.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TrailReportsSection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary">Latest updates</Badge>
            <h2 className="text-3xl md:text-4xl font-bold !font-headline">
              Trail updates and practical notes from the routes people are asking about most.
            </h2>
            <p className="max-w-3xl text-muted-foreground">
              Read current notes on trail conditions, weather, and travel timing
              so you can plan with fewer surprises.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/reports">
              View All Reports
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
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
                <CardTitle className="text-xl leading-tight !font-headline">
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{report.summary}</p>
                <div className="space-y-2 text-sm">
                  {report.highlights.map((highlight) => (
                    <div key={highlight} className="flex gap-2">
                      <Mountain className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrekComparisonSection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary">Choose the right trek</Badge>
            <h2 className="text-3xl md:text-4xl font-bold !font-headline">
              Not sure which trek fits you best?
            </h2>
            <p className="max-w-3xl text-muted-foreground">
              Compare route style, altitude, pace, and overall experience before
              you commit to the wrong trip.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/comparisons">
              Browse Comparisons
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {trekComparisons.slice(0, 4).map((comparison) => (
            <Link key={comparison.slug} href={`/comparisons/${comparison.slug}`}>
              <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {comparison.decisionStage}
                    </p>
                    <h3 className="text-2xl font-bold !font-headline">
                      {comparison.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {comparison.summary}
                  </p>
                  <Separator />
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="font-medium">{comparison.left.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {comparison.left.bestFor}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">{comparison.right.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {comparison.right.bestFor}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClientStoriesSection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary">Traveler stories</Badge>
            <h2 className="text-3xl md:text-4xl font-bold !font-headline">
              Real stories from travelers who trekked Nepal with us.
            </h2>
            <p className="max-w-3xl text-muted-foreground">
              See what their trip was like, what challenges came up on the way,
              and how our guides helped them through it.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/stories">
              Read Client Stories
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {clientStories.map((story) => (
            <Card key={story.slug} className="h-full">
              <CardHeader className="space-y-3">
                <Badge variant="outline">
                  {story.traveler} • {story.country}
                </Badge>
                <CardTitle className="text-xl !font-headline">
                  {story.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">{story.summary}</p>
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">Trek:</span> {story.trek}
                  </p>
                  <p>
                    <span className="font-semibold">Guide:</span> {story.guide}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/70 p-4 text-muted-foreground">
                  <p className="font-medium text-foreground">What went wrong</p>
                  <p className="mt-1">{story.challenge}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PlanningToolsSection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto">
        <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-primary/20 shadow-lg">
            <CardHeader className="space-y-3">
              <Badge variant="secondary">Budget your trip</Badge>
              <CardTitle className="text-3xl !font-headline">
                Trek Cost Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Get a quick budget range for popular Nepal treks and understand
                how trip style, gear, and extra days can affect the total.
              </p>
              <Button asChild>
                <Link href="/tools/cost-calculator">
                  Open Calculator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="space-y-3">
              <Badge variant="secondary">Find your trek</Badge>
              <CardTitle className="text-3xl !font-headline">
                Trek Planner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Tell us your month, budget, fitness, and available days to see
                which trek may suit you best.
              </p>
              <Button asChild>
                <Link href="/tools/trek-planner">
                  Open Planner
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-4">
          {trekHubs.map((hub) => (
            <Card key={hub.slug}>
              <CardContent className="space-y-3 p-6">
                <p className="text-sm font-medium text-primary">Content Hub</p>
                <h3 className="text-xl font-bold !font-headline">{hub.title}</h3>
                <p className="text-sm text-muted-foreground">{hub.summary}</p>
                <Link
                  href={`/trek-hubs/${hub.slug}`}
                  className="inline-flex items-center text-sm font-medium text-primary"
                >
                  Explore hub
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DepartureCalendarPreview({ tours }: { tours: Tour[] }) {
  const uniqueTours = tours.filter(
    (tour, index, array) => array.findIndex((item) => item.id === tour.id) === index
  );

  const upcoming = uniqueTours
    .flatMap((tour) =>
      (tour.departureDates || []).map((departure) => ({
        tour,
        departure,
      }))
    )
    .sort((a, b) => String(a.departure.date).localeCompare(String(b.departure.date)))
    .slice(0, 6);

  if (upcoming.length === 0) {
    return null;
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary">Upcoming departures</Badge>
            <h2 className="text-3xl md:text-4xl font-bold !font-headline">
              See upcoming dates for some of our most requested treks.
            </h2>
            <p className="max-w-3xl text-muted-foreground">
              If a date works for you, ask us about availability, group fit, and
              current route conditions before you book.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/departures">
              Full Departure Calendar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {upcoming.map(({ tour, departure }, index) => (
            <Card key={`${tour.id}-${index}`}>
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{tour.name}</p>
                  <Badge variant={departure.guaranteed ? "default" : "outline"}>
                    {departure.guaranteed ? "Guaranteed" : "Open"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>{String(departure.date)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Price from ${departure.price}. Ask the team about remaining seats and group fit.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
