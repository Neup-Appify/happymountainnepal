
import { notFound } from 'next/navigation';
import { getLocationBySlug, getLocationById, getChildLocations, getPosts, getAllPackages } from '@/lib/db/sqlite';
import { TourCard } from '@/components/TourCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ArrowRight } from 'lucide-react';
import type { Tour, BlogPost } from '@/lib/types';
import { BlogCard } from '@/components/BlogCard';

// Helper to fetch tours
async function getRelatedTours(locationName: string) {
    try {
        return getAllPackages('published')
            .filter(tour => Array.isArray(tour.region) && tour.region.includes(locationName))
            .slice(0, 6);
    } catch (error) {
        console.error("Error fetching tours:", error);
        return [];
    }
}

// Helper to fetch blogs
async function getRelatedBlogs(locationName: string) {
    try {
        const { posts } = getPosts({
            limit: 3,
            status: 'published',
            // Simple tag filtering
            tags: [locationName]
        });

        // getPosts already returns BlogPost[] with date mapped correctly
        return posts;
    } catch (error) {
        console.error("Error fetching blogs:", error);
        return [];
    }
}


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const location = getLocationBySlug(slug);
    if (!location) return { title: 'Not Found' };
    return {
        title: `${location.name} - Happy Mountain Nepal`,
        description: location.description || `Explore ${location.name} with us.`,
    };
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const location = getLocationBySlug(slug);

    if (!location) {
        notFound();
    }

    const parentLocation = location.parentId ? getLocationById(location.parentId) : null;
    const childLocations = getChildLocations(location.id);

    // Fetch related content
    const tours = await getRelatedTours(location.name);
    // Also try fetching with generic tags if name lookup is too specific? For now strictly name.
    const blogs = await getRelatedBlogs(location.name);

    const relatedLocations = [
        ...(parentLocation ? [parentLocation] : []),
        ...childLocations
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                {location.image ? (
                    <Image
                        src={location.image}
                        alt={location.name}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                        <MapPin className="h-24 w-24 text-muted-foreground/30" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    {parentLocation && (
                        <Link href={`/location/${parentLocation.slug}`} className="mb-4 text-white/80 hover:text-white hover:underline text-sm uppercase tracking-wider font-semibold">
                            &infin; Part of {parentLocation.name}
                        </Link>
                    )}
                    <h1 className="text-4xl md:text-6xl font-bold text-white !font-headline mb-4">{location.name}</h1>
                    {location.description && (
                        <p className="max-w-2xl text-lg text-white/90 line-clamp-3">{location.description}</p>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 space-y-20">

                {/* Description Body - if long description existed we'd put it here, for now using hero description is mostly it unless we add 'content' field later */}

                {/* Packages Section */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold !font-headline">Packages in {location.name}</h2>
                        <Link href={`/tours?region=${location.name}`}>
                            <Button variant="outline">View All <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </Link>
                    </div>
                    {tours.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {tours.map(tour => (
                                <TourCard key={tour.id} tour={tour} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-muted/30 rounded-lg">
                            <p className="text-muted-foreground">No specific packages found for this location yet.</p>
                            <Link href="/tours" className="mt-4 inline-block">
                                <Button variant="link">Browse all tours</Button>
                            </Link>
                        </div>
                    )}
                </section>

                {/* Related Locations (People also search for) */}
                {relatedLocations.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold !font-headline mb-8">Explore Nearby & Related</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {relatedLocations.map(loc => (
                                <Link key={loc.id} href={`/location/${loc.slug}`} className="group block relative h-48 rounded-lg overflow-hidden">
                                    {loc.image ? (
                                        <Image
                                            src={loc.image}
                                            alt={loc.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <MapPin className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 p-4">
                                        <span className="text-white font-bold text-lg group-hover:underline decoration-white/50 underline-offset-4">{loc.name}</span>
                                        {loc.id === parentLocation?.id && (
                                            <span className="block text-xs text-white/70 uppercase tracking-widest mt-1">Parent Region</span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Blogs Section */}
                {blogs.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold !font-headline mb-8">Stories from {location.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Assuming we have a standard BlogCard, if not using a placeholder map */}
                            {blogs.map(post => (
                                <BlogCard key={post.id} post={post} />
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
}
