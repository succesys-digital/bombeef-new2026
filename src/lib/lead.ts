// Validates a franchise lead and maps it to RD Station's public conversion API.
// Docs: https://developers.rdstation.com/reference/conversao

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

// Exact values of the production form's custom field, so existing RD segmentation keeps working.
export const INVESTMENT = ['Tenho de R$ 500 mil a R$ 600 mil', 'Tenho de R$ 700 mil a R$ 950 mil', 'Tenho mais de R$ 950 mil'];

export const CONVERSION_ID = 'form-p9-bb-burger';

export interface Lead {
  name: string; email: string; phone: string; city: string; state: string; investment: string;
  utm: { source: string; medium: string; campaign: string; term: string };
}

export type Parsed = { ok: true; lead: Lead; spam: boolean } | { ok: false; errors: Record<string, string> };

export function parseLead(form: { get(k: string): unknown }, now = Date.now()): Parsed {
  const s = (k: string, max = 160) => String(form.get(k) ?? '').trim().slice(0, max);
  const name = s('name'), email = s('email').toLowerCase(), digits = s('phone', 30).replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  const city = s('city'), state = s('state', 2).toUpperCase(), investment = s('investment');
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = 'Informe seu nome.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Informe um email válido.';
  if (!/^[1-9]\d(9\d{8}|[2-8]\d{7})$/.test(digits)) errors.phone = 'Informe o celular com DDD.';
  if (city.length < 2) errors.city = 'Informe a cidade.';
  if (!UFS.includes(state)) errors.state = 'Selecione o estado.';
  if (!INVESTMENT.includes(investment)) errors.investment = 'Selecione o valor disponível.';
  if (form.get('consent') !== 'on') errors.consent = 'Aceite a política para enviar.';
  if (Object.keys(errors).length) return { ok: false, errors };

  // Filled honeypot or a form submitted under 2s: pretend success, send nothing.
  const started = Number(form.get('started'));
  const spam = Boolean(s('website')) || (started > 0 && now - started < 2000);
  return {
    ok: true, spam,
    lead: {
      name, email, phone: `+55${digits}`, city, state, investment,
      utm: { source: s('utm_source'), medium: s('utm_medium'), campaign: s('utm_campaign'), term: s('utm_term') },
    },
  };
}

export function toRdPayload(l: Lead, conversionId = CONVERSION_ID) {
  const payload: Record<string, unknown> = {
    conversion_identifier: conversionId,
    name: l.name,
    email: l.email,
    phone: l.phone,
    mobile_phone: l.phone,
    city: l.city,
    state: l.state,
    cf_digite_o_valor_disponivel_para_investir_0: l.investment,
    legal_bases: [{ category: 'communications', type: 'consent', status: 'granted' }],
  };
  if (l.utm.source) payload.traffic_source = l.utm.source;
  if (l.utm.medium) payload.traffic_medium = l.utm.medium;
  if (l.utm.campaign) payload.traffic_campaign = l.utm.campaign;
  if (l.utm.term) payload.traffic_value = l.utm.term;
  return { event_type: 'CONVERSION', event_family: 'CDP', payload };
}
