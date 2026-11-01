import stores from '../data/stores.json';

export function GET({ site }: { site: URL }) {
  const paths = ['/', '/quero-ser-franqueado/', '/cardapio/', '/unidades/', '/netao/', '/videos/', '/trabalhe-conosco/', '/politica-de-privacidade/',
    ...stores.filter((s) => s.hasPage).map((s) => `/unidades/${s.slug}/`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${new URL(p, site).href}</loc></url>`).join('')}</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
