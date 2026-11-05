// GONES45 — 📊 LOI DES SÉRIES (20261105r, Antoine : « Minnesota était à 2 défaites d'affilée… un tableau qui m'aurait permis de voir qu'il allait
// bientôt gagner d'après les séries » → « sans mes paris, par rapport au résultat ; toute sorte de pari et tout sport ; mise à jour chaque matin ;
// équipes qui jouent dans les 24 h ; critères des 5 dernières saisons ; nouvel onglet "Loi des séries" dans le Cockpit » → maquette → « oui »).
// Chaque matin (loi-series.yml) : matchs des 24 h à venir (miroir/<sp>/<lg>/jours/AAAAMMJJ.json, copie ESPN déjà dans ce dépôt ; ESPN en secours),
// puis pour chaque équipe les 5 dernières saisons d'archives (cotes/<sport>/<ligue>/<saison>/equipes/<id>.json, m[4] = [score dom, score ext]).
// Pour chaque pari : suite réussi / raté, PIRE série (ratés de suite, toutes saisons à la suite) et série EN COURS (ratés au dernier match).
// Gardé = « 🔥 » : au moins 20 matchs, pire ≤ 7 (place pour 2 paliers de sécurité sous 9), en cours ≥ 1 et pire − en cours ≤ 1.
// Lieu : celui du match à venir (🏠 / ✈️) ET tous lieux. Sortie : loi/loi_series.json { at, n, L: [...] }, lue par l'appli (onglet 📊 du Cockpit).
import fs from 'node:fs';
import path from 'node:path';

const LIGUES = [
  ['soccer', 'fra.1'], ['soccer', 'eng.1'], ['soccer', 'esp.1'], ['soccer', 'ita.1'], ['soccer', 'ger.1'],
  ['soccer', 'uefa.champions'], ['soccer', 'uefa.europa'], ['soccer', 'uefa.europa.conf'],
  ['hockey', 'nhl'], ['basketball', 'nba'], ['football', 'nfl'], ['baseball', 'mlb'],
  ['soccer', 'ned.1'], ['soccer', 'por.1'], ['soccer', 'fra.2'], ['soccer', 'bra.1'], ['soccer', 'arg.1'],
  ['rugby', '270559'], ['rugby', '271937'], ['rugby', '272073'], ['rugby-league', '3']
];
const SPN = { soccer: 'foot', hockey: 'hockey', basketball: 'basket', football: 'football-us', baseball: 'baseball', rugby: 'rugby', 'rugby-league': 'rugby-xiii' };
const US = new Set(['hockey', 'basketball', 'football', 'baseball']);
const NSAI = 5, MIN_N = 20, PIRE_MIN = 3, PIRE_MAX = 7, H24 = 24 * 3600e3;   // 20261105t : « série 3 matchs mini, 1 et 2 c'est tellement courant »

/* Paris regardés (maquette validée) : f(pour, contre, prolongation) → réussi ? */
const PARIS = {
  soccer: [['v', 'Victoire', (p, c) => p > c], ['vn', 'Victoire ou nul', (p, c) => p >= c], ['o15', 'Plus de 1,5 buts', (p, c) => p + c >= 2],
    ['o25', 'Plus de 2,5 buts', (p, c) => p + c >= 3], ['u35', 'Moins de 3,5 buts', (p, c) => p + c <= 3], ['btts', 'Les deux marquent', (p, c) => p > 0 && c > 0],
    ['marque', "L'équipe marque", (p) => p > 0]],
  hockey: [['vq', 'Vainqueur (prolongation comprise)', (p, c) => p > c], ['v60', 'Victoire en 60 min', (p, c, ot) => p > c && !ot],
    ['o55', 'Plus de 5,5 buts', (p, c) => p + c >= 6], ['u65', 'Moins de 6,5 buts', (p, c) => p + c <= 6]],
  basketball: [['vq', 'Vainqueur', (p, c) => p > c]],
  football: [['vq', 'Vainqueur', (p, c) => p > c]],
  baseball: [['vq', 'Vainqueur', (p, c) => p > c]],
  rugby: [['v', 'Victoire', (p, c) => p > c]],
  'rugby-league': [['v', 'Victoire', (p, c) => p > c]]
};

const lireJ = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } };
const jour = (t) => new Date(t).toISOString().slice(0, 10).replace(/-/g, '');

async function scoreboard(sp, lg, j) {
  const loc = lireJ(`miroir/${sp}/${lg}/jours/${j}.json`);
  if (loc) return loc;
  for (const h of ['https://site.web.api.espn.com', 'https://site.api.espn.com']) {
    try { const r = await fetch(`${h}/apis/site/v2/sports/${sp}/${lg}/scoreboard?dates=${j}`, { headers: { 'User-Agent': 'gones45-loi', Accept: 'application/json' } }); if (r.ok) return await r.json(); } catch (e) {}
  }
  return null;
}

