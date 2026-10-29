const g = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const sb = await g('https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=20261030');
for (const e of ((sb && sb.events) || []).slice(0, 4)) {
  const pb = await g(`https://sports.core.api.espn.com/v2/sports/hockey/leagues/nhl/events/${e.id}/competitions/${e.id}/odds/100/propBets?limit=1000`);
  const it = ((pb && pb.items) || []).filter((x) => String((x.type || {}).id) === '153');
  console.log(e.name, it.length);
  for (const x of it) { const c = JSON.parse(JSON.stringify(x)); delete c.links; console.log('  ', JSON.stringify(c).replace(/"\$ref":"[^"]*"/g, '').slice(0, 500)); }
  const od = await g(`https://sports.core.api.espn.com/v2/sports/hockey/leagues/nhl/events/${e.id}/competitions/${e.id}/odds`);
  const o = ((od && od.items) || [])[0] || {}; console.log('  ML', JSON.stringify({ h: (o.homeTeamOdds || {}).moneyLine, a: (o.awayTeamOdds || {}).moneyLine }));
}
