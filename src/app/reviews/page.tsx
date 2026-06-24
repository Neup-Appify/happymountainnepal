'use client';
import type { ManagedReview } from '@/lib/types'; // Changed from Review
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReviewStars } from '@/components/ReviewStars';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { format } from 'date-fns'; // Import format from date-fns
import { getAllReviews } from '@/lib/db/reviews';


export default function ReviewsPage() {
  const [allReviews, setAllReviews] = useState<ManagedReview[]>([]); // Changed type
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const reviews = await getAllReviews();
        setAllReviews(reviews);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);


  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold !font-headline">What Our Adventurers Say</h1>
        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
          Real stories from travelers who have explored the Himalayas with us.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className='space-y-2'>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allReviews?.map((review, index) => {
                // Safely get the date object, handling both Timestamp and Date types
                const dateObject = new Date(review.reviewedOn as string);
                const displayDate = dateObject ? format(dateObject, 'PPP') : 'N/A';

                return (
                    <Card key={`${review.id}-${index}`} className="flex flex-col">
                        <CardContent className="p-6 flex-grow">
                            <div className="flex items-center gap-4 mb-4">
                                <Avatar>
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${review.userName}`} />
                                    <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{review.userName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {review.type === 'onSite' && review.reviewFor ? `on ${review.reviewFor}` : ''}
                                        {review.type === 'onSite' && review.reviewFor && displayDate !== 'N/A' && ' • '}
                                        {displayDate !== 'N/A' && displayDate}
                                    </p>
                                </div>
                            </div>
                            <ReviewStars rating={review.stars} /> {/* Changed from rating to stars */}
                            <p className="text-muted-foreground italic mt-4">&quot;{review.reviewBody}&quot;</p> {/* Changed from comment to reviewBody */}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      )}
    </div>
  );
}
