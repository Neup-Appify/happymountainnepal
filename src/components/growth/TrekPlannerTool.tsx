"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Tour } from "@/lib/types";
import { getInquiryLink } from "@/lib/growth-content";

const fitnessScores: Record<string, number> = {
  easy: 1,
  moderate: 2,
  strong: 3,
};

const difficultyScores: Record<string, number> = {
  Easy: 1,
  Moderate: 2,
  Strenuous: 3,
  Challenging: 4,
};

const seasons: Record<string, string[]> = {
  spring: ["everest", "annapurna", "langtang", "manaslu"],
  summer: ["langtang", "manaslu"],
  autumn: ["everest", "annapurna", "langtang", "manaslu", "mera", "island"],
  winter: ["langtang", "annapurna"],
};

export function TrekPlannerTool({ tours }: { tours: Tour[] }) {
  const [month, setMonth] = useState("autumn");
  const [budget, setBudget] = useState("mid");
  const [fitness, setFitness] = useState("moderate");
  const [days, setDays] = useState("10-14");

  const ranked = useMemo(() => {
    const desiredDays =
      days === "7-9" ? [7, 9] : days === "10-14" ? [10, 14] : [15, 24];
    const budgetCap = budget === "low" ? 1300 : budget === "mid" ? 2400 : 5000;
    const allowedSeasonWords = seasons[month] || [];
    const fitnessScore = fitnessScores[fitness] || 2;

    return tours
      .map((tour) => {
        let score = 0;
        const durationDelta =
          tour.duration < desiredDays[0]
            ? desiredDays[0] - tour.duration
            : tour.duration > desiredDays[1]
              ? tour.duration - desiredDays[1]
              : 0;

        score -= durationDelta * 8;
        score -= Math.max(0, tour.price - budgetCap) / 40;
        score -= Math.max(0, difficultyScores[tour.difficulty] - fitnessScore) * 18;

        const haystack = `${tour.name} ${tour.slug} ${tour.region.join(" ")}`.toLowerCase();
        if (allowedSeasonWords.some((word) => haystack.includes(word))) {
          score += 25;
        }
        if (tour.isPopular) score += 6;
        if (tour.isFeatured) score += 4;

        return { tour, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [budget, days, fitness, month, tours]);

  const topPick = ranked[0]?.tour;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl !font-headline">
            Planner Inputs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spring">Spring</SelectItem>
                <SelectItem value="summer">Summer / Monsoon Edge</SelectItem>
                <SelectItem value="autumn">Autumn</SelectItem>
                <SelectItem value="winter">Winter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Budget</Label>
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Under $1,300</SelectItem>
                <SelectItem value="mid">$1,300 to $2,400</SelectItem>
                <SelectItem value="high">$2,400+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fitness</Label>
            <Select value={fitness} onValueChange={setFitness}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Need a softer trek</SelectItem>
                <SelectItem value="moderate">Moderately active</SelectItem>
                <SelectItem value="strong">Strong trekking base</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Trip Length</Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7-9">7 to 9 days</SelectItem>
                <SelectItem value="10-14">10 to 14 days</SelectItem>
                <SelectItem value="15+">15+ days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl !font-headline">
            Recommended Treks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {topPick ? (
            <div className="rounded-xl bg-secondary/70 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Top Recommendation
              </p>
              <h3 className="mt-2 text-3xl font-bold !font-headline">
                {topPick.name}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {topPick.duration} days • {topPick.difficulty} • from ${topPick.price}
              </p>
            </div>
          ) : null}

          <div className="space-y-4">
            {ranked.map(({ tour }) => (
              <div
                key={tour.id}
                className="rounded-lg border border-border/70 p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-xl font-semibold">{tour.name}</h4>
                  <Badge variant="outline">{tour.difficulty}</Badge>
                  <Badge variant="outline">{tour.duration} days</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tour.shortDescription || tour.description.replace(/<[^>]+>/g, "").slice(0, 160)}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild size="sm">
                    <Link href={`/tours/${tour.slug}`}>View Trek</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={getInquiryLink(
                        `Planner follow-up for ${tour.name}`,
                        `The trek planner recommended ${tour.name}. Please help me confirm if it is the right fit for my month, budget, and fitness.`
                      )}
                    >
                      Ask for Custom Advice
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
