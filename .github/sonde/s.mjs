const j = await (await fetch('https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard')).json();
const e = j.events.find(x => /VGK/.test(x.shortName));
console.log('match', e.id, e.shortName, e.date);
const u = `https://sports.core.api.espn.com/v2/sports/hockey/leagues/nhl/events/${e.id}/competitions/${e.id}/odds/100/propBets?limit=500`;
const r = await fetch(u); console.log('propBets statut', r.status);
const p = r.ok ? await r.json() : {}; const it = p.items || []; const t = {};
it.forEach(x => { const k = (x.type || {}).id; t[k] = (t[k] || 0) + 1; });
console.log('count', p.count, 'pages', p.pageCount, 'types', JSON.stringify(t));
const ids = {};
for (const c of e.competitions[0].competitors) {
  const rr = await fetch(`https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/${c.team.id}/roster`);
  const d = rr.ok ? await rr.json() : {}; let n = 0;
  (d.athletes || []).forEach(g => (g.items || [g]).forEach(a => { ids[String(a.id)] = a.displayName; n++; }));
  console.log('effectif', c.team.abbreviation, rr.status, n);
}
let ok = 0, ko = 0, cot = 0;
it.filter(x => ['230', '219', '218', '39'].includes(String((x.type || {}).id))).forEach(x => {
  const a = String((x.athlete || {}).$ref || '').match(/athletes\/(\d+)/); if (a && ids[a[1]]) ok++; else ko++;
  if (parseFloat(((x.odds || {}).decimal || {}).value) > 1) cot++;
});
console.log('joueurs retrouvés', ok, 'non retrouvés', ko, 'avec cote décimale', cot);
const a0 = it.find(x => String((x.type || {}).id) === '230');
console.log('exemple 230', JSON.stringify(a0 || {}).slice(0, 700));
