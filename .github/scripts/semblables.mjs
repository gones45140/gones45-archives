// GONES45 — 📚 MATCHS SEMBLABLES (20261120x). Antoine (19/11, Carolina – Montréal : historique des équipes 3,64 / Winamax sans marge 2,20)
// → « OUI B » : l'appli estime un pari NHL / NBA / NFL à partir des cotes DraftKings du match + des matchs SEMBLABLES des archives
// (même niveau de favori, même total du book). Tests (19/11) : NHL 1 740 matchs, erreur 0,1804 contre 0,1857 pour l'historique des équipes.
// Une ligne par match terminé des 5 dernières saisons (domicile) : [pDom, total, butsDom, butsExt, prol, t]
//   pDom = chance du DOMICILE selon les cotes « vainqueur » de clôture (marge retirée), total = ligne du book.
// Sortie : loi/semblables/<nhl|nba|nfl>.json { v, t, M: [...] }. Lancé chaque matin (semblables.yml).
import fs from 'node:fs';
const L = [['nhl', 'cotes/hockey/nhl'], ['nba', 'cotes/basket/nba'], ['nfl', 'cotes/football-us/nfl']];
fs.mkdirSync('loi/semblables', { recursive: true });
for (const [lg, dir] of L) {
  const SA = fs.readdirSync(dir).filter((d) => /^\d{4}-\d{2}$/.test(d)).sort().slice(-5), vus = new Set(), M = [];
  for (const s of SA) {
    let E = {}; try { E = JSON.parse(fs.readFileSync(`${dir}/${s}/equipes.json`, 'utf8')); } catch (e) { continue; }
    for (const k of Object.keys(E)) {
      let T = null; try { T = JSON.parse(fs.readFileSync(`${dir}/${s}/equipes/${k}.json`, 'utf8')); } catch (e) { continue; }
      for (const r of T.m || []) {
        if (r[3] !== 'h' || !(r[5] >= 2) || !r[4] || r[4][0] == null || vus.has(r[2])) continue;
        const ml = r[11]; if (!Array.isArray(ml) || !(ml[0] > 1) || !(ml[2] > 1)) continue;
        const p = (1 / ml[0]) / (1 / ml[0] + 1 / ml[2]); vus.add(r[2]);
        M.push([Math.round(p * 1000) / 1000, r[9] == null ? null : +r[9], +r[4][0], +r[4][1], r[6] ? 1 : 0, Math.round(r[0] / 864e5)]);
      }
    }
  }
  M.sort((a, b) => a[5] - b[5]);
  fs.writeFileSync(`loi/semblables/${lg}.json`, JSON.stringify({ v: 1, t: Date.now(), M }));
  console.log(`${lg} : ${M.length} matchs (${SA.join(', ')})`);
}
