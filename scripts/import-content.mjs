// Snapshots real content from the live site, the digital menu and the YouTube feed into src/data and src/assets.
// Run with `npm run import:content`, review the diff, commit. The site never fetches these at runtime.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const WP = 'https://bombeefburgers.com.br/wp-json/wp/v2/pages';
const MENU = 'https://bombeef.cardapio.boh.e-deploy.com.br/content/bombeef/0001/';
const YT = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCNU_eMfEmoktIhUsuikHNWA';
const UF = 'AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO';

const mkdir = (p) => fs.mkdirSync(p, { recursive: true });
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;| /g, ' ').replace(/&#8211;/g, '–').replace(/&#038;|&amp;/g, '&').replace(/\s+/g, ' ').trim();
const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function save(url, file) {
  if (fs.existsSync(file)) return true;
  const r = await fetch(url);
  if (!r.ok) { console.warn('skip', r.status, url); return false; }
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  return true;
}

async function stores() {
  mkdir('src/assets/stores');
  const pages = await (await fetch(`${WP}?per_page=100&slug=nossas-unidades&_fields=content`)).json();
  const html = pages[0].content.rendered;
  // Each card starts at its photo; the next card's photo closes it.
  const parts = html.split(/(?=<img[^>]+src="[^"]+\/uploads\/[^"]+"[^>]*>(?:(?!<img)[\s\S])*?<h\d[^>]*>[^<]*Bom Beef)/);
  const out = [];
  for (const part of parts) {
    const head = part.match(/<h\d[^>]*>((?:(?!<\/h\d>)[\s\S])*?Bom Beef(?:(?!<\/h\d>)[\s\S])*?)<\/h\d>/);
    const img = part.match(/<img[^>]+src="([^"]+\/uploads\/[^"]+)"/);
    if (!head || !img) continue;
    // Card ends where the footer block starts on the last card.
    const body = part.slice(part.indexOf(head[0]) + head[0].length).split(/Seja um Franqueado/)[0];
    const title = text(head[1]).replace(/^Bom Beef Burgers?\s*/, '');
    const pageSlug = (body.match(/\/unidades\/([a-z0-9-]+)\/?"/) || [])[1];
    const links = [...body.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&#038;/g, '&'));
    const lines = text(body.replace(/<\/(p|div|h\d|a|br)>|<br\s*\/?>/g, '\n').replace(/\n/g, '¶')).split('¶').map((s) => s.trim()).filter(Boolean)
      .filter((l) => !/^(Instagram|Ver Mais|Whatsapp|Telefone|Horário:?)$/i.test(l));
    const flat = lines.join(' ');
    if (/^Busque/.test(title)) continue;
    const soon = /MAIS INFORMAÇÕES EM BREVE/i.test(flat);
    const phone = (flat.match(/\(\d{2}\)\s*\d?\s?\d{4}-\d{4}/) || [''])[0];
    const hours = (flat.match(/((?:Seg|Ter|Dom|Funcionamento)[^()]*?(?:\d{2}h\d{2}|24 Horas)(?:[^()]*\d{2}h\d{2})?)\s*(?:$|Instagram)/i) || flat.match(/((?:Seg|Ter|Dom|Funcionamento)[^()]*)$/i) || ['', ''])[1].replace(/Horário:?|Fazer Pedido/gi, '').trim();
    const address = (flat.split(/\(\d{2}\)|FONE EM BREVE|MAIS INFORMAÇÕES EM BREVE/i)[0] || '').trim();
    const uf = ([...`${address} ${title}`.matchAll(new RegExp(`\\b(${UF})\\b`, 'g'))].pop() || [])[1] || '';
    const name = title.replace(new RegExp(`/(${UF})$`), '').trim();
    // Announced cards can share a name with an open store (Goiânia), so they get their own slug.
    const slug = pageSlug || (soon ? `${slugify(name)}-em-breve` : slugify(name));
    const raw = img[1].replace(/-\d+x\d+(\.\w+)$/, '$1');
    const ext = path.extname(raw).toLowerCase().replace('jpeg', 'jpg');
    const photo = `${slug}${ext}`;
    await save(img[1].replace(/-\d+x\d+(\.\w+)$/, '-768x768$1'), `src/assets/stores/${photo}`) || await save(raw, `src/assets/stores/${photo}`);
    out.push({
      slug, name, uf, address, phone, hours, soon,
      hasPage: Boolean(pageSlug),
      whatsapp: (links.find((l) => /wa\.me|api\.whatsapp/.test(l)) || '').replace(/&text=.*|\?text=.*/, ''),
      instagram: links.find((l) => /instagram\.com/.test(l)) || 'https://www.instagram.com/bombeefburgers/',
      order: links.find((l) => /cardapio\.boh/.test(l)) || '',
      photo: fs.existsSync(`src/assets/stores/${photo}`) ? photo : '',
    });
  }
  fs.writeFileSync('src/data/stores.json', JSON.stringify(out, null, 2));
  console.log('stores', out.length, 'soon', out.filter((s) => s.soon).length, 'pages', out.filter((s) => s.hasPage).length);
}

// Some menu photos sit on opaque white. Flood-fills near-white from the borders to transparent;
// pixels inside the food are never reached, so a white sauce stays.
async function clearWhiteBackground(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const isWhite = (i) => data[i + 3] > 200 && data[i] > 232 && data[i + 1] > 232 && data[i + 2] > 232;
  const corners = [0, w - 1, (h - 1) * w, h * w - 1];
  if (corners.filter((p) => isWhite(p * 4)).length < 3) return;
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p] || !isWhite(p * 4)) continue;
    seen[p] = 1;
    data[p * 4 + 3] = 0;
    const x = p % w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w);
    if (p < w * (h - 1)) stack.push(p + w);
  }
  // Feather the one-pixel rim left against the cleared area.
  for (let p = 0; p < w * h; p++) {
    if (seen[p]) continue;
    if (seen[p - 1] || seen[p + 1] || seen[p - w] || seen[p + w]) data[p * 4 + 3] = Math.min(data[p * 4 + 3], 110);
  }
  await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(`${file}.tmp`);
  fs.renameSync(`${file}.tmp`, file);
  console.log('cleared white background', file);
}

