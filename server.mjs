import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, resolve, sep, extname} from 'node:path';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const publicRoot = resolve(projectRoot, 'docs');
const upstreamRoutes = {
  '/api/gemini': 'https://generativelanguage.googleapis.com/v1beta/interactions',
  '/api/gemini/content': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'
};
const contentTypes = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8'};

function json(response, status, value) {
  response.writeHead(status, {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'});
  response.end(JSON.stringify(value));
}

async function readBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 128 * 1024) throw Object.assign(new Error('Request is too large.'), {status: 413});
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Request must contain valid JSON.'), {status: 400}); }
}

// The factory accepts a fake upstream for tests. Only the executable loads .env.
export function createDashboardServer({apiKey = '', requestGemini = fetch} = {}) {
  const key = String(apiKey).trim();
  return createServer(async (request, response) => {
    try {
      const host = request.headers.host;
      if (!/^127\.0\.0\.1(?::\d+)?$|^localhost(?::\d+)?$/.test(host || '')) return json(response, 403, {error: 'Unsupported host.'});
      const origin = request.headers.origin;
      const pathname = decodeURIComponent(new URL(request.url, 'http://' + host).pathname);
      if ((pathname.startsWith('/api/') || !['GET', 'HEAD'].includes(request.method)) && ((origin && origin !== 'http://' + host) || request.headers['sec-fetch-site'] === 'cross-site')) return json(response, 403, {error: 'Cross-origin requests are not allowed.'});
      if (pathname === '/api/config' && request.method === 'GET') return json(response, 200, {generationConfigured: Boolean(key)});
      if (Object.hasOwn(upstreamRoutes, pathname)) {
        if (request.method !== 'POST') return json(response, 405, {error: 'Use POST for research requests.'});
        if (!key) return json(response, 503, {error: 'Live research is currently unavailable. Reviewed source search is still available.'});
        if (!request.headers['content-type']?.startsWith('application/json')) return json(response, 415, {error: 'Use application/json.'});
        const body = await readBody(request);
        if (!body || typeof body !== 'object' || Array.isArray(body)) return json(response, 400, {error: 'Invalid research request.'});
        let payload;
        if (pathname === '/api/gemini') {
          if (body.model !== 'gemini-3.8-flash' || typeof body.input !== 'string' || !body.input.trim()) return json(response, 400, {error: 'Invalid research request.'});
          payload = {model: 'gemini-3.8-flash', input: body.input, tools: [{type: 'google_search'}]};
        } else {
          if (!Array.isArray(body.contents) || !body.contents.length) return json(response, 400, {error: 'Invalid research request.'});
          payload = {systemInstruction: body.systemInstruction, contents: body.contents, generationConfig: body.generationConfig};
        }
        const upstream = await requestGemini(upstreamRoutes[pathname], {
          method: 'POST', headers: {'content-type': 'application/json', 'x-goog-api-key': key},
          body: JSON.stringify(payload), signal: AbortSignal.timeout(90000)
        });
        if (!upstream.ok) return json(response, upstream.status, {error: 'Live research could not complete (HTTP ' + upstream.status + '). Please try again later.'});
        const result = await upstream.json();
        // Never relay credential text, even if an upstream error/output echoes it.
        const safeResult = JSON.parse(JSON.stringify(result).split(key).join('[redacted]'));
        return json(response, 200, safeResult);
      }
      if (pathname.startsWith('/api/')) return json(response, 404, {error: 'Not found.'});
      if (!['GET', 'HEAD'].includes(request.method)) return json(response, 405, {error: 'Method not allowed.'});
      // Serve only the generated public directory. Source, .env and git are never public.
      if (pathname.includes('\\') || pathname.split('/').some(part => part.startsWith('.'))) return json(response, 404, {error: 'Not found.'});
      const file = resolve(publicRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(publicRoot + sep) || !Object.hasOwn(contentTypes, extname(file))) return json(response, 404, {error: 'Not found.'});
      const content = await readFile(file);
      response.writeHead(200, {'content-type': contentTypes[extname(file)], 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'same-origin'});
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (response.headersSent) { response.end(); return; }
      const status = error.status || (error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : error instanceof URIError || error instanceof TypeError ? 400 : 502);
      json(response, status, {error: status === 404 ? 'Not found.' : status === 413 ? 'Request is too large.' : status === 400 ? 'Invalid request.' : 'Live research could not complete. Please try again later.'});
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.loadEnvFile(resolve(projectRoot, '.env')); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('Could not load the local .env file.'); }
  const port = Number(process.env.PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
  const server = createDashboardServer({apiKey: process.env.GEMINI_API_KEY});
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'The dashboard port is already in use. Change PORT in .env.' : 'The local dashboard could not start.'); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log('Dashboard ready at http://127.0.0.1:' + port + '\nGemini: ' + (process.env.GEMINI_API_KEY?.trim() ? 'configured' : 'not configured')));
}
