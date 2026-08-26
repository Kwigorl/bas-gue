# Contribuer à Bas-Gué

Merci d’y avoir pensé. Ce dépôt accepte les contributions, à condition qu’on soit d’accord sur une chose avant tout le reste — c’est le premier paragraphe, et c’est le seul qui compte vraiment.

## Ce que tu acceptes en proposant une contribution

En ouvrant une *pull request*, une *issue* contenant du texte destiné au jeu, ou en envoyant une correction par n’importe quel moyen, tu déclares :

1. **que la contribution est de toi**, ou que tu as le droit de la proposer ;
2. **que tu la places sous les mêmes licences que le projet** — CC BY-NC-SA 4.0 pour le contenu, PolyForm Noncommercial 1.0.0 pour le code ;
3. **que tu accordes en plus à l’auteur du projet (Kwigorl) une licence non exclusive, mondiale, irrévocable et gratuite** l’autorisant à utiliser, modifier, traduire et rediffuser ta contribution **sous d’autres conditions, y compris dans une édition commerciale, imprimée ou payante**.

Le point 3 mérite une explication, parce qu’il n’est pas anodin.

Bas-Gué est libre, mais son auteur garde la possibilité de le faire éditer un jour. Le jour où un éditeur demande *« êtes-vous bien titulaire de tous les droits sur ce texte ? »*, la réponse doit être oui, sans avoir à retrouver quinze personnes qui ont corrigé une phrase en 2027. Sans le point 3, chaque contribution retenue crée un droit d’auteur supplémentaire sur le jeu, et un projet à vingt contributeurices devient impossible à éditer.

**Tu ne cèdes rien.** Tu gardes tes droits d’auteur sur ce que tu as écrit, tu peux le republier ailleurs, le réutiliser, t’en revendiquer. Tu autorises, simplement, et sans exclusivité.

Si ce point te pose problème, ouvre une *issue* pour en parler plutôt que de renoncer — il y a souvent une autre façon de faire, par exemple publier ton apport de ton côté, sous ta licence, comme un supplément séparé. C’est parfaitement dans l’esprit du projet.

## Ce qui aide le plus

Par ordre de valeur, très inégal :

- **Ce que vous n’avez pas compris à la table.** Une règle relue trois fois sans se mettre d’accord, un mot qu’on cherche pendant dix minutes, une question qui revient à chaque partie. C’est l’information la plus précieuse et la plus difficile à obtenir : personne d’autre que vous ne l’a.
- **Une règle qui casse en jeu.** Une combinaison qui rend un combat trivial, une greffe que personne ne prend jamais, un chiffre qui ne tient pas. Dis ce qui s’est passé à la table, pas seulement ce que tu proposes.
- **Coquilles, liens morts, ancres cassées, affichage bancal** sur un navigateur ou un téléphone. Signale le navigateur et la taille d’écran.
- **Traductions et adaptations.** Elles sont bienvenues, mais elles vivent mieux **dans ton propre dépôt** : c’est ton travail, il porte ton nom, et la licence t’y autorise sans rien demander. Un lien depuis ce dépôt, avec plaisir.

## Ce qui ne sera probablement pas retenu

Sans rancune, et ce n’est pas un jugement sur la qualité :

- les refontes de règles qui n’ont pas été discutées avant dans une *issue* ;
- les changements de ton, de style ou de mise en page — le texte a une voix, et elle est volontaire ;
- les gros ajouts de contenu *(nouvelles greffes, nouvelles Positions, nouveaux greffons)* : ce sont des choix d’auteur, et ils font d’excellents suppléments chez toi ;
- tout ce qui contredit la **convention d’écriture** *(voir le README)* : orthographe rectifiée de 1990 et écriture inclusive, appliquées partout.

## En pratique

**La source, c’est le markdown.** `manuel-joueureuses.md` et `manuel-meneur.md` sont les seuls fichiers à modifier pour le texte des manuels.

**Ne touche jamais à `manuel-joueureuses.html` ni à `manuel-meneur.html`** : ils sont **générés**, et toute modification y sera écrasée au prochain build. Après une retouche du markdown :

```bash
python3 build.py
```

Aucune dépendance à installer, juste Python 3. Commite le `.md` **et** le `.html` régénéré.

**Vérifie que rien n’est cassé** avant d’envoyer :

```bash
python3 - <<'EOF'
import re
for f in ("manuel-joueureuses.html","manuel-meneur.html"):
    h=open(f,encoding="utf-8").read()
    ids=set(re.findall(r'id="([^"]+)"',h))
    casses=sorted({a for a in re.findall(r'href="#([^"]+)"',h) if a not in ids})
    print(f, "→", casses or "aucun lien cassé")
EOF
```

**Les autres fichiers.** `assets/donnees.js` porte les options de l’atelier de création : si tu corriges une règle dans un manuel, vérifie si elle y figure aussi. `index.html`, `creation.html`, `fiche.html` et `licence.html` s’écrivent à la main.

**Une contribution, une *issue*.** Les corrections de coquilles peuvent partir directement en *pull request*. Tout le reste gagne à commencer par une discussion : ça évite d’écrire trois heures pour rien.

## Crédit

Les contributions retenues sont créditées dans le dépôt. Dis-moi sous quel nom tu veux apparaitre — un pseudo convient très bien, celui de l’auteur en est un.
