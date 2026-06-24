"use client";

import { useWishlist } from '@/context/WishlistContext';
import { TourCard } from '@/components/TourCard';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import type { Tour } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const [wishlistedTours, setWishlistedTours] = useState<Tour[]>([]);
  const [allTours, setAllTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTours = async () => {
      setLoading(true);
      const response = await fetch('/api/packages');
      const data = await response.json();
      setAllTours(data.packages || []);
      setLoading(false);
    };
    fetchTours();
  }, []);
  
  useEffect(() => {
    if (allTours.length > 0) {
      setWishlistedTours(allTours.filter(tour => wishlist.includes(tour.id)));
    }
  }, [wishlist, allTours]);

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold !font-headline">Your Wishlist</h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Your saved adventures for future planning.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold !font-headline">Your Wishlist</h1>
        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
          Your saved adventures for future planning.
        </p>
      </div>

      {wishlistedTours.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishlistedTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Your Wishlist is Empty</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse our tours and click the heart icon to save your favorites.
          </p>
          <Link href="/tours" className="mt-6 inline-block">
            <Button>Explore Tours</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
