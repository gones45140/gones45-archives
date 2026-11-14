// Sonde temporaire (20261114s) : cotes MLB 2024 (core odds) + cotes TD NFL (propBets) — supprimée après lecture.
const UA = { 'User-Agent': 'Mozilla/5.0' };
const lire = async (u) => { try { const r = await fetch(u, { headers: UA }); console.log('GET', r.status, u.slice(0, 160)); return r.ok ? await r.json() : null; } catch (e) { console.log('ERR', u, e.message); return null; } };
const od = await lire('https://sports.core.api.espn.com/v2/sports/baseball/leagues/mlb/events/401568920/competitions/401568920/odds');
for (const x of (od && od.items) || []) console.log('MLB', (x.provider || {}).id, (x.provider || {}).name, 'ML', (x.homeTeamOdds || {}).moneyLine, (x.awayTeamOdds || {}).moneyLine, 'close', JSON.stringify(((x.homeTeamOdds || {}).close || {}).moneyLine || null).slice(0, 120));
const sm = await lire('https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event=401568920');
console.log('MLB pickcenter', JSON.stringify((sm && sm.pickcenter) || null).slice(0, 300));
const sb = await lire('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
const ev = ((sb && sb.events) || []).filter((e) => !((e.status || {}).type || {}).completed);
console.log('NFL à venir', ev.length, ev.slice(0, 3).map((e) => e.id + ' ' + e.name + ' ' + e.date).join(' | '));
for (const e of ev.slice(0, 2)) {
  const pb = await lire(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${e.id}/competitions/${e.id}/odds/100/propBets?limit=500`);
  const it = (pb && pb.items) || [], ty = {};
  for (const x of it) { const t = String((x.type || {}).id) + ':' + ((x.type || {}).name || ''); ty[t] = (ty[t] || 0) + 1; }
  console.log('NFL propBets', e.id, it.length, JSON.stringify(ty).slice(0, 700));
  const td = it.find((x) => String((x.type || {}).id) === '31'); console.log('NFL ex 31', JSON.stringify(td || null).slice(0, 600));
  const c = (e.competitions || [])[0] || {}, h = (c.competitors || []).find((x) => x.homeAway === 'home');
  const ro = await lire(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${h.team.id}/roster`);
  const A = (ro && ro.athletes) || []; console.log('NFL roster groupes', A.length, JSON.stringify(A.map((g) => [g.position, (g.items || []).length])).slice(0, 300), 'ex', JSON.stringify(((A[0] || {}).items || [])[0] || {}).slice(0, 200));
  const ids = new Set(A.flatMap((g) => (g.items || []).map((p) => String(p.id))));
  const refs = it.map((x) => (String((x.athlete || {}).$ref || '').match(/athletes\/(\d+)/) || [])[1]).filter(Boolean);
  console.log('NFL refs athletes', refs.length, 'dans roster dom', refs.filter((r) => ids.has(r)).length, 'ex refs', refs.slice(0, 5).join(','));
}
