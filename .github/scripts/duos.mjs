/* GONES45 — 🏁 DUOS (20261121q NHL ; 20261122a foot + NBA, Antoine « oui ajoute le foot, NBA » + capture Winamax « Double chance marqueurs
   Brunson ou Avdija plus de 34,5 » / « Duo marqueurs de points Brunson + Avdija plus de 39,5 »).
   Deux joueurs de la MÊME équipe, matchs joués ENSEMBLE (NHL / NBA : feuille st J ; foot : les DEUX titulaires, TIT), saison en cours + celle
   d'avant, hors playoffs (ty 3). Clés (un critère = une clé) :
     b      = au moins un des deux marque (NHL, foot : G ≥ 1)
     m19.5… = NBA, au moins un des deux marque PLUS DE L points (« double chance marqueurs »)
     s39.5… = NBA, total des deux PLUS DE L points (« duo marqueurs de points »)
   Sortie loi/duos/<nhl|nba|foot-<ligue>>.json { v: 2, t, s: [saisons], K: [clés], L: [[nomA, idA, nomB, idB, équipe, idÉq,
   { clé: [n, ok, nS, okS, pire, nD, okD, pireD, nE, okE, pireE, ratésEnCours] }]] }. Gardés : assez de matchs ensemble (NHL / NBA 50 dont 10
   cette saison ; foot 20 dont 4), réussite ≥ 30 % sur au moins une clé ; 120 duos max (les mieux classés sur la 1re clé). */
import fs from 'node:fs';
/* 20261122f (« fait pareil pour le foot et faudra faire NBA et NFL voire MLB ») : une clé par RÔLE et par SEUIL du critère, pour tous :
     g1 g2 g3 / a1 a2 / p1 p2 p3 = NHL et foot (g buteur, a passeur, p pointeur / décisif = G + A ; n ou +)
     m19.5… / s39.5… = NBA points (au moins un des deux plus de L / total des deux plus de L), gardées telles quelles
     reb:6.5, ast:5.5, tp:2.5, pra:29.5, pr:24.5, pa:24.5, ra:9.5 = NBA autres stats (au moins un des deux plus de L)
     td:1, td:2 = NFL touchdown (course + réception) ; hr:1, r:1, r:2 = MLB home run / run (n ou +)
   Réussi = au moins UN des deux atteint le seuil. Hors NBA, une clé n'est gardée pour un duo que si CHACUN des deux l'atteint seul dans au
   moins 10 % des matchs ensemble (sinon Haaland + son gardien sortirait en tête). */
const NBAL = { reb: ['4.5', '6.5', '8.5', '10.5'], ast: ['3.5', '5.5', '7.5', '9.5'], tp: ['1.5', '2.5', '3.5'], pra: ['24.5', '29.5', '34.5', '39.5'], pr: ['19.5', '24.5', '29.5'], pa: ['19.5', '24.5', '29.5'], ra: ['7.5', '9.5', '12.5'] };
const CONF = [{ f: 'nhl', d: 'cotes/hockey/nhl/', K: ['g1', 'g2', 'a1', 'a2', 'p1', 'p2', 'p3'], min: [50, 10], dix: 1 },
  { f: 'nba', d: 'cotes/basket/nba/', K: ['m19.5', 'm24.5', 'm29.5', 'm34.5', 's39.5', 's44.5', 's49.5', 's54.5'].concat(Object.keys(NBAL).flatMap((r) => NBAL[r].map((l) => r + ':' + l))), min: [50, 10], top: 40 },
  { f: 'nfl', d: 'cotes/football-us/nfl/', K: ['td:1', 'td:2'], min: [20, 4], dix: 1 },
  { f: 'mlb', d: 'cotes/baseball/mlb/', K: ['hr:1', 'r:1', 'r:2'], min: [80, 20], dix: 1 }]
  .concat(['fra.1', 'eng.1', 'esp.1', 'ita.1', 'ger.1', 'ned.1', 'por.1'].map((lg) => ({ f: 'foot-' + lg, d: 'cotes/foot/' + lg + '/', K: ['g1', 'g2', 'a1', 'p1'], min: [20, 4], foot: 1, dix: 1 })));
const joue = (C, v) => v && v.s && (C.foot ? v.s.TIT : v.s.J);
const VAL = { g: (x) => x.G || 0, a: (x) => x.A || 0, p: (x) => (x.G || 0) + (x.A || 0), pts: (x) => x.PTS || 0, reb: (x) => x.REB || 0, ast: (x) => x.AST || 0, tp: (x) => x['3PT'] || 0,
  pra: (x) => (x.PTS || 0) + (x.REB || 0) + (x.AST || 0), pr: (x) => (x.PTS || 0) + (x.REB || 0), pa: (x) => (x.PTS || 0) + (x.AST || 0), ra: (x) => (x.REB || 0) + (x.AST || 0),
  td: (x) => (x.rTD || 0) + (x.reTD || 0), hr: (x) => x.HR || 0, r: (x) => x.R || 0 };
const cle = (k) => { if (k === 'b') return ['g', 1, 0]; if (/^[gap]\d$/.test(k)) return [k[0], +k[1], 0]; if (/^[ms]\d/.test(k)) return ['pts', +k.slice(1), k[0] === 's'];
  const [r, l] = k.split(':'); return [r, +l, 0]; };
