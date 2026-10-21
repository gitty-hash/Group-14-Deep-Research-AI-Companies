import {readFileSync} from 'node:fs';

const histories=JSON.parse(readFileSync(new URL('./stock-history.json',import.meta.url),'utf8'));
const ranges=['1D','1W','1M','3M','6M','1Y','5Y'];

function returnFor(points,startPrice=points[0]?.close){
 const endPrice=points.at(-1)?.close;
 return Number.isFinite(startPrice)&&startPrice>0&&Number.isFinite(endPrice)
  ?Number(((endPrice/startPrice-1)*100).toFixed(2))
  :null;
}

function makeStock({requestedName,company,symbol,previousClose,dayLow,dayHigh,week52Low,week52High,marketCapUsdBillions,trailingPE,volume,note}){
 const historyByRange=histories[symbol];
 const history=historyByRange['1M'];
 const price=history.at(-1).close;
 const dailyChangePercent=returnFor(historyByRange['1D'],previousClose);
 const periodReturns=Object.fromEntries(ranges.map(range=>[
  range,
  range==='1D'?dailyChangePercent:returnFor(historyByRange[range])
 ]));
 return {
  requestedName,company,symbol,price,currency:'USD',quoteDate:'2026-10-20',quoteType:'last close',
  history,historyByRange,
  previousClose,dayLow,dayHigh,dailyChangePercent,periodReturns,
  week52Low,week52High,marketCapUsdBillions,trailingPE,volume,averageDailyVolume:null,
  beta:null,dividendYieldPercent:null,rsi14:null,sma50:null,sma200:null,note
 };
}

export const stockSnapshot={
 range:'1M',
 checkedAt:'2026-10-20T20:00:00.000Z',
 snapshot:true,
 summary:'Fixed historical snapshot captured at the October 20, 2026 market close. Dated Yahoo Finance closing prices are available for all chart ranges: 1D at 15-minute intervals, 1W and 1M daily, 3M/6M/1Y weekly, and 5Y monthly. Period returns are calculated from the dated points (the 1D return uses the prior close). Market capitalization and trailing P/E are the Yahoo Finance quote-page values checked before the October 21 market open; other technical indicators are not included. This is historical data, not a live market feed.',
 sources:[
  {title:'Alphabet Inc. (GOOGL) Historical Data — Yahoo Finance',url:'https://finance.yahoo.com/quote/GOOGL/history/'},
  {title:'Meta Platforms, Inc. (META) Historical Data — Yahoo Finance',url:'https://finance.yahoo.com/quote/META/history/'},
  {title:'Alphabet Inc. (GOOGL) Quote — Yahoo Finance',url:'https://finance.yahoo.com/quote/GOOGL/'},
  {title:'Meta Platforms, Inc. (META) Quote — Yahoo Finance',url:'https://finance.yahoo.com/quote/META/'}
 ],
 stocks:[
  makeStock({
   requestedName:'Alphabet Inc.',company:'Alphabet Inc.',symbol:'GOOGL',
   previousClose:344.18,dayLow:338.36,dayHigh:344.77,week52Low:244.15,week52High:408.61,marketCapUsdBillions:4162,trailingPE:17.07,volume:18215400,
   note:'Fixed close snapshot for 2026-10-20. Market capitalization and trailing P/E are the Yahoo Finance quote-page values checked before the October 21 market open. Period returns use dated Yahoo Finance closes.'
  }),
  makeStock({
   requestedName:'Meta Platforms, Inc.',company:'Meta Platforms, Inc.',symbol:'META',
   previousClose:705.44,dayLow:681.05,dayHigh:696.51,week52Low:520.26,week52High:779.82,marketCapUsdBillions:1769,trailingPE:26.16,volume:16957600,
   note:'Fixed close snapshot for 2026-10-20. Market capitalization and trailing P/E are the Yahoo Finance quote-page values checked before the October 21 market open. Period returns use dated Yahoo Finance closes.'
  })
 ]
};
