
'use client';

import { useState, useEffect } from 'react';
import type { SiteProfile } from '@/lib/types';
import { getSiteProfileAction } from '@/app/actions/profile';
import { useToast } from './use-toast';

const SESSION_STORAGE_KEY = 'site-profile';

export function useSiteProfile(initialProfile?: SiteProfile | null) {
  const [profile, setProfile] = useState<SiteProfile | null>(initialProfile || null);
  const [isLoading, setIsLoading] = useState(initialProfile === undefined);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (initialProfile !== undefined) return; // Skip if we have initial data (even if null)

    async function fetchProfile() {
      // 1. Try to get data from sessionStorage
      try {
        const cachedProfile = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (cachedProfile) {
          setProfile(JSON.parse(cachedProfile));
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Failed to read from sessionStorage:", error);
      }

      // 2. If not in cache, fetch from SQLite
      try {
        setError(null);
        const siteProfile = await getSiteProfileAction();
        if (siteProfile) {
          setProfile(siteProfile);
          // 3. Save to sessionStorage
          try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(siteProfile));
          } catch (error) {
            console.error("Failed to write to sessionStorage:", error);
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch site profile:", error);
        setError(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load site profile.',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [toast, initialProfile]);

  return { profile, isLoading, error };
}
