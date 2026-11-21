/* GONES45 — 🏎 TRACÉS DES CIRCUITS F1 (21/11/2026)
   Antoine (GP de Las Vegas) : la carte en direct n'était pas dispo car OpenF1 répond 401 à TOUT pendant une séance, et personne
   n'avait ouvert la fiche du GP entre deux séances (« oublié d'aller entre 2 séances du coup j'ai pas le live »).
   Ce robot fabrique À L'AVANCE le tracé de chaque circuit du calendrier ESPN, hors séance, EXACTEMENT comme l'appli
   (_g45F1TraceLire : meilleur tour valide de la meilleure séance finie — Qualifying > course > qualifs sprint —, positions
   location du pilote pendant ce tour, voie des stands par pit + location), puis :
   1) le range dans f1/traces/<clé>.json (clé de l'appli : g45f1tr2_<circuit.id ESPN>) ;
   2) le dépose au worker /f1trace (premier dépôt gardé), que l'appli lit déjà en secours.
   OpenF1 en 401 (séance en cours) → on s'arrête et on réessaie au passage suivant. Circuits sans séance de l'année : année d'avant. */
import fs from 'fs';
const WK = 'https://fd-proxy.touraine-antoine.workers.dev';
const OF = 'https://api.openf1.org/v1/';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
/* circuit.id ESPN → circuit_short_name OpenF1 (regex) ; sondé 21/11 : ESPN ids du calendrier 2026 */
const CIRC = { '601': /melbourne/i, '619': /shanghai/i, '618': /suzuka/i, '603': /sakhir|bahrain/i, '4069': /jeddah/i, '4243': /miami/i,
  '608': /montr/i, '606': /monte|monaco/i, '5826': /catalun|barcelona/i, '779': /spielberg|red bull/i, '611': /silverstone/i,
  '616': /spa/i, '613': /hungaroring|budapest/i, '1102': /zandvoort/i, '615': /monza/i, '605': /madri|madring/i, '607': /baku/i,
  '602': /sepang/i, '740': /singapore|marina bay/i, '609': /austin|americas/i, '782': /mexico/i, '617': /interlagos|paulo/i,
  '4250': /las vegas/i, '4211': /lusail|losail/i, '744': /yas/i };
