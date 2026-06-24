'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveFeedback } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Save, Check } from 'lucide-react';
import { Timestamp } from '@/lib/timestamp';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function CreateFeedbackPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Default values
    const priority = 'low';
    const issuedTo: string[] = [];

    const handleCreate = async () => {
        if (!title.trim()) {
            toast({
                title: "Validation Error",
                description: "Title is required",
                variant: "destructive"
            });
            return;
        }

        setSubmitting(true);
        try {
            const feedbackData: any = {
                title,
                description,
                priority,
                status: 'open',
                issuedTo,
            };

            if (deadline) {
                feedbackData.deadline = Timestamp.fromDate(new Date(deadline));
            }

            await saveFeedback(feedbackData);
            toast({
                title: "Success",
                description: "Feedback created successfully",
            });
            router.push('/manage/feedbacks');
        } catch (error) {
            console.error("Failed to create feedback", error);
            toast({
                title: "Error",
                description: "Failed to create feedback",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()} size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Create New Feedback</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Feedback Details</CardTitle>
                    <CardDescription>
                        Create a new task or report an issue for the team.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Fix navigation bug"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the issue or task in detail..."
                            className="min-h-[150px]"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deadline">Deadline (Optional)</Label>
                        <Input
                            id="deadline"
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                        />
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => router.back()} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={submitting || !title.trim()}>
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Create Task
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div >
    );
}
