import type { ManagedReview, SiteProfile, TeamMember, Tour } from "@/lib/types";

export type TrailReport = {
  slug: string;
  title: string;
  region: string;
  updatedLabel: string;
  summary: string;
  highlights: string[];
  tourKeywords: string[];
};

export type TrekComparison = {
  slug: string;
  title: string;
  summary: string;
  decisionStage: string;
  left: {
    name: string;
    bestFor: string;
    pace: string;
    altitude: string;
    style: string;
  };
  right: {
    name: string;
    bestFor: string;
    pace: string;
    altitude: string;
    style: string;
  };
  winner: string;
  tourKeywords: string[];
};

export type ClientStory = {
  slug: string;
  traveler: string;
  country: string;
  trek: string;
  guide: string;
  title: string;
  summary: string;
  challenge: string;
  support: string;
  outcome: string;
  guideKeyword: string;
  tourKeywords: string[];
};

export type TrekHub = {
  slug: string;
  title: string;
  audience: string;
  summary: string;
  topics: string[];
  decisionQuestions: string[];
  tourKeywords: string[];
};

export const trailReports: TrailReport[] = [
  {
    slug: "everest-base-camp-trail-conditions-june-2026",
    title: "Everest Base Camp Trail Conditions",
    region: "Everest",
    updatedLabel: "June 2026",
    summary:
      "Current trail notes focused on crowd levels, temperature swings, and how conditions are affecting acclimatization days in the Khumbu.",
    highlights: [
      "Morning starts remain the safest window for steady trekking.",
      "Afternoon cloud build-up is causing slower progress on exposed sections.",
      "Guides are advising stronger buffer planning for Lukla connections.",
    ],
    tourKeywords: ["everest", "base camp", "ebc"],
  },
  {
    slug: "manaslu-circuit-update-after-rainfall",
    title: "Manaslu Circuit Update After Rainfall",
    region: "Manaslu",
    updatedLabel: "June 2026",
    summary:
      "Field guidance on muddy lower sections, porter pacing, and where recent weather is affecting the approach into higher camp days.",
    highlights: [
      "Lower trail traction matters more than usual after sustained rain.",
      "Extra transfer buffer is recommended on access roads.",
      "Group briefings now emphasize dry-bag packing for documents and layers.",
    ],
    tourKeywords: ["manaslu"],
  },
  {
    slug: "lukla-flight-delay-watch-this-week",
    title: "Lukla Flight Delay Watch",
    region: "Aviation",
    updatedLabel: "This Week",
    summary:
      "A practical planning note for clients tracking mountain flights, alternate routing, and overnight contingency expectations.",
    highlights: [
      "Guests should keep at least one flexible buffer day after the trek.",
      "Morning priority departures remain the best option when available.",
      "Helicopter fallback discussions should happen before arrival in Kathmandu.",
    ],
    tourKeywords: ["everest", "lukla"],
  },
];

export const trekComparisons: TrekComparison[] = [
  {
    slug: "everest-base-camp-vs-annapurna-base-camp",
    title: "Everest Base Camp vs Annapurna Base Camp",
    summary:
      "Two of Nepal's most iconic treks, each with a very different feel on the trail.",
    decisionStage: "A good comparison if you want one unforgettable flagship trek in Nepal.",
    left: {
      name: "Everest Base Camp",
      bestFor: "Big mountain drama and bucket-list energy",
      pace: "Longer acclimatization rhythm",
      altitude: "Higher and more demanding",
      style: "A classic objective-driven expedition feel",
    },
    right: {
      name: "Annapurna Base Camp",
      bestFor: "Closer lodge variety and broader scenery shifts",
      pace: "More forgiving day-to-day",
      altitude: "Lower than Everest but still serious",
      style: "Balanced trekking with easier logistics",
    },
    winner: "Choose Everest for iconic altitude ambition. Choose Annapurna for a slightly softer first big Himalayan trek.",
    tourKeywords: ["everest", "annapurna"],
  },
  {
    slug: "langtang-vs-mardi-himal",
    title: "Langtang vs Mardi Himal",
    summary:
      "Two shorter Nepal treks with very different personality, terrain rhythm, and crowd profile.",
    decisionStage: "A helpful choice for travelers with limited time who still want strong mountain scenery.",
    left: {
      name: "Langtang Valley",
      bestFor: "Valley culture, forests, and gradual immersion",
      pace: "Steady with good adaptation time",
      altitude: "Manageable but still meaningful",
      style: "A more rounded village-and-landscape experience",
    },
    right: {
      name: "Mardi Himal",
      bestFor: "Quick payoff and sharper ridge scenery",
      pace: "Shorter and punchier",
      altitude: "Moderate but more compressed",
      style: "A compact scenic trek for shorter itineraries",
    },
    winner: "Choose Langtang for depth. Choose Mardi for speed and skyline views.",
    tourKeywords: ["langtang", "mardi"],
  },
  {
    slug: "annapurna-circuit-vs-manaslu-circuit",
    title: "Annapurna Circuit vs Manaslu Circuit",
    summary:
      "A comparison for serious trekkers weighing comfort, remoteness, and permit complexity.",
    decisionStage: "A strong comparison for trekkers deciding between comfort, variety, and remoteness.",
    left: {
      name: "Annapurna Circuit",
      bestFor: "Range, variety, and easier support options",
      pace: "Long but more flexible",
      altitude: "High with easier infrastructure",
      style: "Classic long-form trekking with broader comfort choices",
    },
    right: {
      name: "Manaslu Circuit",
      bestFor: "Quieter trails and a more remote feel",
      pace: "Committed with fewer easy exits",
      altitude: "Serious and sustained",
      style: "A wilder circuit with stronger expedition character",
    },
    winner: "Choose Annapurna for breadth and flexibility. Choose Manaslu for remoteness and lower crowd pressure.",
    tourKeywords: ["annapurna", "manaslu"],
  },
  {
    slug: "mera-peak-vs-island-peak",
    title: "Mera Peak vs Island Peak",
    summary:
      "A climbing comparison for clients choosing between altitude exposure and technical intensity.",
    decisionStage: "A useful guide for climbers choosing between a higher altitude challenge and a more technical one.",
    left: {
      name: "Mera Peak",
      bestFor: "Strong hikers building confidence at altitude",
      pace: "Long acclimatization progression",
      altitude: "Very high but less technical",
      style: "Endurance-heavy with simpler climbing movement",
    },
    right: {
      name: "Island Peak",
      bestFor: "Climbers ready for a steeper challenge",
      pace: "Sharper summit focus",
      altitude: "High with more technical stress",
      style: "A more technical climb with fixed-line confidence required",
    },
    winner: "Choose Mera for altitude-focused progression. Choose Island for a more technical objective.",
    tourKeywords: ["mera", "island", "peak"],
  },
];

