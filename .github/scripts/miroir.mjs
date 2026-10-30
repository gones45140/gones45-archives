// GONES45 — 🪞 MIROIR ESPN SUR GITHUB (30/10/2026, Antoine : « on vient de voir que l'on est très dépendant d'ESPN » → « et si ça bloque on va
// chercher les résultats où » → « oui »). Le soir du 30/10, ESPN (Akamai) a refusé site.api.espn.com aux navigateurs (calendrier vide, courbe
// figée) alors qu'un robot GitHub le lisait sans problème. Ce robot copie donc, depuis GitHub, les CALENDRIERS / RÉSULTATS (scoreboard jour par
// jour) et les CLASSEMENTS des ligues suivies dans miroir/<sport>/<ligue>/… ; l'appli les lit sur raw.githubusercontent.com SEULEMENT si les deux
// adresses ESPN refusent (app.js 20261101u). Passage à chaque lancement de cotes-archive (toutes les heures, worker).
//   jours/AAAAMMJJ.json = réponse scoreboard ?dates=AAAAMMJJ, allégée (liens, diffusions, billets retirés), + _m { t } ;
//   standings.json       = /apis/v2/sports/<sp>/<lg>/standings (saison en cours), + _m { t }.
// Fenêtre J-45 → J+14 (UTC). Relecture : J-1, J, J+1 à chaque passage ; jour futur > 12 h ; jour passé non terminé > 3 h ; manquant ; classement > 6 h.
// Écrit seulement si le contenu change (dépôt léger). Lecture côté serveur via site.web.api.espn.com (même chemin, celle du worker depuis le 16/09).
import fs from 'node:fs';
import path from 'node:path';

const LIGUES = [
  ['soccer', 'fra.1'], ['soccer', 'eng.1'], ['soccer', 'esp.1'], ['soccer', 'ita.1'], ['soccer', 'ger.1'],
  ['soccer', 'uefa.champions'], ['soccer', 'uefa.europa'], ['soccer', 'uefa.europa.conf'],
  ['hockey', 'nhl'], ['basketball', 'nba'], ['football', 'nfl'], ['baseball', 'mlb'],
  ['soccer', 'ned.1'], ['soccer', 'por.1'], ['soccer', 'fra.2'], ['soccer', 'bra.1'], ['soccer', 'arg.1'],
  ['soccer', 'uefa.nations'], ['soccer', 'fifa.worldq.uefa'], ['soccer', 'fifa.friendly']
];
const HOTES = ['https://site.web.api.espn.com', 'https://site.api.espn.com'];
const RETIRER = new Set(['links', 'headlines', 'geoBroadcasts', 'broadcasts', 'tickets', 'uid', 'guid']);
const MAX_REQ = 700, T0 = Date.now(), BUDGET = 9 * 60e3;
let nReq = 0, nEcrits = 0, nErreurs = 0;

const pause = (ms) => new Promise(r => setTimeout(r, ms));
async function lire(chemin) {
  for (const h of HOTES) {
    for (let i = 0; i < 2; i++) {
      if (nReq >= MAX_REQ || Date.now() - T0 > BUDGET) return null;
      nReq++;
      try {
        const r = await fetch(h + chemin, { headers: { 'User-Agent': 'gones45-miroir', 'Accept': 'application/json' } });
        if (r.ok) return await r.json();
        if (r.status === 404 || r.status === 400) return null;
      } catch (e) {}
      await pause(600 * (i + 1));
    }
  }
  nErreurs++;
  return null;
}
const alleger = (o) => {
  if (Array.isArray(o)) return o.map(alleger);
  if (o && typeof o === 'object') { const r = {}; for (const k of Object.keys(o)) if (!RETIRER.has(k)) r[k] = alleger(o[k]); return r; }
  return o;
};
const lireFichier = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } };
const ecrire = (f, d) => {
  const ancien = lireFichier(f);
  const sans = (x) => { if (!x) return ''; const c = { ...x }; delete c._m; return JSON.stringify(c); };
  if (ancien && sans(ancien) === JSON.stringify(d)) return false;
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify({ ...d, _m: { t: Date.now() } }));
  nEcrits++;
  return true;
};
const ymd = (t) => new Date(t).toISOString().slice(0, 10).replace(/-/g, '');
const fini = (d) => (d.events || []).every(e => { const s = ((e.competitions || [])[0] || {}).status || e.status || {}; const ty = s.type || {}; return ty.completed || ty.state === 'post'; });

