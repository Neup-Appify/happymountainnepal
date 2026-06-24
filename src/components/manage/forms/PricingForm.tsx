'use client';

import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
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
import { Card, CardContent } from '@/components/ui/card';
import { type Tour } from '@/lib/types';
import { updateTour, logError } from '@/lib/db';
import { useTransition } from 'react';
import { Loader2, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Timestamp } from '@/lib/timestamp';
import { usePathname } from 'next/navigation';

const departureDateSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  price: z.coerce.number().positive("Price must be positive."),
  guaranteed: z.boolean(),
});

const formSchema = z.object({
  price: z.coerce.number().positive({ message: "Base price must be positive." }),
  departureDates: z.array(departureDateSchema),
  anyDateAvailable: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PricingFormProps {
  tour: Tour;
}

export function PricingForm({ tour }: PricingFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const pathname = usePathname();

  // Helper function to safely convert dates
  const convertToValidDate = (dateValue: string | Timestamp): Date | null => {
    try {
      const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    } catch {
      return null;
    }
  };

  // Convert departure dates and filter out invalid ones
  const validDepartureDates = (tour.departureDates || [])
    .map(d => {
      const validDate = convertToValidDate(d.date);
      return validDate ? { ...d, date: validDate } : null;
    })
    .filter((d): d is { date: Date; price: number; guaranteed: boolean } => d !== null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: tour.price || 0,
      departureDates: validDepartureDates,
      anyDateAvailable: tour.anyDateAvailable || false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "departureDates",
  });

  const anyDateAvailable = form.watch('anyDateAvailable');

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const convertedValues = {
          ...values,
          departureDates: values.departureDates.map(d => ({
            ...d,
            date: Timestamp.fromDate(d.date)
          }))
        };
        await updateTour(tour.id, convertedValues);
        toast({ title: 'Success', description: 'Pricing updated.' });
      } catch (error: any) {
        logError({ message: `Failed to update pricing for tour ${tour.id}`, stack: error.stack, pathname, context: { tourId: tour.id, values: values } });
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not save pricing. Please try again.',
        });
      }
    });
  };

  return (
    <FormProvider {...form}>
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1500" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="anyDateAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Any Date Available
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Check this if the tour can be booked on any date, regardless of specific departure dates below.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className={cn("space-y-4", anyDateAvailable && "opacity-50 pointer-events-none")}>
                <h3 className="text-lg font-medium">Departure Dates</h3>
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md space-y-4">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={isPending || anyDateAvailable}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`departureDates.${index}.date`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    disabled={isPending || anyDateAvailable}
                                  >
                                    {field.value && !isNaN(new Date(field.value).getTime()) ? (
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
                                  disabled={(date) => date < new Date("1900-01-01")}
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
                        name={`departureDates.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price Override (USD)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} placeholder={`Base: $${tour.price}`} disabled={isPending || anyDateAvailable} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`departureDates.${index}.guaranteed`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isPending || anyDateAvailable}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Guaranteed Departure
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ date: new Date(), price: tour.price, guaranteed: false })}
                  disabled={isPending || anyDateAvailable}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Departure Date
                </Button>
              </div>

              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Pricing
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
