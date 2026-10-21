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
  const context = {URL, URLSearchParams, AbortSignal, Blob, setTimeout, document: {baseURI}, fetch: async (path, options) => {
    const url = new URL(path, baseURI);
    calls.push({url, options});
    if (url.pathname.endsWith('/research.json')) return Response.json(structuredClone(seed));
    if (url.pathname.endsWith('/updates.json')) return Response.json({news: []});
    if (url.pathname.endsWith('/runtime-config.json')) return Response.json(runtime);
    if (url.pathname === '/api/config') { assert.equal(url.origin, apiOrigin); return Response.json({generationConfigured: true}); }
    if (url.pathname === '/api/gemini') { assert.equal(url.origin, apiOrigin); return Response.json({steps: [{type: 'google_search_call'}, {type: 'model_output', content: [{type: 'text', text: 'Meta publishes standard API pricing. [M2]', annotations: []}]}]}); }
    if (url.pathname === '/api/gemini/content') { assert.equal(url.origin, apiOrigin); return Response.json({candidates: []}); }
    throw new Error('Unexpected request');
  }};
  vm.createContext(context);
  vm.runInContext(rag, context);
  vm.runInContext(adapter, context);
  const data = await context.PagesAPI.load();
  assert.equal(data.generationConfigured, true);
  assert.equal(data.backendAvailable, true);
  assert.equal(calls.some(call => call.url.pathname.endsWith('/runtime-config.json')), !local, 'Local .env server takes priority over the hosted API.');
  const answer = await context.PagesAPI.ask({question: 'Meta API pricing', company: 'Meta', generate: true});
  assert.equal(answer.mode, 'Agentic Gemini RAG');
  assert.equal(calls.at(-1).url.origin, apiOrigin);
  assert.equal(calls.at(-1).options.headers['x-goog-api-key'], undefined);
  await context.PagesAPI.requestGemini('/api/gemini/content', {method: 'POST', headers: {'content-type': 'application/json'}, body: '{}'});
  assert.equal(calls.at(-1).url.origin, apiOrigin);
  context.fetch = async () => Response.json({code: 'GEMINI_KEY_MISSING'}, {status: 503});
  assert.match((await context.PagesAPI.ask({question: 'Meta API pricing', generate: true})).notice, /provide a Gemini API key in the \.env file/);
}
console.log('GitHub Pages uses the hosted Gemini API; localhost uses its .env server. Neither sends a browser credential.');
