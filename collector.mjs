import {seed as SEED} from './seed.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const strip=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const feeds=[{company:'Google',url:'https://blog.google/rss/',host:'blog.google'},{company:'Meta',url:'https://about.fb.com/feed/',host:'about.fb.com'}];
let cached=null;
async function readState(env){
  if(env.BUCKET){try {const o=await env.BUCKET.get('observatory/latest.json');if(o)return await o.json();}catch{}}
  return cached;
}
async function fetchOfficial(url){
  const allowed=['blog.google','about.fb.com','ai.google.dev','dev.meta.ai'];
  let u=new URL(url);
  for(let i=0;i<4;i++){
    if(!allowed.includes(u.hostname))throw new Error('Unapproved source domain');
    const r=await fetch(u,{redirect:'manual',headers:{'user-agent':'AI-Strategy-Observatory/1.0 academic research','accept':'text/html,application/rss+xml,application/xml'},signal:AbortSignal.timeout(18000)});
    if(r.status>=300&&r.status<400){u=new URL(r.headers.get('location'),u);continue;}
    if(!r.ok)throw new Error('Publisher returned HTTP '+r.status);
    const text=await r.text();if(text.length>5000000)throw new Error('Publisher response exceeds collection limit');
    return {text,url:u.href};
  }
  throw new Error('Too many redirects');
}
export function parseFeed(xml,feed){
  const tag=(s,t)=>{const m=s.match(new RegExp('<'+t+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+t+'>','i'));return m?strip(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')):'';};
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(m=>{
    const title=tag(m[1],'title'),url=tag(m[1],'link'),date=tag(m[1],'pubDate');
    try {if(new URL(url).hostname!==feed.host)return null;}catch{return null;}
    if(!/\bai\b|gemini|muse|llama|artificial intelligence|cloud|agent|earnings/i.test(title))return null;
    const d=Date.parse(date);if(!Number.isFinite(d)||d>Date.now()+86400000)return null;
    return {company:feed.company,title:title.split(/\s+/).slice(0,24).join(' '),url,date:new Date(d).toISOString(),publisher:feed.host};
  }).filter(Boolean).slice(0,12);
}
export function parsePrices(html,company){
  const result=[];
  for(const m of SEED.models.filter(x=>x.company===company&&x.input!==null&&!x.contributor)){
    const marker=html.indexOf('>'+m.id+'<');
    if(marker<0)continue;
    const rest=html.slice(marker,marker+16000);
    const next=rest.search(/<h2\b/i);const block=next>0?rest.slice(0,next):rest;
    // Restrict parsing to the first Standard table following the exact model ID.
    const table=block.match(/<table\b[^>]*>([\s\S]*?)<\/table>/i);if(!table)continue;
    const rows=[...table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(x=>[...x[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(y=>strip(y[1])));
    const price=label=>{const row=rows.find(x=>new RegExp('^'+label+'(?: price)?(?: |$)','i').test(x[0]||''));const cell=row?.[company==='Google'?2:1];if(!cell)return undefined;const rates=[...cell.matchAll(/\$([\d.]+)([^$]*)/g)];let chosen=rates[0]?.[1];for(const rate of rates){const start=rate[2].match(/starting ([A-Z][a-z]+ \d{1,2}, \d{4})/);if(start&&Date.now()>=Date.parse(start[1]+' 00:00:00 GMT'))chosen=rate[1];}return chosen;};
    const input=Number(price('Input')),output=Number(price('Output'));
    if(Number.isFinite(input)&&Number.isFinite(output)&&input>0&&output>0)result.push({id:m.id,input,output});
  }
  return result;
}
async function collect(env,force=false){
  const prev=await readState(env);
  if(!force&&prev&&Date.now()-Date.parse(prev.checkedAt)<3600000)return prev;
  const at=new Date().toISOString();const logs=[],news=[],prices=[];
  await Promise.all(feeds.map(async f=>{
    try{const r=await fetchOfficial(f.url);const n=parseFeed(r.text,f);if(!n.length)throw new Error('No matching dated entries; previous data retained');news.push(...n);logs.push({source:f.url,status:'ok',items:n.length,hash:await hash(r.text),checkedAt:at});}
    catch(e){logs.push({source:f.url,status:'error',message:e.message,checkedAt:at});news.push(...(prev?.news||[]).filter(x=>x.company===f.company).map(x=>({...x,retained:true})));}
  }));
  await Promise.all(['Google','Meta'].map(async company=>{
    const source=SEED.sources.find(x=>x.id===(company==='Google'?'G2':'M2'));
    try{const r=await fetchOfficial(source.url);const p=parsePrices(r.text,company);if(!p.length)throw new Error('Price structure could not be verified; reviewed prices retained');prices.push(...p);logs.push({source:source.url,status:'ok',items:p.length,hash:await hash(r.text),checkedAt:at});}
    catch(e){logs.push({source:source.url,status:'error',message:e.message,checkedAt:at});}
  }));
  for(const p of prev?.prices||[])if(!prices.some(x=>x.id===p.id))prices.push({...p,retained:true});
  const state={checkedAt:at,news:news.sort((a,b)=>b.date.localeCompare(a.date)),prices,logs,persistent:!!env.BUCKET};
  if(env.BUCKET)await env.BUCKET.put('observatory/latest.json',JSON.stringify(state),{httpMetadata:{contentType:'application/json'}});
  cached=state;return state;
}

export {collect};
