import test from 'node:test';
import assert from 'node:assert/strict';
import { recognizeFinancialStatement } from './financial-import.mjs';
const cell=(address,value)=>({address,value});
function workbook(cost=90) {return {sheets:[{name:'财务报表',rows:[
  {row:1,cells:[cell('B1','科目名称'),cell('C1','2025-01'),...Array.from({length:9},(_,i)=>cell(String.fromCharCode(68+i)+'1',`2026-0${i+1}`)),cell('M1','汇总')]},
  {row:2,cells:[cell('B2','一、营业收入(不含增值税)'),...Array.from({length:9},(_,i)=>cell(String.fromCharCode(68+i)+'2',100))]},
  {row:3,cells:[cell('B3','二、营业成本(不含增值税)'),cell('C3',99999),...Array.from({length:9},(_,i)=>cell(String.fromCharCode(68+i)+'3',cost)),cell('M3',999999)]},
  {row:4,cells:[cell('B4','其中：人工费用'),cell('D4',9999)]},
]}]};}
test('selects latest year monthly totals without prior year, subtotals or aggregate columns',()=>{const f=recognizeFinancialStatement(workbook(),'test.xlsx');assert.equal(f.cost,810);assert.equal(f.revenue,900);assert.equal(f.period.months,9);assert.equal(f.sources.length,18);assert.equal(f.cost/9*12,1080);});
test('explicit zero and negative adjustments remain numbers; blank month is not zero',()=>{assert.equal(recognizeFinancialStatement(workbook(0),'').cost,0);assert.equal(recognizeFinancialStatement(workbook(-1),'').cost,-9);assert.equal(recognizeFinancialStatement(workbook(null),'').cost,null);});
test('ambiguous repeated total rows do not silently add or select one',()=>{const w=workbook();w.sheets[0].rows.push({...w.sheets[0].rows[2]});assert.equal(recognizeFinancialStatement(w,'').cost,null);});
