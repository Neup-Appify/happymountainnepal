
'use server';
/**
 * @fileOverview An AI flow for searching tours.
 */

import { z } from 'zod';
import { getAllPackages } from '@/lib/db/sqlite';

const SearchInputSchema = z.string();
const SearchOutputSchema = z.object({
  tours: z.array(z.any()), // We'll use any for now as Tour type is complex for Zod.
});

export async function searchTours(term: string): Promise<z.infer<typeof SearchOutputSchema>> {
  try {
    const searchTermLower = SearchInputSchema.parse(term).toLowerCase();
    const tours = getAllPackages('published')
      .filter(tour => {
        const keywords = tour.searchKeywords || [];
        return keywords.includes(searchTermLower)
          || tour.name.toLowerCase().includes(searchTermLower)
          || tour.description.toLowerCase().includes(searchTermLower);
      })
      .slice(0, 20);

    return SearchOutputSchema.parse({ tours });
  } catch (error) {
    console.error("SQLite search failed:", error);
    return { tours: [] };
  }
}
