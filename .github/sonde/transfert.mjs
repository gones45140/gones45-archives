const g = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : { http: r.status }; } catch (e) { return { err: String(e) }; } };
const ro = await g('https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/86/roster');
const L = (ro.athletes || []); const m = L.find((a) => /Mbapp/.test(a.displayName || ''));
console.log('MBAPPE', m && m.id, m && m.displayName);
const id = m ? m.id : '231388';
const sl = await g(`https://sports.core.api.espn.com/v2/sports/soccer/athletes/${id}/statisticslog`);
console.log('STATLOG', JSON.stringify(sl).slice(0, 2500));
for (const q of ['?season=2023&league=fra.1', '?season=2023&league=esp.1', '?season=2023']) {
  const j = await g(`https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/${id}/gamelog${q}`);
  const ev = j.events ? Object.keys(j.events).length : 0;
  console.log('GAMELOG', q, 'events', ev, 'filters', JSON.stringify(j.filters || j).slice(0, 600));
}
const at = await g(`https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/${id}`);
console.log('ATHLETE', JSON.stringify(at).replace(/"links":\[[^\]]*\]/g, '').slice(0, 1500));
const at2 = await g(`https://sports.core.api.espn.com/v2/sports/soccer/athletes/${id}/seasons`);
console.log('SEASONS', JSON.stringify(at2).slice(0, 800));
const s23 = await g(`https://sports.core.api.espn.com/v2/sports/soccer/leagues/fra.1/seasons/2023/athletes/${id}`);
console.log('S23 fra.1', JSON.stringify(s23).replace(/"links":\[[^\]]*\]/g, '').slice(0, 1200));
