const g = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch (e) { return null; } };
for (const [sp, lg, d] of [['hockey', 'nhl', '202510'], ['hockey', 'nhl', '202604'], ['basketball', 'nba', '202510'], ['football', 'nfl', '202509'], ['football', 'nfl', '202601'], ['football', 'nfl', '202508']]) {
  const sb = await g(`https://site.api.espn.com/apis/site/v2/sports/${sp}/${lg}/scoreboard?dates=${d}&limit=1000`);
  const E = (sb && sb.events) || []; const ty = {}, det = {};
  for (const e of E) { const k = JSON.stringify(e.season); ty[k] = (ty[k] || 0) + 1; const st = ((e.status || {}).type || {}); const x = st.detail + ' | ' + st.shortDetail; det[x] = (det[x] || 0) + 1; }
  console.log(lg, d, 'events', E.length, 'SEASON', JSON.stringify(ty)); console.log('   STATUS', JSON.stringify(det).slice(0, 500));
}
// schedule ESPN (seasontype=2) vs nombre d'événements de l'équipe
for (const [sp, lg, tid, an] of [['hockey', 'nhl', '25', 2026], ['basketball', 'nba', '13', 2026], ['football', 'nfl', '14', 2025]]) {
  const j = await g(`https://site.api.espn.com/apis/site/v2/sports/${sp}/${lg}/teams/${tid}/schedule?season=${an}&seasontype=2`);
  const ev = (j && j.events) || []; console.log('SCHED', lg, tid, an, ev.length, 'premier', ev[0] && ev[0].date, 'dernier', ev[ev.length - 1] && ev[ev.length - 1].date, JSON.stringify(ev[0] && ev[0].season), JSON.stringify(ev[0] && ev[0].seasonType));
}
