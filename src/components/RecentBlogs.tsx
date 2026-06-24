
'use client';
import { BlogCard } from "./BlogCard";
import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { Skeleton } from './ui/skeleton';
import type { BlogPost } from '@/lib/types';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function RecentBlogs({ initialPosts = [] }: { initialPosts?: BlogPost[] }) {
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(!initialPosts || initialPosts.length === 0);

  useEffect(() => {
    if (initialPosts && initialPosts.length > 0) {
      setRecentPosts(initialPosts);
      setIsLoading(false);
      return;
    }

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/blog?limit=3&status=published');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setRecentPosts(data.posts || []);
      } catch (error) {
        console.error("Error fetching recent blog posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [initialPosts]);

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold !font-headline">From Our Travel Journal</h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Tips, stories, and guides to inspire your next Himalayan journey.
          </p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </CardContent>
                <CardFooter className="p-4">
                  <Skeleton className="h-4 w-1/2" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts?.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
        <div className="text-center mt-12">
          <Link href="/blog">
            <Button size="lg" variant="outline">
              Read More Articles <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Add Card, CardContent, CardFooter skeleton structure
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>{children}</div>;
const CardContent = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={cn("p-6 pt-0", className)}>{children}</div>;
const CardFooter = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={cn("flex items-center p-6 pt-0", className)}>{children}</div>;