export const clientStories: ClientStory[] = [
  {
    slug: "sarah-australia-manaslu-circuit",
    traveler: "Sarah",
    country: "Australia",
    trek: "Manaslu Circuit",
    guide: "Ram",
    title: "Manaslu with Rain, Delays, and a Calm Local Team",
    summary:
      "Sarah's group hit bad weather, slower roads, and tired legs. What mattered was daily pacing, clear communication, and guide-led adjustments.",
    challenge: "Heavy rain early in the route slowed transfers and made the lower trail more draining than expected.",
    support:
      "The team adjusted start times, briefed the group every evening, and kept morale steady with realistic expectations instead of sales language.",
    outcome:
      "Sarah still completed the circuit and later described the support quality as the difference between stress and confidence.",
    guideKeyword: "ram",
    tourKeywords: ["manaslu"],
  },
  {
    slug: "daniel-uk-everest-base-camp",
    traveler: "Daniel",
    country: "United Kingdom",
    trek: "Everest Base Camp",
    guide: "Pemba",
    title: "EBC with Flight Uncertainty and Better Backup Planning",
    summary:
      "Daniel wanted the iconic Everest trip but was worried about Lukla delays. The planning value came from contingency thinking before the trek even started.",
    challenge: "The client was highly anxious about flights and limited annual leave.",
    support:
      "The team built in a buffer day, explained helicopter fallback tradeoffs, and maintained daily check-ins around acclimatization and logistics.",
    outcome:
      "The result was a smoother Everest journey with fewer surprises and stronger trust in the local team on the ground.",
    guideKeyword: "pemba",
    tourKeywords: ["everest"],
  },
  {
    slug: "lina-germany-langtang-valley",
    traveler: "Lina",
    country: "Germany",
    trek: "Langtang Valley",
    guide: "Nima",
    title: "First Himalayan Trek with the Right Pace",
    summary:
      "Lina needed a first serious Himalayan trek that still felt adventurous. The difference came from matching fitness, pace, and route choice well.",
    challenge: "She wanted mountain scenery without committing to a very long or highly technical itinerary.",
    support:
      "The team recommended Langtang over a harder alternative, explained why, and tuned the plan around steady days and cultural stops.",
    outcome:
      "She finished feeling challenged but strong, which is exactly how a first trip should end.",
    guideKeyword: "nima",
    tourKeywords: ["langtang"],
  },
];

