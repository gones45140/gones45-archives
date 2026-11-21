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
const CONF = [{ f: 'nhl', d: 'cotes/hockey/nhl/', K: ['b'], min: [50, 10] }, { f: 'nba', d: 'cotes/basket/nba/', K: ['m19.5', 'm24.5', 'm29.5', 'm34.5', 's39.5', 's44.5', 's49.5', 's54.5'], min: [50, 10] }]
  .concat(['fra.1', 'eng.1', 'esp.1', 'ita.1', 'ger.1', 'ned.1', 'por.1'].map((lg) => ({ f: 'foot-' + lg, d: 'cotes/foot/' + lg + '/', K: ['b'], min: [20, 4], foot: 1 })));
const joue = (C, v) => v && v.s && (C.foot ? v.s.TIT : v.s.J);
const reussi = (k, sa, sb) => { if (k === 'b') return (sa.G || 0) + (sb.G || 0) > 0; const L = +k.slice(1); return k[0] === 'm' ? Math.max(sa.PTS || 0, sb.PTS || 0) > L : (sa.PTS || 0) + (sb.PTS || 0) > L; };
const stat = (L) => { let ok = 0, pire = 0, c = 0; for (const z of L) { if (z) { ok++; c = 0; } else { c++; if (c > pire) pire = c; } } return [L.length, ok, pire, c]; };
fs.mkdirSync('loi/duos', { recursive: true });
for (const C of CONF) {
  if (!fs.existsSync(C.d)) continue;
  const sais = fs.readdirSync(C.d).filter((d) => /^\d{4}-\d{2}$/.test(d)).sort().slice(-2), cur = sais[sais.length - 1], G = [];
  for (const s of sais) { const dir = C.d + s + '/matchs/'; if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) { let J; try { J = JSON.parse(fs.readFileSync(dir + f, 'utf8')); } catch (e) { continue; }
      for (const x of Object.values(J)) if (x && x.st && x.f && x.ty !== 3) G.push([x.t, s, x]); } }
  G.sort((a, b) => a[0] - b[0]);
  const P = new Map(), noms = {};
  for (const [, s, x] of G) for (const side of ['h', 'a']) {
    const pl = Object.entries(x.st).filter(([, v]) => v && v.k === side && joue(C, v)).sort((a, b) => a[0] < b[0] ? -1 : 1);
    for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++) {
      const [a, va] = pl[i], [b, vb] = pl[j], k = a + '|' + b; noms[a] = va.n; noms[b] = vb.n;
      if (!P.has(k)) P.set(k, []);
      P.get(k).push([s === cur ? 1 : 0, side === 'h' ? 1 : 0, C.K.map((kk) => reussi(kk, va.s, vb.s) ? 1 : 0), x[side].nom, x[side].id, (va.s.G || 0) > 0 ? 1 : 0, (vb.s.G || 0) > 0 ? 1 : 0]);
    }
  }
  const R = [];
  for (const [k, L] of P) {
    if (L.length < C.min[0]) continue; const S = L.filter((z) => z[0]); if (S.length < C.min[1]) continue;
    /* « b » (buteur) : les DEUX doivent marquer de temps en temps (≥ 10 % des matchs ensemble), sinon Haaland + son gardien sortirait en tête */
    if (C.K[0] === 'b' && (L.filter((z) => z[5]).length < 0.1 * L.length || L.filter((z) => z[6]).length < 0.1 * L.length)) continue;
    const o = {}; let bon = false;
    C.K.forEach((kk, i) => {
      const r = (M) => M.map((z) => z[2][i]);
      const [n, ok, pire, enc] = stat(r(L)), [nS, okS] = stat(r(S)), [nD, okD, pD] = stat(r(L.filter((z) => z[1]))), [nE, okE, pE] = stat(r(L.filter((z) => !z[1])));
      if (ok / n >= 0.3) bon = true;
      o[kk] = [n, ok, nS, okS, pire, nD, okD, pD, nE, okE, pE, enc];
    });
    if (!bon) continue;
    const [a, b] = k.split('|'), last = L[L.length - 1];
    R.push([noms[a], a, noms[b], b, last[3], last[4], o]);
  }
  const k0 = C.K[C.f === 'nba' ? 1 : 0];
  R.sort((x, y) => y[6][k0][1] / y[6][k0][0] - x[6][k0][1] / x[6][k0][0]);
  fs.writeFileSync('loi/duos/' + C.f + '.json', JSON.stringify({ v: 2, t: Date.now(), s: sais, K: C.K, L: R.slice(0, 120) }));
  console.log('✅ ' + C.f + ' : ' + G.length + ' matchs · ' + R.length + ' duos · saisons ' + sais.join(', '));
}
