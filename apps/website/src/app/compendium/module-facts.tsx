import { cn } from '@plexus-ms/std';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { DocFrontmatter, ModuleMaturity } from './render';

// A module's frontmatter (§ 1.3 PLX) as a fact sheet under the title: kind, maturity, what it
// binds, the train its requirements last changed in, and its dependencies as links.
const maturityStyles: Record<ModuleMaturity, string> = {
  note: 'border-line text-ink-soft dark:border-dark-line dark:text-dark-soft',
  candidate: 'border-line text-ink dark:border-dark-line dark:text-dark-paper',
  standard:
    'border-accent bg-accent-wash text-accent-text dark:border-dark-accent dark:bg-dark-raised dark:text-dark-accent',
};

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="font-display text-xs font-bold tracking-widest text-ink-soft uppercase dark:text-dark-soft">
        {label}
      </dt>
      <dd className="text-sm text-ink dark:text-dark-paper">{children}</dd>
    </>
  );
}

function Codes({ codes, routes }: { codes: string[]; routes: Map<string, string> }) {
  if (codes.length === 0) return <span className="text-ink-soft dark:text-dark-soft">none</span>;
  return (
    <span className="inline-flex flex-wrap gap-x-3">
      {codes.map((code) => {
        const href = routes.get(code);
        return href ? (
          <Link key={code} href={href} className="font-semibold text-accent-text hover:underline dark:text-dark-accent">
            {code}
          </Link>
        ) : (
          <span key={code}>{code}</span>
        );
      })}
    </span>
  );
}

export function ModuleFacts({
  frontmatter,
  kind,
  routes,
}: {
  frontmatter: DocFrontmatter;
  kind: 'contract' | 'approach';
  routes: Map<string, string>;
}) {
  const { maturity, binds, depends = [], consumes = [], changed } = frontmatter;
  if (!maturity) return null;
  return (
    <dl className="mt-4 grid grid-cols-[max-content_1fr] items-baseline gap-x-6 gap-y-1.5 border-y border-line py-4 dark:border-dark-line">
      <Fact label="Kind">
        <span className="capitalize">{kind}</span>
      </Fact>
      <Fact label="Maturity">
        <span className={cn('inline-block border px-2 font-display text-xs leading-5', maturityStyles[maturity])}>
          {maturity}
        </span>
      </Fact>
      {binds && <Fact label="Binds">{binds}</Fact>}
      {changed && <Fact label="Changed">train {changed}</Fact>}
      <Fact label="Depends on">
        <Codes codes={depends} routes={routes} />
      </Fact>
      {kind === 'approach' && (
        <Fact label="Consumes">
          <Codes codes={consumes} routes={routes} />
        </Fact>
      )}
    </dl>
  );
}
