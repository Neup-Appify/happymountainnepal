
'use client';

import Link from 'next/link';
import type { BlogPost } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteBlogPostDialog } from './DeleteBlogPostDialog';
import { Badge } from '../ui/badge';
import { Timestamp } from '@/lib/timestamp';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface BlogTableRowProps {
  post: BlogPost;
}

export function BlogManagementCard({ post }: BlogTableRowProps) {
  const displayDate = post.date instanceof Timestamp
    ? post.date.toDate().toLocaleDateString()
    : typeof post.date === 'string'
      ? new Date(post.date).toLocaleDateString()
      : "N/A";

  const hasImage = Boolean(post.image && post.image.trim() !== '');
  const imageSrc = hasImage ? post.image : 'https://cdn.neupgroup.com/p3happymountainnepal/logo.png';

  const getStatusVariant = (status: BlogPost['status']) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-accent/5 transition-colors border-b last:border-0 relative group">
      <Link href={`/manage/blog/${post.id}/edit`} className="absolute inset-0 z-10">
        <span className="sr-only">Edit {post.title}</span>
      </Link>
      <div className={`relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0 border ${!hasImage ? 'bg-white p-2' : 'bg-muted'}`}>
        <Image src={imageSrc} alt={post.title} fill className={hasImage ? "object-cover" : "object-contain"} />
      </div>
      <div className="flex-1 min-w-0 pointer-events-none">
        <p className="font-medium text-base group-hover:text-primary transition-colors truncate">{post.title}</p>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">{post.author}</span>
          <span>&bull;</span>
          <span>{displayDate}</span>
          <span>&bull;</span>
          <Badge variant={getStatusVariant(post.status)} className="h-5 px-1.5 text-[10px] pointer-events-auto">
            {post.status}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2 relative z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/blog/${post.slug}`} target="_blank">View Public Page</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/manage/blog/${post.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
