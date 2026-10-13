// Read only explicit times and post evidence already retained with the import.
export function dailyCoverageHours(raw) {
  const text = String(raw ?? '').normalize('NFKC').replace(/\s/g, '');
  const ranges = [...text.matchAll(/(\d{1,2}):(\d{2})[-~—–至](\d{1,2}):(\d{2})/g)];
  if (!ranges.length) return /^24小时(?:值守)?$/.test(text) ? 24 : null;
  const remaining = text.replace(/(\d{1,2}):(\d{2})[-~—–至](\d{1,2}):(\d{2})/g, '');
  if (/\d{1,2}:\d{2}|待定|未约定|另|不详/.test(remaining)) return null;
  const covered = new Set();
  for (const [, sh, sm, eh, em] of ranges) {
    if (+sh > 23 || +eh > 24 || +sm > 59 || +em > 59 || +eh === 24 && +em !== 0) return null;
    const start = +sh * 60 + +sm, end = +eh * 60 + +em;
    if (start === end) return null;
    const duration = (end - start + 1440) % 1440 || 1440;
    for (let i = 0; i < duration; i++) {
      const minute = (start + i) % 1440;
      if (covered.has(minute)) return null;
      covered.add(minute);
    }
  }
  return covered.size / 60;
}

export function importedSecurityRoster(project) {
  const rows = project.importedSecurityPosts;
  if (rows?.length) {
    const security = rows.filter(r => r.role !== 'other');
    const of = role => security.filter(r => r.role === role);
    if (['gate','car','patrol','monitor','leader','manager'].every(role => of(role).length)) {
      if (security.some(r => !r.valid || r.total === null)) return null;
      const totals = Object.fromEntries(['gate','car','patrol','monitor','leader','manager'].map(role => [role, of(role).reduce((n,r)=>n+r.total,0)]));
      return { mode: 'declared', totals, rows: security, total: security.reduce((n,r)=>n+r.total,0), gatePosts:0,gateHours:0,gatePeople:0,patrolHours:0,twoTowerAssumption:false,assumedPeople:false };
    }
  }
  const read = (key, requiredNote) => {
    const issue = project.importReviewIssues?.find(i => i.key === key && i.resolution?.decision === 'covered');
    if (!issue) return null;
    const cell = col => issue.sources.find(s => new RegExp(`^${col}\\d+$`).test(s.cell))?.raw;
    const note = String(cell('F') ?? '');
    if (!requiredNote.test(note)) return null;
    const count = Number(cell('B')), hours = dailyCoverageHours(cell('E'));
    const rawPeople = cell('D');
    const people = rawPeople == null ? 1 : Number(rawPeople);
    if (!Number.isInteger(count) || count < 1 || !Number.isInteger(people) || people < 1 || hours === null) return null;
    return { count, hours, people, note, assumedPeople: rawPeople == null };
  };
  const gate = read('posts.服务处前台', /门岗/);
  const patrol = read('posts.其他固定位置', /巡逻/);
  if (!gate || !patrol) return null;
  // The source says one point but names both towers. Keep the conservative
  // two-point scenario explicit and editable; do not claim it is confirmed.
  const twoTowerAssumption = gate.count === 1 && project.gatehouses === 2 && /南北塔/.test(gate.note);
  return { gatePosts: twoTowerAssumption ? 2 : gate.count, gateHours: gate.hours, gatePeople: gate.people,
    patrolHours: patrol.count * patrol.hours * patrol.people, twoTowerAssumption,
    assumedPeople: gate.assumedPeople || patrol.assumedPeople };
}

export function readSecurityPosts(sheet) {
  if (!sheet) return [];
  const clean = v => String(v ?? '').replace(/\s/g,'');
  const header = sheet.rows.find(r => r.cells.some(c => /^值守位置$|^岗位名称$/.test(clean(c.value))));
  if (!header) return [];
  const col = re => header.cells.find(c=>re.test(clean(c.value)))?.address.replace(/\d/g,'');
  const cols = {label:col(/^值守位置$|^岗位名称$/),count:col(/点位/),shifts:col(/每天几班|班次数/),people:col(/每班.*几人|每班人数/),relief:col(/例休|轮休|替休/),total:col(/合计人数|总人数/),time:col(/值守时间|覆盖时段/),note:col(/备注/)};
  const number = v => typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : /^\d+$/.test(clean(v)) ? Number(clean(v)) : null;
  return sheet.rows.filter(r=>r.row>header.row).flatMap(row=>{
    const read = key => row.cells.find(c=>c.address===cols[key]+row.row)?.value;
    const label=clean(read('label')), note=String(read('note')??'');
    if (!label || /例如|填写/.test(label)) return [];
    const role=/保安经理|安保经理/.test(label)?'manager':/保安带班|安保带班|班长|带班主任/.test(label)?'leader':/中控|监控/.test(label)?'monitor':/巡逻/.test(label+note)?'patrol':/车场出入口|车库出入口/.test(label)?'car':/大门|门岗|主入口|次入口/.test(label+note)?'gate':'other';
    const count=number(read('count')),shifts=number(read('shifts')),people=number(read('people')),relief=number(read('relief')),stated=number(read('total'));
    const hours=dailyCoverageHours(String(read('time')??'').replace(/(\d{1,2}:\d{2}):00/g,'$1'));
    const derived=[count,shifts,people,relief].every(n=>n!==null)?count*shifts*people+relief:null;
    const total=stated??derived;
    const valid=[count,shifts,people].every(n=>n!==null) && (count===0 ? total===0 && shifts===0 && people===0 : hours!==null && shifts>0&&people>0) && (stated===null||derived===null||stated===derived);
    return [{label,role,count,shifts,people,relief,total,hours,note,valid,sources:row.cells.map(c=>({sheet:sheet.name,cell:c.address,raw:c.value}))}];
  });
}
