
'use client';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Timestamp } from '@/lib/timestamp';
import type { BlogPost } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { Chatbot } from '@/components/Chatbot';
import { getBlogChatMessage } from '@/lib/chat-messages';

interface BlogPostClientProps {
  post: BlogPost;
  tempUserId: string;
}

export default function BlogPostClient({ post, tempUserId }: BlogPostClientProps) {
  const displayDate = post.date instanceof Timestamp ? post.date.toDate().toLocaleDateString() : new Date(post.date).toLocaleDateString();
  const isoDatePublished = post.date instanceof Timestamp ? post.date.toDate().toISOString() : new Date(post.date).toISOString();
  const isoDateModified = isoDatePublished; // Assuming no separate modified date for now

  const hasImage = Boolean(post.image && post.image.trim() !== '');
  const imageSrc = hasImage ? post.image : 'https://cdn.neupgroup.com/p3happymountainnepal/logo.png';

  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": imageSrc,
    "datePublished": isoDatePublished,
    "dateModified": isoDateModified,
    "author": {
      "@type": "Person",
      "name": post.author,
      "image": post.authorPhoto || undefined,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Happy Mountain Nepal",
      "logo": {
        "@type": "ImageObject",
        "url": "https://neupgroup.com/content/p3happymountainnepal/logo.png"
      }
    },
    "description": post.excerpt,
    "articleBody": post.content,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://happymountainnepal.com/blog/${post.slug}`
    }
  };

  const chatMessages = useMemo(() => getBlogChatMessage(post.title), [post.title]);

  return (
    <>
      <article>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
        <header className={`relative h-[40vh] md:h-[50vh] w-full ${!hasImage ? 'bg-white' : ''}`}>
          <Image
            src={imageSrc}
            alt={post.title}
            fill
            className={hasImage ? "object-cover" : "object-contain p-12"}
            priority
            data-ai-hint="travel landscape"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
          <div className="container mx-auto h-full flex flex-col justify-end pb-12 relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold !font-headline text-white">{post.title}</h1>
            <div className="mt-4 flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.authorPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author}`} />
                  <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{post.author}</span>
              </div>
              <span>&bull;</span>
              <time dateTime={isoDatePublished}>{displayDate}</time>
            </div>
          </div>
        </header>

        <div className="container mx-auto py-12">
          <div className="max-w-3xl mx-auto">
            <div
              className="formatted-content max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </article>
      <Chatbot
        prefilledWhatsapp={chatMessages.whatsapp}
        prefilledEmail={chatMessages.email}
        tempUserId={tempUserId}
      />
    </>
  );
}
