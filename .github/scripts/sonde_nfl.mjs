// 20261125b — SONDE (temporaire) : cotes joueurs NFL absentes des archives (aucune fiche j en novembre). Combien de propBets ESPN rend pour un match NFL,
// sur combien de pages, et à quelle place arrivent les types 31 / 32 / 33 (touchdown) ? Lecture seule, rien n'est écrit.
const ev = process.env.EV || '401873078';
/* + un match NBA déjà joué, pour comparer la forme d'une cote qui MARCHE */
try { const r = await fetch('https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events/401910039/competitions/401910039/odds/100/propBets?limit=50'); const j = r.ok ? await r.json() : null; console.log('NBA exemple :', JSON.stringify((j && j.items || [])[0]).slice(0, 900)); } catch (e) {}
for (const lim of [500, 1000]) {
  const u = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${ev}/competitions/${ev}/odds/100/propBets?limit=${lim}`;
  try {
    const r = await fetch(u, { headers: { 'User-Agent': 'gones45-sonde', Accept: 'application/json' } });
    const j = r.ok ? await r.json() : null;
    const T = {}; ((j && j.items) || []).forEach((x, i) => { const t = String((x.type || {}).id); if (!T[t]) T[t] = [0, i, (x.type || {}).name || '']; T[t][0]++; });
    console.log('limit', lim, 'HTTP', r.status, '| count', j && j.count, '| pages', j && j.pageCount, '| reçus', j && (j.items || []).length);
    console.log(JSON.stringify(T).slice(0, 1500));
    const x = j && (j.items || []).find((y) => ['31', '32', '33'].includes(String((y.type || {}).id)));
    if (x) console.log('exemple TD (complet) :', JSON.stringify(x).slice(0, 1500));
    const n = j && (j.items || []).find((y) => String((y.type || {}).id) === '1');
    if (lim === 500) { const e = process.env.EV2; }
  } catch (e) { console.log('limit', lim, 'erreur', e.message); }
}
for (const p of ['200', '58', '40']) {   // autres fournisseurs
  try { const r = await fetch(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${ev}/competitions/${ev}/odds/${p}/propBets?limit=50`); const j = r.ok ? await r.json() : null; console.log('fournisseur', p, 'HTTP', r.status, 'count', j && j.count); } catch (e) {}
}
