const H = 'https://site.web.api.espn.com/apis/site/v2/sports/rugby/270559';
const j = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : { __s: r.status }; } catch (e) { return { __e: e.message }; } };
for (const d of ['20261025', '20250315', '20240310', '20230305']) {
  const s = await j(`${H}/scoreboard?dates=${d}`); console.log('scoreboard', d, s.__s || '', (s.events || []).map(e => e.id + ' ' + e.shortName + ' ' + ((e.competitions || [])[0] || {}).status?.type?.state).join(' | ').slice(0, 300));
}
const sb = await j(`${H}/scoreboard?dates=20261025`); const ev = (sb.events || [])[0];
if (ev) { const s = await j(`${H}/summary?event=${ev.id}`); console.log('summary clés', Object.keys(s).join(','));
  console.log('rosters', (s.rosters || []).map(r => (r.team || {}).abbreviation + ':' + (r.roster || []).length + ' ex=' + JSON.stringify(((r.roster || [])[0] || {})).slice(0, 250)).join(' || '));
  console.log('boxscore', JSON.stringify(s.boxscore || {}).slice(0, 500));
  console.log('keyEvents', JSON.stringify((s.keyEvents || []).slice(0, 3)).slice(0, 500));
  console.log('scoringPlays', JSON.stringify((s.scoringPlays || []).slice(0, 2)).slice(0, 400));
  console.log('header comp', JSON.stringify(((s.header || {}).competitions || [])[0]?.competitors?.map(c => ({ n: c.team?.displayName, sc: c.score, ls: c.linescores })) || '').slice(0, 400));
  console.log('odds/pickcenter', JSON.stringify(s.pickcenter || s.odds || null).slice(0, 200));
}
const st = await j(`https://site.web.api.espn.com/apis/v2/sports/rugby/270559/standings`); console.log('standings', st.__s || '', JSON.stringify(st).slice(0, 300));
const st2 = await j(`https://site.web.api.espn.com/apis/v2/sports/rugby/270559/standings?season=2024`); console.log('standings 2024', st2.__s || '', JSON.stringify(st2).slice(0, 200));
const co = await j(`https://sports.core.api.espn.com/v2/sports/rugby/leagues/270559/events/${ev && ev.id}/competitions/${ev && ev.id}/odds`); console.log('core odds', JSON.stringify(co).slice(0, 200));
