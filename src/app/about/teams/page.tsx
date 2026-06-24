
'use client';

import { TeamMemberCard } from '@/components/TeamMemberCard';
import Link from 'next/link';
import { getTeamMembers, getTeamGroups } from '@/lib/db/team';
import type { TeamMember, TeamGroup } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';

export default function TeamsPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [members, groups] = await Promise.all([
          getTeamMembers(),
          getTeamGroups(),
        ]);

        setTeamMembers(members);
        setTeamGroups(groups);
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getMembersInGroup = (groupId: string | null) => {
    return teamMembers
      .filter(m => (m.groupId || null) === groupId)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  };

  const ungroupedMembers = getMembersInGroup(null);

  return (
    <div className="bg-background">
      <div className="container mx-auto py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold !font-headline">Our Team</h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
            Meet the guides, planners, and local experts who make your Himalayan adventures possible.
          </p>
        </div>

        <div className="grid gap-4 mb-16 md:grid-cols-3">
          {[
            "Guide profiles build trust before the first inquiry.",
            "Local experience matters more than generic travel copy.",
            "Use this page to show certifications, languages, and route strengths over time.",
          ].map((item) => (
            <div key={item} className="rounded-xl bg-secondary/70 p-5 text-sm text-muted-foreground">
              {item}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            {[...Array(8)].map((_, i) => (
                <div key={i}>
                    <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                    <Skeleton className="h-5 w-3/4 mt-4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </div>
            ))}
          </div>
        ) : (
          <div className="space-y-16">
            {teamGroups.map((group) => {
              const groupMembers = getMembersInGroup(group.id);
              if (groupMembers.length === 0) return null;

              return (
                <div key={group.id} className="space-y-12">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold !font-headline">{group.name}</h2>
                    {group.description && (
                      <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">{group.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {groupMembers.map((member) => (
                        <TeamMemberCard key={member.id} member={member} />
                    ))}
                  </div>
                </div>
              );
            })}

            {ungroupedMembers.length > 0 && (
              <div className="space-y-12">
                {teamGroups.length > 0 && (
                  <div className="text-center">
                    <h2 className="text-3xl font-bold !font-headline">Our Guides & Staff</h2>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
                  {ungroupedMembers.map((member) => (
                      <TeamMemberCard key={member.id} member={member} />
                  ))}
                </div>
              </div>
            )}

            {teamMembers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No team members to display yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
