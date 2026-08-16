import { db } from '@/lib/db/sqlite';

export type LinkTargetType = 'internal-blog' | 'internal-tour' | 'internal-other' | 'external';
export type LinkStatus = 'valid' | 'missing' | 'untracked' | 'external';

export interface LinkReportEntry {
  page: string;
  pageTitle: string;
  anchor: string;
  target: string;
  targetType: LinkTargetType;
  status: LinkStatus;
  targetSlug: string | null;
}

export interface LinkReportSummary {
  total: number;
  internalBlog: number;
  internalTour: number;
  internalOther: number;
  external: number;
  valid: number;
  missing: number;
}

export interface LinkReport {
  generatedAt: string;
  summary: LinkReportSummary;
  entries: LinkReportEntry[];
}

const SITE_ORIGIN = 'https://happymountainnepal.com';
const SITE_HOST = 'happymountainnepal.com';
const linkRe = /<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(value: string) {
  return decodeHtml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/';
}

function createSummary(entries: LinkReportEntry[]): LinkReportSummary {
  return entries.reduce<LinkReportSummary>(
    (summary, entry) => {
      summary.total += 1;

      if (entry.targetType === 'internal-blog') summary.internalBlog += 1;
      if (entry.targetType === 'internal-tour') summary.internalTour += 1;
      if (entry.targetType === 'internal-other') summary.internalOther += 1;
      if (entry.targetType === 'external') summary.external += 1;

      if (entry.status === 'valid') summary.valid += 1;
      if (entry.status === 'missing') summary.missing += 1;

      return summary;
    },
    {
      total: 0,
      internalBlog: 0,
      internalTour: 0,
      internalOther: 0,
      external: 0,
      valid: 0,
      missing: 0,
    }
  );
}

export async function getLinkReport(): Promise<LinkReport> {
  const posts = new Set(
    db
      .prepare("select slug from posts where slug is not null and trim(slug) != ''")
      .all()
      .map((row) => String((row as { slug: string }).slug).trim())
  );

  const packages = new Set(
    db
      .prepare("select slug from packages where slug is not null and trim(slug) != ''")
      .all()
      .map((row) => String((row as { slug: string }).slug).trim())
  );

  const blogRows = db
    .prepare("select slug, title, content from posts where content is not null and trim(content) != ''")
    .all() as Array<{ slug: string; title: string; content: string }>;

  const entries: LinkReportEntry[] = [];

  for (const row of blogRows) {
    const seen = new Set<string>();

    for (const match of row.content.matchAll(linkRe)) {
      const rawHref = decodeHtml(match[2].trim());
      const anchor = stripTags(match[3]);

      if (
        !rawHref ||
        rawHref.startsWith('#') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:') ||
        rawHref.startsWith('javascript:')
      ) {
        continue;
      }

      let url: URL;
      try {
        url = new URL(rawHref, SITE_ORIGIN);
      } catch {
        continue;
      }

      const page = `/blog/${row.slug}`;
      const pathname = normalizePathname(url.pathname);
      const target = `${pathname}${url.search}${url.hash}`;

      let targetType: LinkTargetType = 'external';
      let status: LinkStatus = 'external';
      let targetSlug: string | null = null;

      if (url.hostname === SITE_HOST) {
        if (pathname.startsWith('/blog/')) {
          targetType = 'internal-blog';
          targetSlug = pathname.split('/').filter(Boolean)[1] || null;
          status = targetSlug && posts.has(targetSlug) ? 'valid' : 'missing';
        } else if (pathname.startsWith('/tours/')) {
          targetType = 'internal-tour';
          targetSlug = pathname.split('/').filter(Boolean)[1] || null;
          status = targetSlug && packages.has(targetSlug) ? 'valid' : 'missing';
        } else {
          targetType = 'internal-other';
          status = 'untracked';
        }
      }

      const dedupeKey = `${page}::${anchor}::${target}`;
      if (seen.has(dedupeKey)) {
        continue;
      }

      seen.add(dedupeKey);
      entries.push({
        page,
        pageTitle: row.title,
        anchor,
        target,
        targetType,
        status,
        targetSlug,
      });
    }
  }

  entries.sort((left, right) => {
    if (left.status !== right.status) {
      const rank = { missing: 0, valid: 1, untracked: 2, external: 3 } as const;
      return rank[left.status] - rank[right.status];
    }

    if (left.targetType !== right.targetType) {
      return left.targetType.localeCompare(right.targetType);
    }

    if (left.page !== right.page) {
      return left.page.localeCompare(right.page);
    }

    return left.target.localeCompare(right.target);
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: createSummary(entries),
    entries,
  };
}
