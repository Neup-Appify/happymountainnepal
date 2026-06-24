
'use client';
import { TourCard } from './TourCard';
import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import type { Tour } from '@/lib/types';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';


export function PopularPackages({ initialTours = [] }: { initialTours?: Tour[] }) {
  const [popularTours, setPopularTours] = useState<Tour[]>(initialTours);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialTours && initialTours.length > 0) {
      setPopularTours(initialTours);
      setIsLoading(false);
      return;
    }
    const fetchTours = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/packages');
        const data = await response.json();
        const tours = [...(data.packages || [])].sort((a: Tour, b: Tour) => b.price - a.price).slice(0, 3);
        setPopularTours(tours);
      } catch (error) {
          console.error("Error fetching popular packages:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTours();
  }, [initialTours]);


  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold !font-headline">Popular Packages</h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Discover our most sought-after adventures, loved by travelers from around the world.
          </p>
        </div>
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-0">
                            <Skeleton className="h-48 w-full" />
                            <div className="p-4 space-y-2">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </CardContent>
                        <CardFooter className="p-4">
                            <Skeleton className="h-10 w-24 ml-auto" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularTours?.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
            ))}
            </div>
        )}
        <div className="text-center mt-12">
          <Link href="/tours">
            <Button size="lg">
              View All Packages <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Add Card, CardContent, CardFooter skeleton structure
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>{children}</div>;
const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={cn("p-6 pt-0", className)}>{children}</div>;
const CardFooter = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={cn("flex items-center p-6 pt-0", className)}>{children}</div>;
