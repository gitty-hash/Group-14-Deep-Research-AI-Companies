import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {seed} from './seed.mjs';
import {parseFeed,parsePrices} from './collector.mjs';
const adapter=await readFile('docs/pages-api.js','utf8');
const html=await readFile('docs/index.html','utf8');
const updates=JSON.parse(await readFile('docs/data/updates.json','utf8'));
const requests=[];
const context={URL,Blob,AbortSignal,setTimeout,console,document:{baseURI:'https://gitty-hash.github.io/Group-14-Deep-Research-AI-Companies/'},fetch:async(url,opts)=>{requests.push({url:String(url),opts});if(String(url).endsWith('/research.json'))return {ok:true,json:async()=>seed};if(String(url).endsWith('/updates.json'))return {ok:true,json:async()=>updates};throw new Error('Unexpected request');}};
vm.createContext(context);vm.runInContext(await readFile('rag-core.js','utf8'),context);vm.runInContext(adapter,context);const api=context.PagesAPI;
await api.load();
assert(requests[0].url.includes('/Group-14-Deep-Research-AI-Companies/data/research.json'));
for(const [q,id] of [['How do API costs and data-use terms differ?','M2'],['Are Meta and Google partners as well as competitors?','G3'],['How do the companies compare on revenue and profit?','M7'],['Is Llama open source without restrictions?','M6']]){
 const a=await api.ask({question:q});assert(a.sources.some(s=>s.id===id));assert.equal(a.mode,'Source summary');
}
assert.equal((await api.ask({question:'What is the best pasta recipe?'})).sources.length,0);
await assert.rejects(()=>api.ask({question:'API pricing',generate:true}),/own Gemini key/);
assert((await api.ask({question:'API pricing',company:'Meta'})).sources.every(x=>x.company==='Meta'));
context.fetch=async(url,opts)=>{requests.push({url:String(url),opts});return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Meta lists standard API prices. [M2]'}]}}]})};};
const generated=await api.ask({question:'API pricing',generate:true,apiKey:'unit-test-key'});
assert.equal(generated.mode,'Gemini RAG');
assert.equal(requests.at(-1).url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
assert.equal(requests.at(-1).opts.headers['x-goog-api-key'],'unit-test-key');
assert(!requests.at(-1).opts.body.includes('unit-test-key'));
context.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Invented claim [G99]'}]}}]})});
assert.equal((await api.ask({question:'API pricing',generate:true,apiKey:'unit-test-key'})).mode,'Source summary');
context.fetch=async()=>({ok:false,status:403});
assert.match((await api.ask({question:'API pricing',generate:true,apiKey:'unit-test-key'})).notice,/HTTP 403/);
assert(!/localStorage|sessionStorage/.test(adapter));
assert(!/fetch\('\/api\/|location.href='\/api\//.test(html));
assert(html.includes('GitHub Pages edition'));
assert(!html.includes('passes through this private dashboard'));
assert(!html.includes('The Check sources button fetches official'));
new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]);
assert.equal(new Set(seed.sources.map(s=>s.id)).size,31);
for(const model of seed.models)assert(seed.sources.some(s=>s.id===model.source));
assert.equal(10000*(1000*1.25+500*4.25)/1e6,33.75);
assert.deepEqual(parsePrices('<p>Publisher changed its page</p>','Google'),[]);
const feed='<rss><item><title>Gemini AI update</title><link>https://evil.invalid/</link><pubDate>Fri, 16 Oct 2026 12:00:00 GMT</pubDate></item></rss>';
assert.equal(parseFeed(feed,{company:'Google',host:'blog.google'}).length,0);
console.log('Pages path handling, evidence retrieval, Gemini requests, citation fallback, secret handling and collector checks passed.');

for(const company of ['OpenAI','Anthropic']){
 const answer=await api.ask({question:'What are standard API token prices?',company});
 assert(answer.sources.length>0);assert(answer.sources.every(s=>s.company===company));
 const c=seed.companies.find(c=>c.name===company);
 for(const key of ['revenue','margin','growth','grossprofit','netincome'])assert(Number.isFinite(c.performance[key].value));
}
context.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Standard Sol prices apply. [O2]'}]}}]})});
assert.equal((await api.ask({question:'GPT-6.1 Sol API price',company:'OpenAI',generate:true,apiKey:'unit-test-key'})).mode,'Gemini RAG');
context.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Unsupported source. [Z99]'}]}}]})});
assert.equal((await api.ask({question:'Claude pricing',company:'Anthropic',generate:true,apiKey:'unit-test-key'})).mode,'Source summary');
console.log('Four-company retrieval, populated annual financials and new citation-prefix checks passed.');

// Render every company with baseline prices: collected updates must remain optional.
const renderCosts=new Function('DATA','workload','models','refs',html.match(/^function costs\(\).*$/m)[0]+';return costs();');
for(const selected of ['All','Google','Meta','OpenAI','Anthropic']){
 const entries=seed.models.filter(m=>selected==='All'||m.company===selected).map(m=>({...m,live:false}));
 const result=renderCosts(seed,{requests:10000,inputtokens:1000,outputtokens:500,contributor:false},()=>entries,()=> '');
 assert(result.includes('Workload calculator'));
 for(const entry of entries)assert(result.includes(entry.name));
 assert(result.includes('Reviewed '));
}
console.log('Cost tab renders for all companies without collected pricing updates.');

// Exercise generation, source validation and repair without sending a real API key.
const rag=new Function(await (await import('node:fs/promises')).readFile('rag-core.js','utf8')+'\nreturn ResearchRAG;')();
const ragData=typeof seed==='undefined'?data:seed;
const comparison='What is Claude Code doing better than Antigravity of Google?';
const evidence=rag.retrieve(ragData.sources,comparison,'Anthropic');
assert(evidence.some(s=>s.id==='A5')&&evidence.some(s=>s.id==='G7'));
assert(evidence.every(s=>['Google','Anthropic'].includes(s.company)));
const summary=rag.sourceSummary(comparison,evidence);
assert(summary.answer.includes('[A5]')&&summary.answer.includes('[G7]'));
assert.match(summary.limitation,/do not establish/);
const good={sentences:[{text:'The reviewed documentation does not establish a performance winner.',sourceIds:['A5','G7']},{text:'Claude Code documents repository edits and command execution.',sourceIds:['A5']}],limitation:'A comparable test would be needed.',insufficientEvidence:false};
const fakeResponse=text=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text}]}}]})});
let generationCalls=0;
const valid=await rag.generate(comparison,evidence,'test-only-key',async(url,opts)=>{
 generationCalls++;
 const body=JSON.parse(opts.body);
 assert.equal(body.generationConfig.responseMimeType,'application/json');
 assert(body.generationConfig.responseJsonSchema.properties.sentences.items.properties.sourceIds.items.enum.includes('A5'));
 assert(!opts.body.includes('test-only-key'));
 return fakeResponse(JSON.stringify(good));
});
assert.equal(generationCalls,1);assert.equal(valid.mode,'Gemini RAG');
assert(valid.answer.includes('[A5]'));assert(valid.sources.some(s=>s.id==='G7'));
const grouped=rag.parseAnswer('Capabilities overlap. [A5, G7]',evidence);
assert(grouped&&grouped.answer.includes('[A5] [G7]'));
assert.equal(rag.parseAnswer('Invented claim. [Z99]',evidence),null);
assert.equal(rag.parseAnswer(JSON.stringify({...good,sentences:[{text:'No citations',sourceIds:[]}]}),evidence),null);
const gap=rag.parseAnswer(JSON.stringify({sentences:[],limitation:'The reviewed sources do not contain this benchmark.',insufficientEvidence:true}),evidence);
assert(gap&&gap.sources.length===0&&gap.answer.includes('do not contain'));
generationCalls=0;
const repaired=await rag.generate(comparison,evidence,'test-only-key',async()=>fakeResponse(++generationCalls===1?'Malformed output':JSON.stringify(good)));
assert.equal(generationCalls,2);assert.equal(repaired.mode,'Gemini RAG');
generationCalls=0;
const rejected=await rag.generate(comparison,evidence,'test-only-key',async()=>{generationCalls++;return fakeResponse(JSON.stringify({...good,sentences:[{text:'Unverified fabricated winner',sourceIds:['Z99']}]}));});
assert.equal(generationCalls,2);assert.equal(rejected.mode,'Source summary');
assert(!rejected.answer.includes('fabricated winner'));assert.match(rejected.notice,/valid source references/);
generationCalls=0;
const blocked=await rag.generate(comparison,evidence,'test-only-key',async()=>{generationCalls++;return {ok:true,json:async()=>({promptFeedback:{blockReason:'SAFETY'}})};});
assert.equal(generationCalls,1);assert.equal(blocked.mode,'Source summary');
assert.match((await rag.generate(comparison,evidence,'test-only-key',async()=>({ok:false,status:429}))).notice,/HTTP 429/);
assert.equal(rag.sourceSummary('unrelated question',[]).mode,'Evidence gap');
console.log('Answer-first RAG, cross-company retrieval, grouped citations, evidence gaps, bounded repair and failure summaries passed.');

