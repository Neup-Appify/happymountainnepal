
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { WishlistProvider } from '@/context/WishlistContext';
import { ProgressBar } from '@/components/layout/ProgressBar';
import { HeaderV3 as Header } from '@/components/layout/HeaderV3';
import 'quill/dist/quill.snow.css'; // Import Quill's CSS
import { ConditionalFooter } from '@/components/layout/ConditionalFooter';
import { PageViewTracker } from '@/lib/client-logger';
import { AdminControlProvider } from '@/context/AdminControlContext';

export const metadata: Metadata = {
  title: {
    default: 'Happy Mountain Nepal',
    template: '%s | Happy Mountain Nepal',
  },
  description: 'Explore the best treks and tours in the Himalayas.',
  alternates: {
    canonical: 'https://happymountainnepal.com',
    languages: {
      'en': 'https://happymountainnepal.com',
      'x-default': 'https://happymountainnepal.com',
    },
  },
};


import { getSiteProfileAction } from '@/app/actions/profile';
import { readBaseFile } from '@/lib/base';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isManager = cookieStore.has('manager_username');

  // Fetch server data for Header/Footer
  const profile = await getSiteProfileAction();
  let navigationData = null;
  try {
    navigationData = await readBaseFile('navigation-components.json');
  } catch (e) {
    console.error("Failed to load navigation data in layout", e);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Happy Mountain Nepal",
    "url": "https://happymountainnepal.com",
    "logo": "https://cdn.neupgroup.com/p3happymountainnepal/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": profile?.phone || "+977-984-3725521",
      "contactType": "customer service"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ProgressBar />
        <WishlistProvider>
          <AdminControlProvider>
            <div className="flex flex-col min-h-screen">
              <div className="relative z-50">
                <Header
                  initialIsManager={isManager}
                  initialProfile={profile}
                  initialLinks={(navigationData as any)?.header?.links}
                />
              </div>
              <main className="flex-grow pt-16">{children}</main>
              <ConditionalFooter initialProfile={profile} />
            </div>
          </AdminControlProvider>
          {/* Chatbot removed from here, will be added to specific pages */}
          <Toaster />
          <PageViewTracker />
        </WishlistProvider>
      </body>
    </html>
  );
}
