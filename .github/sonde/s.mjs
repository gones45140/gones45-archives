const j = await (await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/scoreboard?dates=20261030')).json();
const e = j.events.find(x => /PSG|Paris/i.test(x.name)); console.log('match', e.id, e.name);
const it = (await (await fetch(`https://sports.core.api.espn.com/v2/sports/soccer/leagues/fra.1/events/${e.id}/competitions/${e.id}/odds/100/propBets?limit=500`)).json()).items || [];
const noms = {};
for (const c of e.competitions[0].competitors) { const d = await (await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/teams/${c.team.id}/roster`)).json(); (d.athletes || []).forEach(g => (g.items || [g]).forEach(a => noms[a.id] = a.displayName + ' ' + c.team.abbreviation)); }
const L = it.filter(x => String(x.type.id) === '230').map(x => { const id = (x.athlete.$ref.match(/athletes\/(\d+)/) || [])[1]; const o = x.current && x.current.over || {}; const od = x.odds || {};
  return [noms[id] || id, od.decimal ? od.decimal.value : o.decimal, od.decimal ? od.decimal.open : (x.open && x.open.over || {}).decimal, x.lastUpdated]; });
L.sort((a, b) => a[1] - b[1]); L.forEach(l => console.log('BUT', l.join(' | ')));
console.log('exemple', JSON.stringify(it.find(x => String(x.type.id) === '230')).slice(0, 600));
