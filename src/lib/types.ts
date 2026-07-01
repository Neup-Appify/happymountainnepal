

import { Timestamp } from '@/lib/timestamp';

export interface ImageWithCaption {
  url: string;
  caption?: string;
  posted_by?: string;
  story?: string;
}

export interface Tour {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string; // Meta description for SEO (150-200 chars)
  region: string[]; // Changed to array
  type: 'Trekking' | 'Tour' | 'Climbing' | 'Jungle Safari';
  difficulty: 'Easy' | 'Moderate' | 'Strenuous' | 'Challenging';
  duration: number; // in days
  price: number; // Base price
  mainImage: ImageWithCaption;
  images: ImageWithCaption[];
  itinerary: { day: number; title: string; description: string }[];
  inclusions: string[];
  exclusions: string[];
  departureDates: { date: string | Timestamp; price: number; guaranteed: boolean }[];
  anyDateAvailable?: boolean; // New field for "Any Date" option
  map: string; // URL for an embedded map iframe (renamed from mapImage)
  reviews: Review[]; // This is for embedded reviews on tour pages
  status: 'draft' | 'published' | 'unpublished' | 'hidden'; // Added status field
  faq: { question: string; answer: string }[]; // New field for Frequently Asked Questions
  additionalInfoSections?: { title: string; content: string }[]; // New field for additional info sections
  bookingType: 'internal' | 'external'; // New: How the tour is booked
  externalBookingUrl?: string; // New: URL for external booking if bookingType is 'external'
  searchKeywords?: string[]; // New field for searching
  gears?: GearItem[]; // New field for gear list
  guides?: GuideItem[]; // New field for blogs/guides
  isPopular?: boolean; // New field for popular packages
  isFeatured?: boolean; // New field for featured packages
}

// Existing Review interface (for embedded reviews)
export interface Review {
  id: string;
  rating: number;
  author: string;
  comment: string;
  date: string | Timestamp;
  globalId?: string; // Reference to global review
}

export interface GearItem {
  id: string;
  name: string;
  description?: string;
  image?: string;
  provided: boolean; // true if provided by company, false if user needs to bring
  globalId?: string; // Reference to the global gear item
}

export interface GuideItem {
  id: string; // Local ID
  title: string;
  excerpt: string;
  image: string;
  slug: string; // To link to the actual blog
  author: string;
  globalId?: string; // Reference to the global blog post
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorPhoto: string; // New field for author's photo
  date: string | Timestamp;
  image: string;
  tags?: string[]; // Added tags field
  metaInformation?: string; // Keeping as string for keywords/short meta description
  status: 'draft' | 'published';
  searchKeywords?: string[];
}

export type TeamMember = {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  groupId?: string;
  orderIndex?: number;
  shortDescription?: string;
  story?: string;
  gallery?: string[];
  socials?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
}

export type TeamGroup = {
  id: string;
  name: string; // e.g., "Management Team", "Internal Team", "International Team"
  description?: string;
  orderIndex: number; // Order of the group itself
}

export interface Destination {
  name: string;
  image: string;
  tourCount: number;
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  link?: string;
}

export interface Account {
  id: string;
  fullName: string; // Added
  email: string;    // Added
  phone?: string;   // Added as optional based on backend.json
  ipAddress?: string; // Optional, if you log it
  createdAt: Timestamp;
}

export interface Activity {
  id: string;
  accountId: string;
  activityName: string;
  activityInfo: Record<string, any>;
  fromIp: string;
  fromLocation?: string; // This would typically require an external service
  activityTime: Timestamp;
}

export interface SiteError {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  pathname: string;
  createdAt: Timestamp;
  context?: Record<string, any>;
}

export type UploadCategory = 'general' | 'trip' | 'document' | 'background' | 'feature-icon' | 'user-photo' | 'blog' | 'logo' | 'author';

export interface FileUpload {
  id: string;
  name: string;
  url: string;
  uploadedBy: string;
  type: string;
  size: number;
  tags: string[];
  meta: any[];
  uploadedOn: string;
  uploadedAt: string; // Serialized to ISO string
  createdAt: string; // Serialized to ISO string
}

// New Review types for the /manage/reviews section
export type ReviewType = 'onSite' | 'offSite';

