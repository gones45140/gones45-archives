const g = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : { http: r.status }; } catch (e) { return { err: String(e) }; } };
for (const id of ['231388', '159047']) {
  const sl = await g(`https://sports.core.api.espn.com/v2/sports/soccer/athletes/${id}/statisticslog`);
  console.log(id, 'KEYS', Object.keys(sl), 'count', sl.count, 'pageSize', sl.pageSize, 'pageCount', sl.pageCount, 'entries', (sl.entries || []).length);
  for (const e of sl.entries || []) {
    const s = (e.season || {}).$ref || ''; const m = s.match(/leagues\/([^/]+)\/seasons\/(\d+)/);
    const t = (((e.statistics || [])[0] || {}).team || {}).$ref || ''; const tm = t.match(/teams\/(\d+)/);
    if (m && +m[2] >= 2022) console.log('  ', m[1], m[2], tm && tm[1]);
  }
}
const tm = await g('https://sports.core.api.espn.com/v2/sports/soccer/leagues/fra.1/seasons/2023/teams/160');
console.log('TEAM', tm.displayName, tm.shortDisplayName, tm.abbreviation);
