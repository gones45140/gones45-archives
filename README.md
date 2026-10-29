# gones45-archives

Archive de **GONES45 / BET45** (application de suivi de paris d'Antoine) : cotes d'avant-match DraftKings (via l'API ESPN) et feuilles de match,
rangées par sport → championnat → équipe / joueur :
`cotes/<sport>/<ligue>/<saison>/matchs/AAAA-MM.json` (matchs ; saison = juillet → juin, ex. 2026-27), puis dans chaque saison `equipes.json` + `equipes/<id>.json`, `joueurs.json` + `joueurs/<id>.json` (index recalculés à chaque passage).
Sports : `foot`, `hockey`, `basket`, `football-us`.

**Carrière d'un joueur** (transferts compris, tous championnats d'un sport) : `cotes/<sport>/joueurs/<idEspn>.json` = `{ n, eq, lg, c: [[ligue, saison, idClub, club, nbMatchs, 1er match, dernier match]] }`, index `cotes/<sport>/joueurs.json`.

- Robot **cotes-archive** (toutes les 2 h) : matchs qui commencent dans les 4 h → cotes principales, cotes joueurs, buts d'équipe ;
  après le match → score et feuille de match (buteurs, passeurs, stats des joueurs).
- Robot **rattrapage** (à la main) : 4 saisons passées → score, feuille de match, cotes de clôture (1N2, handicap, total).
- Lu par l'appli (onglet Compétitions → 📦 Cotes gardées). Tout est gratuit (GitHub Actions + fichiers publics).

- Robot **pdf-saison** (le 3 de chaque mois) : PDF de fin de saison par championnat et par équipe dans `pdf/<sport>/<ligue>/<saison>/` (à partir de 2026-27 ; avant : bouton avec ligue + saison).
