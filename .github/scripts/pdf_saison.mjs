// GONES45 — 📄 PDF DE FIN DE SAISON (20261031w ; Antoine : « fin d'année en PDF, nouveau PDF l'année d'après » → « année footballistique »
// → « ou NHL, par saison en fait » ; « par année Ligue 1 ou Lyon ou les Rams » ; même page que le bouton 📄 de l'appli, texte noir 14 px).
// Pour chaque championnat et chaque saison TERMINÉE (dernier match il y a plus de 10 jours, saison qui n'est pas la saison en cours) sans PDF :
//   pdf/<sport>/<ligue>/<saison>/<Nom du championnat>.pdf  +  pdf/<sport>/<ligue>/<saison>/equipes/<Club>.pdf (+ ses matchs d'Europe pour le foot).
// Forcer : PDF_LIGUE=fra.1 PDF_SAISON=2025-26 (bouton du robot). Playwright (Chromium) imprime la page.
import fs from 'fs';
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');   /* require : marche avec l'installation du robot (npm) comme en local */
const NOMS = { 'fra.1': 'Ligue 1', 'fra.2': 'Ligue 2', 'eng.1': 'Premier League', 'esp.1': 'Liga', 'ita.1': 'Serie A', 'ger.1': 'Bundesliga', 'ned.1': 'Eredivisie', 'por.1': 'Liga Portugal',
  'bra.1': 'Brasileirao', 'arg.1': 'Argentine', 'uefa.champions': 'Ligue des champions', 'uefa.europa': 'Ligue Europa', 'uefa.europa.conf': 'Ligue Conference', nhl: 'NHL', nba: 'NBA', nfl: 'NFL', mlb: 'MLB',
  'fifa.friendly': 'Matchs amicaux', 'uefa.nations': 'Ligue des nations', 'fifa.worldq.uefa': 'Qualifs Coupe du monde', 'fifa.world': 'Coupe du monde', 'uefa.euro': 'Euro' };
