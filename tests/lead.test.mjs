import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLead, toRdPayload, INVESTMENT } from '../src/lib/lead.ts';

const form = (over = {}) => new Map(Object.entries({
  name: 'Ana Souza', email: 'ANA@exemplo.com.br', phone: '(11) 91234-5678', city: 'Santos', state: 'sp',
  investment: INVESTMENT[1], consent: 'on', started: '1000', website: '', ...over,
}));

test('valid lead is normalised', () => {
  const r = parseLead(form(), 60000);
  assert.equal(r.ok, true);
  assert.equal(r.spam, false);
  assert.equal(r.lead.phone, '+5511912345678');
  assert.equal(r.lead.email, 'ana@exemplo.com.br');
  assert.equal(r.lead.state, 'SP');
});

test('landline with DDD and +55 prefix are accepted', () => {
  assert.equal(parseLead(form({ phone: '+55 11 3123-4567' }), 60000).lead.phone, '+551131234567');
});

for (const [field, value] of [['name', 'A'], ['email', 'ana@x'], ['phone', '12345'], ['phone', '00912345678'], ['city', ''], ['state', 'XX'], ['investment', 'R$ 1'], ['consent', undefined]]) {
  test(`rejects ${field}=${value}`, () => {
    const r = parseLead(form({ [field]: value }), 60000);
    assert.equal(r.ok, false);
    assert.ok(r.errors[field]);
  });
}

test('honeypot and too-fast submits are flagged as spam', () => {
  assert.equal(parseLead(form({ website: 'x' }), 60000).spam, true);
  assert.equal(parseLead(form({ started: '59000' }), 60000).spam, true);
});

test('RD payload keeps production identifiers and consent', () => {
  const { lead } = parseLead(form({ utm_source: 'google', utm_campaign: 'franquia' }), 60000);
  const body = toRdPayload(lead);
  assert.equal(body.event_type, 'CONVERSION');
  assert.equal(body.event_family, 'CDP');
  assert.equal(body.payload.conversion_identifier, 'form-p9-bb-burger');
  assert.equal(body.payload.cf_digite_o_valor_disponivel_para_investir_0, INVESTMENT[1]);
  assert.equal(body.payload.legal_bases[0].status, 'granted');
  assert.equal(body.payload.traffic_source, 'google');
  assert.equal(body.payload.traffic_medium, undefined);
});
