'use client';
import type { ManagedReview } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReviewStars } from '@/components/ReviewStars';
import { Timestamp } from '@/lib/timestamp';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';

interface ReviewsProps {
  reviews: ManagedReview[];
  tourId: string;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  allToursMap?: Map<string, string>; // Map of tourId -> tourName
}

export function Reviews({ reviews, tourId, isLoading = false, hasMore = false, onLoadMore, allToursMap = new Map() }: ReviewsProps) {
  if (reviews.length === 0 && !isLoading) {
    return (
      <div>
        <h2 className="text-3xl font-bold !font-headline mb-6">Reviews & Ratings</h2>
        <Card className="bg-card">
          <CardContent className="p-6 text-center text-muted-foreground">
            Be the first to review this tour!
          </CardContent>
        </Card>
      </div>
    );
  }

  if (reviews.length === 0 && isLoading) {
    return (
      <div>
        <h2 className="text-3xl font-bold !font-headline mb-6">Reviews & Ratings</h2>
        <Card className="bg-card">
          <CardContent className="p-6 text-center text-muted-foreground">
            Loading reviews...
          </CardContent>
        </Card>
      </div>
    );
  }


  const [visibleCount, setVisibleCount] = useState(3);

  const visibleReviews = reviews.slice(0, visibleCount);
  const canShowMore = visibleCount < reviews.length || hasMore;

  const handleShowMore = () => {
    const nextCount = visibleCount + 5;
    setVisibleCount(nextCount);
    if (nextCount > reviews.length && hasMore) {
      onLoadMore?.();
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, review) => acc + review.stars, 0) / reviews.length
    : 0;

  return (
    <div>
      <h2 className="text-3xl font-bold !font-headline mb-6">Reviews & Ratings</h2>
      <div className="grid grid-cols-1 gap-6">
        {visibleReviews.map((review) => {
          const dateObject = new Date(review.reviewedOn as string);
          const displayDate = format(dateObject, 'PPP');

          // Only keep tags for other tours, remove verified tag
          let reviewTag = null;
          if (review.type === 'onSite' && review.reviewFor && review.reviewFor !== tourId) {
            const otherTourName = allToursMap.get(review.reviewFor);
            if (otherTourName) {
              reviewTag = (
                <Link href={`/tours/${review.reviewFor}`} className="ml-2">
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5">For: {otherTourName}</Badge>
                </Link>
              );
            }
          }

          return (
            <div key={review.id} className="flex flex-col gap-3 p-6 border rounded-xl bg-white hover:shadow-md transition-shadow">
              {/* Name Row */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${review.userName}`} />
                  <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center">
                    <p className="font-semibold text-base">{review.userName}</p>
                    {reviewTag}
                  </div>
                  <p className="text-xs text-muted-foreground">{displayDate}</p>
                </div>
              </div>

              {/* Stars Row */}
              <div>
                {/* Removed h-4 w-4 constraint to use default size (which is larger) */}
                <ReviewStars rating={review.stars} starClass="h-5 w-5" />
              </div>

              {/* Body Row */}
              <div>
                <p className="text-muted-foreground leading-relaxed">
                  "{review.reviewBody}"
                </p>
              </div>

              {/* Source Link Row */}
              {review.type === 'offSite' && review.originalReviewUrl && (
                <div className="mt-1">
                  <a
                    href={review.originalReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                  >
                    View on source <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {canShowMore && (
        <div className="text-center mt-8">
          <Button onClick={handleShowMore} disabled={isLoading} variant="outline" size="lg" className="min-w-[200px]">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Show More Reviews'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
