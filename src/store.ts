export interface Link {
  slug: string;
  url: string;
  createdAt: string;
  visits: number;
}

export class SlugTakenError extends Error {
  constructor(slug: string) {
    super(`slug already taken: ${slug}`);
    this.name = "SlugTakenError";
  }
}

// Links expire 30 days after creation; computed from createdAt, never stored.
export const LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function isExpired(link: Link): boolean {
  return Date.now() - Date.parse(link.createdAt) > LINK_TTL_MS;
}

const links = new Map<string, Link>();

// No 0/o/1/l/i: slugs get read aloud and typed by hand.
const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function randomSlug(length = 6): string {
  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)];
  }
  return slug;
}

function uniqueSlug(): string {
  let slug = randomSlug();
  while (links.has(slug)) {
    slug = randomSlug();
  }
  return slug;
}

export function createLink(url: string, slug?: string): Link {
  const finalSlug = slug ?? uniqueSlug();
  if (links.has(finalSlug)) {
    throw new SlugTakenError(finalSlug);
  }
  const link: Link = {
    slug: finalSlug,
    url,
    createdAt: new Date().toISOString(),
    visits: 0,
  };
  links.set(finalSlug, link);
  return link;
}

export function getLink(slug: string): Link | undefined {
  return links.get(slug);
}

export function recordVisit(slug: string): void {
  const link = links.get(slug);
  if (link) {
    link.visits += 1;
  }
}

export function resetStore(): void {
  links.clear();
}
