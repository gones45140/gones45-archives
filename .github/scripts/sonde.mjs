// Sonde temporaire (20261115i) : logos de compétition NBA / NHL / NFL / MLB / NRL — supprimée après lecture.
const UA = { 'User-Agent': 'Mozilla/5.0' };
for (const u of ['https://a.espncdn.com/i/teamlogos/leagues/500/nba.png', 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png', 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png', 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png', 'https://a.espncdn.com/i/teamlogos/leagues/500-dark/nba.png']) {
  try { const r = await fetch(u, { headers: UA }); console.log(r.status, r.headers.get('content-type'), r.headers.get('content-length'), u); } catch (e) { console.log('ERR', u); } }
for (const u of ['https://sports.core.api.espn.com/v2/sports/rugby-league/leagues/3', 'https://site.api.espn.com/apis/site/v2/sports/rugby-league/3/scoreboard']) {
  try { const r = await fetch(u, { headers: UA }); const j = await r.json(); const L = j.logos || (j.leagues && j.leagues[0] && j.leagues[0].logos) || []; console.log(r.status, u, JSON.stringify(L).slice(0, 600)); } catch (e) { console.log('ERR', u, e.message); } }