async function menu() {
  mkdir('src/assets/menu');
  const j = await (await fetch(`${MENU}content.json`)).json();
  const byCode = Object.fromEntries(j.products.map((p) => [p.productCode, p]));
  const pick = (node, label) => (node.products || []).map((c) => byCode[c]).filter(Boolean).map((p) => ({
    code: p.productCode, title: p.menu.title, desc: p.menu.listDescription || '',
    detail: (p.menu.detailedDescription || '').replace(/\*?Imagem meramente ilustrativa\.?/i, '').trim(), group: label,
  }));
  const sections = [];
  const top = (t) => j.navigation.children.find((c) => c.title === t);
  const lanches = top('Lanches').children;
  for (const c of lanches) sections.push({ title: c.title, items: pick(c, c.title) });
  sections.splice(2, 0, { title: 'Wagyu', items: pick(top('Wagyu Burger'), 'Wagyu').filter((i) => !/^Combo|Maionese/.test(i.title)) });
  sections.push({ title: 'Acompanhamentos', items: pick(top('Acompanhamentos'), 'Acompanhamentos') });
  sections.push({ title: 'Molhos', items: pick(top('Molhos'), 'Molhos') });
  sections.push({ title: 'Sobremesas', items: top('Sobremesas e Sorvetes').children.flatMap((c) => pick(c, c.title)) });
  for (const s of sections) for (const i of s.items) {
    const file = `src/assets/menu/${i.code}.png`;
    if (await save(`${MENU}${byCode[i.code].imgUrl}`, file)) await clearWhiteBackground(file);
  }
  fs.writeFileSync('src/data/menu.json', JSON.stringify(sections, null, 2));
  console.log('menu', sections.map((s) => `${s.title}:${s.items.length}`).join(' '));
}

async function videos() {
  const x = await (await fetch(YT)).text();
  const out = [...x.matchAll(/<entry>[\s\S]*?<\/entry>/g)].map(([e]) => ({
    id: e.match(/<yt:videoId>(.*?)</)[1],
    title: e.match(/<title>(.*?)</)[1].replace(/&amp;/g, '&').replace(/&#39;/g, '’').replace(/&quot;/g, '"').replace(/\s+/g, ' ').replace(/\s*-\s*Netão Bom Beef\s*$/, '').trim(),
    date: e.match(/<published>(.*?)T/)[1],
    short: /\/shorts\//.test(e.match(/<link[^>]+href="([^"]+)"/)[1]),
  }));
  fs.writeFileSync('src/data/videos.json', JSON.stringify(out, null, 2));
  console.log('videos', out.length, 'shorts', out.filter((v) => v.short).length);
}

async function privacy() {
  const marks = { acute: '́', grave: '̀', tilde: '̃', circ: '̂', cedil: '̧' };
  const decode = (s) => text(s).replace(/&([a-zA-Z])(acute|grave|tilde|circ|cedil);/g, (_, c, m) => c + marks[m]).replace(/&ordm;/g, 'º').replace(/&ordf;/g, 'ª').replace(/&[lr]dquo;/g, '"').replace(/[​‌]/g, '').normalize('NFC');
  const [page] = await (await fetch(`${WP}?slug=politica-de-privacidade&_fields=content`)).json();
  const blocks = [...page.content.rendered.matchAll(/<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => ({ tag: m[1][0] === 'h' ? 'h2' : m[1], text: decode(m[2]) })).filter((b) => b.text);
  const end = blocks.findIndex((b) => /^Seja um Franqueado/.test(b.text));
  const start = blocks.findIndex((b) => /privacidade|cookies/i.test(b.text) && b.text.length > 60);
  fs.writeFileSync('src/data/privacy.json', JSON.stringify(blocks.slice(Math.max(0, start), end < 0 ? undefined : end), null, 1));
  console.log('privacy blocks', end - start);
}

mkdir('src/data');
await privacy();
await stores();
await menu();
await videos();
