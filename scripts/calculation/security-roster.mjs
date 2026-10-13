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
