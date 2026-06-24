
'use client';

import { useForm, FormProvider } from 'react-hook-form';
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
import { type BlogPost } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { useEffect, useState, useTransition } from 'react';
import { CheckCircle, Loader2, RefreshCw, Trash2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MediaPicker } from '../MediaPicker';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { DeleteBlogPostDialog } from '../DeleteBlogPostDialog';
import { useDebounce } from '@/hooks/use-debounce';

// ... schema definition remains same ...

const slugSchema = z.string().min(5, "Slug must be at least 5 characters.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens.")
  .or(z.literal(''));

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  slug: slugSchema, // Allow empty slug for drafts
  content: z.string().optional(),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  authorPhoto: z.string().optional(),
  image: z.string().optional(),
  tags: z.string().optional(),
  metaInformation: z.string().optional(),
  status: z.enum(['draft', 'published']),
}).superRefine((data, ctx) => {
  if (data.status === 'published') {
    if (!data.slug) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Slug is required for publishing.", path: ['slug'] });
    if (!data.content || data.content.length < 20) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Content must be at least 20 characters.", path: ['content'] });
    if (!data.excerpt || data.excerpt.length < 10) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Excerpt must be between 10 and 200 characters.", path: ['excerpt'] });
    if (!data.author || data.author.length < 2) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Author name is required.", path: ['author'] });
    if (!data.authorPhoto) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Author photo is required.", path: ['authorPhoto'] });
    if (!data.image) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Featured image is required.", path: ['image'] });
  }
});

type FormValues = z.infer<typeof formSchema>;

interface BlogPostFormProps {
  post: BlogPost;
}

export function BlogPostForm({ post }: BlogPostFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      title: post.title || '',
      slug: post.slug || '',
      content: post.content || '',
      excerpt: post.excerpt || '',
      author: post.author || 'Admin',
      authorPhoto: post.authorPhoto || '',
      image: post.image || '',
      tags: post.tags?.join(', ') || '',
      metaInformation: post.metaInformation || '',
      status: post.status as 'draft' | 'published' || 'draft', // Type cast for safety
    },
  });

  const currentSlug = form.watch('slug');
  const debouncedSlug = useDebounce(currentSlug, 500);
  const [isSlugChecking, setIsSlugChecking] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const trimmedSlug = debouncedSlug.trim();

    if (!trimmedSlug) {
      setIsSlugAvailable(null);
      setIsSlugChecking(false);
      form.clearErrors('slug');
      return;
    }

    const schemaResult = slugSchema.safeParse(trimmedSlug);
    if (!schemaResult.success) {
      setIsSlugAvailable(null);
      setIsSlugChecking(false);
      return;
    }

    let isCancelled = false;

    const checkSlugAvailability = async () => {
      setIsSlugChecking(true);
      try {
        const params = new URLSearchParams({ slug: trimmedSlug });
        if (post.id) {
          params.set('excludeId', post.id);
        }

        const response = await fetch(`/api/blog?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Could not check slug availability.');
        }

        const data = await response.json();
        if (isCancelled) return;

        setIsSlugAvailable(Boolean(data.available));
        if (data.available) {
          if (form.formState.errors.slug?.type === 'manual') {
            form.clearErrors('slug');
          }
        } else {
          form.setError('slug', { type: 'manual', message: 'This slug is already taken.' });
        }
      } catch {
        if (isCancelled) return;
        setIsSlugAvailable(null);
        form.setError('slug', { type: 'manual', message: 'Could not check slug availability.' });
      } finally {
        if (!isCancelled) {
          setIsSlugChecking(false);
        }
      }
    };

    checkSlugAvailability();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSlug, form, post.id]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const isNewPost = !post.id;
        const url = isNewPost ? '/api/blog' : `/api/blog/${post.id}`;
        const method = isNewPost ? 'POST' : 'PUT';

        // Prepare data
        const postData = {
          ...values,
          content: values.content || '',
          excerpt: values.excerpt || '',
          author: values.author || '',
          authorPhoto: values.authorPhoto || '',
          image: values.image || '',
          metaInformation: values.metaInformation || '',
          // Assuming basic tag splitting
          tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
          // Regenerate search keywords
          searchKeywords: [
            ...values.title.toLowerCase().split(' '),
            ...(values.author || '').toLowerCase().split(' ')
          ].filter(Boolean)
        };

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 409) {
            form.setError('slug', { type: 'manual', message: 'This slug is already taken.' });
            return;
          }
          throw new Error(errorData.error || 'Failed to save post');
        }

        toast({
          title: 'Success',
          description: isNewPost ? 'Blog post created successfully.' : 'Blog post updated successfully.'
        });

        // Redirect based on status
        if (values.status === 'draft') {
          router.push('/manage/blog/drafts');
        } else {
          router.push('/manage/blog');
        }
        router.refresh();

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Could not save post. Please try again.',
        });
      }
    });
  };

  const handleSaveDraft = () => {
    form.setValue('status', 'draft');
    form.handleSubmit(onSubmit)();
  };

  return (
    <FormProvider {...form}>
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Your amazing blog post title" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (URL)</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            placeholder="post-url-slug"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const nextSlug = slugify(e.target.value);
                              if (form.formState.errors.slug?.type === 'manual') {
                                form.clearErrors('slug');
                              }
                              field.onChange(nextSlug);
                              setIsSlugAvailable(null);
                              setIsSlugChecking(Boolean(nextSlug));
                            }}
                            disabled={isPending}
                            className="pr-10"
                          />
                          {!isPending && field.value && (
                            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                              {isSlugChecking ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              ) : isSlugAvailable === true ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : isSlugAvailable === false ? (
                                <XCircle className="h-4 w-4 text-destructive" />
                              ) : null}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const title = form.getValues('title');
                            if (title) {
                              form.setValue('slug', slugify(title), { shouldValidate: true, shouldDirty: true });
                              setIsSlugAvailable(null);
                            }
                          }}
                          disabled={isPending}
                          title="Generate from Title"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      https://happymountainnepal.com/blog/{field.value}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="trekking, everest, guide" {...field as any} disabled={isPending} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of tags.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content (HTML)</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Start writing your amazing blog post here..."
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <MediaPicker name="image" label="Featured Image" tags={['blog']} />

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A short summary of the post..."
                        {...field}
                        rows={3}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <MediaPicker name="authorPhoto" label="Author Photo" tags={['author']} />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metaInformation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Information / Keywords</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., trekking, nepal, everest" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="secondary" disabled={isPending} onClick={handleSaveDraft}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save as Draft
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {post.id ? 'Save & Publish' : 'Publish Post'}
                  </Button>
                </div>

                {post.id && (
                  <DeleteBlogPostDialog post={post}>
                    <Button type="button" variant="destructive" disabled={isPending}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                    </Button>
                  </DeleteBlogPostDialog>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
