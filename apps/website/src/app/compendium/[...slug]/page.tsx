import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findDoc, getModuleRoutes, getNavigation, listDocs, readDoc } from '../compendium';
import { ModuleFacts } from '../module-facts';
import { PrevNextLinks } from '../prev-next-links';
import { Prose } from '../prose';
import { compileDoc } from '../render';
import { TableOfContents } from '../table-of-contents';

// Docs added to the repo after the image was built get rendered on first request post-revalidation.
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  return (await listDocs()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = await findDoc((await params).slug);
  if (!doc) return {};
  const { frontmatter } = await compileDoc(await readDoc(doc.path), doc.format, doc.path);
  return {
    title: `${frontmatter.title} – Plexus.ms Compendium`,
    description: frontmatter.description,
  };
}

export default async function DocPage({ params }: Props) {
  const doc = await findDoc((await params).slug);
  if (!doc) notFound();
  const [{ content, frontmatter, headings }, sections, routes] = await Promise.all([
    readDoc(doc.path).then((source) => compileDoc(source, doc.format, doc.path)),
    getNavigation(),
    getModuleRoutes(),
  ]);
  // The folder is the module's kind (§ 1.3 PLX); pages elsewhere are not modules and get no facts.
  const kind = doc.slug[0] === 'contracts' ? 'contract' : doc.slug[0] === 'approaches' ? 'approach' : undefined;
  const href = `/compendium/${doc.slug.join('/')}`;
  const section = sections.find((s) => s.items.some((item) => item.href === href));
  const authors = [frontmatter.authors].flat().filter(Boolean) as string[];
  const byline =
    authors.length === 0
      ? undefined
      : authors.length === 1
        ? `By ${authors[0]}`
        : authors.length === 2
          ? `By ${authors[0]} and ${authors[1]}`
          : `By ${authors.slice(0, -1).join(', ')}, and ${authors[authors.length - 1]}`;
  const meta = [
    frontmatter.version && `Version ${frontmatter.version}`,
    frontmatter.timestamp && `Updated ${frontmatter.timestamp}`,
    byline,
  ].filter(Boolean);

  return (
    <>
      <div className="max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
        <article>
          <header className="mb-9 space-y-1">
            {section && (
              <p className="font-display text-sm font-bold tracking-widest text-accent-text uppercase dark:text-dark-accent">
                {section.label}
              </p>
            )}
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-dark-paper">
              {frontmatter.title}
            </h1>
            {meta.length > 0 && <p className="text-sm text-ink-soft dark:text-dark-soft">{meta.join(' · ')}</p>}
            {kind && <ModuleFacts frontmatter={frontmatter} kind={kind} routes={routes} />}
          </header>
          <Prose>{content}</Prose>
        </article>
        <PrevNextLinks sections={sections} href={href} />
      </div>
      <TableOfContents headings={headings} />
    </>
  );
}
