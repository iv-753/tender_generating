// Only total operating revenue/cost rows and one explicit monthly period.
// Subaccounts, other years and the aggregate column are never added again.
export function recognizeFinancialStatement(workbook, fileName) {
  const sheet=workbook.sheets.find(s=>s.name==='财务报表');
  if (!sheet) return null;
  const header=sheet.rows.find(r=>r.cells.some(c=>/^20\d{2}-\d{2}$/.test(String(c.value))));
  if (!header) return null;
  const dated=header.cells.filter(c=>/^20\d{2}-\d{2}$/.test(String(c.value)));
  const year=Math.max(...dated.map(c=>Number(String(c.value).slice(0,4))));
  const columns=dated.filter(c=>String(c.value).startsWith(year+'-')).map(c=>({col:c.address.replace(/\d/g,''),month:Number(String(c.value).slice(5))})).sort((a,b)=>a.month-b.month);
  if (!columns.length || columns.some((c,i)=>c.month!==i+1)) return null;
  const period={label:`${year}年1—${columns.length}月`,year,startMonth:1,endMonth:columns.length,endYear:year,months:columns.length,annual:columns.length===12};
  const sources=[];
  function amount(kind) {
    const rows=sheet.rows.filter(r=>r.cells.some(c=>new RegExp('^(?:[一二三四五六七八九十]+[、.])?'+kind+'(?:[（(].*[）)])?$').test(String(c.value).replace(/\s/g,''))));
    if (rows.length!==1) return null;
    const values=columns.map(({col})=>rows[0].cells.find(c=>c.address===col+rows[0].row));
    if(values.some(c=>!c||typeof c.value!=='number'||!Number.isFinite(c.value))) return null;
    sources.push(...values.map(c=>({fileName,sheet:sheet.name,cell:c.address,raw:c.value})));
    // These source statements use yuan; explicit 万元 headings take precedence.
    const factor=header.cells.some(c=>/万元/.test(String(c.value)))?10000:1;
    return values.reduce((sum,c)=>sum+c.value*factor,0);
  }
  const revenue=amount('营业收入'),cost=amount('营业成本');
  return {revenue,cost,period,sources,unit:'元'};
}
