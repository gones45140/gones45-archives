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
const NSAI = 5, MIN_N = 20, PIRE_MIN = 3, PIRE_MAX = 7, COURS_MIN = 3, H24 = 24 * 3600e3;   // 20261107p : « 2/3, j'avais dit à partir de 3 » → 3 ratés de suite EN COURS au moins   // 20261105t : « série 3 matchs mini, 1 et 2 c'est tellement courant »

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
      L.push({ t: m[0], sa: s, d, p: d ? +m[4][0] : +m[4][1], c: d ? +m[4][1] : +m[4][0], ot: m[6] ? 1 : 0, q: m[13] ? 1 : 0 });   /* 20261106l : q = qualification */
    }
  }
  L.sort((a, b) => a.t - b.t);
  return { nom, L, sa };
}

/* ═══ 20261113h — 🌍 SÉLECTIONS NATIONALES (Antoine : « pour les sélections on a quoi ? » → « OUI on part là-dessus ») : une sélection joue
   ≈ 10 matchs par an sur PLUSIEURS compétitions → ses matchs des 5 dernières années civiles, TOUTES compétitions archivées mélangées par date
   (amicaux compris). La pépite garde lg = compétition du match à venir (résultat relu ensuite dans ce dossier) et sel: 1. ═══ */
const SEL = ['fifa.friendly', 'uefa.nations', 'fifa.worldq.uefa', 'fifa.world', 'uefa.euro', 'uefa.euroq', 'conmebol.america', 'caf.nations', 'caf.nations_qual', 'fifa.worldq.conmebol', 'fifa.worldq.caf', 'fifa.worldq.afc', 'fifa.worldq.concacaf', 'fifa.worldq.ofc', 'concacaf.gold', 'concacaf.nations.league', 'afc.asian.cup'];   /* 20261113j : + qualifs Euro, Copa, CAN, qualifs CDM des autres continents… */
function matchsSel(id) {
  const y0 = new Date().getFullYear(), L = []; let nom = '';
  const sa = []; for (let y = y0 - NSAI + 1; y <= y0; y++) sa.push(String(y));
  for (const lg of SEL) for (const s of sa) {
    const q = lireJ(`cotes/foot/${lg}/${s}/equipes/${id}.json`); if (!q || !q.m) continue;
    nom = q.nom || nom;
    for (const m of q.m) {
      if (!m || !m[4] || m[4][0] == null || m[4][1] == null) continue;
      const d = m[3] === 'h';
      L.push({ t: m[0], sa: s, d, p: d ? +m[4][0] : +m[4][1], c: d ? +m[4][1] : +m[4][0], ot: m[6] ? 1 : 0, q: 0, lg });
    }
  }
  L.sort((a, b) => a.t - b.t);
  return { nom, L, sa };
}

/* 20261106l (Plzeň : « la stat ne prenait peut-être pas en compte les qualifs, donc reste vrai » → « A + ») : séries sur la PHASE PRINCIPALE
   seulement (qualifications sautées) ; qv = date de la dernière réussite EN QUALIFICATION pendant la série en cours (mention ⚠️ sur la carte). */
function serie(ms0, f) {
  const ms = ms0.filter((m) => !m.q);
  let pire = 0, cur = 0, ok = 0, qv = 0; const parS = {};
  const dern = ms.length ? ms[ms.length - 1].t : 0; let debut = 0;
  for (const m of ms) {
    const r = f(m.p, m.c, m.ot);
    if (r) { ok++; cur = 0; } else { cur++; if (cur > pire) pire = cur; }
    const P = parS[m.sa] || (parS[m.sa] = { cur: 0, pire: 0 });
    if (r) P.cur = 0; else { P.cur++; if (P.cur > P.pire) P.pire = P.cur; }
  }
  if (cur) { debut = ms[ms.length - cur].t; for (const m of ms0) if (m.q && m.t > debut && f(m.p, m.c, m.ot)) qv = m.t; }
  return { n: ms.length, ok, pire, cours: cur, parS, qv };
}

