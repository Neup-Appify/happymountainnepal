
import { getTourById } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { KeyFacts } from '@/components/tour-details/KeyFacts';
import { Itinerary } from '@/components/tour-details/Itinerary';
import { InclusionsExclusions } from '@/components/tour-details/InclusionsExclusions';
import { FaqSection } from '@/components/tour-details/FaqSection';
import { AdditionalInfoSection } from '@/components/tour-details/AdditionalInfoSection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PenSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from '@/lib/timestamp';
import type { Tour } from '@/lib/types';
import { DownloadDocxButton } from '@/components/manage/DownloadDocxButton';

type PackageDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

// Helper component for section titles with edit links
const SectionTitle = ({ title, editHref }: { title: string; editHref: string }) => (
  <div className="flex items-center gap-2 mb-6">
    <h2 className="text-2xl font-bold !font-headline">{title}</h2>
    <Link href={editHref}>
      <PenSquare className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
    </Link>
  </div>
);


export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { id } = await params;
  const tour = await getTourById(id);

  if (!tour) {
    notFound();
  }

  const allImages = [tour.mainImage, ...(tour.images || [])].filter(img => img && img.url);

  const getStatusVariant = (status: Tour['status']) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'unpublished': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold !font-headline">{tour.name}</h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={getStatusVariant(tour.status)}>
              {tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground font-mono">{tour.id}</span>
          </div>
        </div>
        <DownloadDocxButton tour={tour} />
      </div>

      <div>
        <SectionTitle title="Media & Gallery" editHref={`/manage/packages/${tour.id}/media`} />
        {allImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {allImages.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                <Image src={String(img.url)} alt={img.caption || img.story || `Gallery image ${index + 1}`} fill className="object-cover" />
                {index === 0 && <Badge variant="secondary" className="absolute top-2 left-2">Main Image</Badge>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic">No media uploaded yet.</p>
        )}
      </div>

      <div>
        <SectionTitle title="Key Facts" editHref={`/manage/packages/${tour.id}/basics`} />
        <KeyFacts tour={tour} />
      </div>

      <div>
        <SectionTitle title="Booking &amp; Pricing" editHref={`/manage/packages/${tour.id}/booking`} />
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground">Base Price</span>
              <span className="font-semibold">${tour.price} USD</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-muted-foreground">Booking Type</span>
              <Badge variant="outline">{tour.bookingType}</Badge>
            </div>
            {tour.bookingType === 'external' && tour.externalBookingUrl && (
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">External URL</span>
                <a href={tour.externalBookingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-xs">{tour.externalBookingUrl}</a>
              </div>
            )}
            <div>
              <h4 className="font-semibold mb-2">Departure Dates</h4>
              {tour.departureDates && tour.departureDates.length > 0 ? (
                <ul className="space-y-1">
                  {tour.departureDates.map((d, i) => {
                    const date = d.date instanceof Timestamp ? d.date.toDate() : new Date(d.date);
                    if (isNaN(date.getTime())) return null;

                    return (
                      <li key={i} className="flex justify-between text-sm">
                        <span>{format(date, 'PPP')}</span>
                        <span>${d.price} {d.guaranteed && <Badge variant="default" className="ml-2">Guaranteed</Badge>}</span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{tour.anyDateAvailable ? "Available any date." : "No specific departure dates."}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {tour.itinerary && tour.itinerary.length > 0 && (
        <div>
          <SectionTitle title="Daily Itinerary" editHref={`/manage/packages/${tour.id}/itinerary`} />
          <Itinerary items={tour.itinerary} />
        </div>
      )}

      {(tour.inclusions && tour.inclusions.length > 0) || (tour.exclusions && tour.exclusions.length > 0) ? (
        <div>
          <SectionTitle title="Inclusions &amp; Exclusions" editHref={`/manage/packages/${tour.id}/inclusions`} />
          <InclusionsExclusions tour={tour} />
        </div>
      ) : null}

      <div>
        <SectionTitle title="Gears & Equipment" editHref={`/manage/packages/${tour.id}/gears`} />
        {tour.gears && tour.gears.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Provided</h3>
              <ul className="space-y-2">
                {tour.gears.filter(g => g.provided).map(g => (
                  <li key={g.id} className="flex items-center gap-2 text-sm">
                    {g.image && <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0"><Image src={g.image} alt={g.name} fill className="object-cover" /></div>}
                    <span>{g.name}</span>
                  </li>
                ))}
                {tour.gears.filter(g => g.provided).length === 0 && <li className="text-muted-foreground text-sm italic">Nothing listed as provided.</li>}
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Bring Yourself</h3>
              <ul className="space-y-2">
                {tour.gears.filter(g => !g.provided).map(g => (
                  <li key={g.id} className="flex items-center gap-2 text-sm">
                    {g.image && <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0"><Image src={g.image} alt={g.name} fill className="object-cover" /></div>}
                    <span>{g.name}</span>
                  </li>
                ))}
                {tour.gears.filter(g => !g.provided).length === 0 && <li className="text-muted-foreground text-sm italic">Nothing listed as required.</li>}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground italic">No gears or equipment listed yet.</p>
        )}
      </div>

      {tour.map && (
        <div>
          <SectionTitle title="Trek Map" editHref={`/manage/packages/${tour.id}/media`} />
          <Card>
            <CardContent className="p-6">
              <div className="aspect-video">
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
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <SectionTitle title="Reviews" editHref={`/manage/packages/${tour.id}/reviews`} />
        {tour.reviews && tour.reviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {tour.reviews.map((r, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{r.author}</h4>
                      <p className="text-sm text-yellow-500 font-bold mb-1">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {(() => {
                        try {
                          if (!r.date) return 'Date N/A';
                          const d = r.date instanceof Timestamp ? r.date.toDate() : new Date(r.date);
                          return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
                        } catch (e) {
                          return 'Date Error';
                        }
                      })()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{r.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic">No reviews linked to this package.</p>
        )}
      </div>

      <div>
        <SectionTitle title="Blogs & Guides" editHref={`/manage/packages/${tour.id}/guide`} />
        {tour.guides && tour.guides.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tour.guides.map((g) => (
              <div key={g.id} className="border rounded-lg p-3 flex gap-3 items-start">
                <div className="relative w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                  {g.image && <Image src={g.image} alt={g.title} fill className="object-cover" />}
                </div>
                <div>
                  <h4 className="font-semibold text-sm line-clamp-2">{g.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">By {g.author}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic">No guides linked to this package.</p>
        )}
      </div>

      {tour.faq && tour.faq.length > 0 && (
        <div>
          <SectionTitle title="Frequently Asked Questions" editHref={`/manage/packages/${tour.id}/faq`} />
          <FaqSection faq={tour.faq} />
        </div>
      )}

      {tour.additionalInfoSections && tour.additionalInfoSections.length > 0 && (
        <div>
          <SectionTitle title="Additional Information" editHref={`/manage/packages/${tour.id}/info`} />
          <AdditionalInfoSection sections={tour.additionalInfoSections} />
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold !font-headline mb-6">Billing & Payment</h2>
        <Card>
          <CardHeader>
            <CardTitle>Payment Link Management</CardTitle>
            <CardDescription>
              Manage payment settings and generate checkout links for this package
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure bank transfer information and share the checkout link with customers for this package.
            </p>
            <Link href={`/manage/payment?package=${tour.id}`}>
              <Button className="w-full sm:w-auto">
                Manage Payment Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
