import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {seed} from './seed.mjs';
import {parseFeed,parsePrices} from './collector.mjs';
const adapter=await readFile('docs/pages-api.js','utf8');
const html=await readFile('docs/index.html','utf8');
const updates=JSON.parse(await readFile('docs/data/updates.json','utf8'));
const stockSnapshot=JSON.parse(await readFile('docs/data/stock-snapshot.json','utf8'));
const requests=[];
const context={URL,URLSearchParams,Blob,AbortSignal,setTimeout,console,document:{baseURI:'https://gitty-hash.github.io/Group-14-Deep-Research-AI-Companies/'},fetch:async(url,opts)=>{requests.push({url:String(url),opts});if(String(url).endsWith('/research.json'))return {ok:true,json:async()=>seed};if(String(url).endsWith('/updates.json'))return {ok:true,json:async()=>updates};throw new Error('Unexpected request');}};
vm.createContext(context);vm.runInContext(await readFile('rag-core.js','utf8'),context);vm.runInContext(adapter,context);const api=context.PagesAPI;
await api.load();
assert(requests[0].url.includes('/Group-14-Deep-Research-AI-Companies/data/research.json'));
assert.equal(api.retrieve('latest AI news').some(source=>source.kind==='news'),true);
for(const [q,id] of [['How do API costs and data-use terms differ?','M2'],['Are Meta and Google partners as well as competitors?','G3'],['How do the companies compare on revenue and profit?','M7'],['Is Llama open source without restrictions?','M6']]){
 const a=await api.ask({question:q});assert(a.sources.some(s=>s.id===id));assert.equal(a.mode,'Source summary');
}
assert.equal((await api.ask({question:'What is the best pasta recipe?'})).sources.length,0);
await assert.rejects(()=>api.ask({question:'API pricing',generate:true}),/own Gemini key/);
assert((await api.ask({question:'API pricing',company:'Meta'})).sources.every(x=>x.company==='Meta'));
const localNews=await api.ask({question:'What are the latest AI announcements from Google and Meta?'});
assert(localNews.sources.some(source=>source.kind==='news'),'Recent official-news headlines should enter retrieval.');
assert(localNews.answer.includes('Recent official-news headline'));
context.fetch=async(url,opts)=>{requests.push({url:String(url),opts});return {ok:true,json:async()=>({steps:[
 {type:'google_search_call',arguments:{queries:['Meta current AI API pricing']}},
 {type:'model_output',content:[{type:'text',text:'Meta lists standard API prices. [M2]',annotations:[{type:'url_citation',title:'Meta API pricing',url:'https://example.com/meta-pricing'}]}]}
]})};};
const generated=await api.ask({question:'API pricing',generate:true,apiKey:'unit-test-key'});
assert.equal(generated.mode,'Agentic Gemini RAG');
assert.equal(requests.at(-1).url,'https://generativelanguage.googleapis.com/v1beta/interactions');
assert.equal(requests.at(-1).opts.headers['x-goog-api-key'],'unit-test-key');
assert(!requests.at(-1).opts.body.includes('unit-test-key'));
const agentPayload=JSON.parse(requests.at(-1).opts.body);
assert.deepEqual(agentPayload.tools,[{type:'google_search'}]);
assert(agentPayload.input.includes('M2'));
assert(generated.sources.some(source=>source.url==='https://example.com/meta-pricing'));
assert(generated.trace.some(step=>step.includes('BM25')));
context.fetch=async()=>({ok:true,json:async()=>({steps:[{type:'google_search_call'},{type:'model_output',content:[{type:'text',text:'Invented claim [G99]',annotations:[{type:'url_citation',title:'Unknown',url:'https://example.com/unknown'}]}]}]})});
assert.equal((await api.ask({question:'API pricing',generate:true,apiKey:'unit-test-key'})).mode,'Source summary');
context.fetch=async()=>({ok:false,status:403});
assert.match((await api.ask({question:'API pricing',generate:true,apiKey:'unit-test-key'})).notice,/HTTP 403/);
assert(!/localStorage|sessionStorage/.test(adapter));
assert(!/alphavantage\.co|stockSeries|searchStocks|summarizeStockPerformance/i.test(adapter));
assert(/stockPerformance/.test(adapter));
assert(!/Alpha Vantage|alphavantage/i.test(html));
assert(html.includes('Stock Performance'));
assert(html.includes('Compare Stock'));
assert(html.includes('Retrieve reviewed company research and recent AI news'));
assert(html.includes('Use Gemini agent with Google Search and retrieved source documents'));
assert(html.includes('const result=await PagesAPI.ask({question:q,company,generate,apiKey:key||undefined})'));
assert(html.includes('Supporting documents and web sources'));
assert(html.includes('Latest AI news'));
assert(adapter.includes('BM25 retrieved'));
assert(adapter.includes("tools:[{type:'google_search'}]"));
assert(!/fetch\('\/api\/|location.href='\/api\//.test(html));
assert(html.includes('GitHub Pages edition'));
assert(!html.includes('passes through this private dashboard'));
assert(!html.includes('The Check sources button fetches official'));
assert(!/method:\['Research method'/.test(html));
assert(!/presentation:\['Five minute presentation'/.test(html));
new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]);
assert.equal(new Set(seed.sources.map(s=>s.id)).size,35);
assert.equal(seed.sources.filter(source=>source.type==='Stock market data').length,4);
for(const source of stockSnapshot.sources)assert(seed.sources.some(item=>item.url===source.url),'Every fixed stock snapshot source should also be in the shared source library.');
assert(html.includes('This reviewed source library collects the documents used throughout the dashboard'));
const renderSourceList=new Function('DATA','company','sourceType','query','esc','badge',html.match(/^function sourceList\(\).*$/m)[0]+';return sourceList();');
const allSourcesHTML=renderSourceList(seed,'All','All','',value=>String(value??''),value=>String(value??''));
for(const source of stockSnapshot.sources)assert(allSourcesHTML.includes(source.url));
const googleSourcesHTML=renderSourceList(seed,'Google','All','',value=>String(value??''),value=>String(value??''));
assert(googleSourcesHTML.includes('GOOGL) Historical Data'));
assert(!googleSourcesHTML.includes('META) Historical Data'));
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
context.fetch=async()=>({ok:true,json:async()=>({steps:[{type:'google_search_call'},{type:'model_output',content:[{type:'text',text:'Standard Sol prices apply. [O2]',annotations:[{type:'url_citation',title:'Sol pricing',url:'https://example.com/sol-pricing'}]}]}]})});
assert.equal((await api.ask({question:'GPT-6.1 Sol API price',company:'OpenAI',generate:true,apiKey:'unit-test-key'})).mode,'Agentic Gemini RAG');
context.fetch=async()=>({ok:true,json:async()=>({steps:[{type:'google_search_call'},{type:'model_output',content:[{type:'text',text:'Unsupported source. [Z99]',annotations:[{type:'url_citation',title:'Unrelated',url:'https://example.com/unrelated'}]}]}]})});
assert.equal((await api.ask({question:'Claude pricing',company:'Anthropic',generate:true,apiKey:'unit-test-key'})).mode,'Source summary');
console.log('Four-company retrieval, populated annual financials and new citation-prefix checks passed.');

await assert.rejects(()=>api.compareCompany({company:'Acme Holdings'}),/Gemini API key/);
const externalReport={company:'Acme Holdings',period:'FY2025',metrics:{
 revenue:{value:120,unit:'USD billions',basis:'FY2025 reported revenue'},
 margin:{value:42,unit:'percent',basis:'Gross profit divided by revenue'},
 grossprofit:{value:50.4,unit:'USD billions',basis:'FY2025 reported gross profit'},
 netincome:{value:-3.2,unit:'USD billions',basis:'FY2025 net loss'},
 growth:{value:8.5,unit:'percent',basis:'FY2025 compared with FY2024'}
},limitation:'Acme is privately held.'};
context.fetch=async(url,opts)=>{
 requests.push({url:String(url),opts});
 return {ok:true,json:async()=>({steps:[
  {type:'google_search_call',arguments:{queries:['Acme Holdings FY2025 financials']}},
  {type:'model_output',content:[{type:'text',text:JSON.stringify(externalReport),annotations:[{type:'url_citation',title:'Acme FY2025 report',url:'https://example.com/acme-report'}]}]}
 ]})};
};
const compared=await api.compareCompany({company:'Acme Holdings',apiKey:'unit-test-key'});
assert.equal(compared.company,'Acme Holdings');
assert.equal(compared.period,'FY2025');
assert.equal(compared.metrics.netincome.value,-3.2);
assert.equal(compared.sources.length,1);
assert.equal(compared.sources[0].title,'Acme FY2025 report');
assert.equal(compared.sources[0].url,'https://example.com/acme-report');
assert.equal(requests.at(-1).url,'https://generativelanguage.googleapis.com/v1beta/interactions');
assert.equal(requests.at(-1).opts.headers['x-goog-api-key'],'unit-test-key');
assert(!requests.at(-1).opts.body.includes('unit-test-key'));
const searchPayload=JSON.parse(requests.at(-1).opts.body);
assert.equal(searchPayload.model,'gemini-3.8-flash');
assert.deepEqual(searchPayload.tools,[{type:'google_search'}]);
context.fetch=async()=>({ok:true,json:async()=>({steps:[{type:'model_output',content:[{type:'text',text:JSON.stringify(externalReport)}]}]})});
await assert.rejects(()=>api.compareCompany({company:'Acme Holdings',apiKey:'unit-test-key'}),/did not perform a Google Search/);
context.fetch=async()=>({ok:true,json:async()=>({steps:[{type:'google_search_call'},{type:'model_output',content:[{type:'text',text:JSON.stringify(externalReport)}]}]})});
await assert.rejects(()=>api.compareCompany({company:'Acme Holdings',apiKey:'unit-test-key'}),/no verifiable Google Search citations/);
console.log('Grounded FY2025 company comparison, citation requirements and API-key handling passed.');

await assert.rejects(()=>api.stockPerformance({}),/Gemini API key/);
const stockReport={range:'1M',stocks:[
 {requestedName:'Alphabet Inc.',symbol:'GOOGL',company:'Alphabet Inc.',price:245.12,currency:'USD',quoteDate:'2026-10-20',quoteType:'latest trade',history:[{time:'2026-10-01',close:235},{time:'2026-10-06',close:240},{time:'2026-10-12',close:237},{time:'2026-10-16',close:243},{time:'2026-10-20',close:245.12}],previousClose:242.1,dayLow:240,dayHigh:246,dailyChangePercent:1.25,periodReturns:{'1D':1.25,'1W':2.4,'1M':4.8,'3M':8.1,'6M':12.5,'1Y':18.4,'5Y':92.1},week52Low:147,week52High:250,marketCapUsdBillions:3000,trailingPE:25.2,volume:22000000,averageDailyVolume:21000000,beta:1.03,dividendYieldPercent:.5,rsi14:54,sma50:238,sma200:205,note:'Latest quote from the cited market source.'},
 {requestedName:'Meta Platforms, Inc.',symbol:'META',company:'Meta Platforms, Inc.',price:712.5,currency:'USD',quoteDate:'2026-10-20',quoteType:'last close',history:[{time:'2026-10-01',close:700},{time:'2026-10-06',close:705},{time:'2026-10-12',close:690},{time:'2026-10-16',close:710},{time:'2026-10-20',close:712.5}],previousClose:716,dayLow:708,dayHigh:720,dailyChangePercent:-.5,periodReturns:{'1D':-.5,'1W':-1,'1M':null,'3M':4,'6M':9,'1Y':22,'5Y':130},week52Low:480,week52High:796,marketCapUsdBillions:1800,trailingPE:27.5,volume:11000000,averageDailyVolume:12000000,beta:1.2,dividendYieldPercent:.3,rsi14:48,sma50:710,sma200:645,note:'One-month return was not available.'}
],summary:'Alphabet gained over the past month; Meta was slightly lower on the last trading day.'};
context.fetch=async(url,opts)=>{requests.push({url:String(url),opts});return{ok:true,json:async()=>({steps:[
 {type:'google_search_call',arguments:{queries:['GOOGL META latest stock quote']}},
 {type:'model_output',content:[{type:'text',text:JSON.stringify(stockReport),annotations:[{type:'url_citation',title:'Market quotes',url:'https://example.com/quotes'}]}]}
]})};};
const stockPerformance=await api.stockPerformance({apiKey:'unit-test-key'});
assert.equal(stockPerformance.stocks.length,2);
assert.equal(stockPerformance.range,'1M');
assert.equal(stockPerformance.stocks[0].price,245.12);
assert.equal(stockPerformance.stocks[0].history.length,5);
assert.equal(stockPerformance.stocks[1].periodReturns['1M'],null);
assert.equal(stockPerformance.sources[0].url,'https://example.com/quotes');
assert.equal(requests.at(-1).opts.headers['x-goog-api-key'],'unit-test-key');
assert(!requests.at(-1).opts.body.includes('unit-test-key'));
assert.deepEqual(JSON.parse(requests.at(-1).opts.body).tools,[{type:'google_search'}]);
const renderStockPerformance=new Function('initialData','report','companies','range','selectedCompany','esc','busy','error',html.match(/function stockMoney[\s\S]*?(?=function research\()/)[0]+'\nDATA=initialData;stockReport=report;stockSnapshot=report?.snapshot?report:null;stockCompanies=companies;stockCompanyDraft="";stockRange=range;company=selectedCompany;stockBusy=busy;stockError=error;return stocks();');
const renderedStocks=renderStockPerformance(seed,stockPerformance,[],'1M','All',value=>String(value??''),false,'');
assert(renderedStocks.includes('Market snapshot and comparison'));
assert(renderedStocks.includes('Alphabet Inc.'));
assert(renderedStocks.includes('245.12'));
assert(renderedStocks.includes('Meta Platforms, Inc.'));
assert(renderedStocks.includes('OpenAI')&&renderedStocks.includes('Anthropic'));
assert(renderedStocks.includes('https://example.com/quotes'));
assert(renderedStocks.includes('52-week range'));
assert(renderedStocks.includes('RSI (14)'));
assert(renderedStocks.includes('200-day SMA'));
assert(renderedStocks.includes('data-stock-period="5Y"'));
assert(renderedStocks.includes('Direct metric comparison'));
assert(renderedStocks.includes('Market capitalization (USD billions)'));
assert(renderedStocks.includes('Trailing P/E'));
assert.equal((renderedStocks.match(/class="stock-quote"/g)||[]).length,4,'The comparison should show all companies returned by Gemini.');
assert.equal((renderedStocks.match(/class="stock-chart-svg/g)||[]).length,3,'The dashboard should graph historical prices, market cap and P/E.');
assert(renderedStocks.includes('role="img" aria-label="Indexed historical stock price line chart comparing Alphabet Inc., Meta Platforms, Inc."'));
assert(renderedStocks.includes('<polyline'));
assert(renderedStocks.includes('Historical price movement · 1M'));
assert(renderedStocks.includes('Closing prices indexed to 0%'));
const trendChart=renderedStocks.match(/class="stock-chart-panel stock-history-panel stock-return-line">([\s\S]*?)<\/article>/)?.[1]||'';
assert.equal((trendChart.match(/<polyline/g)||[]).length,2,'Each company should have a multi-point historical trend line.');
assert(!trendChart.includes('<circle'),'The historical trend should be a line, not a dot graph.');
assert(trendChart.includes('Oct 1'));
assert(renderedStocks.includes('stock-line-legend'));
assert(!renderedStocks.includes('<rect'),'Stock comparisons should not render bar charts.');
assert(!/NaN|Infinity/.test(renderedStocks),'Stock chart SVG must not contain invalid numeric coordinates.');
const defaultStockUI=renderStockPerformance(seed,null,[],'1M','All',value=>String(value??''),false,'');
assert(defaultStockUI.includes('Alphabet Inc.'));
assert(defaultStockUI.includes('Meta Platforms, Inc.'));
assert(defaultStockUI.includes('Google and Meta stock information for all seven chart ranges is preloaded below'));
assert(defaultStockUI.includes('GOOGL')&&defaultStockUI.includes('META'),'Google and Meta should be visible before the first comparison.');
assert.equal((defaultStockUI.match(/class="stock-chart-svg/g)||[]).length,3,'Default Google/Meta metric charts should be visible before loading Gemini data.');
assert(defaultStockUI.includes('data-stock-period="1D"'));
assert(defaultStockUI.includes('data-stock-period="5Y"'));
assert(defaultStockUI.includes('No cited historical price series'));
const maxCompanyUI=renderStockPerformance(seed,stockPerformance,['NVIDIA','AMD'],'1M','All',value=>String(value??''),false,'');
assert(maxCompanyUI.includes('Add company (2/2)'));
assert(maxCompanyUI.includes('id="stock-company-input" maxlength="80" autocomplete="off" placeholder="e.g. NVIDIA or NVDA" value="" disabled'));
const googleStockUI=renderStockPerformance(seed,stockPerformance,[],'1M','Google',value=>String(value??''),false,'');
assert(googleStockUI.includes('Showing Google and any added comparisons'));
assert(googleStockUI.includes('Alphabet Inc.'));
assert(!googleStockUI.includes('Meta Platforms, Inc.'));
assert(googleStockUI.includes('245.12'));
const metaStockUI=renderStockPerformance(seed,stockPerformance,[],'1M','Meta',value=>String(value??''),false,'');
assert(metaStockUI.includes('Showing Meta and any added comparisons'));
assert(metaStockUI.includes('Meta Platforms, Inc.'));
assert(!metaStockUI.includes('Alphabet Inc.'));
assert(metaStockUI.includes('712.50'));
const openAIStockUI=renderStockPerformance(seed,stockPerformance,[],'1M','OpenAI',value=>String(value??''),false,'');
assert(openAIStockUI.includes('OpenAI is privately held'));
assert(openAIStockUI.includes('There is no exchange-listed share price'));
assert(!openAIStockUI.includes('Alphabet Inc.'));
assert(!openAIStockUI.includes('Meta Platforms, Inc.'));
assert.equal(stockSnapshot.snapshot,true);
assert.equal(stockSnapshot.range,'1M');
assert.equal(stockSnapshot.checkedAt,'2026-10-20T20:00:00.000Z');
assert.equal(stockSnapshot.stocks.length,2);
assert.equal(stockSnapshot.stocks[0].quoteDate,'2026-10-20');
assert.equal(stockSnapshot.stocks[0].price,340.28);
assert.equal(stockSnapshot.stocks[1].price,694.25);
assert.equal(stockSnapshot.stocks[0].periodReturns['1M'],-4.14);
assert.equal(stockSnapshot.stocks[1].periodReturns['1M'],-6.34);
assert.equal(stockSnapshot.stocks[0].history.length,22);
assert.equal(stockSnapshot.stocks[1].history.length,22);
assert.equal(stockSnapshot.sources.length,4);
assert(stockSnapshot.stocks.every(stock=>stock.history.at(-1).time==='2026-10-20'));
assert(stockSnapshot.stocks.every(stock=>stock.periodReturns['1M']!==null));
assert.deepEqual(stockSnapshot.stocks.map(stock=>[stock.marketCapUsdBillions,stock.trailingPE]),[[4162,17.07],[1769,26.16]]);
const snapshotRanges=['1D','1W','1M','3M','6M','1Y','5Y'];
const expectedHistoryLengths={'1D':27,'1W':5,'1M':22,'3M':15,'6M':28,'1Y':54,'5Y':61};
for(const stock of stockSnapshot.stocks){
 assert.deepEqual(Object.keys(stock.historyByRange),snapshotRanges);
 for(const range of snapshotRanges){
  const history=stock.historyByRange[range];
  assert.equal(history.length,expectedHistoryLengths[range],`${stock.symbol} ${range} history should contain every verified sample.`);
  assert(history.every((point,index)=>Number.isFinite(Date.parse(point.time))&&Number.isFinite(point.close)&&point.close>0&&(index===0||Date.parse(history[index-1].time)<Date.parse(point.time))),`${stock.symbol} ${range} history should be positive and chronological.`);
  assert(history.at(-1).time.startsWith('2026-10-20'));
  assert(Math.abs(history.at(-1).close-stock.price)<0.01);
  assert(Number.isFinite(stock.periodReturns[range]),`${stock.symbol} ${range} return should be preloaded.`);
 }
}
const initialSnapshotUI=renderStockPerformance(seed,stockSnapshot,[],'1M','All',value=>String(value??''),false,'');
assert(initialSnapshotUI.includes('Google and Meta stock information for all seven chart ranges is preloaded below'));
assert(initialSnapshotUI.includes('Fixed snapshot · 2026-10-20'));
assert(initialSnapshotUI.includes('$340.28'));
assert(initialSnapshotUI.includes('$694.25'));
assert(initialSnapshotUI.includes('Historical price movement · 1M'));
assert(initialSnapshotUI.includes('Historical Data — Yahoo Finance'));
assert(initialSnapshotUI.includes('$4,162B'));
assert(initialSnapshotUI.includes('$1,769B'));
assert(initialSnapshotUI.includes('Alphabet Inc. 17.07'));
assert(initialSnapshotUI.includes('Meta Platforms, Inc. 26.16'));
assert(initialSnapshotUI.includes('quote-page market capitalization'));
assert(initialSnapshotUI.includes('Yahoo Finance trailing P/E'));
assert(initialSnapshotUI.includes('Fixed historical snapshot captured'));
for(const range of snapshotRanges){
 const rendered=renderStockPerformance(seed,stockSnapshot,[],range,'All',value=>String(value??''),false,'');
 const trendChart=rendered.match(/class="stock-chart-panel stock-history-panel stock-return-line">([\s\S]*?)<\/article>/)?.[1]||'';
 const lines=[...trendChart.matchAll(/<polyline[^>]* points="([^"]+)"/g)];
 assert(rendered.includes(`data-stock-period="${range}" class="active"`));
 assert.equal(lines.length,2,`${range} snapshot should render separate Google and Meta trend lines.`);
 assert.equal(lines[0][1].split(' ').length,expectedHistoryLengths[range],`${range} chart should use all Google history points.`);
 assert.equal(lines[1][1].split(' ').length,expectedHistoryLengths[range],`${range} chart should use all Meta history points.`);
 assert(trendChart.includes(stockSnapshot.stocks[0].historyByRange[range][0].time));
 assert(!trendChart.includes('No preloaded history is available'));
}
const expandedStockReport={...stockReport,stocks:[...stockReport.stocks,
 {...stockReport.stocks[0],requestedName:'NVIDIA',company:'NVIDIA Corporation',symbol:'NASDAQ:NVDA'},
 {...stockReport.stocks[0],requestedName:'AMD',company:'Advanced Micro Devices, Inc.',symbol:'NASDAQ:AMD'}
]};
context.fetch=async(url,opts)=>{requests.push({url:String(url),opts});return{ok:true,json:async()=>({steps:[
 {type:'google_search_call'},
 {type:'model_output',content:[{type:'text',text:JSON.stringify(expandedStockReport),annotations:[{type:'url_citation',title:'Quotes',url:'https://example.com/expanded'}]}]}
]})};};
const expandedComparison=await api.stockPerformance({apiKey:'unit-test-key',companies:['NVIDIA','AMD']});
assert.equal(expandedComparison.stocks.length,4);
assert.equal(expandedComparison.stocks[2].symbol,'NASDAQ:NVDA');
assert(JSON.parse(requests.at(-1).opts.body).input.includes('NVIDIA'));
await assert.rejects(()=>api.stockPerformance({apiKey:'unit-test-key',range:'QTD'}),/supported stock chart range/);
const unorderedReport={...stockReport,stocks:stockReport.stocks.map((stock,index)=>index?stock:{...stock,history:[...stock.history].reverse()})};
context.fetch=async()=>({ok:true,json:async()=>({steps:[{type:'google_search_call'},{type:'model_output',content:[{type:'text',text:JSON.stringify(unorderedReport),annotations:[{type:'url_citation',title:'Quotes',url:'https://example.com/unordered'}]}]}]})});
await assert.rejects(()=>api.stockPerformance({apiKey:'unit-test-key'}),/invalid or unordered GOOGL historical prices/);
context.fetch=async()=>({ok:true,json:async()=>({steps:[{type:'google_search_call'},{type:'model_output',content:[{type:'text',text:JSON.stringify({...stockReport,range:'1D'}),annotations:[{type:'url_citation',title:'Quotes',url:'https://example.com/daily'}]}]}]})});
await assert.rejects(()=>api.stockPerformance({apiKey:'unit-test-key',range:'1D'}),/date-only data for the 1D GOOGL chart/);
const intradayReport={...stockReport,range:'1D',stocks:stockReport.stocks.map(stock=>({...stock,history:[{time:'2026-10-20T14:30:00Z',close:stock.history[0].close},{time:'2026-10-20T19:30:00Z',close:stock.price}]}))};
context.fetch=async(url,opts)=>{requests.push({url:String(url),opts});return{ok:true,json:async()=>({steps:[{type:'google_search_call'},{type:'model_output',content:[{type:'text',text:JSON.stringify(intradayReport),annotations:[{type:'url_citation',title:'Quotes',url:'https://example.com/intraday'}]}]}]})};};
const intradayComparison=await api.stockPerformance({apiKey:'unit-test-key',range:'1D'});
assert.equal(intradayComparison.range,'1D');
assert(JSON.parse(requests.at(-1).opts.body).input.includes('Requested chart range: 1D'));
await assert.rejects(()=>api.stockPerformance({apiKey:'unit-test-key',companies:['NVIDIA','NVIDIA']}),/already included/);
await assert.rejects(()=>api.stockPerformance({apiKey:'unit-test-key',companies:['NVDA','AMD','TSLA']}),/up to two/);
context.fetch=async()=>({ok:true,json:async()=>({steps:[{type:'model_output',content:[{type:'text',text:JSON.stringify(stockReport)}]}]})});
await assert.rejects(()=>api.stockPerformance({apiKey:'unit-test-key'}),/did not perform a Google Search/);
context.fetch=async()=>({ok:true,json:async()=>({steps:[{type:'google_search_call'},{type:'model_output',content:[{type:'text',text:JSON.stringify(stockReport)}]}]})});
await assert.rejects(()=>api.stockPerformance({apiKey:'unit-test-key'}),/no verifiable Google Search citations/);
console.log('Gemini stock quotes, validation, citations and dashboard rendering passed.');

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
const renderComparisonOverview=new Function('initialData','selectedMetric','selectedCompany','comparison','document',overviewProgram+'\nDATA=initialData;metric=selectedMetric;company=selectedCompany;companyComparison=comparison;const result=overview();drawChart();return result;');
for(const selectedCompany of ['All','Google','Meta','OpenAI','Anthropic'])for(const selectedMetric of ['revenue','margin','growth','grossprofit','netincome']){
 const chart={attributes:{},setAttribute(name,value){this.attributes[name]=value;},innerHTML:''};
 const result=renderOverview(ragData,selectedMetric,selectedCompany,{querySelector:()=>chart});
 assert.equal((result.match(/data-metric=/g)||[]).length,5);
 assert(!result.includes('Not disclosed'));assert(!result.includes('Unavailable'));
 assert(result.includes('FY2025'));assert(chart.attributes['aria-label'].includes('FY2025'));
 assert.equal((chart.innerHTML.match(/<rect /g)||[]).length,selectedCompany==='All'?4:1);
 assert(!/NaN|Infinity/.test(chart.innerHTML));
}
const extra={company:'Acme Holdings',period:'FY2025',checkedAt:'2026-10-20T00:00:00.000Z',limitation:'Private-company reporting.',sources:[{title:'Annual report',url:'https://example.com/report'}],metrics:externalReport.metrics};
for(const selectedMetric of ['revenue','margin','growth','grossprofit','netincome']){
 const chart={attributes:{},setAttribute(name,value){this.attributes[name]=value;},innerHTML:''};
 const result=renderComparisonOverview(ragData,selectedMetric,'All',extra,{querySelector:()=>chart});
 assert(result.includes('Acme Holdings'));assert(result.includes('Remove comparison'));
 assert.equal((chart.innerHTML.match(/<rect /g)||[]).length,5);
 assert(chart.attributes['aria-label'].includes('Acme Holdings'));
 assert(!/NaN|Infinity/.test(chart.innerHTML));
}
const chartAfterRemove={attributes:{},setAttribute(name,value){this.attributes[name]=value;},innerHTML:''};
const originalAfterRemove=renderOverview(ragData,'revenue','All',{querySelector:()=>chartAfterRemove});
assert(!originalAfterRemove.includes('Acme Holdings'));
assert.equal((chartAfterRemove.innerHTML.match(/<rect /g)||[]).length,4);
assert(html.includes('list="company-suggestions"'));
assert(html.includes('data-comparison-toggle'));
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
