import { githubSource } from './github-source';

export interface DocRef {
  path: string;
  slug: string[];
  format: 'md' | 'mdx';
}

export interface CompendiumSource {
  /** Repo-relative paths of all .md/.mdx files. */
  list(): Promise<string[]>;
  read(path: string): Promise<string>;
}

const source: CompendiumSource = githubSource;

function isIndex(path: string): boolean {
  return /(^|\/)index\.mdx?$/.test(path);
}

// A folder's index.md is addressed by the folder itself: nextjs/index.md -> /compendium/nextjs.
function toDocRef(path: string): DocRef {
  const slug = path.replace(/\.mdx?$/, '').split('/');
  if (slug[slug.length - 1] === 'index') slug.pop();
  return { path, slug, format: path.endsWith('.mdx') ? 'mdx' : 'md' };
}

export async function listDocs(): Promise<DocRef[]> {
  const paths = await source.list();
  return paths
    .filter((path) => path !== 'README.md')
    .map(toDocRef)
    .filter((doc) => doc.slug.length > 0);
}

export function readDoc(path: string): Promise<string> {
  return source.read(path);
}

export async function findDoc(slug: string[]): Promise<DocRef | undefined> {
  const docs = await listDocs();
  return docs.find((doc) => doc.slug.join('/') === slug.join('/'));
}

function frontmatterField(content: string, field: string): string | undefined {
  const block = content.match(/^---\n([\s\S]*?)\n---/)?.[1];
  return block?.match(new RegExp(`^${field}:\\s*["']?(.+?)["']?\\s*$`, 'm'))?.[1];
}

// Docs without an explicit `order` sort after their ordered siblings, alphabetically by path.
function navOrder(content: string): number {
  const order = Number(frontmatterField(content, 'order') ?? NaN);
  return Number.isFinite(order) ? order : Infinity;
}

// Navigation labels prefer the optional short_title over the full title.
function navTitle(content: string, fallback: string): string {
  return frontmatterField(content, 'short_title') ?? frontmatterField(content, 'title') ?? fallback;
}

// Module codes (PLX-Repo, …) resolved to their pages, so a module's depends/consumes render as links.
export async function getModuleRoutes(): Promise<Map<string, string>> {
  const docs = await listDocs();
  const routes = new Map<string, string>();
  for (const doc of docs) {
    const code = frontmatterField(await readDoc(doc.path), 'code');
    if (code) routes.set(code, `/compendium/${doc.slug.join('/')}`);
  }
  return routes;
}

export interface NavItem {
  href: string;
  title: string;
  description?: string;
}

export interface NavSection {
  label: string;
  /** Link target of the section heading; set when the folder has an index doc. */
  href?: string;
  /** Description of the folder's index doc, if any. */
  description?: string;
  items: NavItem[];
}

// Sections are the top-level folders, labeled by their index doc's title (folder name as fallback).
// Root-level docs come first, under 'General'. Docs and sections sort by frontmatter `order`
// (index doc's order for sections), unordered ones after, alphabetically.
export async function getNavigation(): Promise<NavSection[]> {
  const docs = await listDocs();
  const entries = await Promise.all(
    docs.map(async (doc) => {
      const content = await readDoc(doc.path);
      return {
        doc,
        order: navOrder(content),
        title: navTitle(content, doc.slug[doc.slug.length - 1]),
        description: frontmatterField(content, 'description'),
      };
    }),
  );
  entries.sort((a, b) => a.order - b.order || a.doc.path.localeCompare(b.doc.path));

  const general: NavSection & { order: number } = { label: 'General', order: Infinity, items: [] };
  const folders = new Map<string, NavSection & { order: number }>();

  for (const { doc, order, title, description } of entries) {
    const href = `/compendium/${doc.slug.join('/')}`;
    if (doc.slug.length === 1 && !isIndex(doc.path)) {
      general.items.push({ href, title, description });
      continue;
    }
    const folder = doc.slug[0];
    const section = folders.get(folder) ?? { label: folder, order: Infinity, items: [] };
    if (isIndex(doc.path) && doc.slug.length === 1) {
      Object.assign(section, { label: title, href, description, order });
    } else {
      section.items.push({ href, title, description });
    }
    folders.set(folder, section);
  }

  const sections = [...folders.entries()]
    .toSorted(([folderA, a], [folderB, b]) => a.order - b.order || folderA.localeCompare(folderB))
    .map(([, section]) => section);
  return general.items.length > 0 ? [general, ...sections] : sections;
}