/* matchs d'une équipe, 5 dernières saisons, du plus ancien au plus récent : { t, sa, d, p, c, ot } */
function matchsEquipe(sp, lg, id) {
  const base = `cotes/${SPN[sp]}/${lg}`;
  let sa = []; try { sa = fs.readdirSync(base).filter((x) => /^\d{4}(-\d{2})?$/.test(x)).sort(); } catch (e) { return null; }
  sa = sa.slice(-NSAI);
  const L = []; let nom = '';
  for (const s of sa) {
    const q = lireJ(`${base}/${s}/equipes/${id}.json`); if (!q || !q.m) continue;
    nom = q.nom || nom;
    for (const m of q.m) {
      if (!m || !m[4] || m[4][0] == null || m[4][1] == null) continue;
      if (US.has(sp) && m[5] !== 2) continue;   // saison régulière seulement (comme les critères « championnat »)
      const d = m[3] === 'h';
      L.push({ t: m[0], sa: s, d, p: d ? +m[4][0] : +m[4][1], c: d ? +m[4][1] : +m[4][0], ot: m[6] ? 1 : 0 });
    }
  }
  L.sort((a, b) => a.t - b.t);
  return { nom, L, sa };
}

function serie(ms, f) {
  let pire = 0, cur = 0, ok = 0; const parS = {};
  for (const m of ms) {
    const r = f(m.p, m.c, m.ot);
    if (r) { ok++; cur = 0; } else { cur++; if (cur > pire) pire = cur; }
    const P = parS[m.sa] || (parS[m.sa] = { cur: 0, pire: 0 });
    if (r) P.cur = 0; else { P.cur++; if (P.cur > P.pire) P.pire = P.cur; }
  }
  return { n: ms.length, ok, pire, cours: cur, parS };
}

const now = Date.now(), fin = now + H24, out = [];
let nMatchs = 0;
for (const [sp, lg] of LIGUES) {
  const vus = new Set();
  for (const j of [...new Set([jour(now), jour(fin)])]) {
    const sb = await scoreboard(sp, lg, j); if (!sb) continue;
    const ligue = (sb.leagues && sb.leagues[0] && (sb.leagues[0].abbreviation || sb.leagues[0].name)) || lg;
    for (const ev of sb.events || []) {
      const t = Date.parse(ev.date); if (!(t > now && t <= fin) || vus.has(ev.id)) continue;
      const st = ev.status && ev.status.type && ev.status.type.state; if (st && st !== 'pre') continue;
      vus.add(ev.id); nMatchs++;
      const cs = (ev.competitions && ev.competitions[0] && ev.competitions[0].competitors) || [];
      for (const co of cs) {
        const id = co.team && co.team.id; if (!id) continue;
        const adv = cs.find((x) => x !== co), dom = co.homeAway === 'home';
        const E = matchsEquipe(sp, lg, id); if (!E || !E.L.length) continue;
        for (const [k, lib, f] of PARIS[sp] || []) {
          const vu = {};
          for (const lieu of [dom ? 'dom' : 'ext', 'tout']) {
            const ms = lieu === 'tout' ? E.L : E.L.filter((m) => m.d === dom);
            const R = serie(ms, f);
            if (R.n < MIN_N || R.pire < PIRE_MIN || R.pire > PIRE_MAX || R.cours < 1 || R.pire - R.cours > 1) continue;
            const sig = R.pire + '|' + R.cours; if (vu[sig]) continue; vu[sig] = 1;   // même chiffre en 🏠 et partout : une seule ligne
            out.push({ sp, lg, ligue, eid: String(ev.id), t, id: String(id), eq: E.nom || (co.team.displayName || ''), adv: (adv && adv.team && (adv.team.displayName || adv.team.shortDisplayName)) || '',
              d: dom ? 1 : 0, lieu, k, lib,
              /* 20261105v (« on habille la carte ») : logo + couleur de l'équipe, logo de l'adversaire (fournis par le calendrier ESPN) */
              logo: (co.team && co.team.logo) || '', c: (co.team && co.team.color) || '', alogo: (adv && adv.team && adv.team.logo) || '', pire: R.pire, cours: R.cours, n: R.n, ok: R.ok, p: E.sa.slice().reverse().map((s) => (R.parS[s] ? R.parS[s].pire : null)).filter((x) => x != null) });
          }
        }
      }
    }
  }
}
out.sort((a, b) => (a.pire - a.cours) - (b.pire - b.cours) || a.t - b.t);
fs.mkdirSync('loi', { recursive: true });
fs.writeFileSync('loi/loi_series.json', JSON.stringify({ at: now, n: nMatchs, s: NSAI, L: out }));
console.log(`Loi des séries : ${nMatchs} matchs dans les 24 h, ${out.length} pépites`);
