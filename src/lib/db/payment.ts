'use server';

import type { PaymentSettings } from '@/lib/types';
import { db } from './sqlite';

const PAYMENT_SETTINGS_DOC_ID = 'wire-transfer-settings';

function defaultSettings(): PaymentSettings {
    return {
        id: PAYMENT_SETTINGS_DOC_ID,
        bankName: '',
        accountName: '',
        accountNumber: '',
        swiftCode: '',
        iban: '',
        bankAddress: '',
        additionalInstructions: '',
        updatedAt: new Date().toISOString(),
    };
}

export async function getPaymentSettings(): Promise<PaymentSettings | null> {
    return (db.prepare('SELECT * FROM paymentSettings WHERE id = ?').get(PAYMENT_SETTINGS_DOC_ID) as PaymentSettings | undefined) || defaultSettings();
}

export async function updatePaymentSettings(
    settings: Omit<PaymentSettings, 'id' | 'updatedAt'>
): Promise<void> {
    db.prepare(`
        INSERT INTO paymentSettings (
            id, bankName, accountName, accountNumber, swiftCode, iban,
            bankAddress, additionalInstructions, updatedAt
        ) VALUES (
            @id, @bankName, @accountName, @accountNumber, @swiftCode, @iban,
            @bankAddress, @additionalInstructions, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
            bankName = excluded.bankName,
            accountName = excluded.accountName,
            accountNumber = excluded.accountNumber,
            swiftCode = excluded.swiftCode,
            iban = excluded.iban,
            bankAddress = excluded.bankAddress,
            additionalInstructions = excluded.additionalInstructions,
            updatedAt = excluded.updatedAt
    `).run({
        id: PAYMENT_SETTINGS_DOC_ID,
        ...settings,
        swiftCode: settings.swiftCode || '',
        iban: settings.iban || '',
        bankAddress: settings.bankAddress || '',
        additionalInstructions: settings.additionalInstructions || '',
        updatedAt: new Date().toISOString(),
    });
}
