
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { TeamMember } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <Link href={`/about/teams/${member.slug}`} className="group block">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
             <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="portrait person"
            />
        </div>
        <div className="mt-4">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.role}</p>
            {member.shortDescription ? (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                {member.shortDescription}
              </p>
            ) : null}
        </div>
    </Link>
  );
}
