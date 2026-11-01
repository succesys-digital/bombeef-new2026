// Crawls the running preview: every internal link and asset must resolve, every page must be well formed.
// Usage: node tests/site.mjs http://localhost:8788
const base = process.argv[2] || 'http://localhost:8788';
const seen = new Map();
const queue = ['/', '/sitemap.xml', '/robots.txt', '/nao-existe/', '/nossas-unidades/', '/hamburguer-perfeito/', '/primo/', '/quero-ser-franqueado/sucesso/'];
const problems = [];
const pages = [];

async function visit(p, from) {
  if (seen.has(p)) return;
  seen.set(p, 0);
  const r = await fetch(base + p, { redirect: 'manual' });
  seen.set(p, r.status);
  const expected = p === '/nao-existe/' ? 404 : null;
  if (expected ? r.status !== expected : r.status >= 400) problems.push(`${r.status} ${p} (from ${from})`);
  if (r.status >= 300 && r.status < 400) { const l = r.headers.get('location'); if (l) queue.push(new URL(l, base + p).pathname); return; }
  if (!(r.headers.get('content-type') || '').includes('text/html')) return;
  const h = await r.text();
  if (r.status === 200) {
    pages.push(p);
    if ((h.match(/<h1[\s>]/g) || []).length !== 1) problems.push(`h1 count ${p}`);
    if (!/<title>[^<]{5,}<\/title>/.test(h)) problems.push(`title ${p}`);
    if (!/<meta name="description"/.test(h)) problems.push(`description ${p}`);
    if (!/<html lang="pt-BR"/.test(h)) problems.push(`lang ${p}`);
    for (const m of h.matchAll(/<img\b[^>]*>/g)) {
      if (!/\balt[=\s]/.test(m[0])) problems.push(`img no alt ${p}: ${m[0].slice(0, 80)}`);
      if (!/\bwidth=/.test(m[0]) || !/\bheight=/.test(m[0])) problems.push(`img no size ${p}: ${m[0].slice(0, 80)}`);
    }
  }
  const refs = [...h.matchAll(/(?:href|src)="([^"#]+)/g)].map((m) => m[1]);
  for (const m of h.matchAll(/srcset="([^"]+)"/g)) refs.push(...m[1].split(',').map((s) => s.trim().split(' ')[0]));
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:)/.test(ref)) continue;
    queue.push(new URL(ref, base + p).pathname);
  }
}
while (queue.length) { const batch = queue.splice(0, 12); await Promise.all(batch.map((p) => visit(p, 'crawl'))); }
console.log(`checked ${seen.size} urls, ${pages.length} html pages`);
console.log('redirect /nossas-unidades/ ->', seen.get('/nossas-unidades/'), ' 404 page ->', seen.get('/nao-existe/'));
if (problems.length) { console.log(problems.slice(0, 40).join('\n')); process.exit(1); }
console.log('OK');

const fd = new FormData();
for (const [k, v] of Object.entries({ name: 'Teste QA', email: 'x', phone: '11912345678', city: 'Santos', state: 'SP', investment: 'Tenho mais de R$ 950 mil', consent: 'on', started: '1000' })) fd.set(k, v);
const bad = await fetch(`${base}/api/lead`, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
console.log('POST /api/lead invalid:', bad.status, (await bad.text()).slice(0, 90));
if (bad.status !== 422) process.exit(1);

// A valid lead reaches the CRM when RD_PUBLIC_TOKEN is set, so it only runs locally, where the token is absent.
if (new URL(base).hostname === 'localhost') {
  fd.set('email', 'qa@exemplo.com');
  const ok = await fetch(`${base}/api/lead`, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
  console.log('POST /api/lead valid, no token:', ok.status, await ok.text());
  if (ok.status !== 503) process.exit(1);
}