const atteint = (v, l) => Number.isInteger(l) ? v >= l : v > l;
const reussi = (k, sa, sb) => { const [r, l, som] = cle(k), f = VAL[r]; return som ? atteint(f(sa) + f(sb), l) : atteint(Math.max(f(sa), f(sb)), l); };
const seul = (k, x) => { const [r, l, som] = cle(k); return som ? true : atteint(VAL[r](x), l); };
const stat = (L) => { let ok = 0, pire = 0, c = 0; for (const z of L) { if (z) { ok++; c = 0; } else { c++; if (c > pire) pire = c; } } return [L.length, ok, pire, c]; };
fs.mkdirSync('loi/duos', { recursive: true });
/* 20261122b (capture : Lightning sans logo, le nom court « Lightning » n'était pas dans l'index) : nom COMPLET + logo par n° d'équipe ESPN (loi/equipes.json) */
const IXE = {}; try { for (const x of JSON.parse(fs.readFileSync('loi/equipes.json', 'utf8')).L || []) IXE[x[1] + '|' + x[3]] = [x[4], x[5] || '']; } catch (e) {}
for (const C of CONF) {
  if (!fs.existsSync(C.d)) continue;
  /* 20261122c (« 2 saisons est-ce suffisant ? » → bouton 4 saisons « oui ») : on lit les 4 dernières saisons ; classement et seuils sur les 2 dernières, stats 4 saisons en plus (d[8]) */
  const sais4 = fs.readdirSync(C.d).filter((d) => /^\d{4}(-\d{2})?$/.test(d)).sort().slice(-4), sais = sais4.slice(-2), cur = sais[sais.length - 1], G = [];
  for (const s of sais4) { const dir = C.d + s + '/matchs/'; if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) { let J; try { J = JSON.parse(fs.readFileSync(dir + f, 'utf8')); } catch (e) { continue; }
      for (const x of Object.values(J)) if (x && x.st && x.f && x.ty !== 3) G.push([x.t, s, x]); } }
  G.sort((a, b) => a[0] - b[0]);
  const P = new Map(), noms = {};
  for (const [, s, x] of G) for (const side of ['h', 'a']) {
    const pl = Object.entries(x.st).filter(([, v]) => v && v.k === side && joue(C, v)).sort((a, b) => a[0] < b[0] ? -1 : 1);
    for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++) {
      const [a, va] = pl[i], [b, vb] = pl[j], k = a + '|' + b; noms[a] = va.n; noms[b] = vb.n;
      if (!P.has(k)) P.set(k, []);
      P.get(k).push([s === cur ? 1 : 0, side === 'h' ? 1 : 0, C.K.map((kk) => reussi(kk, va.s, vb.s) ? 1 : 0), x[side].nom, x[side].id, C.K.map((kk) => seul(kk, va.s) ? 1 : 0), C.K.map((kk) => seul(kk, vb.s) ? 1 : 0), sais.indexOf(s) >= 0 ? 1 : 0]);
    }
  }
  const R = [];
  for (const [k, L4] of P) {
    const L = L4.filter((z) => z[7]);
    if (L.length < C.min[0]) continue; const S = L.filter((z) => z[0]); if (S.length < C.min[1]) continue;
    /* « b » (buteur) : les DEUX doivent marquer de temps en temps (≥ 10 % des matchs ensemble), sinon Haaland + son gardien sortirait en tête */
    const o = {}; let bon = false;
    const dixOk = (i) => !C.dix || (L.filter((z) => z[5][i]).length >= 0.1 * L.length && L.filter((z) => z[6][i]).length >= 0.1 * L.length);
    C.K.forEach((kk, i) => { if (!dixOk(i)) return;
      const r = (M) => M.map((z) => z[2][i]);
      const [n, ok, pire, enc] = stat(r(L)), [nS, okS] = stat(r(S)), [nD, okD, pD] = stat(r(L.filter((z) => z[1]))), [nE, okE, pE] = stat(r(L.filter((z) => !z[1])));
      if (ok / n >= 0.3) bon = true;
      o[kk] = [n, ok, nS, okS, pire, nD, okD, pD, nE, okE, pE, enc];
    });
    if (!bon) continue;
    const o4 = {}; if (L4.length > L.length) C.K.forEach((kk, i) => { if (!o[kk]) return;
      const r = (M) => M.map((z) => z[2][i]);
      const [n, ok, pire, enc] = stat(r(L4)), [nS, okS] = stat(r(L4.filter((z) => z[0]))), [nD, okD, pD] = stat(r(L4.filter((z) => z[1]))), [nE, okE, pE] = stat(r(L4.filter((z) => !z[1])));
      o4[kk] = [n, ok, nS, okS, pire, nD, okD, pD, nE, okE, pE, enc];
    });
    const [a, b] = k.split('|'), last = L[L.length - 1];
    const lgK = C.f.indexOf('foot-') === 0 ? C.f.slice(5) : C.f, eq = IXE[lgK + '|' + last[4]] || [last[3], ''];
    R.push([noms[a], a, noms[b], b, eq[0], last[4], o, eq[1], o4]);
  }
  /* 20261122e : les 60 meilleurs de CHAQUE clé (sinon un duo fort en « pointeur 2+ » pouvait manquer, classé seulement sur la 1re clé) */
  const garde = new Set();
  for (const kk of C.K) R.filter((x) => x[6][kk]).sort((x, y) => y[6][kk][1] / y[6][kk][0] - x[6][kk][1] / x[6][kk][0]).slice(0, C.top || 60).forEach((x) => garde.add(x));
  const OUT = R.filter((x) => garde.has(x));
  fs.writeFileSync('loi/duos/' + C.f + '.json', JSON.stringify({ v: 2, t: Date.now(), s: sais, s4: sais4, K: C.K, L: OUT }));
  console.log('✅ ' + C.f + ' : ' + G.length + ' matchs · ' + R.length + ' duos (' + OUT.length + ' écrits) · saisons ' + sais.join(', '));
}
