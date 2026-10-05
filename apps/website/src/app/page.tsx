import { cn } from '@plexus-ms/std';
import type { Metadata } from 'next';
import { Hero, HeroBody, type HeroContent } from '@/app/hero';

const slogan = 'Standardized, Boring, Yours.';
const metaDescription = 'Plexus is a collection of opinionated guidelines and approaches in information technology.';

export const metadata: Metadata = {
  title: `Plexus.ms – ${slogan}`,
  description: metaDescription,
};

const content: HeroContent = {
  intro: {
    eyebrow: 'Working Against the Mental Fog in Your Stack',
    slogan,
    description: `${metaDescription} Hoping that others might also find it useful, we've made it public.`,
  },
  actions: {
    primary: { label: 'Read the manifesto', href: '/compendium/plexus/manifesto' },
    secondary: { label: 'Adopt the standard', href: '/compendium/plexus/standard' },
  },
  testimonial: {
    quote:
      "»Before Plexus, every project was a unique handcrafted artisanal snowflake; now they're all boring and identical, and we have never been happier.«",
    author: 'David Julian Albers',
    org: 'DAMAGE GmbH',
  },
};

export default function Home() {
  return (
    <Hero content={content}>
      <HeroBody>
        <p>
          As we tackled more and more projects, our surface area grew organically, not by design. The dominant
          experience became <span className={cn('font-bold text-ink dark:text-dark-paper')}>mental fog</span>: losing
          track of what deploys where, how configuration interacts, how to set up a given environment, and generally,
          where we were mentally when last touching a project. Projects felt half-baked, never brought live properly,
          never documented or guardrailed enough for autopilot.
        </p>
        <p className={cn('mt-6')}>
          <span className={cn('font-bold text-ink dark:text-dark-paper')}>Plexus is our response. </span>
          It forces us to do things properly, to re-use as much as possible, and to standardize as far as possible, so
          that each new project adds near-zero overhead. Have a look around{' '}
          <a
            className={cn('font-bold text-accent-text underline underline-offset-3 dark:text-dark-accent')}
            rel="noopener noreferrer"
            target="_blank"
            href="https://github.com/plexus-ms"
          >
            our GitHub
          </a>
          .
        </p>
      </HeroBody>
    </Hero>
  );
}
