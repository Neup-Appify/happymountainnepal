import { Badge } from "@/components/ui/badge";
import { TrekPlannerTool } from "@/components/growth/TrekPlannerTool";
import { getAllPublishedTours } from "@/lib/db/tours";

export default async function TrekPlannerPage() {
  const tours = await getAllPublishedTours();

  return (
    <div className="bg-background">
      <div className="container mx-auto py-16 space-y-10">
        <div className="max-w-4xl space-y-4">
          <Badge variant="secondary">Planning Tool</Badge>
          <h1 className="text-4xl md:text-5xl font-bold !font-headline">
            Interactive Trek Planner
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose your month, budget, fitness level, and available days to see
            which trek may suit you best.
          </p>
        </div>

        <TrekPlannerTool tours={tours} />
      </div>
    </div>
  );
}
