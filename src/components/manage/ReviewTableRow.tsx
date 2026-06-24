'use client';

import Link from 'next/link';
import type { ManagedReview } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal, Trash2, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DeleteReviewDialog } from '@/components/manage/DeleteReviewDialog';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { ReviewStars } from '../ReviewStars';
import { Timestamp } from '@/lib/timestamp'; // Import Timestamp

interface ReviewTableRowProps {
  review: ManagedReview;
}

export function ReviewTableRow({ review }: ReviewTableRowProps) {
  // Safely get the date object, handling both Timestamp and Date types
  const dateObject = review.reviewedOn instanceof Timestamp 
    ? review.reviewedOn.toDate() 
    : (review.reviewedOn instanceof Date ? review.reviewedOn : null);

  const displayDate = dateObject ? format(dateObject, 'PPP') : 'N/A';

  return (
    <TableRow>
      <TableCell>
        <Badge variant={review.type === 'onSite' ? 'default' : 'secondary'}>
          {review.type === 'onSite' ? 'On-Site' : 'Off-Site'}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">
        {review.userName}
        {review.userRole && <div className="text-xs text-muted-foreground">{review.userRole}</div>}
      </TableCell>
      <TableCell>
        {review.reviewFor ? (
          <Link href={`/tours/${review.reviewFor}`} className="text-primary hover:underline" target="_blank">
            {review.reviewFor}
          </Link>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </TableCell>
      <TableCell>
        <ReviewStars rating={review.stars} />
      </TableCell>
      <TableCell>{displayDate}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/manage/reviews/${review.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            {review.type === 'offSite' && review.originalReviewUrl && (
              <DropdownMenuItem asChild>
                <a href={review.originalReviewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> View Original
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DeleteReviewDialog review={review}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DeleteReviewDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}