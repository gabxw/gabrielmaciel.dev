import type { APIRoute } from 'astro';
import { projects } from '../data/projects';
import { projectRoute, route } from '../i18n/ui';

// Sitemap simples, com as duas versões de cada página ligadas por hreflang.
export const GET: APIRoute = ({ site }) => {
  const pairs: [string, string][] = [
    [route('home', 'pt'), route('home', 'en')],
    [route('projects', 'pt'), route('projects', 'en')],
    [route('books', 'pt'), route('books', 'en')],
    ...projects.map((p): [string, string] => [projectRoute(p.slug, 'pt'), projectRoute(p.slug, 'en')]),
  ];
  const url = (path: string) => new URL(path, site).href;
  const entries = pairs
    .flatMap(([pt, en]) =>
      [pt, en].map(
        (loc) => `  <url>
    <loc>${url(loc)}</loc>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${url(pt)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${url(en)}"/>
  </url>`,
      ),
    )
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
