// Cloudflare Pages Function: POST /api/lead. Set RD_PUBLIC_TOKEN in the Pages project settings.
import { parseLead, toRdPayload } from '../../src/lib/lead';

interface Env { RD_PUBLIC_TOKEN?: string; RD_CONVERSION_ID?: string }
interface Ctx { request: Request; env: Env }

const FORM = '/quero-ser-franqueado/';

export async function onRequestPost({ request, env }: Ctx) {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const reply = (status: number, body: Record<string, unknown>, redirect: string) =>
    wantsJson ? Response.json(body, { status }) : Response.redirect(new URL(redirect, request.url), 303);
  const failed = `${FORM}?erro=1#cadastro`;

  // Same-origin only: this endpoint forwards to a CRM.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return reply(403, { error: 'Origem não permitida.' }, failed);

  let form: FormData;
  try { form = await request.formData(); } catch { return reply(400, { error: 'Envio inválido.' }, failed); }

  const parsed = parseLead(form);
  if (!parsed.ok) return reply(422, { error: Object.values(parsed.errors)[0], errors: parsed.errors }, failed);
  if (parsed.spam) return reply(200, { ok: true }, `${FORM}sucesso/`);

  // Without the integration the form must say so, never fake a success.
  if (!env.RD_PUBLIC_TOKEN) return reply(503, { error: 'O envio de cadastros ainda não está ativo.' }, failed);

  const res = await fetch(`https://api.rd.services/platform/conversions?api_key=${encodeURIComponent(env.RD_PUBLIC_TOKEN)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(toRdPayload(parsed.lead, env.RD_CONVERSION_ID)),
  }).catch(() => null);

  if (!res?.ok) {
    console.error('rd conversion failed', res?.status, await res?.text().catch(() => ''));
    return reply(502, { error: 'Não foi possível enviar agora.' }, failed);
  }
  return reply(200, { ok: true }, `${FORM}sucesso/`);
}
