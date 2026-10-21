import test from 'node:test';
import assert from 'node:assert/strict';
import {recognizeComparisonData} from './comparison-import.mjs';
const row=(n,values)=>({row:n,cells:values.map((value,i)=>({address:String.fromCharCode(65+i)+n,value})).filter(c=>c.value!==undefined)});
const book=(rows,period='2026年1月—12月')=>({sheets:[{name:'5 实际人数和费用',rows:[row(1,['实际人数和全年费用']),row(2,['统计期间',period]),row(3,['人员类别','自有人员（人）','这些人员全年费用（元）','外包人员（人）','全年付给外包公司的费用（元）']),...rows]}]});
test('selects grand totals instead of summing detail and subtotal',()=>{
 const d=recognizeComparisonData(book([row(4,['工程',2,100,3,200]),row(5,['工程小计',2,100,3,200]),row(6,['总计',2,100,3,200])]));
 assert.equal(d.personnel.total,5);assert.equal(d.cost.amount,300);assert.equal(d.personnel.own.sources[0].cell,'B6');
});
test('does not double count subtotal or duplicate rows; repeated imports replace rather than accumulate',()=>{
 const w=book([row(4,['工程',2,100,3,200]),row(5,['工程',2,100,3,200]),row(6,['工程小计',2,100,3,200]),row(7,['保洁',1,50,4,300])]);
 for(let i=0;i<2;i++){const d=recognizeComparisonData(w);assert.equal(d.personnel.total,10);assert.equal(d.cost.amount,650);}
});
test('keeps explicit zero and unknown distinct',()=>{
 const zero=recognizeComparisonData(book([row(4,['工程',0,0,0,0])]));assert.equal(zero.personnel.total,0);assert.equal(zero.cost.amount,0);
 const blank=recognizeComparisonData(book([row(4,['工程',null,null,null,null])]));assert.equal(blank.personnel.total,null);assert.equal(blank.cost.amount,null);
 const partial=recognizeComparisonData(book([row(4,['工程',2,120,null,null])]));assert.equal(partial.personnel.total,2);assert.equal(partial.personnel.outsourced.value,null);assert.equal(partial.personnel.own.complete,true);assert.equal(partial.personnel.outsourced.complete,false);
});
test('retains period and end-year headcount qualification',()=>{
 const d=recognizeComparisonData(book([row(4,['工程',2,100,3,200,'人数填年底在岗人数'])],'2026年1月至9月'),{fileName:'真实源表.xlsx'});
 assert.equal(d.period.months,9);assert.equal(d.cost.amount,300);assert.equal(d.cost.kind,'reported');assert.equal(d.cost.periodVerified,false);
 assert.match(d.personnel.kind,/年底/);assert.equal(d.personnel.periodVerified,false);assert.equal(d.cost.sources[0].fileName,'真实源表.xlsx');
});
test('converts explicit cost units and preserves actual vs budget',()=>{
 const workbook=kind=>({sheets:[{name:'项目成本',rows:[row(1,[kind+'；费用范围：服务成本及补充费用']),row(2,['统计期间','2025年1月—12月']),row(3,['费用项目','金额（万元）']),row(4,['人员',12]),row(5,['其他',3]),row(6,['合计',15])]}]});
 const actual=recognizeComparisonData(workbook('实际成本')).cost;assert.equal(actual.amount,150000);assert.equal(actual.kind,'actual');assert.equal(actual.scopeVerified,true);assert.equal(actual.own.sources[0].raw,15);assert.equal(actual.own.rawUnit,'万元');
 assert.equal(recognizeComparisonData(workbook('全年预算')).cost.kind,'budget');
});
test('imports action rows, excludes headings and explicit non-applicability, never uses execution count',()=>{
 const w={sheets:[{name:'合同约定服务标准',rows:[row(1,['序号','服务内容','服务频次']),row(2,['保洁']),row(3,[1,'地面清扫','365次/年']),row(4,[2,'绿化','不涉及'])]}]};
 const d=recognizeComparisonData(w);assert.equal(d.actions.items.length,2);assert.equal(d.actions.items[0].applicable,true);assert.equal(d.actions.items[1].applicable,false);assert.equal(d.actions.confirmed,false);
});
