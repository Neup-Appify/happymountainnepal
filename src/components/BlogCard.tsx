'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Timestamp } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const resolvedDate = post.date instanceof Timestamp ? post.date.toDate() : new Date(post.date);
  const displayDate = Number.isNaN(resolvedDate.getTime())
    ? post.date
    : new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(resolvedDate);
  const hasImage = Boolean(post.image && post.image.trim() !== '');
  const imageSrc = hasImage ? post.image : 'https://cdn.neupgroup.com/p3happymountainnepal/logo.png';

  return (
    <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl">
      {/* Clickable Image */}
      <CardHeader className="p-0">
        <Link href={`/blog/${post.slug}`} className="block">
          <div className={`w-full h-48 relative ${!hasImage ? 'bg-white p-8' : ''}`}>
            <Image
              src={imageSrc}
              alt={post.title}
              width={600}
              height={400}
              className={`w-full h-full ${hasImage ? 'object-cover' : 'object-contain'} transition-transform duration-300 hover:scale-105`}
              data-ai-hint="travel blog"
            />
          </div>
        </Link>
      </CardHeader>

      <CardContent className="p-4 flex-grow">
        {/* Clickable Title */}
        <Link href={`/blog/${post.slug}`}>
          <CardTitle className="text-lg font-bold !font-headline mb-2 leading-tight hover:text-primary transition-colors cursor-pointer">
            {post.title}
          </CardTitle>
        </Link>

        <p className="text-sm text-muted-foreground line-clamp-3">
          {post.excerpt}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <span>By {post.author}</span> &bull; <span>{displayDate}</span>
        </div>

        {/* Clickable Button */}
        <Button variant="ghost" size="sm" asChild className="group">
          <Link href={`/blog/${post.slug}`} className="flex items-center gap-1">
            Read More
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
