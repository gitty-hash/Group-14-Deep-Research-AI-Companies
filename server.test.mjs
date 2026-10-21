import assert from 'node:assert/strict';
import {once} from 'node:events';
import {request as httpRequest} from 'node:http';
import {readFile, readdir} from 'node:fs/promises';
import {createDashboardServer} from './server.mjs';

async function withServer(options, run) {
  const server = createDashboardServer(options);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  try { await run(base); }
  finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}

const key = 'private-server-test-credential';
const calls = [];
let result = {ok: true, json: async () => ({steps: [{type: 'google_search_call'}]})};
const post = input => ({method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(input)});
const research = {model: 'gemini-3.8-flash', input: 'Compare the supplied reviewed evidence.', tools: [{type: 'google_search'}]};

await withServer({apiKey: key, requestGemini: async (url, options) => { calls.push({url, options}); return result; }}, async base => {
  const config = await fetch(base + '/api/config');
  assert.deepEqual(await config.json(), {generationConfigured: true});
  assert.equal(config.headers.get('cache-control'), 'no-store');
  const html = await fetch(base + '/');
  assert.equal(html.status, 200);
  assert.equal(html.headers.get('cache-control'), 'no-store');
  assert(!(await html.text()).includes(key));
  assert.equal((await fetch(base + '/data/research.json')).status, 200);
  assert.equal((await fetch(base + '/', {headers: {'sec-fetch-site': 'cross-site'}})).status, 200, 'Opening a link from another site must load the dashboard.');
  assert.equal((await fetch(base + '/pages-api.js', {method: 'HEAD'})).status, 200);
  for (const path of ['/.env', '/.env.example', '/server.mjs', '/.git/config', '/%2eenv', '/%2e%2e%2f.env', '/data/%2e%2e%2f%2e%2e%2f.env', '/data%5c..%5c..%5c.env', '/api/missing']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404, path);
    assert(!(await response.text()).includes(key));
  }
  assert.equal((await fetch(base + '/api/gemini')).status, 405);
  assert.equal((await fetch(base + '/api/gemini', {method: 'POST', body: '{}'})).status, 415);
  assert.equal((await fetch(base + '/api/gemini', {...post({}), body: '{broken'})).status, 400);
  assert.equal((await fetch(base + '/api/gemini', post(null))).status, 400);
  assert.equal((await fetch(base + '/api/gemini', post({...research, model: 'unapproved-model'}))).status, 400);
  const crossOrigin = post(research);
  crossOrigin.headers.origin = 'https://unrelated.example';
  assert.equal((await fetch(base + '/api/gemini', crossOrigin)).status, 403);
  const crossSite = post(research);
  crossSite.headers['sec-fetch-site'] = 'cross-site';
  assert.equal((await fetch(base + '/api/gemini', crossSite)).status, 403);
  const wrongHostStatus = await new Promise((resolve, reject) => {
    const request = httpRequest(base + '/api/gemini', {headers: {host: 'unrelated.example'}}, response => { response.resume(); resolve(response.statusCode); });
    request.on('error', reject);
    request.end();
  });
  assert.equal(wrongHostStatus, 403);
  assert.equal(calls.length, 0);

  const response = await fetch(base + '/api/gemini', post({...research, apiKey: 'ignored-browser-key', tools: [{type: 'unapproved_tool'}]}));
  assert.equal(response.status, 200);
  assert.equal(calls[0].url, 'https://generativelanguage.googleapis.com/v1beta/interactions');
  assert.equal(calls[0].options.headers['x-goog-api-key'], key);
  assert.deepEqual(JSON.parse(calls[0].options.body), research);
  assert(!calls[0].options.body.includes(key));
  assert(!(await response.text()).includes(key));

  const content = {contents: [{parts: [{text: 'Summarize supplied notes.'}]}], generationConfig: {responseMimeType: 'application/json'}};
  assert.equal((await fetch(base + '/api/gemini/content', post(content))).status, 200);
  assert(calls.at(-1).url.endsWith('gemini-3.5-flash-lite:generateContent'));
  assert.equal(calls.at(-1).options.headers['x-goog-api-key'], key);

  result = {ok: false, status: 403, json: async () => ({error: key})};
  const denied = await fetch(base + '/api/gemini', post(research));
  assert.equal(denied.status, 403);
  assert(!(await denied.text()).includes(key));
  result = {ok: true, json: async () => ({text: key})};
  assert.deepEqual(await (await fetch(base + '/api/gemini', post(research))).json(), {text: '[redacted]'});
  result = {ok: true, json: async () => { throw new Error(key); }};
  const failed = await fetch(base + '/api/gemini', post(research));
  assert.equal(failed.status, 502);
  assert(!(await failed.text()).includes(key));
  const oversized = await fetch(base + '/api/gemini', post({...research, input: 'x'.repeat(129 * 1024)}));
  assert.equal(oversized.status, 413);
});

await withServer({}, async base => {
  assert.deepEqual(await (await fetch(base + '/api/config')).json(), {generationConfigured: false});
  const missingKey = await fetch(base + '/api/gemini', post(research));
  assert.equal(missingKey.status, 503);
  const failure = await missingKey.json();
  assert.equal(failure.code, 'GEMINI_KEY_MISSING');
  assert.match(failure.error, /provide a Gemini API key in the \.env file/);
  assert.equal((await fetch(base + '/')).status, 200);
});

// Scan every public artifact for the local credential without printing the value.
let localKey = '';
try { localKey = (await readFile('.env', 'utf8')).match(/^GEMINI_API_KEY=(.+)$/m)?.[1].trim() || ''; }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const path of await readdir('docs', {recursive: true, withFileTypes: true})) {
  if (!path.isFile()) continue;
  assert(!path.name.startsWith('.env'), 'An environment file must not be public.');
  if (localKey) assert(!(await readFile(path.parentPath + '/' + path.name, 'utf8')).includes(localKey), 'A public artifact contains the local credential.');
}
console.log('Private Gemini proxy, credential isolation, static paths, origin checks and failure handling passed. No real Gemini requests were made.');
