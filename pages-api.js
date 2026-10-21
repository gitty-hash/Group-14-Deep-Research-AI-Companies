/* Public GitHub Pages adapter. No shared API key or server secret belongs here. */
(function(root){
  'use strict';
  let data=null;
  function retrieve(question,company='All'){
    if(!data)throw new Error('Research data is still loading.');
    return ResearchRAG.retrieve(data.sources,question,company);
  }
  async function fetchJSON(path){const r=await fetch(new URL(path,document.baseURI),{cache:'no-store'});if(!r.ok)throw new Error('Could not load published data (HTTP '+r.status+').');return r.json();}
  async function load(){data=await fetchJSON('./data/research.json');try{data.live=await fetchJSON('./data/updates.json');}catch{data.live=null;}data.generationConfigured=false;return data;}
  async function refresh(){const update=await fetchJSON('./data/updates.json');if(data)data.live=update;return update;}
  async function ask(body){
    const question=String(body.question||'').trim().slice(0,1200);if(!question)throw new Error('Enter a research question.');
    const hits=retrieve(question,body.company||'All');
    if(!body.generate||!hits.length)return ResearchRAG.sourceSummary(question,hits);
    const apiKey=String(body.apiKey||'').trim();if(!apiKey)throw new Error('Enter your own Gemini key in the connection panel. Source summaries work without one.');
    return ResearchRAG.generate(question,hits,apiKey);
  }

  function exportData(){if(!data)return;const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='group-14-four-company-ai-research.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  root.PagesAPI={load,refresh,ask,exportData,retrieve,_setDataForTests:d=>{data=d;}};
})(globalThis);
