const t = async (n, u) => { try { const r = await fetch(u); const x = await r.text(); console.log(n, r.status, x.slice(0, 300).replace(/\s+/g, ' ')); return x; } catch (e) { console.log(n, 'ERREUR', e.message); } };
const d = await t('direct', 'https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=Lille');
await t('worker', 'https://fd-proxy.touraine-antoine.workers.dev?host=tsdb&path=' + encodeURIComponent('/api/v1/json/123/searchteams.php?t=Lille'));
try { const j = JSON.parse(d); const tm = (j.teams || [])[0] || {}; console.log('fanart', tm.strFanart1, 'banner', tm.strBanner);
  for (const u of [tm.strFanart1, tm.strBanner].filter(Boolean)) { const r = await fetch(u, { method: 'HEAD' }); console.log('image', r.status, u); } } catch (e) { console.log('json', e.message); }
