import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {seed} from './seed.mjs';
import {stockSnapshot} from './stock-snapshot.mjs';
await import('./office-export.js');
const live=JSON.parse(await readFile('docs/data/updates.json','utf8'));
const data={...structuredClone(seed),live,apiKey:'excluded-test-credential',privateConfig:{key:'excluded-test-credential'}};
const output='work/export-verification';
await mkdir(output,{recursive:true});

function entries(bytes){
  const files=new Map(),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),decoder=new TextDecoder();
  let position=0;
  while(view.getUint32(position,true)===0x04034b50){
    assert.equal(view.getUint16(position+8,true),0);
    const length=view.getUint32(position+18,true),nameLength=view.getUint16(position+26,true),extra=view.getUint16(position+28,true);
    const name=decoder.decode(bytes.subarray(position+30,position+30+nameLength)),start=position+30+nameLength+extra;
    files.set(name,decoder.decode(bytes.subarray(start,start+length)));position=start+length;
  }
  assert.equal(view.getUint32(position,true),0x02014b50);
  assert.equal(view.getUint32(bytes.length-22,true),0x06054b50);
  assert.equal(view.getUint16(bytes.length-12,true),files.size);
  return files;
}

for(const format of ['docx','xlsx']){
  const file=DashboardExport.createFile(format,data,{stockReport:stockSnapshot,apiKey:'excluded-test-credential'});
  assert(file.filename.endsWith('.'+format));
  assert(file.blob.type.includes('openxmlformats'));
  const bytes=new Uint8Array(await file.blob.arrayBuffer()),files=entries(bytes),contents=[...files.values()].join('\n');
  assert(files.has('[Content_Types].xml'));assert(files.has('_rels/.rels'));assert(!contents.includes('excluded-test-credential'));
  if(format==='xlsx'){
    assert(files.get('xl/workbook.xml').includes('name="Financials"'));
    assert(files.get('xl/workbook.xml').includes('name="Stock history"'));
    assert(files.get('xl/worksheets/sheet2.xml').includes('402.836'));
    assert(files.get('xl/worksheets/sheet7.xml').includes('https://'));
    assert(files.get('xl/worksheets/sheet6.xml').includes('2026-10-20'));
    assert(!contents.includes('<f>'));
  }else{
    assert(files.get('word/document.xml').includes('AI Observatory Research Data'));
    assert(files.get('word/document.xml').includes('Source library'));
    assert(files.get('word/document.xml').includes('402.84'));
    assert(files.get('word/_rels/document.xml.rels').includes('TargetMode="External"'));
    assert(files.get('word/styles.xml').includes('w:styleId="Title"'));
  }
  await writeFile(output+'/dashboard.'+format,bytes);
}
const hostile=structuredClone(seed);
hostile.sources[0].title='=SUM(A1:A9) & <report>\u0000\u000B';
hostile.sources[0].url='javascript:alert(1)';
for(const format of ['docx','xlsx']){
  const file=DashboardExport.createFile(format,hostile);
  const bytes=new Uint8Array(await file.blob.arrayBuffer()),contents=[...entries(bytes).values()].join('\n');
  assert(contents.includes('=SUM(A1:A9) &amp; &lt;report&gt;'));
  assert(!contents.includes('javascript:'));assert(!contents.includes('\u0000'));assert(!contents.includes('\u000B'));
  await writeFile(output+'/escaped.'+format,bytes);
}
assert.throws(()=>DashboardExport.createFile('csv',data),/Choose Word/);
assert.throws(()=>DashboardExport.createFile('docx',null),/still loading/);
const html=await readFile('docs/index.html','utf8');
assert(html.includes('Word report (.docx)'));assert(html.includes('Excel workbook (.xlsx)'));
assert(html.includes('office-export.js?v='));assert(!html.includes('/api/export'));
console.log('Word and Excel packages, data types, snapshot history, citations, XML escaping and credential exclusion passed.');
