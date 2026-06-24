"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Tour } from "@/lib/types";
import { getInquiryLink } from "@/lib/growth-content";

export function TrekCostCalculator({ tours }: { tours: Tour[] }) {
  const [tourId, setTourId] = useState(tours[0]?.id ?? "");
  const [travelers, setTravelers] = useState(2);
  const [gearLevel, setGearLevel] = useState("standard");
  const [hotelLevel, setHotelLevel] = useState("standard");
  const [bufferDays, setBufferDays] = useState([2]);

  const selectedTour = useMemo(
    () => tours.find((tour) => tour.id === tourId) ?? tours[0],
    [tourId, tours]
  );

  const breakdown = useMemo(() => {
    const baseTripCost = (selectedTour?.price || 0) * travelers;
    const permitAndLogistics = Math.max(90, (selectedTour?.duration || 1) * 18) * travelers;
    const gearRentalPerTraveler =
      gearLevel === "basic" ? 60 : gearLevel === "premium" ? 180 : 110;
    const hotelPerNight =
      hotelLevel === "budget" ? 25 : hotelLevel === "premium" ? 85 : 45;
    const cityBufferCost = bufferDays[0] * hotelPerNight * travelers;
    const gearCost = gearRentalPerTraveler * travelers;
    const contingency = Math.round((baseTripCost + permitAndLogistics + gearCost) * 0.08);
    const total =
      baseTripCost + permitAndLogistics + cityBufferCost + gearCost + contingency;

    return {
      baseTripCost,
      permitAndLogistics,
      cityBufferCost,
      gearCost,
      contingency,
      total,
    };
  }, [bufferDays, gearLevel, hotelLevel, selectedTour, travelers]);

  if (!selectedTour) {
    return null;
  }

  const consultationLink = getInquiryLink(
    `Cost planning request for ${selectedTour.name}`,
    `Please review this ${selectedTour.name} budget with me. We are ${travelers} traveler(s), want ${bufferDays[0]} buffer day(s), and would like help making the quote more accurate.`
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl !font-headline">
            Trip Inputs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Trek</Label>
            <Select value={tourId} onValueChange={setTourId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a trek" />
              </SelectTrigger>
              <SelectContent>
                {tours.map((tour) => (
                  <SelectItem key={tour.id} value={tour.id}>
                    {tour.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Travelers</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={travelers}
              onChange={(event) => setTravelers(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>

          <div className="space-y-2">
            <Label>Gear Rental Level</Label>
            <Select value={gearLevel} onValueChange={setGearLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Kathmandu Hotel Level</Label>
            <Select value={hotelLevel} onValueChange={setHotelLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Buffer Days in Kathmandu</Label>
              <span className="text-sm text-muted-foreground">{bufferDays[0]} day(s)</span>
            </div>
            <Slider
              value={bufferDays}
              min={0}
              max={5}
              step={1}
              onValueChange={setBufferDays}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl !font-headline">
            Estimated Budget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Estimate for {selectedTour.name}
            </p>
            <p className="mt-2 text-5xl font-bold">${breakdown.total.toLocaleString()}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Base trek cost</span>
              <span>${breakdown.baseTripCost.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Permits and logistics</span>
              <span>${breakdown.permitAndLogistics.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Gear rental</span>
              <span>${breakdown.gearCost.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>City buffer days</span>
              <span>${breakdown.cityBufferCost.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Contingency reserve</span>
              <span>${breakdown.contingency.toLocaleString()}</span>
            </div>
          </div>

          <div className="rounded-lg bg-secondary/70 p-4 text-sm text-muted-foreground">
            This is a planning tool, not a final quote. It is designed to make
            budget conversations easier and capture serious inquiries earlier.
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={consultationLink}>Request Accurate Quote</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/tours/${selectedTour.slug}`}>View Trek Page</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
