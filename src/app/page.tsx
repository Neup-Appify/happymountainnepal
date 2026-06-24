import { FeaturedTours } from "@/components/FeaturedTours";
import { HeroSection } from "@/components/HeroSection";
import { PopularPackages } from "@/components/PopularPackages";
import { WhyUs } from "@/components/WhyUs";
import { Testimonials } from "@/components/Testimonials";
import { RecentBlogs } from "@/components/RecentBlogs";
import { CustomizeTrip } from "@/components/CustomizeTrip";
import { FavoriteDestinations } from "@/components/FavoriteDestinations";
import { RecommendedTours } from "@/components/RecommendedTours";
import { OurPartners } from "@/components/OurPartners";
import { ContactSection } from "@/components/ContactSection";
import { Chatbot } from "@/components/Chatbot";
import {
  ClientStoriesSection,
  DepartureCalendarPreview,
  PlanningToolsSection,
  TrailReportsSection,
  TrekComparisonSection,
  TrustConversionSection,
} from "@/components/growth/GrowthSections";
import { headers } from "next/headers";
import { getLocations, getPosts, getFeaturedToursDB, getPopularToursDB, getReviewsDB } from "@/lib/db/sqlite";
import { getTeamMembers } from "@/lib/db/team";

import { getSiteProfileAction } from '@/app/actions/profile';
import { getPartnersAction } from '@/app/actions/partners';

export default async function Home() {
  const headersList = await headers();
  const tempUserId = headersList.get('x-temp-account-id') || 'NotAvailable';

  // Fetch data on server
  const featuredLocations = getLocations({ featured: true });
  const recentPostsData = getPosts({ limit: 3, status: 'published' });
  const featuredTours = getFeaturedToursDB(3); 
  
  // Parallel fetch for remaining data
  const [profile, partners, teamMembers] = await Promise.all([
    getSiteProfileAction(),
    getPartnersAction(),
    getTeamMembers(),
  ]);

  const popularPackages = getPopularToursDB(3); 
  const recommendedTours = getPopularToursDB(4); 
  
  // Fetch reviews from SQLite (5-star, approved)
  const reviews = getReviewsDB({ limit: 10, rating: 5, status: 'approved' });

  return (
    <>
      <div className="homepage-sections-wrapper flex flex-col">
        <HeroSection initialProfile={profile} />
        <TrustConversionSection
          profile={profile}
          reviews={reviews}
          teamMembers={teamMembers}
        />
        <TrailReportsSection />
        <TrekComparisonSection />
        <FavoriteDestinations initialLocations={featuredLocations} />
        <RecommendedTours initialTours={recommendedTours} />
        <FeaturedTours initialTours={featuredTours} />
        <PopularPackages initialTours={popularPackages} />
        <DepartureCalendarPreview tours={[...featuredTours, ...popularPackages, ...recommendedTours]} />
        <WhyUs initialProfile={profile} />
        <Testimonials initialReviews={reviews} initialProfile={profile} />
        <ClientStoriesSection />
        <PlanningToolsSection />
        <RecentBlogs initialPosts={recentPostsData.posts} />
        <OurPartners initialPartners={partners} />
        <CustomizeTrip />
        <ContactSection initialProfile={profile} />
      </div>
      <Chatbot tempUserId={tempUserId} />
    </>
  );
}
