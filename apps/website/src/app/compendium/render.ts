import rehypeShiki from '@shikijs/rehype';
import { compileMDX } from 'next-mdx-remote/rsc';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { Callout } from './callout';
import { DocLink } from './doc-link';
import { Pre } from './pre';

export type ModuleMaturity = 'note' | 'candidate' | 'standard';

export interface DocFrontmatter {
  title?: string;
  short_title?: string;
  description?: string;
  version?: string;
  timestamp?: string;
  authors?: string | string[];
  // Module fields (§ 1.3 PLX): present on every page under contracts/ and approaches/.
  code?: string;
  maturity?: ModuleMaturity;
  binds?: string;
  depends?: string[];
  consumes?: string[];
  changed?: string;
}

export interface DocHeading {
  id: string;
  text: string;
  depth: 2 | 3;
}

interface HastNode {
  type: string;
  tagName?: string;
  properties?: { id?: string; className?: string[]; dataMermaidChart?: string };
  value?: string;
  children?: HastNode[];
}

interface MdastNode {
  type: string;
  url?: string;
  children?: MdastNode[];
}

// Relative .md links are written for GitHub (standard.md, ../principles/dry.md#x); resolved against
// the doc's repo path they become site routes (/compendium/principles/dry#x), with index.md mapping
// to its folder route just like toDocRef does.
function resolveDocLink(url: string, fromDir: string[]): string {
  const [target = '', hash = ''] = url.split(/(?=#)/);
  if (!/^[^/#?]/.test(target) || /^[a-z][a-z0-9+.-]*:/i.test(target) || !/\.mdx?$/i.test(target)) return url;
  const segments = [...fromDir];
  for (const part of target.replace(/\.mdx?$/i, '').split('/')) {
    if (part === '..') segments.pop();
    else if (part !== '.' && part !== '') segments.push(part);
  }
  if (segments[segments.length - 1] === 'index') segments.pop();
  return ['/compendium', ...segments].join('/') + hash;
}

function markdownLinks(docPath: string) {
  const fromDir = docPath.split('/').slice(0, -1);
  const visit = (node: MdastNode) => {
    if ((node.type === 'link' || node.type === 'definition') && node.url) node.url = resolveDocLink(node.url, fromDir);
    for (const child of node.children ?? []) visit(child);
  };
  return () => visit;
}

function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(textOf).join('');
}

// Collects h2/h3 ids assigned by rehype-slug, so ToC anchors always match the rendered ids.
function collectHeadings(headings: DocHeading[]) {
  return () => (tree: HastNode) => {
    for (const node of tree.children ?? []) {
      if ((node.tagName === 'h2' || node.tagName === 'h3') && node.properties?.id) {
        headings.push({ id: node.properties.id, text: textOf(node), depth: node.tagName === 'h2' ? 2 : 3 });
      }
    }
  };
}

// Mermaid fences become bare marker pres (no code child, so shiki skips them) that the Pre override
// turns into client-rendered diagrams.
function mermaidBlocks() {
  const visit = (node: HastNode) => {
    for (const child of node.children ?? []) {
      const code = child.tagName === 'pre' ? child.children?.find((c) => c.tagName === 'code') : undefined;
      if (code?.properties?.className?.includes('language-mermaid')) {
        child.properties = { dataMermaidChart: textOf(code).trimEnd() };
        child.children = [];
      } else {
        visit(child);
      }
    }
  };
  return () => visit;
}

export async function compileDoc(source: string, format: 'md' | 'mdx', path: string) {
  const headings: DocHeading[] = [];
  const { content, frontmatter } = await compileMDX<DocFrontmatter>({
    source,
    components: { Callout, a: DocLink, pre: Pre },
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        format,
        remarkPlugins: [remarkGfm, markdownLinks(path)],
        rehypePlugins: [
          rehypeSlug,
          collectHeadings(headings),
          mermaidBlocks(),
          // One dark theme in both modes: the panel look comes from the prose-pre classes, so
          // shiki's inline background (which would override those classes) is stripped from the pre.
          [
            rehypeShiki,
            {
              theme: 'github-dark',
              fallbackLanguage: 'text',
              transformers: [
                {
                  pre(node: HastNode & { properties: { style?: string } }) {
                    node.properties.style = node.properties.style?.replace(/background-color:[^;]+;?/, '');
                  },
                },
              ],
            },
          ],
        ],
      },
    },
  });
  return { content, frontmatter, headings };
}
