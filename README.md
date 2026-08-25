# Bas-Gué — le site

Site statique pour le jeu de rôle **Bas-Gué**. Aucune dépendance, aucun compte, aucun outil de compilation : ce sont des fichiers HTML qu’un navigateur ouvre tels quels.

```
index.html                  l’accueil
manuel-joueureuses.html     généré depuis le markdown
manuel-meneur.html          généré depuis le markdown
creation.html               l’atelier de création de personnage
assets/                     styles, scripts, données de jeu
build.py                    le convertisseur Obsidian → HTML
carte.svg                   la carte du fleuve, insérée dans le manuel du meneur
gabarit-manuel.html         le squelette des deux pages de manuel
manuel-joueureuses.md       ta note Obsidian, telle quelle
manuel-meneur.md            ta note Obsidian, telle quelle
```

## Mettre en ligne sur GitHub Pages

1. Crée un dépôt (par exemple `bas-gue`) et pousse tout le contenu de ce dossier à la racine.
2. Dans le dépôt : **Settings → Pages**.
3. *Source* : **Deploy from a branch**. *Branch* : `main`, dossier `/ (root)`. Enregistre.
4. Une minute plus tard, le site est sur `https://<ton-pseudo>.github.io/bas-gue/`.

Le fichier `.nojekyll` (vide) est là pour que GitHub serve les fichiers sans les retoucher. Ne le supprime pas.

## Remettre à jour les manuels après une modif dans Obsidian

Les deux pages de manuel ne se modifient pas à la main : elles sont **générées**. Le markdown reste la source.

1. Recopie tes deux notes dans ce dossier sous les noms `manuel-joueureuses.md` et `manuel-meneur.md`.
   (Les noms de fichiers du dépôt sont volontairement sans accent : Windows et certains outils d'archive abîment les accents des *noms* de fichiers. Le contenu des notes, lui, reste en UTF-8 accentué sans problème.)
2. Lance la conversion :

```bash
python3 build.py
```

Aucune bibliothèque à installer — juste Python 3.

Le script relit les deux `.md`, régénère `manuel-joueureuses.html` et `manuel-meneur.html`, et écrit au passage `assets/ancres.json`, l’index complet des ancres.

### Ce que le script sait faire

- **Les ancres sont conservées.** Chaque titre reçoit un identifiant stable (`## Les marques` → `#les-marques`), et tous les `[[#Les marques]]` du texte pointent dessus. Les liens d’un manuel vers l’autre (`[[Bas-Gué — Manuel des joueureuses|…]]`) deviennent des liens entre les deux pages, ancre comprise.
- Les tableaux, les callouts `> [!abstract]`, les citations, les listes, le gras et l’italique passent tels quels.
- Les liens vers des notes qui n’existent pas encore (*La commande*, *Pré-tirés*, *Notes d’arbitrage*) s’affichent en gris pointillé, sans casser la page. Le jour où tu ajoutes ces notes, déclare-les dans `NOTE_TARGETS` en haut de `build.py` et elles deviendront des liens.
- `![[Bas-Gué - Carte.svg]]` est remplacé par le contenu de `carte.svg`, qui est un vrai SVG inline : il suit le thème clair/sombre et reste lisible à l’impression.

Après le build, tu peux vérifier qu’aucun lien n’est cassé :

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

## L’atelier de création

`creation.html` lit ses options dans `assets/donnees.js` : morphologies, gabarits, sens, positions, les dix familles de greffes avec leurs variantes, armes et outils vivants. **Si tu changes une règle dans le manuel, change-la aussi là** — c’est le seul endroit du site qui duplique du contenu, parce qu’il a besoin des chiffres et pas seulement du texte.

Le fichier est du JavaScript très simple, un objet par option :

```js
{ id: 'grimpeur', nom: 'Grimpeur',
  face: '+3 pour grimper et garder l’équilibre.',
  ombre: '−2 pour résister à ce qui pousse…',
  pv: 0, def: 0 }
```

`pv` et `def` sont les seuls champs calculés : ils s’ajoutent aux points de vie et à la Défense. Tout le reste est du texte recopié sur la fiche.

La fiche en cours est gardée dans le navigateur (`localStorage`) et peut être exportée en `.json`, rechargée, ou imprimée : l’impression ne sort que la fiche, sur deux colonnes.

## Détails

- **Le bouton lampe** (en haut à droite) bascule jour/nuit. Le choix est retenu, et la première visite suit le réglage du système.
- La recherche des pages de manuel filtre le sommaire ; `Entrée` saute au premier résultat, `Échap` efface.
- Polices : Fraunces, Spectral et IBM Plex Mono, chargées depuis Google Fonts. Si tu préfères t’en passer, supprime les deux `<link>` de chaque page — les polices de repli sont déjà déclarées.
- Tout est en français dans le code aussi, classes CSS comprises, pour que ça reste modifiable sans traduction mentale.
