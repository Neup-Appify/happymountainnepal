
'use client';
import { TeamMemberCard } from '@/components/TeamMemberCard';
import Image from 'next/image';
import { getTeamMembers } from '@/lib/db/team';
import type { TeamMember } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { AdminPageControl } from '@/components/admin/AdminPageControl';

export default function AboutPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      try {
        const members = await getTeamMembers();
        setTeamMembers(members);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "Happy Mountain Nepal",
      "description": "We are a team of passionate mountaineers, seasoned guides, and travel experts dedicated to providing you with an unforgettable Himalayan experience."
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-16">
        <div className="text-center mb-16">
          <Skeleton className="h-12 w-1/2 mx-auto" />
          <Skeleton className="h-6 w-3/4 mx-auto mt-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background">
      <AdminPageControl editPath="/manage/profile" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />
      <div className="container mx-auto py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold !font-headline">About Happy Mountain Nepal</h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
            We are a team of passionate mountaineers, seasoned guides, and travel experts dedicated to providing you with an unforgettable Himalayan experience.
          </p>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold !font-headline">Our Experts</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 lg:gap-x-12 lg:gap-y-16">
          {teamMembers?.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>

      <div className="bg-secondary py-16 lg:py-24">
        <div className="container mx-auto">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold !font-headline">Our Mission</h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              To share the majestic beauty of the Himalayas through safe, sustainable, and culturally respectful tourism, creating lifelong memories for our clients while supporting local communities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
