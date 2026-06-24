
'use client';
import { ImageGallery } from '@/components/tour-details/ImageGallery';
import { KeyFacts } from '@/components/tour-details/KeyFacts';
import { Itinerary } from '@/components/tour-details/Itinerary';
import { BookingWidget } from '@/components/tour-details/BookingWidget';
import { Reviews } from '@/components/tour-details/Reviews';
import { InclusionsExclusions } from '@/components/tour-details/InclusionsExclusions';
import { TourGallery } from '@/components/tour-details/TourGallery';
import { FaqSection } from '@/components/tour-details/FaqSection';
import { AdditionalInfoSection } from '@/components/tour-details/AdditionalInfoSection';
import { GearsSection } from '@/components/tour-details/GearsSection';
import { GuidesSection } from '@/components/tour-details/GuidesSection';
import Image from 'next/image';
import { TourNav } from '@/components/tour-details/TourNav';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { exportTourToPdf } from '@/lib/pdf-export';
import type { Tour, ManagedReview } from '@/lib/types';
import { useEffect, useMemo } from 'react';
import { Chatbot } from '@/components/Chatbot';
import { getTourChatMessage } from '@/lib/chat-messages';
import Link from 'next/link';

interface TourDetailClientProps {
  tour: Tour;
  tempUserId: string;
}

const RECENTLY_VIEWED_KEY = 'happy-mountain-recent-tours';
const MAX_RECENTLY_VIEWED = 10;

