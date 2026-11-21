/* GONES45 — 🏁 DUOS « DOUBLE CHANCE BUTEUR » NHL (20261121q, maquette maquette_duos.png « oui » d'Antoine : « faudrait mettre jouable en
   Cockpit, que ça trouve d'autres duos »). Deux joueurs de la MÊME équipe, matchs où les DEUX ont joué (feuille st, J = 1), réussi = au moins
   un des deux a marqué (G ≥ 1, prolongation comprise). Saison en cours + saison d'avant (la plus récente terminée). Gardés : ≥ 50 matchs
   ensemble dont ≥ 10 cette saison, réussite ≥ 55 %. Sortie loi/duos/nhl.json { v, t, s: [saisons], L: [[nomA, idA, nomB, idB, équipe,
   idÉquipe, n, ok, nS, okS, pire, nD, okD, pireD, nE, okE, pireE, ratésEnCours]] } triée par réussite, 80 duos maximum. */
import fs from 'node:fs';
const B = 'cotes/hockey/nhl/';
const sais = fs.readdirSync(B).filter((d) => /^\d{4}-\d{2}$/.test(d)).sort().slice(-2);
const G = [];
for (const s of sais) {
  const dir = B + s + '/matchs/'; if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).sort()) {
    let J; try { J = JSON.parse(fs.readFileSync(dir + f, 'utf8')); } catch (e) { continue; }
    for (const x of Object.values(J)) if (x && x.st && x.f && x.ty !== 3) G.push([x.t, s, x]);
  }
}
G.sort((a, b) => a[0] - b[0]);
const cur = sais[sais.length - 1], P = new Map(), noms = {};
for (const [, s, x] of G) {
  for (const side of ['h', 'a']) {
    const pl = Object.entries(x.st).filter(([, v]) => v && v.k === side && v.s && v.s.J).sort((a, b) => a[0] < b[0] ? -1 : 1);
    for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++) {
      const [a, va] = pl[i], [b, vb] = pl[j], k = a + '|' + b;
      noms[a] = va.n; noms[b] = vb.n;
      if (!P.has(k)) P.set(k, []);
      P.get(k).push([s === cur ? 1 : 0, side === 'h' ? 1 : 0, (va.s.G || vb.s.G) ? 1 : 0, x[side].nom, x[side].id]);
    }
  }
}
const stat = (L) => { let ok = 0, pire = 0, c = 0; for (const z of L) { if (z[2]) { ok++; c = 0; } else { c++; if (c > pire) pire = c; } } return [L.length, ok, pire, c]; };
const R = [];
for (const [k, L] of P) {
  if (L.length < 50) continue;
  const S = L.filter((z) => z[0]); if (S.length < 10) continue;
  const [n, ok, pire, enc] = stat(L); if (ok / n < 0.55) continue;
  const [nS, okS] = stat(S), [nD, okD, pD] = stat(L.filter((z) => z[1])), [nE, okE, pE] = stat(L.filter((z) => !z[1]));
  const [a, b] = k.split('|'), last = L[L.length - 1];
  R.push([noms[a], a, noms[b], b, last[3], last[4], n, ok, nS, okS, pire, nD, okD, pD, nE, okE, pE, enc]);
}
R.sort((x, y) => y[7] / y[6] - x[7] / x[6]);
fs.mkdirSync('loi/duos', { recursive: true });
fs.writeFileSync('loi/duos/nhl.json', JSON.stringify({ v: 1, t: Date.now(), s: sais, L: R.slice(0, 80) }));
console.log('✅ ' + G.length + ' matchs · ' + R.length + ' duos gardés (80 max écrits) · saisons ' + sais.join(', '));