const EUR = { 'uefa.champions': '🏆 C1', 'uefa.europa': '🥈 C3', 'uefa.europa.conf': '🥉 C4' }, DOM_EU = ['fra.1', 'fra.2', 'eng.1', 'esp.1', 'ita.1', 'ger.1', 'ned.1', 'por.1'];
const JTY = { soccer: ['230', '⚽ Buteur'], hockey: ['230', '🏒 Buteur'], football: ['31', '🏈 TD'], basketball: ['218', '🏀 Points'] };
const esc = (t) => String(t == null ? '' : t).replace(/[<>&"]/g, '');
const f2 = (x) => (x > 1 ? x.toFixed(2).replace('.', ',') : '–'), vir = (x) => String(x).replace('.', ','), sg = (x) => (x > 0 ? '+' : (x < 0 ? '−' : '')) + vir(Math.abs(x));
const lireSaison = (sp, lg, sa) => { const D = {}; const B = `cotes/${sp}/${lg}/${sa}/matchs`; try { for (const f of fs.readdirSync(B)) Object.assign(D, JSON.parse(fs.readFileSync(`${B}/${f}`, 'utf8'))); } catch (e) {} return D; };
const reussi = (fi, id, ty) => { if (!fi.st) return null; const o = fi.st[id]; if (!o) return 'abs'; const s = o.s || {}; if (fi.s === 'football') return ((s.rTD || 0) + (s.reTD || 0)) >= 1; if (fi.s === 'basketball') return (s.PTS || 0) >= 20; return (s.G || 0) >= 1; };
function page(L, eq, eqNom, titre, lg0) {
  const B = {}; let h = '';
  for (const fi of L) {
    const d = new Date(fi.t), dt = d.toISOString().slice(8, 10) + '/' + d.toISOString().slice(5, 7) + '/' + d.toISOString().slice(0, 4);
    const moi = eq ? (String(fi.h.id) === eq ? 'h' : 'a') : '', ce = EUR[fi.lg] && fi.lg !== lg0 ? 'E' : 'L', b = B[ce] || (B[ce] = { V: 0, N: 0, D: 0, p: 0, c: 0, x: {} }); if (ce === 'E') b.x[EUR[fi.lg]] = 1;
    let res = '';
    if (fi.f && moi) { const m = moi === 'h' ? fi.f.h : fi.f.a, l = moi === 'h' ? fi.f.a : fi.f.h; b.p += m; b.c += l; if (m > l) { b.V++; res = ' ✅ V'; } else if (m < l) { b.D++; res = ' ❌ D'; } else { b.N++; res = ' 🟰 N'; } }
    h += `<div class="m"><div class="t"><b>${dt}</b> · ${ce === 'E' ? '<b>' + EUR[fi.lg] + '</b> · ' : ''}${esc(fi.h.nom)} <b>${fi.f ? fi.f.h + ' - ' + fi.f.a : 'vs'}</b> ${esc(fi.a.nom)}${res}</div>`;
    const c = [];
    if (fi.ml) c.push(`1 ${f2(fi.ml.h)}${fi.ml.d > 1 ? ' · N ' + f2(fi.ml.d) : ''} · 2 ${f2(fi.ml.a)}`);
    if (fi.hc && fi.hc.L != null) c.push(`Handicap ${esc(fi.h.nom)} ${sg(fi.hc.L)} ${f2(fi.hc.h)} / ${sg(-fi.hc.L)} ${f2(fi.hc.a)}`);
    if (fi.tot && fi.tot.L != null) c.push(`Total ${vir(fi.tot.L)} : + ${f2(fi.tot.o)} / − ${f2(fi.tot.u)}`);
    if (fi.bts) c.push(`Les deux marquent : oui ${f2(fi.bts.o)} / non ${f2(fi.bts.n)}`);
    if (c.length) h += `<div>${c.join(' &nbsp;|&nbsp; ')}</div>`;
    const ty = (JTY[fi.s] || [])[0];
    if (ty && fi.j) {
      const J = Object.keys(fi.j).map((k) => { const l = (fi.j[k].o || {})[ty] || []; const q = fi.s === 'basketball' ? l.find((x) => x[0] === 20) : l[0]; return q ? { n: fi.j[k].n, d: q[1], ok: reussi(fi, k) } : null; }).filter(Boolean).sort((a, b) => a.d - b.d).slice(0, eq ? 12 : 5);
      if (J.length) h += `<div>${JTY[fi.s][1]} : ${J.map((x) => esc(x.n) + ' ' + f2(x.d) + (x.ok === true ? ' ✅' : (x.ok === false ? ' ❌' : ''))).join(' · ')}</div>`;
    }
    if (fi.s === 'soccer' && fi.bu && fi.bu.length) { const nom = (id) => (fi.st && fi.st[id] && fi.st[id].n) || ''; h += `<div>📋 ${fi.bu.map((x) => '⚽ <b>' + esc(x[0]) + '</b> ' + esc(nom(x[1]) || x[4]) + (x[2] && nom(x[2]) ? ' (passe ' + esc(nom(x[2])) + ')' : '')).join(' &nbsp; ')}</div>`; }
    h += '</div>';
  }
  let bil = ''; if (eq) for (const k of ['L', 'E']) { const b = B[k]; if (!b || !(b.V + b.N + b.D)) continue; bil += `<div class="b">Bilan ${esc(eqNom)}${B.E ? (k === 'L' ? ' — ' + esc(NOMS[lg0] || lg0) : ' — Europe (' + Object.keys(b.x).join(', ') + ')') : ''} : ${b.V} V · ${b.N} N · ${b.D} D — ${b.p} marqués, ${b.c} encaissés</div>`; }
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(titre)}</title><style>body{background:#fff;color:#000;font:14px/1.45 Arial,sans-serif;margin:16px;}h1{font-size:20px;margin:0 0 4px;}.s{font-size:13px;color:#333;margin-bottom:10px;}.b{font-size:15px;font-weight:700;border:2px solid #000;padding:6px 8px;margin:8px 0 12px;}.m{border-top:1px solid #999;padding:6px 0;break-inside:avoid;page-break-inside:avoid;}.t{font-size:15px;}</style></head><body><h1>${esc(titre)}</h1><div class="s">${L.length} match${L.length > 1 ? 's' : ''} · cotes d'avant-match DraftKings (via ESPN) · BET45, PDF de fin de saison du ${new Date().toLocaleDateString('fr-FR')}</div>${bil}${h}</body></html>`;
}
const SPN = { foot: 'soccer', hockey: 'hockey', basket: 'basketball', 'football-us': 'football', baseball: 'baseball' };
const maintenant = Date.now(), TOUT = (process.env.PDF_LIGUE || '') === 'tout', FL = TOUT ? '' : (process.env.PDF_LIGUE || ''), FS = process.env.PDF_SAISON || '';   /* 30/10 : « tout » (Antoine « TOUT ») = toutes les ligues, toutes les saisons FINIES, PDF déjà faits sautés */
const nav = await chromium.launch(), pg = await nav.newPage();
let nPdf = 0;
const imprimer = async (html, chemin) => { fs.mkdirSync(chemin.replace(/\/[^/]+$/, ''), { recursive: true }); await pg.setContent(html, { waitUntil: 'load' }); await pg.pdf({ path: chemin, format: 'A4', margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' } }); nPdf++; };
const propre = (t) => String(t || '').replace(/[\/\\:*?"<>|]/g, ' ').trim() || 'equipe';
for (const sp of Object.keys(SPN)) {
  let LG = []; try { LG = fs.readdirSync(`cotes/${sp}`).filter((d) => d !== 'joueurs' && fs.statSync(`cotes/${sp}/${d}`).isDirectory()); } catch (e) {}
  for (const lg of LG) {
    if (FL && lg !== FL) continue;
    let SA = []; try { SA = fs.readdirSync(`cotes/${sp}/${lg}`).filter((d) => /^\d{4}(-\d{2})?$/.test(d)).sort(); } catch (e) {}
    for (const sa of SA) {
      if (FS && sa !== FS) continue;
      const D = lireSaison(sp, lg, sa), L = Object.values(D).filter((x) => x && x.f && x.h && x.a).sort((a, b) => a.t - b.t); if (!L.length) continue;
      const enCours = SA[SA.length - 1] === sa, fini = maintenant - L[L.length - 1].t > 10 * 864e5 && !Object.values(D).some((x) => x && !x.f && x.t > maintenant - 3 * 864e5);
      const dossier = `pdf/${sp}/${lg}/${sa}`, nomLg = NOMS[lg] || lg;
      if (TOUT) { if (enCours || !fini || fs.existsSync(`${dossier}/${propre(nomLg)}.pdf`)) continue; }
      else if (!FL && (+sa.slice(0, 4) < 2026 || enCours || !fini || fs.existsSync(`${dossier}/${propre(nomLg)}.pdf`))) continue;   /* tout seul : à partir de 2026-27 (cotes complètes) ; avant = sur demande */
      console.log(`📄 ${lg} ${sa} : ${L.length} matchs`);
      await imprimer(page(L, '', '', `BET45 — ${nomLg} ${sa}`, lg), `${dossier}/${propre(nomLg)}.pdf`);
      const eqs = {}; for (const fi of L) for (const k of ['h', 'a']) eqs[fi[k].id] = fi[k].nom;
      for (const [id, nom] of Object.entries(eqs)) {
        let M = L.filter((fi) => String(fi.h.id) === id || String(fi.a.id) === id);
        if (DOM_EU.includes(lg)) for (const c of Object.keys(EUR)) { const E = lireSaison('foot', c, sa); for (const fi of Object.values(E)) if (fi && fi.f && (String(fi.h.id) === id || String(fi.a.id) === id)) { if (!fi.lg) fi.lg = c; M.push(fi); } }
        M = M.sort((a, b) => a.t - b.t);
        const euro = M.some((fi) => EUR[fi.lg] && fi.lg !== lg);
        await imprimer(page(M, id, nom, `BET45 — ${nom} — ${nomLg}${euro ? ' + Europe' : ''} ${sa}`, lg), `${dossier}/equipes/${propre(nom)}.pdf`);
      }
    }
  }
}
await nav.close();
console.log(`📄 ${nPdf} PDF fabriqué(s)`);
