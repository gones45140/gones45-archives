for (const q of ['Lille', 'Lille OSC', 'LOSC Lille', 'LOSC', 'Lille Olympique', 'Paris SG', 'Marseille', 'Lyon', 'Lens', 'Nice']) {
  try { const j = await (await fetch('https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=' + encodeURIComponent(q))).json();
    console.log(q, '→', (j.teams || []).map(t => t.strTeam + ' [' + t.strSport + '] ' + t.idTeam + (t.strFanart1 ? ' fanart' : '') + (t.strBanner ? ' banner' : '')).join(' | ') || 'rien'); } catch (e) { console.log(q, 'ERREUR', e.message); }
}
try { const j = await (await fetch('https://www.thesportsdb.com/api/v1/json/123/search_all_teams.php?l=French%20Ligue%201')).json(); const L = (j.teams || []).find(t => /lille/i.test(t.strTeam)); console.log('ligue → ', (j.teams || []).length, 'équipes', L && (L.strTeam + ' ' + L.idTeam + ' ' + L.strFanart1)); } catch (e) { console.log('ligue', e.message); }
try { const j = await (await fetch('https://www.thesportsdb.com/api/v1/json/123/lookupteam.php?id=133714')).json(); const t = (j.teams || [])[0] || {}; console.log('lookup 133714 →', t.strTeam, t.strSport, t.strFanart1); } catch (e) { console.log('lookup', e.message); }
