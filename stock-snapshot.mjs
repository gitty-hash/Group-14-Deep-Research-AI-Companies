const dates = [
 '2026-09-21','2026-09-22','2026-09-23','2026-09-24','2026-09-25',
 '2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02',
 '2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09',
 '2026-10-12','2026-10-13','2026-10-14','2026-10-15','2026-10-16',
 '2026-10-19','2026-10-20'
];

function makeStock({requestedName,company,symbol,closes,previousClose,dayLow,dayHigh,week52Low,week52High,volume,note}){
 const price=closes.at(-1);
 return {
  requestedName,company,symbol,price,currency:'USD',quoteDate:'2026-10-20',quoteType:'last close',
  history:dates.map((time,index)=>({time,close:closes[index]})),
  previousClose,dayLow,dayHigh,
  dailyChangePercent:Number(((price/previousClose-1)*100).toFixed(2)),
  periodReturns:{'1D':Number(((price/previousClose-1)*100).toFixed(2)),'1W':null,'1M':Number(((price/closes[0]-1)*100).toFixed(2)),'3M':null,'6M':null,'1Y':null,'5Y':null},
  week52Low,week52High,marketCapUsdBillions:null,trailingPE:null,volume,averageDailyVolume:null,
  beta:null,dividendYieldPercent:null,rsi14:null,sma50:null,sma200:null,note
 };
}

export const stockSnapshot={
 range:'1M',
 checkedAt:'2026-10-20T20:00:00.000Z',
 snapshot:true,
 summary:'Fixed historical snapshot captured at the October 20, 2026 market close. The chart and one-month change use Yahoo Finance daily closing prices from September 21 through October 20, 2026. Market capitalization, valuation ratios and technical indicators are not included in this snapshot; use Compare Stock with Gemini Search for a fresh cited report. This is not live market data.',
 sources:[
  {title:'Alphabet Inc. (GOOGL) Historical Data — Yahoo Finance',url:'https://finance.yahoo.com/quote/GOOGL/history/'},
  {title:'Meta Platforms, Inc. (META) Historical Data — Yahoo Finance',url:'https://finance.yahoo.com/quote/META/history/'}
 ],
 stocks:[
  makeStock({
   requestedName:'Alphabet Inc.',company:'Alphabet Inc.',symbol:'GOOGL',
   closes:[354.97,351.16,337.83,342.36,343.92,342.75,340.92,344.08,338.24,343.50,346.47,347.68,350.50,348.29,351.66,352.72,353.78,347.64,349.22,340.59,344.18,340.28],
   previousClose:344.18,dayLow:338.36,dayHigh:344.77,week52Low:244.15,week52High:408.61,volume:18215400,
   note:'Fixed close snapshot for 2026-10-20. One-month return is calculated from the first available close (2026-09-21); valuation and technical fields are not in this snapshot.'
  }),
  makeStock({
   requestedName:'Meta Platforms, Inc.',company:'Meta Platforms, Inc.',symbol:'META',
   closes:[741.25,736.60,744.10,777.59,751.66,715.62,738.79,725.18,725.93,728.08,741.90,738.88,721.31,720.89,718.67,742.96,762.50,737.54,736.72,709.33,705.44,694.25],
   previousClose:705.44,dayLow:681.05,dayHigh:696.51,week52Low:520.26,week52High:779.82,volume:16957600,
   note:'Fixed close snapshot for 2026-10-20. One-month return is calculated from the first available close (2026-09-21); valuation and technical fields are not in this snapshot.'
  })
 ]
};
