"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAllPublishedTours } from '@/lib/db/tours';
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

function ToursPageContent() { // Renamed to ToursPageContent
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
      try {
        const fetchedTours = await getAllPublishedTours();
        setTours(fetchedTours);
      } finally {
        setLoading(false);
      }
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
    const normalizedSearch = filters.search.trim().toLowerCase();

    return tours
      .filter((tour: Tour) => {
        const keywordText = Array.isArray(tour.searchKeywords) ? tour.searchKeywords.join(' ').toLowerCase() : '';
        const matchesSearch = normalizedSearch === '' || (
          tour.name.toLowerCase().includes(normalizedSearch) ||
          tour.description.toLowerCase().includes(normalizedSearch) ||
          keywordText.includes(normalizedSearch)
        );
        const matchesRegion = filters.region === '' || (Array.isArray(tour.region) && tour.region.includes(filters.region));
        const selectedDifficulties = filters.hardship.flatMap(h => hardshipToDifficulties[h] || []);
        const matchesHardship = filters.hardship.length === 0 || selectedDifficulties.includes(tour.difficulty);
        return matchesSearch && matchesRegion && matchesHardship;
      })
      .sort((left, right) => {
        if (!normalizedSearch) return left.name.localeCompare(right.name);

        const getRank = (tour: Tour) => {
          if (tour.name.toLowerCase().includes(normalizedSearch)) return 0;
          if (tour.description.toLowerCase().includes(normalizedSearch)) return 1;

          const keywordText = Array.isArray(tour.searchKeywords) ? tour.searchKeywords.join(' ').toLowerCase() : '';
          if (keywordText.includes(normalizedSearch)) return 2;

          return 3;
        };

        const rankDifference = getRank(left) - getRank(right);
        if (rankDifference !== 0) return rankDifference;

        return left.name.localeCompare(right.name);
      });
  }, [filters, tours]);

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold !font-headline tracking-tight">Explore Himalayan Treks</h1>
        <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">Minimal, elegant listings to help you find the right adventure.</p>
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
          <h3 className="mt-4 text-lg font-semibold">No Tours Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ToursPage() {
  return (
    <Suspense fallback={<div>Loading tours...</div>}>
      <ToursPageContent />
    </Suspense>
  )
}