export interface BaseReview {
  id: string;
  type: ReviewType;
  reviewedOn: Timestamp | Date | string; // Allow Date and string for client-side flexibility
  userName: string;
  userRole?: string; // Added: Optional role/title of the reviewer
  reviewFor?: string | null; // packageId if applicable, can be null
  reviewBody: string;
  reviewMedia?: string[]; // Array of image URLs
  stars: 1 | 2 | 3 | 4 | 5;
}

export interface OnSiteReview extends BaseReview {
  type: 'onSite';
  userId: string; // ID of the user who left the review
  reviewFor: string; // Must be a packageId for on-site reviews
}

export interface OffSiteReview extends BaseReview {
  type: 'offSite';
  originalReviewUrl: string; // URL to the original review on an external platform
}

export type ManagedReview = OnSiteReview | OffSiteReview;

export type ChatbotPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'middle-right' | 'middle-left';

export interface DisplayUser {
  id: string;
  activityCount: number;
  timeInvestedSeconds: number;
  lastSeen: string;
  firstSeen: string;
  identifier: string;
  type: 'Permanent' | 'Temporary';
  userAgentCategory: string;
  referrerSource: string;
  ipAddress: string;
  countryCode?: string;
}

export interface SiteProfile {
  id: string;
  basePath?: string; // Base path for the site (e.g., 'https://happymountainnepal.com')
  reviewCount?: number;
  contactEmail?: string;
  phone?: string;
  address?: string;
  heroTitle?: string;
  heroDescription?: string;
  footerTagline?: string;
  location?: string; // New: Display text for location
  locationUrl?: string; // New: URL for location (e.g., Google Maps)
  heroImage?: string; // New field for hero image
  heroImages?: string[]; // Array of hero images for slider
  heroTransitionInterval?: number; // Interval in seconds for slider transition
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  whyUs?: { icon: string; title: string; description: string; }[];
  chatbot?: {
    enabled?: boolean;
    position?: ChatbotPosition;
    whatsappNumber?: string;
    emailAddress?: string;
  };
}

export interface LegalDocument {
  id: string;
  title: string;
  description?: string;
  url: string;
  createdAt: string;
  requireEmailProtection?: boolean;
  isHidden?: boolean;
  orderIndex?: number;
}


export interface LegalContent {
  id: 'privacy-policy' | 'terms-of-service';
  content: string;
  lastUpdated: string;
}

// New type for AI import
export interface ImportedTourData {
  name: string;
  description: string;
  duration: number;
  price: number;
  difficulty: 'Easy' | 'Moderate' | 'Strenuous' | 'Challenging';
  region: string[];
  itinerary: { day: number; title: string; description: string }[];
  inclusions: string[];
  exclusions: string[];
  faq: { question: string; answer: string }[];
  additionalInfoSections: { title: string; content: string }[];
  type?: 'Trekking' | 'Tour' | 'Climbing' | 'Jungle Safari';
}

export interface ImportedBlogData {
  title: string;
  content: string;
  excerpt: string;
  author: string;
  image: string;
}

export interface Redirect {
  id: string;
  source: string;
  destination: string;
  permanent: boolean;
  createdAt?: Timestamp | string;
}

export interface Log {
  id: string;
  accountId?: string;
  cookieId: string; // The temp_account cookie ID
  pageAccessed: string; // The path that was accessed
  resourceType: 'page' | 'api' | 'static' | 'redirect'; // Type of resource
  method?: string; // HTTP method (GET, POST, etc.)
  statusCode?: number; // Response status code
  referrer?: string; // Where the user came from
  userAgent: string; // Browser/bot user agent
  ipAddress?: string; // Client IP address
  countryCode?: string;
  timestamp: Timestamp | string; // When the access occurred (Timestamp in DB, string when serialized)
  isBot?: boolean; // Whether this appears to be a bot
  agentCategory?: string;
  referrerSource?: string;
  metadata?: Record<string, any>; // Any additional information
}

export interface PaymentSettings {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode?: string;
  iban?: string;
  bankAddress?: string;
  additionalInstructions?: string;
  updatedAt: Timestamp | string;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isFeatured: boolean;
  parentId?: string | null; // For sub-locations
  createdAt: string; // ISO string
  parentName?: string; // Derived field
}
