
import { getTourById, getAllBlogPosts } from '@/lib/db';
import { notFound } from 'next/navigation';
import EditGuideClient from '@/components/manage/EditGuideClient';
import { Timestamp } from '@/lib/timestamp';

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function ManagePackageGuidePage({ params }: PageProps) {
    const { id } = await params;
    const tour = await getTourById(id);
    const globalBlogs = await getAllBlogPosts();

    if (!tour) {
        notFound();
    }

    // Normalize blog dates for client serialization (Global blogs still have dates)
    const serializedBlogs = globalBlogs.map(b => ({
        ...b,
        date: b.date instanceof Timestamp ? b.date.toDate().toISOString() : b.date
    }));

    return (
        <EditGuideClient tour={tour} globalBlogs={serializedBlogs} />
    );
}
