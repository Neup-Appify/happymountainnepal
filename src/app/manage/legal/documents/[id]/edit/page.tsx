
'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getLegalDocumentById, updateLegalDocument, logFileUpload } from '@/lib/db';
import type { ImageWithCaption, LegalDocument } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Save, Upload as UploadIcon, FileText, Library } from 'lucide-react';
import { MediaLibraryDialog } from '@/components/manage/MediaLibraryDialog';


export default function EditLegalDocumentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [documentData, setDocumentData] = useState<LegalDocument | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [currentFileUrl, setCurrentFileUrl] = useState('');

    // New file upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedExistingUrl, setSelectedExistingUrl] = useState('');
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    const selectedSourceLabel = useMemo(() => {
        if (selectedFile) return selectedFile.name;
        if (selectedExistingUrl) return selectedExistingUrl;
        return '';
    }, [selectedExistingUrl, selectedFile]);

    useEffect(() => {
        async function fetchDocument() {
            try {
                const doc = await getLegalDocumentById(id);
                if (doc) {
                    setDocumentData(doc);
                    setTitle(doc.title);
                    setDescription(doc.description || '');
                    setCurrentFileUrl(doc.url);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Document not found.' });
                    router.push('/manage/legal/documents');
                }
            } catch (error) {
                console.error("Failed to load document", error);
                toast({ variant: "destructive", title: "Error", description: "Could not load legal document." });
            } finally {
                setIsLoading(false);
            }
        }
        fetchDocument();
    }, [id, router, toast]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setSelectedExistingUrl('');
        }
    };

    const handleExistingSelect = (files: ImageWithCaption[]) => {
        const url = files[0]?.url || '';
        setSelectedExistingUrl(url);
        setSelectedFile(null);
        setIsLibraryOpen(false);
    };

    const handleClearReplacement = () => {
        setSelectedFile(null);
        setSelectedExistingUrl('');
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Title is required.' });
            return;
        }

        setIsSaving(true);
        try {
            let fileUrl = currentFileUrl;

            if (selectedExistingUrl) {
                fileUrl = selectedExistingUrl;
            }

            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('platform', 'p3.happymountainnepal');
                formData.append('contentIds', JSON.stringify(['legal-documents', 'admin-user', 'edit']));
                formData.append('name', selectedFile.name.replace(/\.[^/.]+$/, ''));

                const response = await fetch('https://cdn.neupgroup.com/bridge/api/v1/upload', {
                    method: 'POST',
                    body: formData,
                });

                const responseText = await response.text();
                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.status} ${responseText}`);
                }

                const result = JSON.parse(responseText);
                if (result.success && result.url) {
                    fileUrl = result.url;

                    await logFileUpload({
                        name: selectedFile.name,
                        url: fileUrl,
                        uploadedBy: 'admin',
                        type: selectedFile.type,
                        size: selectedFile.size,
                        tags: ['legal-documents', 'document'],
                        meta: []
                    });
                } else {
                    throw new Error(result.message || 'Unknown upload error');
                }
            }

            // Update in database
            await updateLegalDocument(id, {
                title: title.trim(),
                description: description.trim(),
                url: fileUrl,
            });

            toast({ title: 'Success', description: 'Document updated successfully.' });
            router.push('/manage/legal/documents');
            router.refresh();

        } catch (error: any) {
            console.error('Update error:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update document.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <Button asChild variant="ghost" className="pl-0 mb-4">
                    <Link href="/manage/legal/documents">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Documents
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold !font-headline">Edit Document</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Document Details</CardTitle>
                    <CardDescription>Update the title, description, or replace the file.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Document Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Company Registration"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description for the document"
                            disabled={isSaving}
                            rows={4}
                        />
                    </div>

                    {/* Current File Info */}
                    <div className="space-y-2">
                        <Label>Current File</Label>
                        <div className="flex items-center p-3 border rounded-md bg-muted/50">
                            <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                            <a
                                href={currentFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline truncate flex-1"
                            >
                                {currentFileUrl}
                            </a>
                        </div>
                    </div>

                    {/* Replace File */}
                    <div className="space-y-2 pt-2 border-t">
                        <Label className="text-base font-semibold">Replace File (Optional)</Label>
                        <div
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors mt-2"
                            onClick={() => document.getElementById('edit-file-input')?.click()}
                        >
                            <input
                                id="edit-file-input"
                                type="file"
                                className="hidden"
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                disabled={isSaving}
                            />
                            {selectedSourceLabel ? (
                                <div className="space-y-1">
                                    <FileText className="h-8 w-8 mx-auto text-green-500" />
                                    <p className="text-sm font-medium break-all">{selectedSourceLabel}</p>
                                    {selectedFile && (
                                        <p className="text-xs text-muted-foreground">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB - Ready to upload
                                        </p>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearReplacement();
                                    }} className="mt-2 text-destructive">
                                        Remove Selection
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <UploadIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        Click to upload a new version
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Leave empty to keep generic file
                                    </p>
                                </div>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsLibraryOpen(true)}
                            disabled={isSaving}
                        >
                            <Library className="h-4 w-4 mr-2" />
                            Select From Uploaded Files
                        </Button>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" asChild disabled={isSaving}>
                            <Link href="/manage/legal/documents">Cancel</Link>
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <MediaLibraryDialog
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                onSelect={handleExistingSelect}
                initialSelectedUrls={selectedExistingUrl ? [selectedExistingUrl] : []}
                defaultTags={['legal-documents', 'document']}
            />
        </div>
    );
}