export default function TourDetailClient({ tour, tempUserId }: TourDetailClientProps) {

  // Log recently viewed tour
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      let recentlyViewed: string[] = stored ? JSON.parse(stored) : [];

      recentlyViewed = recentlyViewed.filter(id => id !== tour.id);
      recentlyViewed.unshift(tour.id);

      const updatedRecentlyViewed = recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);

      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updatedRecentlyViewed));
    } catch (error) {
      console.error("Failed to update recently viewed tours in localStorage", error);
    }
  }, [tour.id]);

  // Transform tour.reviews to ManagedReview format
  const displayedReviews: ManagedReview[] = (tour.reviews || []).map(r => ({
    id: r.id,
    type: 'onSite' as const,
    userId: 'embedded', // These are embedded reviews, not tied to a specific user account
    userName: r.author,
    reviewBody: r.comment,
    stars: r.rating as 1 | 2 | 3 | 4 | 5,
    reviewedOn: r.date,
    reviewFor: tour.id
  }));

  const hasReviews = displayedReviews.length > 0;

  const averageRating = displayedReviews.length > 0
    ? (displayedReviews.reduce((acc, review) => acc + review.stars, 0) / displayedReviews.length)
    : 0;

  const itineraryItems = tour.itinerary?.map(item => ({
    "@type": "ListItem",
    "position": item.day,
    "name": item.title,
    "description": item.description,
  }));

  const faqItems = tour.faq?.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer
    }
  }));

  const currentYear = new Date().getFullYear();
  const priceValidUntil = `${currentYear}-12-31`;

  const jsonLdSchema: any[] = [{
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "name": tour.name,
    "description": tour.description,
    "image": tour.mainImage.url,
    "url": `https://happymountainnepal.com/tours/${tour.slug}`,
    "provider": {
      "@type": "Organization",
      "name": "Happy Mountain Nepal",
      "url": "https://happymountainnepal.com",
      "logo": "https://cdn.neupgroup.com/p3happymountainnepal/logo.png"
    },
    ...(averageRating > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageRating.toFixed(1),
        "reviewCount": displayedReviews.length
      }
    }),
    "offers": {
      "@type": "Offer",
      "price": tour.price,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": `https://happymountainnepal.com/tours/${tour.slug}`,
      "priceValidUntil": priceValidUntil,
    },
    ...(itineraryItems && itineraryItems.length > 0 && {
      "itinerary": {
        "@type": "ItemList",
        "itemListElement": itineraryItems
      }
    }),
  }];

  if (faqItems && faqItems.length > 0) {
    jsonLdSchema.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqItems
    });
  }

  const chatMessages = useMemo(() => getTourChatMessage(tour.name), [tour.name]);

  return (
    <>
      <div className="bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
        <ImageGallery images={tour.images} mainImage={tour.mainImage} tourName={tour.name} />

        <TourNav tour={tour} hasReviews={hasReviews} />

        <div className="container mx-auto py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12">

            <div className="lg:col-span-2 space-y-12">
              <header>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h1 className="text-4xl md:text-5xl font-bold !font-headline text-primary">{tour.name}</h1>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-fit gap-2 border-primary text-primary hover:bg-primary hover:text-white transition-all"
                    onClick={() => exportTourToPdf(tour)}
                  >
                    <FileDown className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
                <div
                  className="mt-4 text-lg text-muted-foreground [&_p]:mb-4 last:[&_p]:mb-0"
                  dangerouslySetInnerHTML={{ __html: tour.description }}
                />
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {[
                    "Local Nepali-owned support team",
                    "Licensed guides and route planning",
                    "24/7 help for logistics and emergency coordination",
                  ].map((item) => (
                    <div key={item} className="rounded-xl bg-secondary/70 p-4 text-sm text-muted-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              </header>

              <div className="lg:hidden my-8">
                <BookingWidget tour={tour} />
              </div>

              <section id="key-facts" className="scroll-m-32">
                <KeyFacts tour={tour} />
              </section>

              {tour.departureDates && tour.departureDates.length > 0 && (
                <section id="departures" className="scroll-m-32">
                  <h2 className="text-3xl font-bold !font-headline mb-6">Departure Calendar</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {tour.departureDates.map((departure, index) => (
                      <div key={`${tour.id}-departure-${index}`} className="rounded-xl border bg-card p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold">{String(departure.date)}</p>
                          <Badge variant={departure.guaranteed ? "default" : "outline"}>
                            {departure.guaranteed ? "Guaranteed" : "Open"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Price from ${departure.price}. Ask the team about remaining seats and current trail conditions for this departure.
                        </p>
                        <Button asChild size="sm" variant="outline" className="mt-4">
                          <Link href={`/contact?subject=${encodeURIComponent(`Departure question for ${tour.name}`)}&message=${encodeURIComponent(`I am interested in the ${tour.name} departure on ${String(departure.date)}. Please share current availability, conditions, and whether this date is a good fit for me.`)}`}>
                            Ask about this date
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <section id="itinerary" className="scroll-m-32">
                <Itinerary items={tour.itinerary} />
              </section>
              <section id="inclusions" className="scroll-m-32">
                <InclusionsExclusions tour={tour} />
              </section>

              {tour.map && (
                <section id="map" className="scroll-m-32">
                  <h2 className="text-3xl font-bold !font-headline mb-6">Trek Map</h2>
                  <div className="bg-card p-4 rounded-lg shadow-sm aspect-video">
                    <iframe
                      src={tour.map}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map for ${tour.name}`}
                      className="rounded-md"
                    ></iframe>
                  </div>
                </section>
              )}

              {tour.images && tour.images.length > 0 && (
                <section id="gallery" className="scroll-m-32">
                  <TourGallery images={tour.images} tourName={tour.name} />
                </section>
              )}

              {tour.faq && tour.faq.length > 0 && (
                <section id="faq" className="scroll-m-32">
                  <FaqSection faq={tour.faq} />
                </section>
              )}

              {hasReviews && (
                <section id="reviews" className="scroll-m-32">
                  <Reviews
                    reviews={displayedReviews}
                    tourId={tour.id}
                  />
                </section>
              )}

              {tour.gears && tour.gears.length > 0 && (
                <section id="gears" className="scroll-m-32">
                  <GearsSection gears={tour.gears} />
                </section>
              )}

              {tour.additionalInfoSections && tour.additionalInfoSections.length > 0 && (
                <section id="additional-info" className="scroll-m-32">
                  <AdditionalInfoSection sections={tour.additionalInfoSections} />
                </section>
              )}

              {tour.guides && tour.guides.length > 0 && (
                <section id="guides" className="scroll-m-32">
                  <GuidesSection guides={tour.guides} />
                </section>
              )}
            </div>

            <aside className="lg:col-span-1 mt-12 lg:mt-0 hidden lg:block">
              <div className="sticky top-28">
                <BookingWidget tour={tour} />
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Chatbot
        prefilledWhatsapp={chatMessages.whatsapp}
        prefilledEmail={chatMessages.email}
        tempUserId={tempUserId}
      />
    </>
  );
}
