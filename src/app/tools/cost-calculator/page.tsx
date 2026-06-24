import { Badge } from "@/components/ui/badge";
import { TrekCostCalculator } from "@/components/growth/TrekCostCalculator";
import { getAllPublishedTours } from "@/lib/db/tours";

export default async function CostCalculatorPage() {
  const tours = await getAllPublishedTours();

  return (
    <div className="bg-background">
      <div className="container mx-auto py-16 space-y-10">
        <div className="max-w-4xl space-y-4">
          <Badge variant="secondary">Trip Budget Tool</Badge>
          <h1 className="text-4xl md:text-5xl font-bold !font-headline">
            Nepal Trek Cost Calculator
          </h1>
          <p className="text-lg text-muted-foreground">
            Get a simple budget estimate for your trip and see how trek choice,
            travel style, and extra days can affect the final cost.
          </p>
        </div>

        <TrekCostCalculator tours={tours} />
      </div>
    </div>
  );
}