const now = Date.now(), fin = now + H24, out = [];
let nMatchs = 0;
for (const [sp, lg] of LIGUES) {
  const vus = new Set();
  for (const j of [...new Set([jour(now), jour(fin)])]) {
    const sb = await scoreboard(sp, lg, j); if (!sb) continue;
    const ligue = (sb.leagues && sb.leagues[0] && (sb.leagues[0].abbreviation || sb.leagues[0].name)) || lg;
    /* 20261105x (« dans mes entourés, y mettre le logo du championnat ») : logo ESPN de la ligue, version pour fond sombre si elle existe */
    const LG = ((sb.leagues && sb.leagues[0] && sb.leagues[0].logos) || []), lgD = LG.find((x) => (x.rel || []).includes('dark')) || LG[0];
    const llogo = (lgD && lgD.href) || '';
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
            if (R.n < MIN_N || R.pire < PIRE_MIN || R.pire > PIRE_MAX || R.cours < COURS_MIN || R.pire - R.cours > 1) continue;
            const sig = R.pire + '|' + R.cours; if (vu[sig]) continue; vu[sig] = 1;   // même chiffre en 🏠 et partout : une seule ligne
            out.push({ sp, lg, ligue, eid: String(ev.id), t, id: String(id), eq: E.nom || (co.team.displayName || ''), adv: (adv && adv.team && (adv.team.displayName || adv.team.shortDisplayName)) || '',
              d: dom ? 1 : 0, lieu, k, lib,
              /* 20261105v (« on habille la carte ») : logo + couleur de l'équipe, logo de l'adversaire (fournis par le calendrier ESPN) */
              llogo, logo: (co.team && co.team.logo) || '', c: (co.team && co.team.color) || '', alogo: (adv && adv.team && adv.team.logo) || '', pire: R.pire, cours: R.cours, n: R.n, ok: R.ok, qv: R.qv || undefined, p: E.sa.slice().reverse().map((s) => (R.parS[s] ? R.parS[s].pire : null)).filter((x) => x != null) });
          }
        }
      }
    }
  }
}
/* 20261113h : pépites des sélections (matchs des 24 h de chaque compétition, séries sur toutes les compétitions) */
{
  let nS = 0, pS = 0; const vus = new Set();
  for (const lg of SEL) {
    for (const j of [...new Set([jour(now), jour(fin)])]) {
      const sb = await scoreboard('soccer', lg, j); if (!sb) continue;
      const ligue = (sb.leagues && sb.leagues[0] && (sb.leagues[0].abbreviation || sb.leagues[0].name)) || lg;
      const LG = ((sb.leagues && sb.leagues[0] && sb.leagues[0].logos) || []), lgD = LG.find((x) => (x.rel || []).includes('dark')) || LG[0];
      for (const ev of sb.events || []) {
        const t = Date.parse(ev.date); if (!(t > now && t <= fin) || vus.has(ev.id)) continue;
        const st = ev.status && ev.status.type && ev.status.type.state; if (st && st !== 'pre') continue;
        vus.add(ev.id); nMatchs++; nS++;
        const cs = (ev.competitions && ev.competitions[0] && ev.competitions[0].competitors) || [];
        for (const co of cs) {
          const id = co.team && co.team.id; if (!id) continue;
          const adv = cs.find((x) => x !== co), dom = co.homeAway === 'home';
          const E = matchsSel(id); if (!E.L.length) continue;
          for (const [k, lib, f] of PARIS.soccer) {
            const vu = {};
            for (const lieu of [dom ? 'dom' : 'ext', 'tout']) {
              const ms = lieu === 'tout' ? E.L : E.L.filter((m) => m.d === dom);
              const R = serie(ms, f);
              if (R.n < MIN_N || R.pire < PIRE_MIN || R.pire > PIRE_MAX || R.cours < COURS_MIN || R.pire - R.cours > 1) continue;
              const sig = R.pire + '|' + R.cours; if (vu[sig]) continue; vu[sig] = 1;
              out.push({ sp: 'soccer', lg, ligue, sel: 1, eid: String(ev.id), t, id: String(id), eq: E.nom || (co.team.displayName || ''), adv: (adv && adv.team && (adv.team.displayName || adv.team.shortDisplayName)) || '',
                d: dom ? 1 : 0, lieu, k, lib, llogo: (lgD && lgD.href) || '', logo: (co.team && co.team.logo) || '', c: (co.team && co.team.color) || '', alogo: (adv && adv.team && adv.team.logo) || '',
                pire: R.pire, cours: R.cours, n: R.n, ok: R.ok, p: E.sa.slice().reverse().map((s) => (R.parS[s] ? R.parS[s].pire : null)).filter((x) => x != null) });
              pS++;
            }
          }
        }
      }
    }
  }
  console.log(`Sélections : ${nS} matchs dans les 24 h, ${pS} pépites`);
}
/* ═══ 20261106u — 🏒 KHL DANS LES PÉPITES (Antoine : « KHL dans les pépites du jour de la Loi des séries ; go »). Matchs des 24 h = khl.ru
   events_v2 par dates (q[start_at_gt/lt_time_from_unixtime], comme l'appli) via le worker ; team_a = domicile ; archives cotes/hockey/khl
   (robot khl.yml). Mêmes paris et mêmes règles que la NHL. ═══ */
{
  const W = 'https://fd-proxy.touraine-antoine.workers.dev/?host=khl&path=';
  const khl = async (fic, q) => {
    const u = W + encodeURIComponent('/' + fic + '.json?locale=en' + (q ? '&' + q : ''));
    for (let i = 0; i < 4; i++) {
      try { const c = new AbortController(), tm = setTimeout(() => c.abort(), 40000); const r = await fetch(u, { signal: c.signal }); clearTimeout(tm);
        if (r.ok) { const t = await r.text(); if (/^\s*[\[{]/.test(t)) return JSON.parse(t); } } catch (e) {}
      await new Promise((r) => setTimeout(r, 4000 * (i + 1)));
    }
    return null;
  };
  const data = await khl('data', ''), stage = data && +data.current_stage_id;
  let nK = 0, pK = 0;
  if (stage) {
    const vus = new Set();
    for (let page = 1; page <= 4; page++) {
      const j = await khl('events_v2', `stage_id=${stage}&order_direction=asc&page=${page}&q%5Bstart_at_gt_time_from_unixtime%5D=${Math.floor(now / 1000)}&q%5Bstart_at_lt_time_from_unixtime%5D=${Math.floor(fin / 1000)}`);
      if (!Array.isArray(j) || !j.length) break;
      let neufs = 0;
      for (const it of j) {
        const e = (it && it.event) || it; if (!e || !e.id || vus.has(e.id)) continue; vus.add(e.id); neufs++;
        const t = +e.start_at < 1e12 ? +e.start_at * 1000 : +e.start_at; if (!(t > now && t <= fin) || (e.game_state_key && e.game_state_key !== 'not_yet_started') || !e.team_a || !e.team_b) continue;
        nMatchs++; nK++;
        for (const [co, adv, dom] of [[e.team_a, e.team_b, true], [e.team_b, e.team_a, false]]) {
          const E = matchsEquipe('hockey', 'khl', String(co.id)); if (!E || !E.L.length) continue;
          for (const [k, lib, f] of PARIS.hockey) {
            const vu = {};
            for (const lieu of [dom ? 'dom' : 'ext', 'tout']) {
              const ms = lieu === 'tout' ? E.L : E.L.filter((m) => m.d === dom);
              const R = serie(ms, f);
              if (R.n < MIN_N || R.pire < PIRE_MIN || R.pire > PIRE_MAX || R.cours < COURS_MIN || R.pire - R.cours > 1) continue;
              const sig = R.pire + '|' + R.cours; if (vu[sig]) continue; vu[sig] = 1;
              out.push({ sp: 'hockey', lg: 'khl', ligue: 'KHL', eid: 'khl' + e.id, t, id: String(co.id), eq: E.nom || co.name || '', adv: adv.name || '', d: dom ? 1 : 0, lieu, k, lib,
                llogo: '', logo: co.image || '', c: '', alogo: adv.image || '', pire: R.pire, cours: R.cours, n: R.n, ok: R.ok, qv: R.qv || undefined,
                p: E.sa.slice().reverse().map((s) => (R.parS[s] ? R.parS[s].pire : null)).filter((x) => x != null) });
              pK++;
            }
          }
        }
      }
      if (!neufs || j.length < 16) break;
    }
  }
  console.log(`KHL : ${nK} matchs dans les 24 h, ${pK} pépites (stage ${stage || '?'})`);
}
out.sort((a, b) => (a.pire - a.cours) - (b.pire - b.cours) || a.t - b.t);
fs.mkdirSync('loi', { recursive: true });
fs.writeFileSync('loi/loi_series.json', JSON.stringify({ at: now, n: nMatchs, s: NSAI, L: out }));
console.log(`Loi des séries : ${nMatchs} matchs dans les 24 h, ${out.length} pépites`);

/* ═══ 20261107q — 📒 HISTORIQUE DES PÉPITES (Antoine : « balancer dans Tendances et archiver, je veux contrôler un truc » → bilan + calendrier,
   maquette « oui ») : chaque pépite du matin est GARDÉE (loi/historique.json, une ligne par match / équipe / pari / lieu) ; les jours suivants,
   le résultat est relu dans les archives (equipes/<id>.json de la saison, m[2] = n° du match, m[4] = score, m[6] = prolongation) :
   r = 1 → le pari a gagné (la série s'est arrêtée), 0 → encore raté ; sc = « pour-contre ». Pas trouvé 10 jours après → r = -1 (annulé / reporté). ═══ */
{
  const H = lireJ('loi/historique.json') || { L: [] }, cle = (x) => [x.eid, x.id, x.k, x.lieu].join('|'), vus = new Set(H.L.map(cle));
  const jourP = (t) => new Date(t).toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' });
  let neufs = 0, regles = 0;
  for (const x of out) { if (vus.has(cle(x))) continue; vus.add(cle(x)); neufs++;
    H.L.push({ j: jourP(x.t), t: x.t, sp: x.sp, lg: x.lg, ligue: x.ligue, eid: x.eid, id: x.id, eq: x.eq, adv: x.adv, d: x.d, lieu: x.lieu, k: x.k, lib: x.lib, pire: x.pire, cours: x.cours, logo: x.logo || '', c: x.c || '', r: null }); }   /* 20261107r : + couleur (fond de la carte) */
  for (const x of H.L) {
    if (x.r != null || x.t > now - 3 * 3600e3) continue;
    const f = ((PARIS[x.sp] || []).find((p) => p[0] === x.k) || [])[2]; if (!f) continue;
    const base = `cotes/${SPN[x.sp]}/${x.lg}`, eid = String(x.eid).replace(/^khl/, '');
    let sa = []; try { sa = fs.readdirSync(base).filter((q) => /^\d{4}(-\d{2})?$/.test(q)).sort().slice(-2); } catch (e) {}
    let m = null; for (const s0 of sa) { const q = lireJ(`${base}/${s0}/equipes/${x.id}.json`); const y = q && (q.m || []).find((z) => String(z[2]) === eid); if (y) m = y; }
    if (m && m[4] && m[4][0] != null && m[4][1] != null) { const dom = m[3] === 'h', p = dom ? +m[4][0] : +m[4][1], c = dom ? +m[4][1] : +m[4][0];
      x.r = f(p, c, m[6] ? 1 : 0) ? 1 : 0; x.sc = p + '-' + c + (US.has(x.sp) && m[6] ? ' (prol.)' : ''); regles++; }
    else if (x.t < now - 10 * 864e5) { x.r = -1; regles++; }
  }
  H.L.sort((a, b) => b.t - a.t); H.at = now;
  fs.writeFileSync('loi/historique.json', JSON.stringify(H));
  console.log(`Historique : ${H.L.length} pépites gardées (${neufs} nouvelles, ${regles} résultats lus)`);
}

/* 20261106i — 🔎 CRITÈRES DANS LE COCKPIT (Antoine : « si je veux Edmonton pour regarder ce que ça donne je suis obligé d'aller dans
   Compétitions / sport / équipe… parce que pas dans mon mur ») : index de TOUTES les équipes des championnats archivés, pour la recherche
   de l'appli. Nom complet ESPN (miroir standings.json, ex. « Paris Saint-Germain » : le foot retrouve l'équipe PAR LE NOM) ; sinon le nom
   court des archives (equipes.json de la dernière saison). Sortie : loi/equipes.json { at, L: [[sp, lg, ligue, id, nom, logo], …] }. */
{
  const IX = [], vusE = new Set();
  for (const [sp, lg] of [...LIGUES, ['hockey', 'khl']]) {   /* 20261106m : + KHL (archive khl.yml) */
    if (/^uefa\./.test(lg)) continue;   // coupes d'Europe : les clubs sont déjà dans leur championnat
    const st = lireJ(`miroir/${sp}/${lg}/standings.json`), noms = {};
    let ligN = (st && (st.abbreviation || st.name)) || { '270559': 'Top 14', '271937': 'Champions Cup', '272073': 'Challenge Cup', '3': 'NRL', khl: 'KHL' }[lg]   /* 20261114g (capture « Toulon · URC », « Stade Toulousain · Premiership ») : vrais noms des 2 coupes */ || '';
    if (st) JSON.stringify(st, (k, v) => { if (v && v.team && v.team.id && v.team.displayName && !noms[v.team.id]) { const Lg = v.team.logos || []; noms[v.team.id] = [v.team.displayName, (Lg.find((x) => (x.rel || []).includes('dark')) || Lg[0] || {}).href || '']; } return v; });
    const base = `cotes/${SPN[sp]}/${lg}`;
    let sa = []; try { sa = fs.readdirSync(base).filter((x) => /^\d{4}(-\d{2})?$/.test(x)).sort(); } catch (e) {}
    const eqj = sa.length ? lireJ(`${base}/${sa[sa.length - 1]}/equipes.json`) : null;
    const ids = new Set([...Object.keys(eqj || {}), ...Object.keys(noms)]);
    for (const id of ids) {
      const cle = sp + '|' + lg + '|' + id; if (vusE.has(cle)) continue; vusE.add(cle);
      if (sp === 'rugby' && (lg === '271937' || lg === '272073') && vusE.has('rugby|270559|' + id)) continue;   /* 20261114g : club du Top 14 = une seule ligne */
      const nom = (noms[id] && noms[id][0]) || (eqj && eqj[id] && eqj[id][0]) || ''; if (!nom) continue;
      IX.push([sp, lg, ligN || lg, String(id), nom, (noms[id] && noms[id][1]) || (sp === 'rugby' ? `https://a.espncdn.com/i/teamlogos/rugby/teams/500/${id}.png` : '')]);
    }
  }
  /* 20261113h : sélections nationales (toutes celles vues dans les compétitions archivées), lg 'sel' ; l'appli met le nom français */
  { const vS = {};
    for (const lg of SEL) { let sa = []; try { sa = fs.readdirSync(`cotes/foot/${lg}`).filter((x) => /^\d{4}$/.test(x)); } catch (e) {}
      for (const s of sa) { const q = lireJ(`cotes/foot/${lg}/${s}/equipes.json`) || {}; for (const id of Object.keys(q)) if (q[id] && q[id][0] && !vS[id]) vS[id] = q[id][0]; } }
    for (const id of Object.keys(vS)) IX.push(['soccer', 'sel', 'Sélections', String(id), vS[id], `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`]); }
  /* 20261113k : sélections de RUGBY (Six Nations, Nations Championship, Coupe du monde, tests), lg 'rsel' */
  { const vR = {};
    for (const lg of ['180659', '17567', '164205', '289234', '244293']) { let sa = []; try { sa = fs.readdirSync(`cotes/rugby/${lg}`).filter((x) => /^\d{4}$/.test(x)); } catch (e) {}
      for (const s of sa) { const q = lireJ(`cotes/rugby/${lg}/${s}/equipes.json`) || {}; for (const id of Object.keys(q)) if (q[id] && q[id][0] && !vR[id]) vR[id] = q[id][0]; } }
    for (const id of Object.keys(vR)) IX.push(['rugby', 'rsel', 'Sélections rugby', String(id), vR[id], `https://a.espncdn.com/i/teamlogos/rugby/teams/500/${id}.png`]); }
  IX.sort((a, b) => a[4].localeCompare(b[4], 'fr'));
  fs.writeFileSync('loi/equipes.json', JSON.stringify({ at: now, L: IX }));
  console.log(`Index équipes : ${IX.length}`);
}
