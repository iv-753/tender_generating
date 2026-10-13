import { emptyRevenueScenario } from '../calculation/revenue-scenario.mjs';
const cell = (r, c) => r?.cells.find(v => v.address.replace(/\d/g, '') === c)?.value;
const clean = x => String(x ?? '').replace(/[,，\s]/g, '');
const number = x => typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : /^\d+(\.\d+)?$/.test(clean(x)) ? Number(clean(x)) : null;

// Accept only complete, explicit arithmetic notes; never evaluate workbook text as code.
function annualNote(raw) {
  const lines = String(raw ?? '').split(/[\n；;]/).map(s => s.trim()).filter(Boolean);
  if (!lines.length) return null;
  const values = lines.map(line => {
    const annual = line.match(/全年(?:预估|估算|预计|合计)?[￥¥]?\s*(\d+(?:\.\d+)?)/);
    if (annual) return Number(annual[1]);
    const monthly = clean(line).match(/(?:估|=)(\d+(?:\.\d+)?)(?:元)?\/月[*×](?:(\d+(?:\.\d+)?)[*×])?12月$/);
    return monthly ? Number(monthly[1]) * Number(monthly[2] ?? 1) * 12 : null;
  });
  return values.some(v => v === null) ? null : values.reduce((a,b)=>a+b,0);
}
export function recognizeRevenue(workbook) {
  const sheet = workbook.sheets.find(s => /项目收入/.test(s.name));
  if (!sheet) return null;
  const s = emptyRevenueScenario();
  const rows = pattern => sheet.rows.filter(r => pattern.test(clean(cell(r, 'A'))));
  const row = pattern => { const found = rows(pattern); return found.length === 1 ? found[0] : undefined; };
  const source = (r, cols = ['C']) => cols.map(c => `${sheet.name}!${c}${r.row}：${cell(r,c) ?? '空白'}`).join('；');
  const annual = (key, pattern) => {
    const r = row(pattern); if (!r) return;
    const v = number(cell(r,'C')), unit = clean(cell(r,'B'));
    const factor = { '元/年': 1, '万元/年': 10000, '元/月': 12, '万元/月': 120000 }[unit];
    s[key] = v === null || !factor ? null : v * factor;
    s.sources[key] = `${source(r,['B','C'])}${factor === 12 ? '；月金额×12' : ''}`;
    if (key === 'nonContractAnnual' && v === null && unit === '元/年') {
      s[key] = annualNote(cell(r,'E'));
      s.sources[key] += `；${source(r,['E'])}；按备注逐项全年金额合计`;
    }
    if (key === 'parkingAnnual' && /每月/.test(cell(r,'A')) && /年/.test(unit)) s.notes.push('车位行名称写“每月”，单位和填报说明写“年”；按单位元/年读取，请核对。');
  };
  const commercialPrice = row(/^商业物业费单价$/), commercialArea = row(/^商业收费面积$/);
  const price = number(cell(commercialPrice,'C')), area = number(cell(commercialArea,'C'));
  if (commercialPrice && commercialArea) {
    const unitsOK = /^元\/(?:㎡|平方米|m²|m2)[·/]?月$/.test(clean(cell(commercialPrice,'B'))) && /^(㎡|平方米|m²|m2)$/.test(clean(cell(commercialArea,'B')));
    s.commercialAnnual = unitsOK && price !== null && area !== null ? price * area * 12 : null;
    s.sources.commercialAnnual = `${source(commercialPrice)}；${source(commercialArea)}；单价×面积×12（按100%收缴试算）`;
  }
  annual('parkingAnnual', /^车位管理费(?:每月|全年|年度)?合计$/);
  annual('valueAddedAnnual', /^增值服务(?:全年|年度)?收入$/);
  annual('nonContractAnnual', /^(?:无合同|非合同)(?:全年|年度)?收入$/);
  const residentialPrice = row(/^住宅物业费单价$/);
  if (residentialPrice && /^元\/(?:㎡|平方米|m²|m2)[·/]?月$/.test(clean(cell(residentialPrice,'B')))) {
    s.currentResidentialRate = number(cell(residentialPrice,'C'));
    s.sources.currentResidentialRate = source(residentialPrice);
  }
  s.sourceResidentialArea = number(cell(row(/^住宅收费面积$/),'C')) ?? undefined;
  const basic = workbook.sheets.find(t => /项目基本情况/.test(t.name));
  const name = basic?.rows.find(r=>/^项目名称$/.test(clean(cell(r,'A'))));
  if (name) s.sourceProjectName = String(cell(name,'C') ?? '');
  s.notes.push('收入按表6的年度口径试算；表内统计期提示与表5一致，请确认填写值已是全年金额。增值及其他收入只计物业公司可取得的份额，配套成本需纳入费用。');
  return s;
}
