const g = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const sb = await g('https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=20250715');
const id = sb.events[0].id; const sm = await g('https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event=' + id);
for (const eq of ((sm.boxscore || {}).players || []).slice(0, 1)) for (const c of eq.statistics || []) { console.log('CAT', JSON.stringify(c.name), JSON.stringify(c.type), 'LABELS', JSON.stringify(c.labels), 'KEYS', JSON.stringify(c.keys)); const a = (c.athletes || [])[0]; console.log('  EX', a && a.athlete && a.athlete.displayName, JSON.stringify(a && a.stats)); }
