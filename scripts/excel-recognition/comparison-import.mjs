
const text = v => String(v ?? '').trim();
const clean = v => text(v).replace(/\s/g, '');
const at = (row,col) => row?.cells.find(c=>c.address.replace(/\d/g,'')===col);
const number = value => {
  if(typeof value==='number') return Number.isFinite(value)&&value>=0?value:null;
  const t=clean(value).replace(/[,，]/g,'');
  return /^\d+(\.\d+)?$/.test(t)?Number(t):null;
};
const ref = (sheet,row,col,fileName) => ({fileName,sheet:sheet.name,cell:col+row.row,raw:at(row,col)?.value ?? null});
const cellsText = rows => rows.flatMap(r=>r.cells.map(c=>text(c.value))).join('；');

export function parsePeriod(raw) {
  const label=text(raw)||'期间待补充';
  const years=[...label.matchAll(/(20\d{2})年?/g)].map(m=>Number(m[1]));
  const months=[...label.matchAll(/(\d{1,2})月/g)].map(m=>Number(m[1]));
  // Support compact ranges such as 2026年1—9月.
  const compact=label.match(/年(\d{1,2})\s*[-—~～至]\s*(\d{1,2})月/);
  if(compact&&months.length===1)months.unshift(Number(compact[1]));
  const year=years[0]??null,startMonth=months[0]??(year?1:null),endMonth=months.at(-1)??(year?12:null);
  const endYear=years.at(-1)??year;
  const count=year&&startMonth&&endMonth?(endYear-year)*12+endMonth-startMonth+1:null;
  return {label,year,startMonth,endMonth,endYear,months:count,annual:count===12};
}

function aggregate(rows,col,sheet,fileName,unit='人') {
  if(!col)return {value:null,complete:false,sources:[],rawUnit:unit,method:'未提供',missing:[]};
  const numeric=rows.filter(r=>number(at(r,col)?.value)!==null);
  const grand=numeric.filter(r=>/^(总计|合计|总人数|人数合计|总成本|费用合计|成本合计)$/.test(clean(at(r,'A')?.value)));
  let selected,method;
  if(grand.length){
    if(new Set(grand.map(r=>number(at(r,col)?.value))).size>1)return {value:null,complete:false,sources:grand.map(r=>ref(sheet,r,col,fileName)),rawUnit:unit,method:'总计冲突，待核对',missing:[]};
    selected=[grand[0]];method='采用总计，不叠加明细或小计';
  } else {
    // A labelled subtotal closes its preceding detail group. It is used only
    // when that group contains no numeric detail; it is never added on top.
    const picked=[];let group=[];
    for(const row of rows){
      const label=clean(at(row,'A')?.value);
      if(/总计|合计/.test(label)&&!label.includes('小计'))continue;
      if(/小计/.test(label)){
        const details=group.filter(r=>number(at(r,col)?.value)!==null);
        picked.push(...(details.length?details:number(at(row,col)?.value)!==null?[row]:[]));group=[];
      }else group.push(row);
    }
    picked.push(...group.filter(r=>number(at(r,col)?.value)!==null));
    const seen=new Set();
    selected=picked.filter(r=>{const key=clean(at(r,'A')?.value)+'|'+clean(at(r,col)?.value);if(seen.has(key))return false;seen.add(key);return true;});
    method='已填写明细合计；排除小计、总计和重复行';
  }
  const factor=/万元/.test(unit)?10000:1;
  const missing=grand.length?[]:rows.filter(r=>!/(?:小计|总计|合计)/.test(clean(at(r,'A')?.value))&&number(at(r,col)?.value)===null).map(r=>ref(sheet,r,col,fileName));
  return {value:selected.length?Number((selected.reduce((s,r)=>s+number(at(r,col)?.value)*factor,0)).toFixed(6)):null,complete:selected.length>0&&missing.length===0,sources:selected.map(r=>ref(sheet,r,col,fileName)),rawUnit:unit,method,missing};
}

