'use server';

import type { LegalContent, LegalDocument } from '@/lib/types';
import {
  deleteLegalDocumentRecord,
  getAllLegalDocuments,
  getLegalContent as getSqliteLegalContent,
  getLegalDocument as getSqliteLegalDocument,
  getLegalDocumentSettings,
  saveLegalContent as saveSqliteLegalContent,
  saveLegalDocument,
  saveLegalDocumentSettings,
} from '@/lib/db/sqlite';

function mapLegalContentId(id: 'privacy-policy' | 'terms-of-service') {
  return id === 'privacy-policy' ? 'privacy' : 'terms';
}

export async function getLegalContent(id: 'privacy-policy' | 'terms-of-service'): Promise<LegalContent | null> {
  const data = getSqliteLegalContent(mapLegalContentId(id));
  if (!data) return null;

  return {
    id,
    content: data.content,
    lastUpdated: data.updatedAt as unknown as LegalContent['lastUpdated'],
  };
}

export async function updateLegalContent(id: 'privacy-policy' | 'terms-of-service', content: string): Promise<void> {
  saveSqliteLegalContent(mapLegalContentId(id), content);
}

export async function getLegalDocuments(): Promise<LegalDocument[]> {
  return getAllLegalDocuments();
}

export async function getLegalDocumentById(id: string): Promise<LegalDocument | null> {
  return getSqliteLegalDocument(id);
}

export async function addLegalDocument(data: Omit<LegalDocument, 'id' | 'createdAt'>): Promise<string> {
  return saveLegalDocument({
    title: data.title,
    description: data.description,
    url: data.url,
    isHidden: data.isHidden,
    orderIndex: data.orderIndex,
  });
}

export async function deleteLegalDocument(id: string): Promise<void> {
  deleteLegalDocumentRecord(id);
}

export async function updateLegalDocument(id: string, data: Partial<Omit<LegalDocument, 'id' | 'createdAt'>>): Promise<void> {
  const existing = getSqliteLegalDocument(id);
  if (!existing) {
    throw new Error('Legal document not found.');
  }

  saveLegalDocument({
    id,
    title: data.title ?? existing.title,
    description: data.description ?? existing.description,
    url: data.url ?? existing.url,
    createdAt: existing.createdAt,
    isHidden: data.isHidden ?? existing.isHidden,
    orderIndex: data.orderIndex ?? existing.orderIndex,
  });
}

export async function getLegalSettings(): Promise<{ requireEmailProtection: boolean }> {
  return getLegalDocumentSettings();
}

export async function updateLegalSettings(settings: { requireEmailProtection: boolean }): Promise<void> {
  saveLegalDocumentSettings(settings);
}

export async function updateLegalDocumentsOrder(updates: { id: string; orderIndex: number }[]): Promise<void> {
  for (const update of updates) {
    const existing = getSqliteLegalDocument(update.id);
    if (!existing) continue;

    saveLegalDocument({
      id: existing.id,
      title: existing.title,
      description: existing.description,
      url: existing.url,
      createdAt: existing.createdAt,
      isHidden: existing.isHidden,
      orderIndex: update.orderIndex,
    });
  }
}
