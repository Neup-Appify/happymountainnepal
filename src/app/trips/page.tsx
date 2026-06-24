"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Tour } from '@/lib/types';
import { TourCard } from '@/components/TourCard';
import { MinimalTourFilters } from '@/components/MinimalTourFilters';
import { Mountain } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CardsGrid } from '@/components/CardsGrid';

const hardshipToDifficulties: Record<string, string[]> = {
  low: ['Easy'],
  mid: ['Moderate'],
  high: ['Strenuous', 'Challenging'],
};

function TripsPageContent() {
  const searchParams = useSearchParams();
  const initialRegion = searchParams.get('region') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialHardshipParam = searchParams.get('hardship') || '';
  const initialHardship = initialHardshipParam
    ? initialHardshipParam.split(',').map(h => h.trim().toLowerCase()).filter(Boolean)
    : [];

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: initialSearch,
    region: initialRegion,
    hardship: initialHardship as string[],
  });

  useEffect(() => {
    const fetchTours = async () => {
      setLoading(true);
      const response = await fetch('/api/packages');
      const data = await response.json();
      setTours(data.packages || []);
      setLoading(false);
    };
    fetchTours();
  }, []);

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: initialSearch,
      region: initialRegion,
      hardship: initialHardship,
    }));
  }, [initialRegion, initialSearch, initialHardshipParam]);

  const allRegions = useMemo(() => {
    if (!tours) return [];
    const regionsSet = new Set<string>();
    tours.forEach(tour => {
      if (Array.isArray(tour.region)) {
        tour.region.forEach(r => regionsSet.add(r));
      }
    });
    return Array.from(regionsSet);
  }, [tours]);

  const filteredTours = useMemo(() => {
    if (!tours) return [];
    return tours.filter((tour: Tour) => {
      const matchesSearch = filters.search === '' || tour.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesRegion = filters.region === '' || (Array.isArray(tour.region) && tour.region.includes(filters.region));
      const selectedDifficulties = filters.hardship.flatMap(h => hardshipToDifficulties[h] || []);
      const matchesHardship = filters.hardship.length === 0 || selectedDifficulties.includes(tour.difficulty);
      return matchesSearch && matchesRegion && matchesHardship;
    });
  }, [filters, tours]);

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold !font-headline tracking-tight">Explore Trips</h1>
        <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">Browse popular packages with the same polished card design as the homepage.</p>
      </div>

      <MinimalTourFilters 
        filters={filters} 
        setFilters={setFilters} 
        regions={allRegions} 
      />
      
      {loading ? (
        <CardsGrid>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-8 w-3/4" />
              <div className="flex justify-between">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-1/4" />
              </div>
            </div>
          ))}
        </CardsGrid>
      ) : filteredTours.length > 0 ? (
        <CardsGrid>
          {filteredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </CardsGrid>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg">
          <Mountain className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Trips Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={<div>Loading trips...</div>}>
      <TripsPageContent />
    </Suspense>
  )
}