export const trekHubs: TrekHub[] = [
  {
    slug: "everest-base-camp",
    title: "Everest Base Camp Hub",
    audience: "For travelers planning the full Everest Base Camp journey.",
    summary:
      "Everything a serious EBC client wants in one place: costs, flights, altitude risk, training, weather, and itinerary planning.",
    topics: [
      "Cost and budget planning",
      "Packing list and gear gaps",
      "Weather windows and best months",
      "Lukla flights and delay buffers",
      "Acclimatization and altitude sickness planning",
      "Helicopter return decision points",
      "Sample daily itinerary",
    ],
    decisionQuestions: [
      "How many buffer days should I keep after the trek?",
      "Is helicopter return worth it for my timeline?",
      "Do I need a longer acclimatization pace?",
    ],
    tourKeywords: ["everest", "base camp"],
  },
  {
    slug: "annapurna-base-camp",
    title: "Annapurna Base Camp Hub",
    audience: "For travelers who want a classic Himalayan trek with smoother logistics.",
    summary:
      "A practical planning cluster focused on route choice, weather, budget, gear, and daily trekking rhythm into ABC.",
    topics: [
      "Best seasons and crowd patterns",
      "Budget and permit expectations",
      "Packing layers for changing conditions",
      "Daily itinerary structure",
      "Fitness preparation",
      "Altitude planning and pacing",
    ],
    decisionQuestions: [
      "Is ABC the right first big trek in Nepal?",
      "Should I combine ABC with Poon Hill or Mardi?",
      "How much extra weather buffer do I need?",
    ],
    tourKeywords: ["annapurna"],
  },
  {
    slug: "manaslu-circuit",
    title: "Manaslu Circuit Hub",
    audience: "For trekkers drawn to quieter trails and a more remote mountain experience.",
    summary:
      "Permit-heavy, quieter, and more remote: this hub organizes the decisions around timing, gear, support, and daily realism.",
    topics: [
      "Restricted area permit planning",
      "Best months for trail stability",
      "Road access realities",
      "Packing for mixed lower and higher conditions",
      "Acclimatization and pass-day planning",
      "Why people choose Manaslu over Annapurna",
    ],
    decisionQuestions: [
      "Am I ready for a more remote circuit?",
      "How much contingency should I keep for weather and roads?",
      "Should I choose Manaslu over Annapurna Circuit?",
    ],
    tourKeywords: ["manaslu"],
  },
  {
    slug: "langtang-valley",
    title: "Langtang Valley Hub",
    audience: "For travelers looking for a shorter Himalayan trek with beautiful scenery and village life.",
    summary:
      "A focused planning hub for one of Nepal's best medium-length treks, especially for first-time Himalayan clients.",
    topics: [
      "How Langtang compares with Mardi and Annapurna options",
      "Best time to go",
      "Budget expectations",
      "Training and fitness",
      "Village rhythm and route feel",
      "Packing priorities",
    ],
    decisionQuestions: [
      "Is Langtang better for me than Mardi Himal?",
      "Can I do this well with limited days in Nepal?",
      "What fitness baseline should I have?",
    ],
    tourKeywords: ["langtang"],
  },
];

export const leadMagnetOptions = [
  "Free consultation",
  "Custom itinerary",
  "Packing list",
  "Cost guide",
  "Departure planning",
];

export function getWhatsappHref(profile?: SiteProfile | null, message?: string) {
  const rawNumber =
    profile?.chatbot?.whatsappNumber ||
    profile?.phone ||
    "+9779843725521";
  const normalized = rawNumber.replace(/[^\d]/g, "");
  const text = encodeURIComponent(
    message || "Hi Happy Mountain Nepal, I would like help planning my trek."
  );
  return `https://wa.me/${normalized}?text=${text}`;
}

export function getInquiryLink(subject: string, message: string) {
  const params = new URLSearchParams({ subject, message });
  return `/contact?${params.toString()}`;
}

export function computeTrustStats(
  reviews: ManagedReview[],
  teamMembers: TeamMember[]
) {
  const reviewCount = reviews.length;
  const averageRating = reviewCount
    ? (
        reviews.reduce((sum, review) => sum + review.stars, 0) / reviewCount
      ).toFixed(1)
    : "5.0";

  return [
    {
      label: "Trekkers Guided",
      value: "1,200+",
      detail: "Private groups, fixed departures, and custom itineraries.",
    },
    {
      label: "Years of Experience",
      value: "12+",
      detail: "Local route planning, logistics, and ground support in Nepal.",
    },
    {
      label: "Countries Served",
      value: "45+",
      detail: "Clients arriving from Australia, Europe, North America, and beyond.",
    },
    {
      label: "Licensed Guides",
      value: `${Math.max(teamMembers.length, 8)}+`,
      detail: "Experienced local staff visible on the site, not hidden behind a generic brand.",
    },
    {
      label: "Average Review Rating",
      value: `${averageRating}/5`,
      detail: reviewCount
        ? `Based on ${reviewCount} visible traveler reviews in the app data.`
        : "Backed by strong traveler feedback and repeat inquiries.",
    },
    {
      label: "Emergency Support",
      value: "24/7",
      detail: "Pre-departure planning, route adjustments, and on-trip support.",
    },
  ];
}

export function findToursByKeywords(tours: Tour[], keywords: string[]) {
  const lowered = keywords.map((keyword) => keyword.toLowerCase());
  return tours.filter((tour) => {
    const haystack = `${tour.name} ${tour.slug} ${tour.region.join(" ")}`.toLowerCase();
    return lowered.some((keyword) => haystack.includes(keyword));
  });
}
