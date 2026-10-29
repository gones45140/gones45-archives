const g = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const sb = await g('https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard');
const e = ((sb && sb.events) || []).find((x) => !((x.status || {}).type || {}).completed) || (sb.events || [])[0];
console.log('MATCH', e && e.id, e && e.name);
const od = await g(`https://sports.core.api.espn.com/v2/sports/hockey/leagues/nhl/events/${e.id}/competitions/${e.id}/odds`);
for (const o of (od && od.items) || []) console.log('ODDS prov', (o.provider || {}).id, (o.provider || {}).name, 'draw', JSON.stringify(o.drawOdds || null).slice(0, 150), 'keys', Object.keys(o).join(','));
const pb = await g(`https://sports.core.api.espn.com/v2/sports/hockey/leagues/nhl/events/${e.id}/competitions/${e.id}/odds/100/propBets?limit=1000`);
const T = {}; for (const x of (pb && pb.items) || []) { const k = (x.type || {}).id + ' ' + (x.type || {}).name; T[k] = (T[k] || 0) + 1; }
console.log('PROPBETS', (pb && pb.count), JSON.stringify(T));
const sm = await g(`https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event=${e.id}`);
console.log('PICKCENTER', JSON.stringify((sm && sm.pickcenter) || []).slice(0, 600));
console.log('ODDS summary', JSON.stringify((sm && sm.odds) || []).slice(0, 400));
