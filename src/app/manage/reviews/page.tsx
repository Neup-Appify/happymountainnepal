'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PlusCircle, Star } from 'lucide-react';
import { ReviewTableRow } from '@/components/manage/ReviewTableRow';
import type { ManagedReview } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllReviews } from '@/lib/db/reviews';

export default function ReviewsListPage() {
  const [reviews, setReviews] = useState<ManagedReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const fetchedReviews = await getAllReviews();
        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        // Optionally show a toast error here
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);


  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold !font-headline">Customer Reviews</h1>
        <Button asChild>
          <Link href="/manage/reviews/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Review
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Reviews</CardTitle>
          <CardDescription>
            Here you can add, edit, and manage customer reviews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>User Name</TableHead>
                <TableHead>Review For</TableHead>
                <TableHead>Stars</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <ReviewTableRow key={review.id} review={review} />
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    <Star className="mx-auto h-12 w-12 mb-4" />
                    No reviews found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
