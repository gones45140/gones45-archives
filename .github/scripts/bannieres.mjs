// GONES45 — 🖼️ Archive des BANNIÈRES d'équipes (20261120i). Antoine : « je veux suivre le joueur sans forcément le club » → « impossible de les
// archiver les bannières ? » → « OUI » (seulement les ADRESSES : les images restent chez TheSportsDB, pas de redistribution dans ce dépôt public).
// Pour chaque club de loi/equipes.json (hors sélections), même recherche que l'appli (_g45FanChercher) : searchteams.php (clé gratuite 3), bon sport,
// pas d'équipe féminine / jeunes / réserve, nom identique ou contenu (≥ 6 lettres), champ bandeau d'abord puis fanart, stade, maillot, poster.
// Sortie : bannieres/bannieres.json { v, t, E: { "<sport>|<id>": { n: nom, u: adresse ou "", t: date } } }. Trouvée : revue tous les 60 j ;
// pas trouvée : nouvel essai après 14 j ; TheSportsDB en panne (429 / 5xx) : rien d'écrit, nouvel essai au passage suivant.
import fs from 'node:fs';
const IX = JSON.parse(fs.readFileSync('loi/equipes.json', 'utf8')).L || [];
const F = 'bannieres/bannieres.json';
let B = { v: 1, t: 0, E: {} }; try { B = JSON.parse(fs.readFileSync(F, 'utf8')); B.E = B.E || {}; } catch (e) {}
const SPT = { soccer: 'Soccer', hockey: 'Ice Hockey', basketball: 'Basketball', football: 'American Football', baseball: 'Baseball', rugby: 'Rugby', 'rugby-league': 'Rugby' };
const nz = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const dors = (ms) => new Promise((r) => setTimeout(r, ms));
const MARQ = /(gloriosas|femenin|feminin|women|ladies|damen|dames|girls|youth|academy|reserve|reserves|\bu\s?1[4-9]\b|\bu\s?2[0-3]\b|\bii\b|\bb\b)/i;
const variantes = (n) => { const v = [n], c = n.replace(/\b(FC|CF|AFC|AC|SC|AS|CD|CA|SV|FK|SK|BK|Club|de Fútbol|Futebol Clube)\b\.?/gi, '').replace(/\s+/g, ' ').trim(); if (c && c !== n) v.push(c); return v; };
async function chercher(nom, sp) {
  const ess = variantes(nom), acc = new Set(ess.map(nz).filter(Boolean)), att = SPT[sp] || '';
  const corr = (k) => k && (acc.has(k) || [...acc].some((a) => a.length >= 6 && (k.includes(a) || a.includes(k))));
  let rep = false;
  for (const e of ess) {
    let j = null;
    for (let tent = 0; tent < 3 && !j; tent++) {
      try { const r = await fetch('https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=' + encodeURIComponent(e));
        if (r.status === 429) { await dors(65000); continue; } if (!r.ok) { await dors(5000); continue; } j = await r.json(); } catch (x) { await dors(5000); }
    }
    await dors(2300);   // ≈ 26 recherches / minute (clé gratuite)
    if (!j) continue; rep = true;
    const L = (j.teams || []).filter((t) => !att || nz(t.strSport) === nz(att)).filter((t) => MARQ.test(nom) || !MARQ.test(String(t.strTeam || '')));
    const t = L.find((x) => acc.has(nz(x.strTeam))) || L.find((x) => corr(nz(x.strTeam)));
    if (t) { const u = t.strTeamBanner || t.strFanart1 || t.strFanart2 || t.strFanart3 || t.strFanart4 || t.strStadiumThumb || t.strTeamJersey || t.strPoster || ''; if (u) return { u, rep }; }
  }
  return { u: '', rep };
}
const now = Date.now(), J = 864e5; let faits = 0, trouves = 0, depart = Date.now();
const liste = IX.filter((x) => x && x[3] && x[4] && x[1] !== 'sel' && x[1] !== 'rsel');
const vus = new Set();
for (const x of liste) {
  const k = x[0] + '|' + x[3]; if (vus.has(k)) continue; vus.add(k);
  const E = B.E[k]; if (E && ((E.u && now - E.t < 60 * J) || (!E.u && now - E.t < 14 * J))) continue;
  if (Date.now() - depart > 80 * 60e3) { console.log('⏱️ temps écoulé, la suite au prochain passage'); break; }
  const r = await chercher(x[4], x[0]); faits++;
  if (r.u || r.rep) { B.E[k] = { n: x[4], u: r.u, t: now }; if (r.u) trouves++; }
  if (faits % 40 === 0) { B.t = Date.now(); fs.writeFileSync(F, JSON.stringify(B)); console.log(faits + ' cherchées, ' + trouves + ' trouvées'); }
}
B.t = Date.now(); fs.mkdirSync('bannieres', { recursive: true }); fs.writeFileSync(F, JSON.stringify(B));
const tot = Object.values(B.E).filter((e) => e.u).length;
console.log('✅ ' + faits + ' cherchées ce passage, ' + trouves + ' trouvées · archive : ' + tot + ' bannières / ' + Object.keys(B.E).length + ' équipes');