// toutes les ligues ensemble, jours proches d'abord : si le budget s'épuise (1er passage ≈ 1 200 demandes), ce sont les jours lointains qui attendent
const auj = Date.now(), travail = [], classements = [];
for (const [sp, lg] of LIGUES) {
  const dos = `miroir/${sp}/${lg}`;
  for (let k = -45; k <= 14; k++) {
    const d = ymd(auj + k * 864e5), f = `${dos}/jours/${d}.json`, a = lireFichier(f), age = a && a._m ? auj - a._m.t : Infinity;
    if (!a || (k >= -1 && k <= 1) || (k > 1 && age > 12 * 3600e3) || (k < -1 && !fini(a) && age > 3 * 3600e3)) travail.push({ sp, lg, f, d, k: Math.abs(k) });
  }
  const fs1 = `${dos}/standings.json`, s0 = lireFichier(fs1);
  if (!s0 || !s0._m || auj - s0._m.t > 6 * 3600e3) classements.push({ sp, lg, f: fs1 });
}
travail.sort((x, y) => x.k - y.k);
const proches = travail.filter(x => x.k <= 1), autres = travail.filter(x => x.k > 1);
const passe = async (L, fn) => { for (let i = 0; i < L.length; i += 6) { if (nReq >= MAX_REQ || Date.now() - T0 > BUDGET) break; await Promise.all(L.slice(i, i + 6).map(fn)); } };
const jour = async (x) => {
  const j = await lire(`/apis/site/v2/sports/${x.sp}/${x.lg}/scoreboard?dates=${x.d}&limit=200`);
  if (j && Array.isArray(j.events)) ecrire(x.f, alleger({ leagues: j.leagues, season: j.season, day: j.day, events: j.events }));
};
await passe(proches, jour);
// 30/10 (Antoine : « les compos, important non ? » → « oui ») : RÉSUMÉS des matchs qui commencent dans les 2 h (ou ont commencé il y a
// moins de 2 h) → compos (rosters), absents (injuries), en-tête, gameInfo ; relus à chaque passage tant qu'ils sont dans la fenêtre
// (la compo sort ~1 h avant). miroir/<sp>/<lg>/resumes/<eid>.json ; effacés après 3 jours. Commentaires, actions, articles, vidéos retirés.
const RES_GARDER = ['header', 'rosters', 'injuries', 'gameInfo', 'boxscore', 'format', 'lastFiveGames', 'headToHeadGames', 'seasonseries', 'predictor', 'odds', 'pickcenter', 'standings', 'leaders', 'keyEvents'];
const resumes = [];
for (const [sp, lg] of LIGUES) {
  const dos = `miroir/${sp}/${lg}`;
  for (const k of [-1, 0, 1]) {
    const a = lireFichier(`${dos}/jours/${ymd(auj + k * 864e5)}.json`);
    ((a && a.events) || []).forEach(e => { const t = Date.parse(e.date); if (t && t - auj < 2 * 3600e3 && auj - t < 2 * 3600e3) resumes.push({ sp, lg, id: String(e.id), f: `${dos}/resumes/${e.id}.json` }); });
  }
  try { for (const n of fs.readdirSync(`${dos}/resumes`)) { const f = `${dos}/resumes/${n}`, r = lireFichier(f); if (!r || !r._m || auj - r._m.t > 3 * 864e5) { fs.unlinkSync(f); nEcrits++; } } } catch (e) {}
}
await passe(resumes, async (x) => {
  const j = await lire(`/apis/site/v2/sports/${x.sp}/${x.lg}/summary?event=${x.id}`);
  if (j && j.header) { const o = {}; RES_GARDER.forEach(k => { if (j[k] != null) o[k] = j[k]; }); ecrire(x.f, alleger(o)); }
});
console.log(`miroir : ${resumes.length} résumés (compos) relus`);
await passe(classements, async (x) => { const s = await lire(`/apis/v2/sports/${x.sp}/${x.lg}/standings`); if (s && (s.children || s.standings)) ecrire(x.f, alleger(s)); });
await passe(autres, jour);
console.log(`miroir : ${travail.length} jours à relire, ${classements.length} classements ; ${nReq} demandes, ${nEcrits} fichiers écrits, ${nErreurs} échecs, ${Math.round((Date.now() - T0) / 1000)} s`);
