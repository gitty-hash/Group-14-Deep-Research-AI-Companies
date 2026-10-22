import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {seed} from './seed.mjs';

const runtime = JSON.parse(await readFile('runtime-config.json', 'utf8'));
const remoteOrigin = new URL(runtime.geminiApiBaseUrl).origin;
assert.equal(new URL(remoteOrigin).protocol, 'https:');
const adapter = await readFile('pages-api.js', 'utf8');
const rag = await readFile('rag-core.js', 'utf8');
for (const baseURI of ['https://gitty-hash.github.io/Group-14-Deep-Research-AI-Companies/', 'http://127.0.0.1:8787/']) {
  const calls = [];
  const local = baseURI.startsWith('http://127.0.0.1');
  const apiOrigin = local ? new URL(baseURI).origin : remoteOrigin;
  let config = {generationConfigured: false, keyMode: 'visitor'};
  const context = {URL, URLSearchParams, AbortSignal, Blob, setTimeout, document: {baseURI}, fetch: async (path, options) => {
    const url = new URL(path, baseURI);
    calls.push({url, options});
    if (url.pathname.endsWith('/research.json')) return Response.json(structuredClone(seed));
    if (url.pathname.endsWith('/updates.json')) return Response.json({news: []});
    if (url.pathname.endsWith('/runtime-config.json')) return Response.json(runtime);
    if (url.pathname === '/api/config') { assert.equal(url.origin, apiOrigin); return Response.json(config); }
    if (url.pathname === '/api/gemini') { assert.equal(url.origin, apiOrigin); return Response.json({steps: [{type: 'google_search_call'}, {type: 'model_output', content: [{type: 'text', text: 'Meta publishes standard API pricing. [M2]', annotations: []}]}]}); }
    if (url.pathname === '/api/gemini/content') { assert.equal(url.origin, apiOrigin); return Response.json({candidates: []}); }
    throw new Error('Unexpected request');
  }};
  vm.createContext(context);
  vm.runInContext(rag, context);
  vm.runInContext(adapter, context);
  const api = context.PagesAPI;
  let data = await api.load();
  assert.equal(data.generationConfigured, false);
  assert.equal(data.backendAvailable, true);
  assert.equal(calls.some(call => call.url.pathname.endsWith('/runtime-config.json')), !local);
  const priorCalls = calls.length;
  assert.match((await api.ask({question: 'Meta API pricing', generate: true})).notice, /Add your own Gemini API key/);
  assert.equal(calls.length, priorCalls, 'No Gemini request without a visitor key.');
  assert.throws(() => api.setGeminiKey('bad key'), /valid Gemini API key/);
  api.setGeminiKey('first-visitor-test-key');
  assert.equal(data.generationConfigured, true);
  assert.equal(api.hasGeminiKey(), true);
  const answer = await api.ask({question: 'Meta API pricing', company: 'Meta', generate: true});
  assert.equal(answer.mode, 'Agentic Gemini RAG');
  const call = calls.at(-1);
  assert.equal(call.url.origin, apiOrigin);
  assert.equal(call.options.headers['x-gemini-api-key'], 'first-visitor-test-key');
  assert.equal(call.options.credentials, 'omit');
  assert.equal(call.options.redirect, 'error');
  assert.equal(call.options.cache, 'no-store');
  assert(!call.options.body.includes('first-visitor-test-key'));
  assert(!JSON.stringify(data).includes('first-visitor-test-key'));
  api.setGeminiKey('second-visitor-test-key');
  await api.requestGemini('/api/gemini/content', {method: 'POST', headers: {'content-type': 'application/json'}, body: '{}'});
  assert.equal(calls.at(-1).options.headers['x-gemini-api-key'], 'second-visitor-test-key');
  assert.throws(() => api.requestGemini('https://unrelated.example/steal'), /Unsupported/);
  api.setGeminiKey('');
  assert.equal(data.generationConfigured, false);
  assert.equal(api.hasGeminiKey(), false);
  assert.throws(() => api.requestGemini('/api/gemini'), /Add your own/);
  api.setGeminiKey('second-visitor-test-key');
  const healthyFetch = context.fetch;
  context.fetch = async () => Response.json({code: 'GEMINI_KEY_MISSING'}, {status: 401});
  assert.match((await api.ask({question: 'Meta API pricing', generate: true})).notice, /Add a valid Gemini API key/);
  context.fetch = healthyFetch;
  config = {generationConfigured: true};
  data = await api.load();
  assert.equal(data.generationConfigured, false, 'A legacy owner-key service must never enable Gemini.');
  assert.throws(() => api.requestGemini('/api/gemini'), /visitor-key Gemini service/);
  vm.runInContext(adapter, context);
  assert.equal(context.PagesAPI.hasGeminiKey(), false, 'A fresh page starts without a key.');
}
assert(!/localStorage|sessionStorage|document.cookie/.test(adapter));
console.log('Visitor-key routing, key replacement/clearing, reload behavior, legacy-service rejection and credential isolation passed.');
