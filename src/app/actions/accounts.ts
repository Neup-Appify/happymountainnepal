'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import type { Account } from '@/lib/types';
import { clearUnrealAccounts, getAccountByEmail, getAccountById, saveAccount } from '@/lib/db/accounts';

const ACCOUNT_COOKIE = 'account_id';

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function setAccountCookie(accountId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACCOUNT_COOKIE, accountId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getAccountAction(id: string): Promise<Account | null> {
  return getAccountById(id);
}

export async function getCurrentAccountAction(): Promise<Account | null> {
  const cookieStore = await cookies();
  const accountId = cookieStore.get(ACCOUNT_COOKIE)?.value;
  return accountId ? getAccountById(accountId) : null;
}

export async function registerAccountAction(data: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const existing = await getAccountByEmail(data.email);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const id = randomUUID();
  await saveAccount({
    id,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone || '',
    passwordHash: hashPassword(data.password),
  } as Omit<Account, 'createdAt'> & { passwordHash: string });
  await setAccountCookie(id);
  return id;
}

export async function loginAccountAction(email: string, password: string) {
  const account = await getAccountByEmail(email);
  if (!account || !verifyPassword(password, account.passwordHash)) {
    throw new Error('Invalid email or password.');
  }
  await setAccountCookie(account.id);
  return account.id;
}

export async function logoutAccountAction() {
  const cookieStore = await cookies();
  cookieStore.set(ACCOUNT_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function saveAccountAction(data: Omit<Account, 'createdAt'> & { createdAt?: string }) {
  await saveAccount(data);
}

export async function clearUnrealAccountsAction() {
  const result = await clearUnrealAccounts();
  revalidatePath('/manage/interactions');
  return result;
}
