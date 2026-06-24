import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Tour, ManagedReview, OnSiteReview, OffSiteReview, BlogPost } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'base', 'sources');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dataDir, 'local.sqlite');

// Singleton pattern to prevent multiple connections during development hot-reloading
const globalForDb = global as unknown as { db: Database.Database };

export const db = globalForDb.db || new Database(dbPath);

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS partners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT NOT NULL,
      description TEXT NOT NULL,
      link TEXT
    );

    CREATE TABLE IF NOT EXISTS profile (
      id TEXT PRIMARY KEY,
      basePath TEXT,
      reviewCount INTEGER,
      contactEmail TEXT,
      phone TEXT,
      address TEXT,
      heroTitle TEXT,
      heroDescription TEXT,
      footerTagline TEXT,
      location TEXT,
      locationUrl TEXT,
      heroImage TEXT,
      heroImages TEXT,
      heroTransitionInterval INTEGER,
      socials TEXT,
      whyUs TEXT,
      chatbot TEXT
    );
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      image TEXT,
      isFeatured INTEGER DEFAULT 0,
      parentId TEXT,
      createdAt TEXT,
      FOREIGN KEY (parentId) REFERENCES locations(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT,
      content TEXT,
      author TEXT,
      authorPhoto TEXT,
      image TEXT,
      tags TEXT, -- JSON array
      metaInformation TEXT,
      status TEXT, -- 'draft' | 'published'
      searchKeywords TEXT, -- JSON array
      createdAt TEXT -- ISO string
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      uploadedBy TEXT,
      type TEXT,
      size INTEGER,
      tags TEXT, -- JSON array
      meta TEXT, -- JSON array
      uploadedOn TEXT,
      uploadedAt TEXT,
      createdAt TEXT
    );



    DELETE FROM uploads WHERE rowid NOT IN (
      SELECT MIN(rowid) FROM uploads GROUP BY url
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_uploads_url ON uploads(url);

    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      shortDescription TEXT,
      region TEXT, -- JSON array of strings
      type TEXT, -- 'Trekking', 'Tour', 'Climbing', 'Jungle Safari'
      difficulty TEXT, -- 'Easy', 'Moderate', 'Strenuous', 'Challenging'
      duration INTEGER,
      price REAL,
      mainImage TEXT, -- JSON object {url, caption, posted_by, story}
      images TEXT, -- JSON array of image objects
      itinerary TEXT, -- JSON array of itinerary objects
      inclusions TEXT, -- JSON array of strings
      exclusions TEXT, -- JSON array of strings
      departureDates TEXT, -- JSON array of date objects
      anyDateAvailable INTEGER DEFAULT 0,
      map TEXT,
      reviews TEXT, -- JSON array of review objects
      status TEXT DEFAULT 'draft', -- 'draft' | 'published' | 'unpublished' | 'hidden'
      faq TEXT, -- JSON array of faq objects
      additionalInfoSections TEXT, -- JSON array
      bookingType TEXT DEFAULT 'internal',
      externalBookingUrl TEXT,
      gears TEXT, -- JSON array
      guides TEXT, -- JSON array
      searchKeywords TEXT, -- JSON array
      createdAt TEXT,
      updatedAt TEXT,
      isPopular INTEGER DEFAULT 0,
      isFeatured INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);
    CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
    CREATE INDEX IF NOT EXISTS idx_packages_type ON packages(type);
    CREATE INDEX IF NOT EXISTS idx_packages_difficulty ON packages(difficulty);

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      type TEXT,
      rating INTEGER NOT NULL,
      author TEXT NOT NULL,
      userRole TEXT,
      comment TEXT NOT NULL,
      date TEXT NOT NULL, -- ISO string
      status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
      source TEXT DEFAULT 'website', -- 'website' | 'tripadvisor' | 'google'
      packageId TEXT, -- Optional, link to a specific package
      userId TEXT,
      originalReviewUrl TEXT,
      reviewMedia TEXT,
      createdAt TEXT,
      FOREIGN KEY (packageId) REFERENCES packages(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      ipAddress TEXT,
      passwordHash TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      activityName TEXT NOT NULL,
      activityInfo TEXT,
      fromIp TEXT,
      fromLocation TEXT,
      activityTime TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS errors (
      id TEXT PRIMARY KEY,
      message TEXT NOT NULL,
      stack TEXT,
      componentStack TEXT,
      pathname TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      context TEXT
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      deadline TEXT,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'medium',
      issuedTo TEXT,
      entries TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gears (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT,
      provided INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS redirects (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      permanent INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS paymentSettings (
      id TEXT PRIMARY KEY,
      bankName TEXT NOT NULL,
      accountName TEXT NOT NULL,
      accountNumber TEXT NOT NULL,
      swiftCode TEXT,
      iban TEXT,
      bankAddress TEXT,
      additionalInstructions TEXT,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS legal (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS legalDocuments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      isHidden INTEGER DEFAULT 0,
      orderIndex INTEGER
    );

    CREATE TABLE IF NOT EXISTS legalDocumentSettings (
      id TEXT PRIMARY KEY,
      requireEmailProtection INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS teamGroups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      orderIndex INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS teamMembers (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      bio TEXT NOT NULL,
      image TEXT NOT NULL,
      groupId TEXT,
      orderIndex INTEGER,
      shortDescription TEXT,
      story TEXT,
      gallery TEXT,
      socials TEXT,
      FOREIGN KEY (groupId) REFERENCES teamGroups(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_team_members_group_order ON teamMembers(groupId, orderIndex);

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      page TEXT,
      temporary_id TEXT,
      conversation TEXT,
      data TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_inquiries_createdAt ON inquiries(createdAt DESC);

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      accountId TEXT,
      cookieId TEXT,
      pageAccessed TEXT NOT NULL,
      resourceType TEXT NOT NULL,
      method TEXT,
      statusCode INTEGER,
      referrer TEXT,
      userAgent TEXT NOT NULL,
      ipAddress TEXT,
      countryCode TEXT,
      timestamp TEXT NOT NULL,
      isBot INTEGER DEFAULT 0,
      agentCategory TEXT,
      referrerSource TEXT,
      metadata TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_cookieId ON logs(cookieId);
  `);

  // Migration for adding parentId to existing table if needed
  try {
    const tableInfo = db.prepare("PRAGMA table_info(locations)").all() as any[];
    const hasParentId = tableInfo.some(col => col.name === 'parentId');
    if (!hasParentId) {
      db.prepare("ALTER TABLE locations ADD COLUMN parentId TEXT").run();
      // SQLite doesn't support adding FK constraints in ALTER TABLE easily, so we skip the constraint for existing tables or rely on app logic
    }
  } catch (error) {
    console.error("Migration error (parentId):", error);
  }

  // Migration for adding isPopular and isFeatured to packages table if needed
  try {
    const tableInfo = db.prepare("PRAGMA table_info(packages)").all() as any[];
    const hasIsPopular = tableInfo.some(col => col.name === 'isPopular');
    const hasIsFeatured = tableInfo.some(col => col.name === 'isFeatured');
    
    if (!hasIsPopular) {
      db.prepare("ALTER TABLE packages ADD COLUMN isPopular INTEGER DEFAULT 0").run();
    }
    if (!hasIsFeatured) {
      db.prepare("ALTER TABLE packages ADD COLUMN isFeatured INTEGER DEFAULT 0").run();
    }
  } catch (error) {
    console.error("Migration error (packages columns):", error);
  }

  // Migration for teamMembers optional profile fields if needed
  try {
    const tableInfo = db.prepare("PRAGMA table_info(teamMembers)").all() as any[];
    const hasShortDescription = tableInfo.some(col => col.name === 'shortDescription');
    const hasStory = tableInfo.some(col => col.name === 'story');
    const hasGallery = tableInfo.some(col => col.name === 'gallery');
    const hasSocials = tableInfo.some(col => col.name === 'socials');

    if (!hasShortDescription) {
      db.prepare("ALTER TABLE teamMembers ADD COLUMN shortDescription TEXT").run();
    }
    if (!hasStory) {
      db.prepare("ALTER TABLE teamMembers ADD COLUMN story TEXT").run();
    }
    if (!hasGallery) {
      db.prepare("ALTER TABLE teamMembers ADD COLUMN gallery TEXT").run();
    }
    if (!hasSocials) {
      db.prepare("ALTER TABLE teamMembers ADD COLUMN socials TEXT").run();
    }
  } catch (error) {
    console.error("Migration error (teamMembers profile columns):", error);
  }

  try {
    const tableInfo = db.prepare("PRAGMA table_info(legalDocuments)").all() as any[];
    const hasIsHidden = tableInfo.some(col => col.name === 'isHidden');
    const hasOrderIndex = tableInfo.some(col => col.name === 'orderIndex');

    if (!hasIsHidden) {
      db.prepare("ALTER TABLE legalDocuments ADD COLUMN isHidden INTEGER DEFAULT 0").run();
    }
    if (!hasOrderIndex) {
      db.prepare("ALTER TABLE legalDocuments ADD COLUMN orderIndex INTEGER").run();
    }
  } catch (error) {
    console.error("Migration error (legalDocuments columns):", error);
  }

  try {
    const tableInfo = db.prepare("PRAGMA table_info(reviews)").all() as any[];
    const columns = new Set(tableInfo.map(col => col.name));
    const reviewColumns: Array<[string, string]> = [
      ['type', 'TEXT'],
      ['userRole', 'TEXT'],
      ['userId', 'TEXT'],
      ['originalReviewUrl', 'TEXT'],
      ['reviewMedia', 'TEXT'],
    ];

    for (const [name, definition] of reviewColumns) {
      if (!columns.has(name)) {
        db.prepare(`ALTER TABLE reviews ADD COLUMN ${name} ${definition}`).run();
      }
    }
  } catch (error) {
    console.error("Migration error (review columns):", error);
  }

  try {
    const tableInfo = db.prepare("PRAGMA table_info(logs)").all() as any[];
    const hasAccountId = tableInfo.some(col => col.name === 'accountId');
    const hasCountryCode = tableInfo.some(col => col.name === 'countryCode');
    const hasAgentCategory = tableInfo.some(col => col.name === 'agentCategory');
    const hasReferrerSource = tableInfo.some(col => col.name === 'referrerSource');
    if (!hasAccountId) {
      db.prepare("ALTER TABLE logs ADD COLUMN accountId TEXT").run();
    }
    if (!hasCountryCode) {
      db.prepare("ALTER TABLE logs ADD COLUMN countryCode TEXT").run();
    }
    if (!hasAgentCategory) {
      db.prepare("ALTER TABLE logs ADD COLUMN agentCategory TEXT").run();
    }
    if (!hasReferrerSource) {
      db.prepare("ALTER TABLE logs ADD COLUMN referrerSource TEXT").run();
    }
  } catch (error) {
    console.error("Migration error (logs columns):", error);
  }

  try {
    const tableInfo = db.prepare("PRAGMA table_info(accounts)").all() as any[];
    const hasPasswordHash = tableInfo.some(col => col.name === 'passwordHash');
    if (!hasPasswordHash) {
      db.prepare("ALTER TABLE accounts ADD COLUMN passwordHash TEXT").run();
    }
  } catch (error) {
    console.error("Migration error (accounts columns):", error);
  }

  db.prepare(`
    INSERT OR IGNORE INTO legalDocumentSettings (id, requireEmailProtection)
    VALUES ('legal', 1)
  `).run();
}

// Initialize tables
initDb();

// --- Location Helpers ---

export interface LocationDB {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isFeatured: number; // SQLite stores booleans as 0/1
  parentId: string | null;
  createdAt: string;
  parentName?: string; // Derived
}

export function getLocations(options?: { featured?: boolean }) {
  let query = `
    SELECT l.*, p.name as parentName 
    FROM locations l
    LEFT JOIN locations p ON l.parentId = p.id
  `;
  const params: any[] = [];
  const conditions: string[] = [];

  if (options?.featured) {
    conditions.push('l.isFeatured = 1');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY l.createdAt DESC';

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as LocationDB[];

  return rows.map(row => ({
    ...row,
    isFeatured: Boolean(row.isFeatured),
    parentId: row.parentId || null
  }));
}

export function getLocationById(id: string) {
  const row = db.prepare(`
    SELECT l.*, p.name as parentName 
    FROM locations l
    LEFT JOIN locations p ON l.parentId = p.id
    WHERE l.id = ?
  `).get(id) as LocationDB | undefined;

  if (!row) return null;
  return {
    ...row,
    isFeatured: Boolean(row.isFeatured),
    parentId: row.parentId || null
  };
}

export function getLocationBySlug(slug: string) {
  const row = db.prepare(`
    SELECT l.*, p.name as parentName 
    FROM locations l
    LEFT JOIN locations p ON l.parentId = p.id
    WHERE l.slug = ?
  `).get(slug) as LocationDB | undefined;

  if (!row) return null;
  return {
    ...row,
    isFeatured: Boolean(row.isFeatured),
    parentId: row.parentId || null
  };
}

export function saveLocation(location: Omit<LocationDB, 'createdAt' | 'parentName'> & { createdAt?: string }) {
  const existing = db.prepare('SELECT id FROM locations WHERE id = ?').get(location.id);
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(`
      UPDATE locations 
      SET name = @name, slug = @slug, description = @description, image = @image, isFeatured = @isFeatured, parentId = @parentId
      WHERE id = @id
    `).run({
      ...location,
      isFeatured: location.isFeatured ? 1 : 0,
      parentId: location.parentId || null
    });
  } else {
    db.prepare(`
      INSERT INTO locations (id, name, slug, description, image, isFeatured, parentId, createdAt)
      VALUES (@id, @name, @slug, @description, @image, @isFeatured, @parentId, @createdAt)
    `).run({
      ...location,
      isFeatured: location.isFeatured ? 1 : 0,
      parentId: location.parentId || null,
      createdAt: location.createdAt || now
    });
  }
  return location.id;
}

export function deleteLocation(id: string) {
  db.prepare('DELETE FROM locations WHERE id = ?').run(id);
}

export function getChildLocations(parentId: string) {
  const rows = db.prepare('SELECT * FROM locations WHERE parentId = ?').all(parentId) as LocationDB[];
  return rows.map(row => ({
    ...row,
    isFeatured: Boolean(row.isFeatured),
    parentId: row.parentId || null
  }));
}

// --- Blog Post Helpers ---

export interface PostDB {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorPhoto: string;
  createdAt: string; // ISO string
  image: string;
  tags: string; // JSON string array
  metaInformation: string;
  status: string; // 'draft' | 'published'
  searchKeywords: string; // JSON string array
}

export function getPosts(options?: {
  limit?: number;
  page?: number;
  status?: string;
  search?: string;
  tags?: string[];
}) {
  const limit = options?.limit || 10;
  const page = options?.page || 1;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM posts';
  const conditions: string[] = [];
  const params: any[] = [];

  if (options?.status) {
    conditions.push('status = ?');
    params.push(options.status);
  }

  if (options?.search) {
    conditions.push('(title LIKE ? OR content LIKE ? OR searchKeywords LIKE ?)');
    const term = `%${options.search}%`;
    params.push(term, term, term);
  }

  if (options?.tags && options.tags.length > 0) {
    const tagConditions = options.tags.map(() => 'tags LIKE ?');
    conditions.push(`(${tagConditions.join(' OR ')})`);
    options.tags.forEach(tag => params.push(`%${tag}%`));
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params) as PostDB[];

  // Get total count
  let countQuery = 'SELECT COUNT(*) as count FROM posts';
  const countParams = params.slice(0, params.length - 2);

  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }

  const totalCount = (db.prepare(countQuery).get(...countParams) as { count: number }).count;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    posts: rows.map(row => ({
      ...row,
      date: row.createdAt, // Map for compatibility
      tags: JSON.parse(row.tags || '[]'),
      searchKeywords: JSON.parse(row.searchKeywords || '[]'),
      status: row.status as 'draft' | 'published'
    }) as BlogPost),
    totalCount,
    totalPages,
    hasMore: page < totalPages
  };
}

export function getPostById(id: string): BlogPost | null {
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as PostDB | undefined;
  if (!row) return null;
  return {
    ...row,
    date: row.createdAt,
    tags: JSON.parse(row.tags || '[]'),
    searchKeywords: JSON.parse(row.searchKeywords || '[]'),
    status: row.status as 'draft' | 'published'
  } as BlogPost;
}

export function getPostBySlug(slug: string): BlogPost | null {
  const row = db.prepare('SELECT * FROM posts WHERE slug = ?').get(slug) as PostDB | undefined;
  if (!row) return null;
  return {
    ...row,
    date: row.createdAt,
    tags: JSON.parse(row.tags || '[]'),
    searchKeywords: JSON.parse(row.searchKeywords || '[]'),
    status: row.status as 'draft' | 'published'
  } as BlogPost;
}

export function getAllPosts(status?: string): BlogPost[] {
  let query = 'SELECT * FROM posts';
  const params: any[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY createdAt DESC';

  const rows = db.prepare(query).all(...params) as PostDB[];

  return rows.map(row => ({
    ...row,
    date: row.createdAt,
    tags: JSON.parse(row.tags || '[]'),
    searchKeywords: JSON.parse(row.searchKeywords || '[]'),
    status: row.status as 'draft' | 'published'
  }) as BlogPost);
}

export function savePost(post: Omit<PostDB, 'tags' | 'searchKeywords'> & { tags: string[], searchKeywords: string[] }) {
  const existing = db.prepare('SELECT id FROM posts WHERE id = ?').get(post.id);

  // Convert arrays to JSON strings
  const serializedPost = {
    ...post,
    tags: JSON.stringify(post.tags),
    searchKeywords: JSON.stringify(post.searchKeywords)
  };

  if (existing) {
    db.prepare(`
            UPDATE posts 
            SET slug = @slug, title = @title, excerpt = @excerpt, content = @content, 
                author = @author, authorPhoto = @authorPhoto, image = @image, 
                tags = @tags, metaInformation = @metaInformation, status = @status, 
                searchKeywords = @searchKeywords
            WHERE id = @id
        `).run(serializedPost);
  } else {
    db.prepare(`
            INSERT INTO posts (id, slug, title, excerpt, content, author, authorPhoto, createdAt, image, tags, metaInformation, status, searchKeywords)
            VALUES (@id, @slug, @title, @excerpt, @content, @author, @authorPhoto, @createdAt, @image, @tags, @metaInformation, @status, @searchKeywords)
        `).run(serializedPost);
  }
  return post.id;
}

export function deletePost(id: string) {
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
}

export function checkPostSlugAvailability(slug: string, excludeId?: string): boolean {
  if (excludeId) {
    const row = db.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').get(slug, excludeId);
    return !row;
  }
  const row = db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug);
  return !row;
}

// --- Upload Helpers ---

export interface UploadDB {
  id: string;
  name: string;
  url: string;
  uploadedBy: string;
  type: string;
  size: number;
  tags: string; // JSON string
  meta: string; // JSON string
  uploadedOn: string;
  uploadedAt: string;
  createdAt: string;
}

export function saveUpload(upload: Omit<UploadDB, 'tags' | 'meta'> & { tags: string[], meta: any[] }) {
  // Check collision on URL
  const existingUrl = db.prepare('SELECT id FROM uploads WHERE url = ?').get(upload.url) as { id: string } | undefined;

  if (existingUrl) {
    if (existingUrl.id !== upload.id) {
      // URL exists on DIFFERENT ID.
      // If we are trying to insert new (upload.id not in DB), then we should deduplicate and return existing ID.
      const selfExists = db.prepare('SELECT id FROM uploads WHERE id = ?').get(upload.id);
      if (selfExists) {
        // This is an UPDATE to an existing record, changing its URL to a duplicate one.
        throw new Error('Cannot update upload: URL already exists.');
      } else {
        // This is an INSERT of a new record with a duplicate URL.
        // Return the EXISTING ID and skip insert.
        return existingUrl.id;
      }
    }
  }

  const existing = db.prepare('SELECT id FROM uploads WHERE id = ?').get(upload.id);

  const serializedUpload = {
    ...upload,
    tags: JSON.stringify(upload.tags),
    meta: JSON.stringify(upload.meta)
  };

  if (existing) {
    db.prepare(`
      UPDATE uploads 
      SET name = @name, url = @url, uploadedBy = @uploadedBy, type = @type, 
          size = @size, tags = @tags, meta = @meta, uploadedOn = @uploadedOn, 
          uploadedAt = @uploadedAt, createdAt = @createdAt
      WHERE id = @id
    `).run(serializedUpload);
  } else {
    db.prepare(`
      INSERT INTO uploads (id, name, url, uploadedBy, type, size, tags, meta, uploadedOn, uploadedAt, createdAt)
      VALUES (@id, @name, @url, @uploadedBy, @type, @size, @tags, @meta, @uploadedOn, @uploadedAt, @createdAt)
    `).run(serializedUpload);
  }
  return upload.id;
}

export function getUploads(options?: {
  limit?: number;
  page?: number;
  tags?: string[];
  search?: string;
}) {
  const limit = options?.limit || 10;
  const page = options?.page || 1;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM uploads';
  const conditions: string[] = [];
  const params: any[] = [];

  if (options?.search) {
    conditions.push('name LIKE ?');
    params.push(`%${options.search}%`);
  }

  if (options?.tags && options.tags.length > 0) {
    const tagConditions = options.tags.map(() => 'tags LIKE ?');
    conditions.push(`(${tagConditions.join(' OR ')})`);
    options.tags.forEach(tag => params.push(`%${tag}%`));
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY uploadedAt DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params) as UploadDB[];

  // Get total count
  let countQuery = 'SELECT COUNT(*) as count FROM uploads';
  const countParams = params.slice(0, params.length - 2);

  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }

  const totalCount = (db.prepare(countQuery).get(...countParams) as { count: number }).count;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    uploads: rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      meta: JSON.parse(row.meta || '[]'),
      size: row.size || 0
    })),
    totalCount,
    totalPages,
    hasMore: page < totalPages
  };
}

export function getUploadById(id: string) {
  const row = db.prepare('SELECT * FROM uploads WHERE id = ?').get(id) as UploadDB | undefined;
  if (!row) return null;
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    meta: JSON.parse(row.meta || '[]'),
    size: row.size || 0
  };
}

export function deleteUpload(id: string) {
  db.prepare('DELETE FROM uploads WHERE id = ?').run(id);
}

export function getUploadByUrl(url: string) {
  const row = db.prepare('SELECT * FROM uploads WHERE url = ?').get(url) as UploadDB | undefined;
  if (!row) return null;
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    meta: JSON.parse(row.meta || '[]'),
    size: row.size || 0
  };
}

// --- Package Helpers ---

export interface PackageDB {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  region: string; // JSON string
  type: string;
  difficulty: string;
  duration: number;
  price: number;
  mainImage: string; // JSON string
  images: string; // JSON string
  itinerary: string; // JSON string
  inclusions: string; // JSON string
  exclusions: string; // JSON string
  departureDates: string; // JSON string
  anyDateAvailable: number;
  map: string;
  reviews: string; // JSON string
  status: string;
  faq: string; // JSON string
  additionalInfoSections: string; // JSON string
  bookingType: string;
  externalBookingUrl: string;
  gears: string; // JSON string
  guides: string; // JSON string
  searchKeywords: string; // JSON string
  createdAt: string;
  updatedAt: string;
  isPopular: number;
  isFeatured: number;
}

export function savePackage(pkg: any) {
  const existing = db.prepare('SELECT id FROM packages WHERE id = ?').get(pkg.id);
  const now = new Date().toISOString();

  const serializedPackage = {
    id: pkg.id,
    name: pkg.name,
    slug: pkg.slug,
    description: pkg.description || '',
    shortDescription: pkg.shortDescription || '',
    region: JSON.stringify(pkg.region || []),
    type: pkg.type || 'Trekking',
    difficulty: pkg.difficulty || 'Moderate',
    duration: pkg.duration || 0,
    price: pkg.price || 0,
    mainImage: JSON.stringify(pkg.mainImage || { url: '' }),
    images: JSON.stringify(pkg.images || []),
    itinerary: JSON.stringify(pkg.itinerary || []),
    inclusions: JSON.stringify(pkg.inclusions || []),
    exclusions: JSON.stringify(pkg.exclusions || []),
    departureDates: JSON.stringify(pkg.departureDates || []),
    anyDateAvailable: pkg.anyDateAvailable ? 1 : 0,
    map: pkg.map || '',
    reviews: JSON.stringify(pkg.reviews || []),
    status: pkg.status || 'draft',
    faq: JSON.stringify(pkg.faq || []),
    additionalInfoSections: JSON.stringify(pkg.additionalInfoSections || []),
    bookingType: pkg.bookingType || 'internal',
    externalBookingUrl: pkg.externalBookingUrl || '',
    gears: JSON.stringify(pkg.gears || []),
    guides: JSON.stringify(pkg.guides || []),
    searchKeywords: JSON.stringify(pkg.searchKeywords || []),
    createdAt: pkg.createdAt || now,
    updatedAt: now,
    isPopular: pkg.isPopular ? 1 : 0,
    isFeatured: pkg.isFeatured ? 1 : 0
  };

  if (existing) {
    db.prepare(`
      UPDATE packages 
      SET name = @name, slug = @slug, description = @description, shortDescription = @shortDescription,
          region = @region, type = @type, difficulty = @difficulty, duration = @duration, price = @price,
          mainImage = @mainImage, images = @images, itinerary = @itinerary, inclusions = @inclusions,
          exclusions = @exclusions, departureDates = @departureDates, anyDateAvailable = @anyDateAvailable,
          map = @map, reviews = @reviews, status = @status, faq = @faq,
          additionalInfoSections = @additionalInfoSections, bookingType = @bookingType,
          externalBookingUrl = @externalBookingUrl, gears = @gears, guides = @guides,
          searchKeywords = @searchKeywords, updatedAt = @updatedAt,
          isPopular = @isPopular, isFeatured = @isFeatured
      WHERE id = @id
    `).run(serializedPackage);
  } else {
    db.prepare(`
      INSERT INTO packages (id, name, slug, description, shortDescription, region, type, difficulty, duration, price,
                           mainImage, images, itinerary, inclusions, exclusions, departureDates, anyDateAvailable,
                           map, reviews, status, faq, additionalInfoSections, bookingType, externalBookingUrl,
                           gears, guides, searchKeywords, createdAt, updatedAt, isPopular, isFeatured)
      VALUES (@id, @name, @slug, @description, @shortDescription, @region, @type, @difficulty, @duration, @price,
              @mainImage, @images, @itinerary, @inclusions, @exclusions, @departureDates, @anyDateAvailable,
              @map, @reviews, @status, @faq, @additionalInfoSections, @bookingType, @externalBookingUrl,
              @gears, @guides, @searchKeywords, @createdAt, @updatedAt, @isPopular, @isFeatured)
    `).run(serializedPackage);
  }
  return pkg.id;
}

function deserializePackage(row: PackageDB): Tour {
  return {
    ...row,
    region: JSON.parse(row.region || '[]'),
    mainImage: JSON.parse(row.mainImage || '{"url":""}'),
    images: JSON.parse(row.images || '[]'),
    itinerary: JSON.parse(row.itinerary || '[]'),
    inclusions: JSON.parse(row.inclusions || '[]'),
    exclusions: JSON.parse(row.exclusions || '[]'),
    departureDates: JSON.parse(row.departureDates || '[]'),
    anyDateAvailable: Boolean(row.anyDateAvailable),
    reviews: JSON.parse(row.reviews || '[]'),
    faq: JSON.parse(row.faq || '[]'),
    additionalInfoSections: JSON.parse(row.additionalInfoSections || '[]'),
    gears: JSON.parse(row.gears || '[]'),
    guides: JSON.parse(row.guides || '[]'),
    searchKeywords: JSON.parse(row.searchKeywords || '[]'),
    isPopular: Boolean(row.isPopular),
    isFeatured: Boolean(row.isFeatured)
  } as unknown as Tour;
}

export function getPackageById(id: string) {
  const row = db.prepare('SELECT * FROM packages WHERE id = ?').get(id) as PackageDB | undefined;
  if (!row) return null;
  return deserializePackage(row);
}

export function getPackageBySlug(slug: string) {
  const row = db.prepare('SELECT * FROM packages WHERE slug = ?').get(slug) as PackageDB | undefined;
  if (!row) return null;
  return deserializePackage(row);
}

export function getPackages(options?: {
  limit?: number;
  page?: number;
  status?: string;
  search?: string;
  type?: string;
  difficulty?: string;
  region?: string;
}) {
  const limit = options?.limit || 10;
  const page = options?.page || 1;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM packages';
  const conditions: string[] = [];
  const params: any[] = [];

  if (options?.status) {
    conditions.push('status = ?');
    params.push(options.status);
  }

  if (options?.type) {
    conditions.push('type = ?');
    params.push(options.type);
  }

  if (options?.difficulty) {
    conditions.push('difficulty = ?');
    params.push(options.difficulty);
  }

  if (options?.region) {
    conditions.push('region LIKE ?');
    params.push(`%${options.region}%`);
  }

  if (options?.search) {
    conditions.push('(name LIKE ? OR description LIKE ? OR searchKeywords LIKE ?)');
    const term = `%${options.search}%`;
    params.push(term, term, term);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params) as PackageDB[];

  // Get total count
  let countQuery = 'SELECT COUNT(*) as count FROM packages';
  const countParams = params.slice(0, params.length - 2);

  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }

  const totalCount = (db.prepare(countQuery).get(...countParams) as { count: number }).count;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    packages: rows.map(deserializePackage),
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasMore: page < totalPages
    }
  };
}

export function getFeaturedToursDB(limit: number = 3) {
  let rows = db.prepare(`
    SELECT * FROM packages 
    WHERE status = 'published' AND isFeatured = 1 
    ORDER BY createdAt DESC 
    LIMIT ?
  `).all(limit) as PackageDB[];
  
  // Fallback if no featured tours
  if (rows.length === 0) {
    rows = db.prepare(`
      SELECT * FROM packages 
      WHERE status = 'published' 
      ORDER BY createdAt DESC 
      LIMIT ?
    `).all(limit) as PackageDB[];
  }
  
  return rows.map(deserializePackage);
}

export function getPopularToursDB(limit: number = 3) {
  let rows = db.prepare(`
    SELECT * FROM packages 
    WHERE status = 'published' AND isPopular = 1 
    ORDER BY price DESC 
    LIMIT ?
  `).all(limit) as PackageDB[];
  
  // Fallback if no popular tours
  if (rows.length === 0) {
    rows = db.prepare(`
      SELECT * FROM packages 
      WHERE status = 'published' 
      ORDER BY price DESC 
      LIMIT ?
    `).all(limit) as PackageDB[];
  }
  
  return rows.map(deserializePackage);
}

export function getAllPackagesForSelect() {
  const rows = db.prepare('SELECT id, name, slug FROM packages ORDER BY name ASC').all() as { id: string; name: string; slug: string }[];
  return rows;
}

export function getAllPackages(status?: string): Tour[] {
  let query = 'SELECT * FROM packages';
  const params: any[] = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY name ASC';

  const rows = db.prepare(query).all(...params) as PackageDB[];
  return rows.map(deserializePackage);
}

export function deletePackage(id: string) {
  db.prepare('DELETE FROM packages WHERE id = ?').run(id);
}

export function checkPackageSlugAvailability(slug: string, excludeId?: string): boolean {
  if (excludeId) {
    const row = db.prepare('SELECT id FROM packages WHERE slug = ? AND id != ?').get(slug, excludeId);
    return !row;
  }
  const row = db.prepare('SELECT id FROM packages WHERE slug = ?').get(slug);
  return !row;
}

// --- Review Helpers ---

export interface ReviewDB {
  id: string;
  rating: number;
  author: string;
  comment: string;
  date: string;
  status: string;
  source: string;
  packageId?: string | null;
  createdAt: string;
}

export function getReviewsDB(options?: {
  limit?: number;
  status?: string;
  rating?: number;
}): ManagedReview[] {
  const limit = options?.limit || 10;
  let query = 'SELECT * FROM reviews';
  const conditions: string[] = [];
  const params: any[] = [];

  if (options?.status) {
    conditions.push('status = ?');
    params.push(options.status);
  }

  if (options?.rating) {
    conditions.push('rating = ?');
    params.push(options.rating);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY date DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(query).all(...params) as ReviewDB[];
  return rows.map(row => {
    const isOnSite = row.source === 'website' || !row.source;
    if (isOnSite) {
      return {
        id: row.id,
        type: 'onSite',
        reviewedOn: row.date,
        userName: row.author,
        reviewFor: row.packageId || 'general',
        reviewBody: row.comment,
        stars: row.rating as 1 | 2 | 3 | 4 | 5,
        userId: 'anonymous'
      } as OnSiteReview;
    } else {
      return {
        id: row.id,
        type: 'offSite',
        reviewedOn: row.date,
        userName: row.author,
        reviewFor: row.packageId || null,
        reviewBody: row.comment,
        stars: row.rating as 1 | 2 | 3 | 4 | 5,
        originalReviewUrl: ''
      } as OffSiteReview;
    }
  });
}

export function saveReview(review: Omit<ReviewDB, 'createdAt'> & { createdAt?: string }) {
  const existing = db.prepare('SELECT id FROM reviews WHERE id = ?').get(review.id);
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(`
      UPDATE reviews 
      SET rating = @rating, author = @author, comment = @comment, date = @date, 
          status = @status, source = @source, packageId = @packageId
      WHERE id = @id
    `).run({
      ...review,
      packageId: review.packageId || null
    });
  } else {
    db.prepare(`
      INSERT INTO reviews (id, rating, author, comment, date, status, source, packageId, createdAt)
      VALUES (@id, @rating, @author, @comment, @date, @status, @source, @packageId, @createdAt)
    `).run({
      ...review,
      packageId: review.packageId || null,
      createdAt: review.createdAt || now
    });
  }
  return review.id;
}


export function deleteReview(id: string) {
  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
}

// --- Legal Helpers ---

export function getLegalContent(id: string) {
  const row = db.prepare('SELECT content, updatedAt FROM legal WHERE id = ?').get(id) as { content: string; updatedAt: string } | undefined;
  return row || null;
}

export function saveLegalContent(id: string, content: string) {
  const updatedAt = new Date().toISOString();
  const existing = db.prepare('SELECT id FROM legal WHERE id = ?').get(id);

  if (existing) {
    db.prepare('UPDATE legal SET content = ?, updatedAt = ? WHERE id = ?').run(content, updatedAt, id);
  } else {
    db.prepare('INSERT INTO legal (id, content, updatedAt) VALUES (?, ?, ?)').run(id, content, updatedAt);
  }
}

export interface LegalDocumentDB {
  id: string;
  title: string;
  description: string | null;
  url: string;
  createdAt: string;
  isHidden: number | null;
  orderIndex: number | null;
}

function mapLegalDocumentRow(row: LegalDocumentDB) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    url: row.url,
    createdAt: row.createdAt,
    isHidden: Boolean(row.isHidden),
    orderIndex: row.orderIndex ?? undefined,
  };
}

export function getAllLegalDocuments() {
  const rows = db.prepare(`
    SELECT id, title, description, url, createdAt, isHidden, orderIndex
    FROM legalDocuments
    ORDER BY
      CASE WHEN orderIndex IS NULL THEN 1 ELSE 0 END,
      orderIndex ASC,
      datetime(createdAt) DESC
  `).all() as LegalDocumentDB[];

  return rows.map(mapLegalDocumentRow);
}

export function getLegalDocument(id: string) {
  const row = db.prepare(`
    SELECT id, title, description, url, createdAt, isHidden, orderIndex
    FROM legalDocuments
    WHERE id = ?
  `).get(id) as LegalDocumentDB | undefined;

  return row ? mapLegalDocumentRow(row) : null;
}

export function saveLegalDocument(data: {
  id?: string;
  title: string;
  description?: string;
  url: string;
  createdAt?: string;
  isHidden?: boolean;
  orderIndex?: number;
}) {
  const id = data.id || uuidv4();
  const createdAt = data.createdAt || new Date().toISOString();
  const existing = db.prepare('SELECT id FROM legalDocuments WHERE id = ?').get(id);

  if (existing) {
    db.prepare(`
      UPDATE legalDocuments
      SET title = ?, description = ?, url = ?, isHidden = ?, orderIndex = ?
      WHERE id = ?
    `).run(
      data.title,
      data.description?.trim() || null,
      data.url,
      data.isHidden ? 1 : 0,
      data.orderIndex ?? null,
      id
    );
  } else {
    db.prepare(`
      INSERT INTO legalDocuments (id, title, description, url, createdAt, isHidden, orderIndex)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.title,
      data.description?.trim() || null,
      data.url,
      createdAt,
      data.isHidden ? 1 : 0,
      data.orderIndex ?? null
    );
  }

  return id;
}

export function deleteLegalDocumentRecord(id: string) {
  db.prepare('DELETE FROM legalDocuments WHERE id = ?').run(id);
}

export function getLegalDocumentSettings() {
  const row = db.prepare(`
    SELECT requireEmailProtection
    FROM legalDocumentSettings
    WHERE id = 'legal'
  `).get() as { requireEmailProtection: number } | undefined;

  return {
    requireEmailProtection: row ? Boolean(row.requireEmailProtection) : true,
  };
}

export function saveLegalDocumentSettings(settings: { requireEmailProtection: boolean }) {
  db.prepare(`
    INSERT INTO legalDocumentSettings (id, requireEmailProtection)
    VALUES ('legal', ?)
    ON CONFLICT(id) DO UPDATE SET requireEmailProtection = excluded.requireEmailProtection
  `).run(settings.requireEmailProtection ? 1 : 0);
}
