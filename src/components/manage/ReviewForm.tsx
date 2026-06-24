'use client';

import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { type ManagedReview, OnSiteReview, OffSiteReview } from '@/lib/types';
import { addReview, updateReview, logError, getAllToursForSelect } from '@/lib/db';
import { useTransition, useState, useEffect } from 'react';
import { Loader2, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MediaPicker } from './MediaPicker';
import { usePathname, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  type: z.enum(['onSite', 'offSite'], { required_error: "Review type is required." }),
  userName: z.string().min(2, "User name is required."),
  userRole: z.string().optional(), // Added userRole to schema
  reviewedOn: z.date({ required_error: "Review date is required." }),
  reviewFor: z.string().optional().nullable(), // packageId
  reviewBody: z.string().min(10, "Review body must be at least 10 characters."),
  reviewMedia: z.array(z.object({ url: z.string().url("Must be a valid URL.") })).optional(),
  stars: z.number().min(1).max(5, "Stars must be between 1 and 5."),
  userId: z.string().optional(), // Only for onSite
  originalReviewUrl: z.string().url("Must be a valid URL.").optional(), // Only for offSite
}).superRefine((data, ctx) => {
  if (data.type === 'onSite') {
    if (!data.userId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "User ID is required for on-site reviews.",
        path: ['userId'],
      });
    }
    if (!data.reviewFor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Package is required for on-site reviews.",
        path: ['reviewFor'],
      });
    }
  }
  if (data.type === 'offSite' && !data.originalReviewUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Original review URL is required for off-site reviews.",
      path: ['originalReviewUrl'],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

interface ReviewFormProps {
  review?: ManagedReview;
}

export function ReviewForm({ review }: ReviewFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const [tours, setTours] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [isLoadingTours, setIsLoadingTours] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: review?.type || 'onSite',
      userName: review?.userName || '',
      userRole: review?.userRole || '', // Set default value for userRole
      reviewedOn: review?.reviewedOn ? new Date(review.reviewedOn as any) : new Date(),
      reviewFor: review?.reviewFor || null,
      reviewBody: review?.reviewBody || '',
      reviewMedia: review?.reviewMedia?.map(url => ({ url })) || [],
      stars: review?.stars || 5,
      userId: (review as OnSiteReview)?.userId || '',
      originalReviewUrl: (review as OffSiteReview)?.originalReviewUrl || '',
    },
  });

  const { fields: mediaFields, append: appendMedia, remove: removeMedia } = useFieldArray({
    control: form.control,
    name: 'reviewMedia',
  });

  const reviewType = form.watch('type');

  useEffect(() => {
    const fetchTours = async () => {
      setIsLoadingTours(true);
      try {
        const fetchedTours = await getAllToursForSelect();
        setTours(fetchedTours);
      } catch (error) {
        console.error("Failed to fetch tours for select:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load tour packages for selection.',
        });
      } finally {
        setIsLoadingTours(false);
      }
    };
    fetchTours();
  }, [toast]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const formattedValues = {
          ...values,
          reviewMedia: values.reviewMedia?.map(m => m.url).filter(Boolean) || [],
        };

        if (review) {
          await updateReview(review.id, formattedValues as any);
          toast({ title: 'Success', description: 'Review updated.' });
        } else {
          await addReview(formattedValues as any);
          toast({ title: 'Success', description: 'Review created.' });
        }
        router.push('/manage/reviews');
      } catch (error: any) {
        console.error("Failed to save review:", error);
        const context = {
            reviewId: review?.id,
            values: values
        };
        logError({ message: `Failed to save review: ${error.message}`, stack: error.stack, pathname, context });
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not save review. Please try again.',
        });
      }
    });
  };

  return (
    <FormProvider {...form}>
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Review Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col sm:flex-row space-y-1"
                        disabled={isPending}
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="onSite" />
                          </FormControl>
                          <FormLabel className="font-normal">On-Site Review</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="offSite" />
                          </FormControl>
                          <FormLabel className="font-normal">Off-Site Review</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField // Added userRole field
                control={form.control}
                name="userRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CEO, Traveler" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reviewedOn"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Review Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isPending}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || isPending}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stars"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <Label htmlFor="stars-slider">Stars ({value})</Label>
                    <FormControl>
                      <Slider
                        id="stars-slider"
                        min={1}
                        max={5}
                        step={1}
                        value={[value]}
                        onValueChange={(val) => onChange(val[0])}
                        disabled={isPending}
                        className="w-full"
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {reviewType === 'onSite' && (
                <>
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., account-id-123" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reviewFor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Review For (Package)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={isPending || isLoadingTours}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a tour package" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingTours ? (
                                <SelectItem value="loading" disabled>Loading tours...</SelectItem>
                            ) : tours.length === 0 ? (
                                <SelectItem value="no-tours" disabled>No tours available</SelectItem>
                            ) : (
                                tours.map((tour) => (
                                    <SelectItem key={tour.id} value={tour.id}>
                                        {tour.name}
                                    </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {reviewType === 'offSite' && (
                <FormField
                  control={form.control}
                  name="originalReviewUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Review URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.tripadvisor.com/review/123" {...field} disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="reviewBody"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Body</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write the full review here..."
                        rows={5}
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Review Media (Images)</h3>
                {mediaFields.map((field, index) => (
                   <div key={field.id} className="flex items-center gap-2 p-4 border rounded-lg">
                     <div className="w-full">
                        <MediaPicker name={`reviewMedia.${index}.url`} category="trip" />
                        <FormMessage>{form.formState.errors.reviewMedia?.[index]?.message}</FormMessage>
                     </div>
                     <Button type="button" variant="ghost" size="icon" onClick={() => removeMedia(index)} disabled={isPending}>
                       <Trash2 className="h-4 w-4 text-destructive" />
                     </Button>
                   </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendMedia({ url: '' })} disabled={isPending}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Media Image
                </Button>
              </div>

              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {review ? 'Update Review' : 'Create Review'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
