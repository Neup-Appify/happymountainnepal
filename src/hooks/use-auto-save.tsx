
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useDebounce } from './use-debounce';
import { updateTour } from '@/lib/db';
import { useToast } from './use-toast';
import { Timestamp } from '@/lib/timestamp';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

interface UseAutoSaveProps {
  tourId: string;
  enabled?: boolean;
}

export function useAutoSave({ tourId, enabled = true }: UseAutoSaveProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const { watch, formState: { isDirty, dirtyFields }, getValues } = useFormContext();
  const { toast } = useToast();

  // watch for all changes
  const watchedValues = watch();
  const debouncedValues = useDebounce(watchedValues, 5000); // 5-second debounce delay
  const isMounted = useRef(false);

  const saveChanges = useCallback(async () => {
    if (!isDirty || !enabled) {
      setSaveStatus('idle');
      return;
    }

    setSaveStatus('saving');
    
    // Get only the dirty fields to send a smaller payload
    const values = getValues();
    const dirtyValues: { [key: string]: any } = {};
    Object.keys(dirtyFields).forEach(key => {
        // @ts-ignore
        dirtyValues[key] = values[key];
    });

    try {
        // Handle date conversion for departureDates
        if (dirtyValues.departureDates) {
            dirtyValues.departureDates = dirtyValues.departureDates.map((d: any) => ({
                ...d,
                date: d.date instanceof Date ? Timestamp.fromDate(d.date) : d.date
            }));
        }

      await updateTour(tourId, dirtyValues);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      toast({
        variant: 'destructive',
        title: 'Auto-save failed',
        description: 'Your latest changes could not be saved. Please try saving manually if the issue persists.',
      });
    }
  }, [isDirty, enabled, getValues, dirtyFields, tourId, toast]);

  useEffect(() => {
    // We don't want to save on the initial load, so we use a ref to track mount status.
    if (isMounted.current && isDirty && enabled) {
      saveChanges();
    }
  }, [debouncedValues, isDirty, enabled, saveChanges]);

  useEffect(() => {
    // This ensures we don't trigger a save on the very first render.
    isMounted.current = true;
  }, []);

  return { saveStatus };
}
