'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { BlogPost } from '@/lib/types';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const hasImage = Boolean(post.image && post.image.trim() !== '');
  const imageSrc = hasImage ? post.image : 'https://cdn.neupgroup.com/p3happymountainnepal/logo.png';

  return (
    <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl">
      {/* Clickable Image */}
      <CardHeader className="p-0">
        <Link href={`/blog/${post.slug}`} className="group block">
          <div className={`relative h-48 w-full overflow-hidden ${!hasImage ? 'bg-white p-8' : ''}`}>
            <Image
              src={imageSrc}
              alt={post.title}
              width={600}
              height={400}
              className={`h-full w-full ${hasImage ? 'object-cover' : 'object-contain'} transition-transform duration-300 group-hover:scale-110`}
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

      <CardFooter className="p-4 pt-0" />
    </Card>
  );
}