// Exercise the complete overview and chart for every metric and company filter.
const uiScript=html.match(/<script>([\s\S]*)<\/script>/)[1];
const overviewProgram=uiScript.slice(0,uiScript.indexOf("document.addEventListener('click'"));
const renderOverview=new Function('initialData','selectedMetric','selectedCompany','document',overviewProgram+'\nDATA=initialData;metric=selectedMetric;company=selectedCompany;const result=overview();drawChart();return result;');
for(const selectedCompany of ['All','Google','Meta','OpenAI','Anthropic'])for(const selectedMetric of ['revenue','margin','growth','grossprofit','netincome']){
 const chart={attributes:{},setAttribute(name,value){this.attributes[name]=value;},innerHTML:''};
 const result=renderOverview(ragData,selectedMetric,selectedCompany,{querySelector:()=>chart});
 assert.equal((result.match(/data-metric=/g)||[]).length,5);
 assert(!result.includes('Not disclosed'));assert(!result.includes('Unavailable'));
 assert(result.includes('FY2025'));assert(chart.attributes['aria-label'].includes('FY2025'));
 assert.equal((chart.innerHTML.match(/<rect /g)||[]).length,selectedCompany==='All'?4:1);
 assert(!/NaN|Infinity/.test(chart.innerHTML));
}
assert.equal(ragData.financialPeriod,'FY2025');
for(const c of ragData.companies)for(const key of ['revenue','margin','growth','grossprofit','netincome']){
 const value=c.performance[key];assert(Number.isFinite(value.value));
 assert(value.refs.every(id=>ragData.sources.some(s=>s.id===id)));
}
assert(Math.abs(ragData.companies.find(c=>c.name==='OpenAI').performance.margin.value-42.6167)<.001);
assert.equal(ragData.companies.find(c=>c.name==='Anthropic').performance.margin.approximate,true);
assert.equal(ragData.companies.find(c=>c.name==='Anthropic').performance.growth.value,1088);
console.log('FY2025 overview, charts, source references and all 25 company/metric combinations passed.');