export function recognizeComparisonData(workbook,{fileName='',recognition}={}) {
  const data={version:1,fileName,importedAt:new Date().toISOString(),period:parsePeriod(''),personnel:null,cost:null,actions:null,rate:null,warnings:[]};
  for(const sheet of workbook.sheets){
    const header=sheet.rows.find(r=>r.cells.some(c=>/自有人员|自有人数/.test(clean(c.value)))&&r.cells.some(c=>/外包人员|外包人数/.test(clean(c.value))));
    if(!header)continue;
    const col=pattern=>header.cells.find(c=>pattern.test(clean(c.value)))?.address.replace(/\d/g,'');
    const periodRow=sheet.rows.find(r=>/统计年度|统计期间|数据期间/.test(text(at(r,'A')?.value)));
    data.period=parsePeriod(at(periodRow,'B')?.value);
    data.period.sources=periodRow?[ref(sheet,periodRow,'B',fileName)]:[];
    const rows=sheet.rows.filter(r=>r.row>header.row&&text(at(r,'A')?.value)&&r.cells.some(c=>c.address[0]!=='A')&&!/填写说明|其他需要说明|人员费用包括/.test(text(at(r,'A')?.value)));
    const own=aggregate(rows,col(/自有(?:人员|人数)/),sheet,fileName);
    const outsourced=aggregate(rows,col(/外包(?:人员|人数)/),sheet,fileName);
    const note=cellsText(rows.filter(r=>r.cells.some(c=>/人数填|编制|计划人数|实际在岗/.test(text(c.value)))));
    const kind=/计划|编制/.test(note)?'编制／计划人数':/年底/.test(note)?'年底在岗人数（项目填报）':'项目填报人数';
    const totalCol=col(/^(总人数|人员合计|人数合计)/);
    const explicit=totalCol?aggregate(rows,totalCol,sheet,fileName):null;
    data.personnel={own,outsourced,total:explicit?.value??([own.value,outsourced.value].some(v=>v!==null)?(own.value??0)+(outsourced.value??0):null),kind,scope:'自有及外包人员（以已填栏目为准）',scopeVerified:/本项目.*驻场|驻场.*自有.*外包/.test(cellsText(sheet.rows)),periodVerified:data.period.annual&&/全年平均在岗|年度平均在岗/.test(note),period:data.period,notes:[note||'人员在岗时点待核',...(own.missing.length||outsourced.missing.length?['有空白或非数字人数栏目，显示已填合计，不将空值当0。']:[])],sources:[...(explicit?.sources??[]),...own.sources,...outsourced.sources]};
    const ownCostCol=col(/这些人员.*费用|自有.*费用/),outCostCol=col(/付给外包|外包.*费用/);
    const ownUnit=text(header.cells.find(c=>c.address.replace(/\d/g,'')===ownCostCol)?.value).includes('万元')?'万元':'元';
    const outUnit=text(header.cells.find(c=>c.address.replace(/\d/g,'')===outCostCol)?.value).includes('万元')?'万元':'元';
    const ownCost=aggregate(rows,ownCostCol,sheet,fileName,ownUnit),outCost=aggregate(rows,outCostCol,sheet,fileName,outUnit);
    const costTotalCol=col(/^(费用合计|成本合计|总费用)/);
    const costTotal=costTotalCol?aggregate(rows,costTotalCol,sheet,fileName,text(at(header,costTotalCol)?.value).includes('万元')?'万元':'元'):null;
    const headings=cellsText(sheet.rows.filter(r=>r.row<=header.row));
    const kindCost=/预算/.test(headings)?'budget':/实际成本|实际发生费用|已发生费用/.test(headings)&&!/推算|预估|预算/.test(headings)?'actual':'reported';
    const conflict=!data.period.annual&&/全年费用|全年付给/.test(cellsText([header]));
    data.cost={amount:costTotal?.value??([ownCost.value,outCost.value].some(v=>v!==null)?Number(((ownCost.value??0)+(outCost.value??0)).toFixed(6)):null),currency:'元',own:ownCost,outsourced:outCost,kind:kindCost,scope:'人员费用及外包服务费（已填合计）',scopeVerified:/服务成本[及＋+]补充费用|全部服务费用.*含补充/.test(headings),period:data.period,periodVerified:data.period.annual&&!conflict,notes:[...(conflict?['统计期间不足全年，但费用表头为全年费用，原金额按统计期间保留，年化值另行标注。']:[]),...(ownCost.missing.length||outCost.missing.length?['存在空白或非数字费用栏目，金额为已填合计。']:[])],sources:[...(costTotal?.sources??[]),...ownCost.sources,...outCost.sources]};
    break;
  }
  if(!data.cost) for(const sheet of workbook.sheets.filter(s=>/成本|费用/.test(s.name))) {
    const header=sheet.rows.find(r=>r.cells.some(c=>/^(费用项目|成本项目|费用类别)$/.test(clean(c.value)))&&r.cells.some(c=>/金额|实际成本|预算金额/.test(clean(c.value))));
    if(!header)continue;
    const moneyCell=header.cells.find(c=>/金额|实际成本|预算金额/.test(clean(c.value)));
    const col=moneyCell.address.replace(/\d/g,'');
    const heading=cellsText(sheet.rows.filter(r=>r.row<=header.row));
    if(!/元/.test(heading))continue;
    const periodRow=sheet.rows.find(r=>/统计年度|统计期间|数据期间/.test(text(at(r,'A')?.value)));
    data.period=parsePeriod(at(periodRow,'B')?.value);
    const rows=sheet.rows.filter(r=>r.row>header.row&&text(at(r,'A')?.value)&&r.cells.some(c=>c.address.replace(/\d/g,'')===col));
    const aggregateCost=aggregate(rows,col,sheet,fileName,/万元/.test(heading)?'万元':'元');
    const blank={value:null,complete:false,sources:[],rawUnit:'元',method:'无独立分类',missing:[]};
    const kind=/预算/.test(heading)?'budget':/实际成本|实际发生费用|已发生费用/.test(heading)?'actual':'reported';
    data.cost={amount:aggregateCost.value,currency:'元',own:aggregateCost,outsourced:blank,kind,scope:/服务成本[及＋+]补充费用/.test(heading)?'服务成本及补充费用':'上传费用清单，范围待核',scopeVerified:/服务成本[及＋+]补充费用/.test(heading),period:data.period,periodVerified:data.period.annual,notes:[],sources:aggregateCost.sources};
    break;
  }
  // Retain confirmed imported action rows and their mapping to calculation
  // parameters. Do not infer counts from annual execution frequency.
  const actionItems=[];
  for(const sheet of workbook.sheets.filter(s=>/合同约定服务标准|项目服务动作|服务动作清单/.test(s.name))){
    const header=sheet.rows.find(r=>r.cells.some(c=>/^(服务内容|服务动作|动作名称)$/.test(clean(c.value))));
    if(!header)continue;
    const labelCol=header.cells.find(c=>/^(服务内容|服务动作|动作名称)$/.test(clean(c.value))).address.replace(/\d/g,'');
    const freqCol=header.cells.find(c=>/服务频次/.test(clean(c.value)))?.address.replace(/\d/g,'')??'C';
    for(const row of sheet.rows.filter(r=>r.row>header.row)){
      const label=text(at(row,labelCol)?.value),frequency=at(row,freqCol)?.value,notes=text(at(row,'E')?.value);
      if(!label||/^(服务内容|序号|合计|小计|总计)$/.test(label))continue;
      const parameters=(recognition?.recognition?.parameters??[]).filter(p=>p.source?.sheet===sheet.name&&p.source.cell===freqCol+row.row);
      const mappings=parameters.map(p=>p.key);
      const excluded=/^(不提供|不适用|不涉及|不开展|无此设施)/.test(clean(frequency))||/^0(?:$|[（(])/.test(clean(frequency))||/^(不涉及|不适用|无此设施)$/.test(clean(notes));
      actionItems.push({id:label, label,applicable:!excluded,mappingKeys:mappings,source:ref(sheet,row,labelCol,fileName),frequencySource:ref(sheet,row,freqCol,fileName)});
    }
  }
  if(actionItems.length)data.actions={confirmed:false,items:actionItems};
  const revenue=recognition?.project?.revenueScenario;
  if(revenue&&typeof revenue.currentResidentialRate==='number')data.rate={value:revenue.currentResidentialRate,area:revenue.sourceResidentialArea??null,period:data.period,source:revenue.sources.currentResidentialRate??'',fileName};
  return data;
}
