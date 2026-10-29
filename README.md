# gones45-archives

Archive de **GONES45 / BET45** (application de suivi de paris d'Antoine) : cotes d'avant-match DraftKings (via l'API ESPN) et feuilles de match,
rangées par sport → championnat → équipe / joueur :
`cotes/<sport>/<ligue>/matchs/AAAA-MM.json` (matchs), `equipes.json` + `equipes/<id>.json`, `joueurs.json` + `joueurs/<id>.json` (index recalculés à chaque passage).
Sports : `foot`, `hockey`, `basket`, `football-us`.

- Robot **cotes-archive** (toutes les 2 h) : matchs qui commencent dans les 4 h → cotes principales, cotes joueurs, buts d'équipe ;
  après le match → score et feuille de match (buteurs, passeurs, stats des joueurs).
- Robot **rattrapage** (à la main) : 4 saisons passées → score, feuille de match, cotes de clôture (1N2, handicap, total).
- Lu par l'appli (onglet Compétitions → 📦 Cotes gardées). Tout est gratuit (GitHub Actions + fichiers publics).