// Losses must extend left of zero; profits right, with positive SVG widths.
for(const selectedCompany of ['All','OpenAI','Anthropic']){
 const chart={attributes:{},setAttribute(n,v){this.attributes[n]=v;},innerHTML:''};
 const result=renderOverview(ragData,'netincome',selectedCompany,{querySelector:()=>chart});
 const zero=Number(chart.innerHTML.match(/data-zero="true" x1="([^"]+)"/)[1]);
 const bars=[...chart.innerHTML.matchAll(/<rect x="([^"]+)" y="[^"]+" width="([^"]+)"[^>]*><title>([^<]+)<\/title>/g)];
 for(const [,left,width,title] of bars){
  assert(Number(width)>0);
  if(/OpenAI|Anthropic/.test(title)){assert(Number(left)<zero);assert(Math.abs(Number(left)+Number(width)-zero)<1e-8);assert(title.includes('−$'));}
  else assert.equal(Number(left),zero);
 }
 assert(result.includes('noncash'));assert(!result.includes('$-'));
}
assert(Math.abs(ragData.companies.find(c=>c.name==='Google').performance.grossprofit.value-240.301)<1e-8);
assert(Math.abs(ragData.companies.find(c=>c.name==='Meta').performance.grossprofit.value-164.791)<1e-8);
assert.equal(ragData.companies.find(c=>c.name==='OpenAI').performance.netincome.value,-38.53);
assert.equal(ragData.companies.find(c=>c.name==='Anthropic').performance.netincome.value,-41.97);
assert.equal(ragData.companies.find(c=>c.name==='Anthropic').performance.grossprofit.approximate,true);
console.log('Gross profit derivations, attributable net losses and signed comparison charts passed.');
