/* Browser-only Office Open XML exports. No libraries, API calls or credentials. */
(function(root){
  'use strict';
  const XML='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  const PKG='http://schemas.openxmlformats.org/package/2006/relationships';
  const METRICS=[['revenue','Revenue'],['margin','Gross margin'],['grossprofit','Gross profit'],['netincome','Net income or loss'],['growth','Revenue growth']];
  const MIME={docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
  const text=value=>String(value??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
  const xml=value=>text(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const list=value=>Array.isArray(value)?value:[];
  const refs=value=>list(value).join(', ');
  const number=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
  const shown=value=>value===null||value===undefined||value===''?'Unavailable':value;
  const url=value=>{try{const parsed=new URL(value);return ['http:','https:'].includes(parsed.protocol)?parsed.href:'';}catch{return '';}};
  const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  function crc32(bytes){let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}

  // Uncompressed ZIP keeps the download self-contained and works in every browser.
  function zip(files){
    const encoder=new TextEncoder(),parts=[],directory=[];let offset=0;
    for(const [path,content] of Object.entries(files)){
      const name=encoder.encode(path),bytes=encoder.encode(content),crc=crc32(bytes);
      const local=new Uint8Array(30+name.length),l=new DataView(local.buffer);
      l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,33,true);
      l.setUint32(14,crc,true);l.setUint32(18,bytes.length,true);l.setUint32(22,bytes.length,true);l.setUint16(26,name.length,true);local.set(name,30);
      const central=new Uint8Array(46+name.length),c=new DataView(central.buffer);
      c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);
      c.setUint32(16,crc,true);c.setUint32(20,bytes.length,true);c.setUint32(24,bytes.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);central.set(name,46);
      parts.push(local,bytes);directory.push(central);offset+=local.length+bytes.length;
    }
    const length=directory.reduce((sum,part)=>sum+part.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);
    e.setUint32(0,0x06054b50,true);e.setUint16(8,directory.length,true);e.setUint16(10,directory.length,true);e.setUint32(12,length,true);e.setUint32(16,offset,true);
    return [...parts,...directory,end];
  }

  function snapshot(data,context={}){
    if(!data)throw new Error('Research data is still loading. Please try again.');
    const generated=new Date().toISOString(),day=generated.slice(0,10),companies=list(data.companies).slice();
    if(context.companyComparison){const item=context.companyComparison;companies.push({name:item.company,entity:item.company,summary:item.limitation,performance:item.metrics,refs:[],comparison:true});}
    const financials=companies.flatMap(company=>METRICS.map(([key,label])=>{
      const item=company.performance?.[key]||{};
      return [company.name,data.financialPeriod||'FY2025',label,number(item.value),item.unit||(['margin','growth'].includes(key)?'percent':'USD billions'),item.basis||'',item.approximate?'Approximate':number(item.value)!==null?'Reported or calculated':'Unavailable',refs(item.refs)];
    }));
    const models=list(data.models).map(item=>{
      const expired=item.until&&day>item.until;
      const collected=list(data.live?.prices).find(price=>price.id===item.id)||{};
      const model={...item,input:expired&&item.nextInput?item.nextInput:item.input,output:expired&&item.nextOutput?item.nextOutput:item.output,...collected};
      return [model.company,model.name,model.type,model.type==='Open weights'?'Not applicable':number(model.input),model.type==='Open weights'?'Not applicable':number(model.output),model.contributor?'Submitted content may be used for training':'See cited product terms',model.type==='Open weights'?'Self-hosting compute and operations costs':collected.id?'Collected official price':'Reviewed rate',model.use||'',model.source||item.source,model.until||'',collected.checkedAt||(collected.id?data.live?.checkedAt:data.reviewed)||''];
    });
    const report=context.stockReport||null;
    const stocks=list(report?.stocks);
    const stockFields=[['price','Price','quote currency'],['previousClose','Previous close','quote currency'],['dayLow','Session low','quote currency'],['dayHigh','Session high','quote currency'],['dailyChangePercent','Daily change','percent'],['week52Low','52 week low','quote currency'],['week52High','52 week high','quote currency'],['marketCapUsdBillions','Market capitalization','USD billions'],['trailingPE','Trailing PE','multiple'],['volume','Volume','shares'],['averageDailyVolume','Average daily volume','shares'],['beta','Beta','multiple'],['dividendYieldPercent','Dividend yield','percent'],['rsi14','RSI 14','index'],['sma50','50 day SMA','quote currency'],['sma200','200 day SMA','quote currency']];
    const quotes=stocks.flatMap(stock=>[...stockFields.map(([key,label,unit])=>[stock.company,stock.symbol,label,number(stock[key]),unit==='quote currency'?stock.currency:unit,stock.quoteDate,stock.quoteType,stock.note||'']),...Object.entries(stock.periodReturns||{}).map(([period,value])=>[stock.company,stock.symbol,period+' return',number(value),'percent',stock.quoteDate,stock.quoteType,stock.note||''])]);
    const history=stocks.flatMap(stock=>Object.entries(stock.historyByRange||{[report?.range||context.range||'1M']:list(stock.history)}).flatMap(([range,points])=>list(points).map(point=>[stock.company,stock.symbol,range,point.time,number(point.close),stock.currency])));
    const sources=list(data.sources).map(source=>[source.id,source.company,source.title,source.publisher,source.type,source.date||'',source.reviewed||data.reviewed||'',source.note,url(source.url)]);
    for(const [prefix,items] of [['ST',report?.sources],['CC',context.companyComparison?.sources]])list(items).forEach((source,index)=>{const href=url(source.url);if(href&&!sources.some(row=>row[8]===href))sources.push([prefix+(index+1),'Additional comparison',source.title,'','Comparison citation','',report?.checkedAt||context.companyComparison?.checkedAt||'','',href]);});
    const news=list(data.live?.news).map(item=>[item.company,item.title,item.date,item.publisher||'',url(item.url)]);
    const insights=list(data.insights).map(item=>[item.title,item.text,refs(item.sources)]);
    const logs=list(data.live?.logs).map(item=>[item.status,item.source,item.message||'',number(item.items),item.hash||'']);
    return {generated,day,reviewed:data.reviewed||'',period:data.financialPeriod||'FY2025',scope:data.performanceScope||'',companies,financials,models,report,stocks,quotes,history,sources,news,insights,logs,collected:data.live?.checkedAt||''};
  }

  function tables(s){return [
    {name:'Overview',headers:['Field','Value'],widths:[30,110],rows:[['Report','AI Observatory research data'],['Exported at UTC',s.generated],['Data reviewed',s.reviewed],['Financial period',s.period],['Financial scope',s.scope],['Published data collected',s.collected],['Export scope','All baseline companies, sources and published data; includes any added company comparison and current stock report.'],['Pricing unit','USD per million tokens. Prices and model availability are dated.'],['Financial caveat','Company-wide results include businesses beyond AI. Private-company figures are attributed reporting.'],['Stock caveat',s.report?.summary||'No stock report was loaded.'],['History','Dated observations are included for all preloaded ranges, or the current live comparison range. Unavailable values are not replaced with zero.']]},
    {name:'Financials',headers:['Company','Period','Metric','Value','Unit','Basis','Qualification','Source IDs'],widths:[18,12,24,18,18,70,20,18],rows:s.financials},
    {name:'Companies',headers:['Company','Entity','Ticker','Strategy','Distribution','Risk','Source IDs'],widths:[18,30,20,70,55,65,20],rows:s.companies.map(c=>[c.name,c.entity||'',c.ticker||'',c.summary||'',c.route||'',c.risk||'',refs(c.refs)])},
    {name:'Model pricing',headers:['Company','Model','Access','Input USD per 1M','Output USD per 1M','Data use terms','Pricing basis','Intended use','Source ID','Rate until','Reviewed or checked'],widths:[18,30,20,22,22,40,45,65,16,16,24],rows:s.models},
    {name:'Stock quotes',headers:['Company','Symbol','Metric','Value','Unit','Quote date','Quote type','Note'],widths:[28,16,26,20,20,18,20,80],rows:s.quotes},
    {name:'Stock history',headers:['Company','Symbol','Range','Observation time','Close','Currency'],widths:[28,16,12,28,20,14],rows:s.history},
    {name:'Sources',headers:['ID','Company','Title','Publisher','Type','Published','Reviewed','Research notes','URL'],widths:[12,22,65,30,25,18,25,100,85],rows:s.sources},
    {name:'News',headers:['Company','Headline','Published','Publisher','URL'],widths:[20,90,28,30,85],rows:s.news},
    {name:'Insights',headers:['Title','Research interpretation','Source IDs'],widths:[60,110,25],rows:s.insights},
    {name:'Collection log',headers:['Status','Source','Message','Items','Content hash'],widths:[18,85,90,16,75],rows:s.logs}
  ];}

  function core(s){return XML+`<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>AI Observatory Research Data</dc:title><dc:creator>AI Observatory</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${s.generated}</dcterms:created></cp:coreProperties>`;}
  function contentTypes(overrides){return XML+`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>${overrides}</Types>`;}
  function packageRels(main){return XML+`<Relationships xmlns="${PKG}"><Relationship Id="rId1" Type="${REL}officeDocument" Target="${main}"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;}
  function col(n){let result='';for(n++;n;n=Math.floor((n-1)/26))result=String.fromCharCode(65+(n-1)%26)+result;return result;}
  const excelStyles=XML+`<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00;[Red](#,##0.00)"/></numFmts><fonts count="2"><font><sz val="11"/><color rgb="FF202535"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF303A66"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  function workbook(s){
    const sheets=tables(s),files={'_rels/.rels':packageRels('xl/workbook.xml'),'docProps/core.xml':core(s),'xl/styles.xml':excelStyles};
    files['[Content_Types].xml']=contentTypes('<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join(''));
    files['xl/workbook.xml']=XML+`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${REL.slice(0,-1)}"><bookViews><workbookView/></bookViews><sheets>${sheets.map((sheet,i)=>`<sheet name="${xml(sheet.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`;
    files['xl/_rels/workbook.xml.rels']=XML+`<Relationships xmlns="${PKG}">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="${REL}worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="styles" Type="${REL}styles" Target="styles.xml"/></Relationships>`;
    sheets.forEach((sheet,i)=>{
      const rows=[sheet.headers,...sheet.rows],last=col(sheet.headers.length-1)+rows.length;
      const sheetRows=rows.map((row,r)=>{
        const height=r===0?32:Math.min(409,Math.max(24,...row.map((value,c)=>Math.ceil(text(shown(value)).length/(sheet.widths[c]*.85))*15+7)));
        return `<row r="${r+1}" ht="${height}" customHeight="1">${row.map((value,c)=>{const position=col(c)+(r+1);return number(value)!==null&&r>0?`<c r="${position}" s="2"><v>${value}</v></c>`:`<c r="${position}" s="${r===0?1:0}" t="inlineStr"><is><t xml:space="preserve">${xml(text(shown(value)).slice(0,32767))}</t></is></c>`;}).join('')}</row>`;
      }).join('');
      files[`xl/worksheets/sheet${i+1}.xml`]=XML+`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${last}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>${sheet.widths.map((width,c)=>`<col min="${c+1}" max="${c+1}" width="${width}" customWidth="1"/>`).join('')}</cols><sheetData>${sheetRows}</sheetData>${rows.length>1?`<autoFilter ref="A1:${last}"/>`:''}<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`;
    });
    return files;
  }

  function documentFile(s){
    const relationships=[`<Relationship Id="styles" Type="${REL}styles" Target="styles.xml"/>`];
    const run=(value,bold=false)=>`<w:r>${bold?'<w:rPr><w:b/></w:rPr>':''}<w:t xml:space="preserve">${xml(value)}</w:t></w:r>`;
    const p=(value,style='Normal')=>`<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>${run(value)}</w:p>`;
    const link=(href,label)=>{if(!url(href))return p(label);const id='url'+relationships.length;relationships.push(`<Relationship Id="${id}" Type="${REL}hyperlink" Target="${xml(url(href))}" TargetMode="External"/>`);return `<w:p><w:hyperlink r:id="${id}"><w:r><w:rPr><w:color w:val="4257D0"/><w:u w:val="single"/></w:rPr><w:t>${xml(label)}</w:t></w:r></w:hyperlink></w:p>`;};
    const table=(headers,rows,widths)=>`<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(side=>`<w:${side} w:val="single" w:sz="4" w:color="D9D9D9"/>`).join('')}</w:tblBorders><w:tblCellMar><w:top w:w="95" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="95" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(width=>`<w:gridCol w:w="${width}"/>`).join('')}</w:tblGrid>${[headers,...rows].map((row,r)=>`<w:tr><w:trPr>${r===0?'<w:tblHeader/>':''}<w:cantSplit/></w:trPr>${row.map((value,c)=>`<w:tc><w:tcPr><w:tcW w:w="${widths[c]}" w:type="dxa"/><w:shd w:fill="${r===0?'E8ECF4':r%2===0?'F7F9FC':'FFFFFF'}"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:pStyle w:val="TableText"/>${c>0&&r>0&&/^[-≈$\d]/.test(text(value))?'<w:jc w:val="right"/>':''}</w:pPr>${run(shown(value),r===0)}</w:p></w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>`;
    const money=(entry)=>{const n=number(entry?.value);return n===null?'Unavailable':(entry.approximate?'≈':'')+(entry.unit==='percent'?n.toFixed(1)+'%':(n<0?'−':'')+'$'+Math.abs(n).toFixed(2)+'B');};
    let body=p('AI Observatory Research Data','Title')+p('Google Meta OpenAI and Anthropic','Subtitle')+p('Exported '+s.generated+' UTC  |  Reviewed '+s.reviewed+'  |  '+s.period,'Small');
    body+=p('This report brings together the dashboard financial comparison, company strategy, model pricing, stock snapshot, published news and source notes. Financial results cover full companies and use attributed reporting for private companies. Dates, qualifications and citations are retained so the figures can be checked.');
    body+=p('Financial comparison','Heading1')+p(s.scope||'Annual financial results for '+s.period,'Small');
    body+=table(['Company','Revenue USD bn','Gross margin','Gross profit USD bn','Net income or loss USD bn','Revenue growth'],s.companies.map(c=>[c.name,...METRICS.map(([key])=>money(c.performance?.[key]))]),[1700,1460,1460,1580,1700,1460]);
    for(const c of s.companies){body+=p(c.name+' financial basis','Heading2');body+=p(METRICS.map(([key,label])=>{const item=c.performance?.[key]||{};return label+': '+(item.basis||'Unavailable')+(item.approximate?' (approximate)':'')+(list(item.refs).length?' ['+refs(item.refs)+']':'');}).join('; '),'Small');}
    body+=p('Company strategy','Heading1');
    for(const c of s.companies){body+=p(c.name,'Heading2')+p(c.summary||'No strategy note is available.');if(c.route)body+=p('Distribution: '+c.route);if(c.risk)body+=p('Research consideration: '+c.risk);if(list(c.refs).length)body+=p('Sources: '+refs(c.refs),'Small');}
    body+=p('Model API pricing','Heading1')+p('USD per million tokens. Rates reflect reviewed data and published collection updates at export time. Prices are not a measure of model quality. Contributor pricing, where offered, has different data use terms.','Small');
    body+=table(['Company','Model','Input USD','Output USD','Source'],s.models.map(row=>[row[0],row[1],number(row[3])===null?shown(row[3]):row[3].toFixed(2),number(row[4])===null?shown(row[4]):row[4].toFixed(2),row[8]]),[1500,3600,1420,1420,1420]);
    body+=p('Stock snapshot','Heading1')+p(s.report?.summary||'No stock report was loaded.');
    if(s.stocks.length)body+=table(['Company','Symbol','Price','Currency','Quote date'],s.stocks.map(stock=>[stock.company,stock.symbol,number(stock.price)===null?'Unavailable':stock.price.toFixed(2),stock.currency,stock.quoteDate]),[3060,1260,1500,1260,2280]);
    body+=p((s.report?.snapshot?'This is a fixed historical snapshot, not live quotes. ':'The comparison was produced on demand; verify its cited market sources. ')+'The Excel export includes dated price observations and the complete set of stock measures.','Small');
    if(s.insights.length){body+=p('Research interpretation','Heading1');for(const row of s.insights)body+=p(row[0],'Heading2')+p(row[1])+p('Sources: '+row[2],'Small');}
    if(s.news.length){body+=p('Published news','Heading1')+p('Collected '+s.collected+'. Publisher headlines are discovery leads, not independently verified article summaries.','Small');for(const row of s.news)body+=p(row[1],'SourceTitle')+p(row[0]+'  |  '+row[2]+(row[3]?'  |  '+row[3]:''),'Small')+link(row[4],'Open original article');}
    body+=p('Source library','Heading1');
    for(const row of s.sources)body+=p('['+row[0]+'] '+row[2],'SourceTitle')+p([row[1],row[3],row[5]?'Published '+row[5]:'Undated source',row[6]?'Reviewed '+row[6]:''].filter(Boolean).join('  |  '),'Small')+(row[7]?p(row[7]):'')+link(row[8],'Open source document');
    body+='<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1440" w:bottom="1080" w:left="1440" w:header="360" w:footer="360"/></w:sectPr>';
    const styles=XML+'<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="000000"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'+[['Normal',22,false,140,false],['Title',44,true,200,true],['Subtitle',25,false,180,true],['Heading1',30,true,160,true],['Heading2',24,true,120,true],['SourceTitle',22,true,90,true],['Small',18,false,100,false],['TableText',19,false,60,false]].map(([id,size,bold,after,keep])=>`<w:style w:type="paragraph" w:styleId="${id}"${id==='Normal'?' w:default="1"':''}><w:name w:val="${id==='Heading1'?'heading 1':id==='Heading2'?'heading 2':id}"/>${id!=='Normal'?'<w:basedOn w:val="Normal"/>':''}<w:pPr>${keep?'<w:keepNext/>':''}<w:spacing w:before="${id==='Heading1'?240:id==='Heading2'?160:0}" w:after="${after}"/>${id==='Heading1'?'<w:outlineLvl w:val="0"/>':id==='Heading2'?'<w:outlineLvl w:val="1"/>':''}</w:pPr><w:rPr><w:color w:val="000000"/><w:sz w:val="${size}"/>${bold?'<w:b/>':''}</w:rPr></w:style>`).join('')+'</w:styles>';
    return {'[Content_Types].xml':contentTypes('<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'),'_rels/.rels':packageRels('word/document.xml'),'docProps/core.xml':core(s),'word/document.xml':XML+`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="${REL.slice(0,-1)}"><w:body>${body}</w:body></w:document>`,'word/styles.xml':styles,'word/_rels/document.xml.rels':XML+`<Relationships xmlns="${PKG}">${relationships.join('')}</Relationships>`};
  }

  function createFile(format,data,context={}){
    if(!MIME[format])throw new Error('Choose Word (.docx) or Excel (.xlsx).');
    const s=snapshot(data,context),files=format==='xlsx'?workbook(s):documentFile(s);
    return {blob:new Blob(zip(files),{type:MIME[format]}),filename:'ai-observatory-export-'+s.day+'.'+format};
  }
  function download(format,data,context){
    const file=createFile(format,data,context),href=URL.createObjectURL(file.blob),a=document.createElement('a');
    a.href=href;a.download=file.filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),15000);return file.filename;
  }
  root.DashboardExport={createFile,download};
})(globalThis);
