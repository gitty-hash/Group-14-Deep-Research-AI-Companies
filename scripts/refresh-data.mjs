import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {collect} from '../collector.mjs';
const target=new URL('../docs/data/updates.json',import.meta.url);
let previous=null;try{previous=await readFile(target,'utf8');}catch{}
let persisted=null;
const env={BUCKET:{get:async()=>previous?{json:async()=>JSON.parse(previous)}:null,put:async(key,value)=>{persisted=value;}}};
const result=await collect(env,true);
if(!persisted)throw new Error('No update record was generated');
result.persistent=false;result.storage='github-pages-snapshot';
await mkdir(new URL('../docs/data/',import.meta.url),{recursive:true});
await writeFile(target,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({checkedAt:result.checkedAt,collectors:result.logs.map(x=>({source:x.source,status:x.status})),news:result.news.length,prices:result.prices.length}));
