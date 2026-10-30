import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 412, height: 900 } });
const err = []; p.on('pageerror', e => err.push(e.message));
await p.route(/espn\.com/, async r => { try { const res = await r.fetch(); const h = { ...res.headers(), 'access-control-allow-origin': '*' }; await r.fulfill({ response: res, headers: h }); } catch (e) { await r.abort(); } });
await p.goto('https://gones45140.github.io/gones45/index.html?v=' + Date.now(), { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(8000);
const r = await p.evaluate(async () => {
  const E = '401892611', o = {};
  const t = async (n, u) => { try { const r = await fetch(u); let x = ''; try { x = (await r.text()).slice(0, 160); } catch (e) {} o[n] = r.status + ' ' + x; } catch (e) { o[n] = 'ERREUR ' + e.message; } };
  await t('summary', 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event=' + E);
  await t('summaryFR', 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event=' + E + '&lang=fr&region=fr');
  await t('rosterVGK', 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/37/roster');
  await t('compCore', 'https://sports.core.api.espn.com/v2/sports/hockey/leagues/nhl/events/' + E + '/competitions/' + E);
  await t('scoreboard', 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard');
  await t('summaryFoot', 'https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/scoreboard');
  return o;
});
console.log(JSON.stringify(r, null, 1)); console.log('erreurs', err.slice(0, 5));
await b.close();
