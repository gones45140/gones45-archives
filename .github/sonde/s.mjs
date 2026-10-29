const g = async (u) => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const sm = await g('https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/summary?event=748383');
for (const ro of sm.rosters || []) for (const p of ro.roster || []) if (/Mbapp/.test((p.athlete || {}).displayName || '')) console.log('ROSTER', JSON.stringify({ starter: p.starter, subbedIn: p.subbedIn, subbedOut: p.subbedOut, active: p.active, stats: (p.stats || []).filter(s => s.value).map(s => s.name + '=' + s.value) }));
const j = await g('https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/231388/gamelog?season=2025&league=esp.1');
const ev = (j.events || {})['748383']; console.log('GAMELOG EV', JSON.stringify(ev).slice(0, 400));
for (const st of j.seasonTypes || []) for (const c of st.categories || []) for (const e of c.events || []) if (e.eventId === '748383') console.log('GAMELOG STATS', JSON.stringify(j.names), JSON.stringify(e.stats));
const kd = (sm.keyEvents || []).filter(k => JSON.stringify(k).includes('Mbapp')).map(k => (k.type || {}).text + ' ' + (k.clock || {}).displayValue); console.log('KEYEVENTS', JSON.stringify(kd));
