// Sonde temporaire 2 (20261114s) : TD NFL (31) — pages, cotes présentes ? — supprimée après lecture.
const UA = { 'User-Agent': 'Mozilla/5.0' };
const lire = async (u) => { try { const r = await fetch(u, { headers: UA }); return r.ok ? await r.json() : null; } catch (e) { return null; } };
for (const id of ['401873058', '401873053']) {
  const p1 = await lire(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${id}/competitions/${id}/odds/100/propBets?limit=1000`);
  console.log(id, 'count', p1 && p1.count, 'pageCount', p1 && p1.pageCount, 'items', ((p1 && p1.items) || []).length);
  let it = (p1 && p1.items) || [];
  for (let pg = 2; p1 && pg <= (p1.pageCount || 1) && pg <= 5; pg++) { const q = await lire(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${id}/competitions/${id}/odds/100/propBets?limit=1000&page=${pg}`); it = it.concat((q && q.items) || []); }
  const ty = {}; for (const x of it) { const t = String((x.type || {}).id); ty[t] = (ty[t] || 0) + 1; } console.log('types', JSON.stringify(ty));
  const td = it.filter((x) => ['31', '32', '33'].includes(String((x.type || {}).id)));
  const avec = td.filter((x) => (x.odds && (x.odds.decimal || x.odds.american)) || ((x.current || {}).over || {}).decimal || ((x.current || {}).over || {}).american);
  console.log('TD items', td.length, 'avec cote', avec.length);
  console.log('ex avec', JSON.stringify(avec[0] || null).slice(0, 700));
  console.log('clés ex sans', JSON.stringify(Object.keys(td[0] || {})), JSON.stringify(td[1] || null).slice(0, 400));
}
