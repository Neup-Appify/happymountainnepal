'use client';
import { useState, useEffect, useMemo } from 'react';
import type { Tour } from '@/lib/types';
import { useWishlist } from '@/context/WishlistContext';
import { MinimalTourCard } from './MinimalTourCard';
import { Skeleton } from './ui/skeleton';
import { Heart } from 'lucide-react';

const RECENTLY_VIEWED_KEY = 'happy-mountain-recent-tours';
const DISPLAY_COUNT = 4;

export function RecommendedTours({ 
  initialTours = [], 
  initialType = null 
}: { 
  initialTours?: Tour[], 
  initialType?: 'wishlist' | 'recent' | null 
}) {
  const { wishlist } = useWishlist();

  const [recommendedTours, setRecommendedTours] = useState<Tour[]>(initialTours);
  const [recommendationType, setRecommendationType] = useState<'wishlist' | 'recent' | null>(initialType);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If we have initial tours and wishlist is empty (so no personalized recommendations yet), 
    // or if we've already set personalized recommendations, we can skip or refine
    
    async function fetchRecommendations() {
      const response = await fetch('/api/packages');
      const data = await response.json();
      const allTours = (data.packages || []) as Tour[];

      // Personalized recommendations require client-side data (wishlist/localstorage)
      // so we always check these on the client
      
      // 1. Prioritize Wishlist
      if (wishlist.length > 0) {
        // If wishlist is not empty, fetch current tour data by ID.
        // since we only have IDs in wishlist
        const toursMap = new Map(allTours.map((t: Tour) => [t.id, t]));

        const toursFromWishlist = wishlist
          .map(id => toursMap.get(id))
          .filter((tour): tour is Tour => !!tour)
          .slice(0, DISPLAY_COUNT);
        
        if (toursFromWishlist.length > 0) {
          setRecommendedTours(toursFromWishlist);
          setRecommendationType('wishlist');
          setIsLoading(false);
          return;
        }
      }
      
      // 2. Fallback to Recently Viewed (client-side only)
      const recentlyViewedIds: string[] = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]') : [];
      if (recentlyViewedIds.length > 0) {
        const toursMap = new Map(allTours.map((t: Tour) => [t.id, t]));

        const toursFromHistory = recentlyViewedIds
          .map(id => toursMap.get(id))
          .filter((tour): tour is Tour => !!tour)
          .slice(0, DISPLAY_COUNT);

        if (toursFromHistory.length > 0) {
          setRecommendedTours(toursFromHistory);
          setRecommendationType('recent');
          setIsLoading(false);
          return;
        }
      }

      // 3. If no personalized data, but we have initialTours, keep them
      if (initialTours && initialTours.length > 0) {
        setRecommendedTours(initialTours);
        setRecommendationType(initialType);
        setIsLoading(false);
        return;
      }

      // 4. Ultimate fallback if nothing else works
      setRecommendedTours(allTours.slice(0, DISPLAY_COUNT));
      setRecommendationType(null);
      setIsLoading(false);
    }
    
    fetchRecommendations();

  }, [wishlist, initialTours, initialType]);

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto">
          <Skeleton className="h-10 w-1/3 mx-auto mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (recommendedTours.length === 0) {
    return null; // Don't render the section if there's nothing to show
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold !font-headline">You Might Like These</h2>
          {recommendationType === 'wishlist' && <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">Based on your wishlist, check out these adventures!</p>}
          {recommendationType === 'recent' && <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">Based on your recent activity, take another look at these trips.</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedTours.map((tour) => (
            <MinimalTourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </div>
    </section>
  );
}
