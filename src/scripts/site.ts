// Small behaviours shared by every page. Each one is inert when its element is absent.

// Mobile menu: native <dialog> gives focus trapping, Esc and inert background for free.
const menu = document.querySelector<HTMLDialogElement>('[data-menu]');
document.querySelector('[data-menu-open]')?.addEventListener('click', () => menu?.showModal());
menu?.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t === menu || t.closest('[data-menu-close]') || t.closest('a')) menu.close();
});

// YouTube facade: the player only loads on request.
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-yt]');
  if (!btn) return;
  const f = document.createElement('iframe');
  f.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0`;
  f.title = btn.dataset.title || 'Vídeo do Netão Bom Beef';
  f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
  f.allowFullscreen = true;
  btn.replaceWith(f);
  f.focus();
});

// Weight picker on the home page.
document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((root) => {
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role=tab]')];
  const select = (t: HTMLButtonElement, focus = false) => {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')!)!.hidden = !on;
    });
    if (focus) t.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
});

// Store filter: works on server-rendered rows, so without JS the full list simply stays visible.
const filter = document.querySelector<HTMLFormElement>('[data-store-filter]');
if (filter) {
  const rows = [...document.querySelectorAll<HTMLElement>('[data-store]')];
  const count = document.querySelector('[data-store-count]')!;
  const empty = document.querySelector<HTMLElement>('[data-store-empty]')!;
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const run = () => {
    const uf = (filter.elements.namedItem('uf') as HTMLSelectElement).value;
    const q = norm((filter.elements.namedItem('q') as HTMLInputElement).value.trim());
    let n = 0;
    for (const r of rows) {
      const show = (!uf || r.dataset.uf === uf) && (!q || norm(r.dataset.store!).includes(q));
      r.hidden = !show;
      if (show) n++;
    }
    count.textContent = `${n} ${n === 1 ? 'unidade' : 'unidades'}`;
    empty.hidden = n > 0;
  };
  filter.addEventListener('input', run);
  filter.addEventListener('submit', (e) => e.preventDefault());
  filter.addEventListener('reset', () => setTimeout(run));
}

// Franchise lead form. Success is only ever shown after the server confirms delivery.
document.querySelectorAll<HTMLFormElement>('[data-lead]').forEach((form) => {
  form.noValidate = true; // messages render inline; without JS the browser's own validation still applies
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[type=submit]')!;
  const params = new URLSearchParams(location.search);
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term']) {
    const el = form.elements.namedItem(k) as HTMLInputElement | null;
    if (el && params.get(k)) el.value = params.get(k)!;
  }
  (form.elements.namedItem('started') as HTMLInputElement).value = String(Date.now());
  if (params.get('erro')) status.textContent = 'O cadastro não foi enviado. Confira os dados e tente de novo.';

  const showError = (field: HTMLInputElement | HTMLSelectElement) => {
    const box = field.closest('.field');
    const msg = box?.querySelector('.field__error');
    if (msg) msg.textContent = field.validationMessage;
    field.setAttribute('aria-invalid', String(!field.validity.valid));
  };
  form.addEventListener('invalid', (e) => { e.preventDefault(); showError(e.target as HTMLInputElement); }, true);
  form.addEventListener('change', (e) => { const t = e.target as HTMLInputElement; if (t.willValidate) showError(t); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) {
      (form.querySelector('[aria-invalid=true]') as HTMLElement | null)?.focus();
      return;
    }
    submit.disabled = true;
    status.textContent = 'Enviando seu cadastro…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar agora.');
      (window as any).dataLayer?.push({ event: 'franchise_lead' });
      location.href = '/quero-ser-franqueado/sucesso/';
    } catch (err) {
      status.textContent = `${(err as Error).message} Seus dados continuam aqui: tente de novo ou escreva para netaobombeef@gmail.com.`;
      submit.disabled = false;
    }
  });
});

// Consent gate for the tags the current site already runs (GTM). Nothing loads before a yes.
const GTM = import.meta.env.PUBLIC_GTM_ID as string | undefined;
const bar = document.querySelector<HTMLElement>('[data-consent]');
const read = () => { try { return localStorage.getItem('bb-consent'); } catch { return null; } };
const loadTags = () => {
  if (!GTM) return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM}`;
  document.head.append(s);
};
if (read() === 'yes') loadTags();
else if (read() === null && bar && GTM) bar.hidden = false;
bar?.addEventListener('click', (e) => {
  const v = (e.target as HTMLElement).closest<HTMLElement>('[data-consent-value]')?.dataset.consentValue;
  if (!v) return;
  try { localStorage.setItem('bb-consent', v); } catch {}
  bar.hidden = true;
  if (v === 'yes') loadTags();
});