class Bloque extends Error {}
async function of1(u) {
  for (let essai = 0; essai < 5; essai++) {
    await dormir(essai ? essai * 5000 : 1300);
    const r = await fetch(OF + u);
    if (r.status === 429) continue;
    if (r.status === 401) throw new Bloque('OpenF1 401 (séance en cours)');
    if (!r.ok) throw new Error('openf1 ' + r.status + ' ' + u);
    return r.json();
  }
  throw new Error('openf1 429');
}
function pitVoie(tr, L) {   /* copie de _g45F1PitVoie (app.js) */
  const P = tr.P, pts = (L || []).filter((p) => p && p.x != null && p.y != null);
  if (pts.length < 10) return null;
  const d2 = (x, y) => { let m = Infinity; for (const q of P) { const dx = q[1] - x, dy = q[2] - y, v = dx * dx + dy * dy; if (v < m) m = v; } return Math.sqrt(m); };
  let best = [], cur = [];
  for (const p of pts) { if (d2(p.x, p.y) > 60) cur.push([p.x, p.y]); else { if (cur.length > best.length) best = cur; cur = []; } }
  if (cur.length > best.length) best = cur;
  return best.length >= 8 ? best : null;
}
async function tracer(sessions) {
  const now = Date.now();
  const rang = (s) => { const n = String(s.session_name || ''); return /^qualifying$/i.test(n) ? 4 : /race/i.test(n) ? 3 : /qualif/i.test(n) ? 2 : 1; };
  const finies = sessions.filter((s) => Date.parse(s.date_end) < now - 600000)
    .sort((a, b) => rang(b) - rang(a) || Date.parse(b.date_start) - Date.parse(a.date_start));
  for (const s of finies.slice(0, 3)) {
    const k = s.session_key;
    try {   /* 21/11 : 1er passage, « openf1 404 laps?session_key=11265 » (séance sans données) → séance suivante au lieu de tout arrêter */
    const L = (await of1('laps?session_key=' + k)).filter((l) => l.lap_duration && l.date_start && !l.is_pit_out_lap && l.duration_sector_1 && l.duration_sector_2 && l.duration_sector_3)
      .sort((a, b) => a.lap_duration - b.lap_duration)[0];
    if (!L) continue;
    const d0 = new Date(L.date_start), d1 = new Date(+d0 + L.lap_duration * 1000);
    const P = await of1('location?session_key=' + k + '&driver_number=' + L.driver_number + '&date>' + d0.toISOString() + '&date<' + d1.toISOString());
    if (!P || P.length < 50) continue;
    const tr = { T: L.lap_duration, D: [L.duration_sector_1, L.duration_sector_2, L.duration_sector_3],
      P: P.map((p) => [Math.round((Date.parse(p.date) - +d0) / 100) / 10, p.x, p.y]).filter((p) => p[0] >= 0 && [p[1], p[2]].every((v) => typeof v === 'number' && isFinite(v))) };
    if (tr.P.length < 50 || tr.P.length > 4000) continue;
    try {
      const Pi = (await of1('pit?session_key=' + k)).filter((x) => x.date).sort((a, b) => (b.lane_duration || 0) - (a.lane_duration || 0));
      for (let q = 0; q < Math.min(3, Pi.length) && !tr.pit; q++) {
        /* 21/11 : Interlagos → voie de 9 807 points (lane_duration énorme, drapeau rouge ?) refusée par le worker (413) : durée bornée 60 s, voie ≤ 600 points */
        const pd = new Date(Pi[q].date), du = Math.min(60, +(Pi[q].lane_duration || 30));
        const Lp = await of1('location?session_key=' + k + '&driver_number=' + Pi[q].driver_number + '&date>' + new Date(+pd - 15000).toISOString() + '&date<' + new Date(+pd + (du + 15) * 1000).toISOString());
        tr.pit = pitVoie(tr, Lp || []);
        if (tr.pit && tr.pit.length > 600) tr.pit = null;
      }
    } catch (e) { if (e instanceof Bloque) throw e; }
    if (!tr.pit) delete tr.pit;
    tr.k = k;
    return { tr, s };
    } catch (e) { if (e instanceof Bloque) throw e; console.log('   séance', k, 'ignorée :', e.message); }
  }
  return null;
}
(async () => {
  const an = new Date().getUTCFullYear();
  const j = await (await fetch('https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard?dates=' + an)).json();
  const circuits = {};
  for (const e of j.events || []) { const c = e.circuit || {}; if (c.id) circuits[String(c.id)] = c.fullName || e.name; }
  console.log(Object.keys(circuits).length, 'circuits ESPN');
  const annees = {};
  const sesAn = async (y) => annees[y] || (annees[y] = await of1('sessions?year=' + y));
  let faits = 0, deja = 0;
  try {
    for (const id of Object.keys(circuits)) {
      const cle = 'g45f1tr2_' + id.replace(/\W+/g, '_').slice(0, 40), fic = 'f1/traces/' + cle + '.json';
      if (fs.existsSync(fic)) { deja++; continue; }
      const re = CIRC[id];
      if (!re) { console.log('⚠️ circuit inconnu', id, circuits[id]); continue; }
      let res = null;
      try {
      for (const y of [an, an - 1]) {
        let S = (await sesAn(y)).filter((s) => re.test(s.circuit_short_name || '') || re.test(s.location || ''));
        /* 21/11 : Bahreïn pris sur les essais d'hiver (« Day 3 ») → seulement les week-ends de GP (avec qualifs ou course) */
        const gp = new Set(S.filter((s) => /qualifying|race/i.test(s.session_name || '')).map((s) => s.meeting_key));
        if (gp.size) S = S.filter((s) => gp.has(s.meeting_key));
        if (!S.length) continue;
        const dern = Math.max(...S.map((s) => s.meeting_key));   /* dernier week-end sur ce circuit */
        res = await tracer(S.filter((s) => s.meeting_key === dern));
        if (res) break;
      }
      } catch (e) { if (e instanceof Bloque) throw e; console.log('— erreur', id, e.message); }
      if (!res) { console.log('— pas de tracé', id, circuits[id]); continue; }
      fs.writeFileSync(fic, JSON.stringify(res.tr));
      let dep = '';
      try { const r = await fetch(WK + '/f1trace?c=' + cle, { method: 'POST', body: JSON.stringify(res.tr) }); dep = r.status + ' ' + (await r.text()).slice(0, 40); } catch (e) { dep = 'erreur ' + e.message; }
      console.log('✅', id, circuits[id], '←', res.s.year, res.s.circuit_short_name, res.s.session_name, res.tr.P.length, 'points', res.tr.pit ? 'stands ' + res.tr.pit.length : 'sans stands', '| worker', dep);
      faits++;
    }
  } catch (e) {
    if (e instanceof Bloque) console.log('⏸', e.message, '→ on réessaiera au prochain passage');
    else throw e;
  }
  console.log('Fini :', faits, 'nouveaux,', deja, 'déjà gardés');
})();
