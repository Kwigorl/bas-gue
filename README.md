# Bas-Gué — le site

Site statique pour le jeu de rôle **Bas-Gué**. Aucune dépendance, aucun compte, aucun outil de compilation : ce sont des fichiers HTML qu’un navigateur ouvre tels quels.

```
index.html                  l’accueil
manuel-joueureuses.html     généré depuis le markdown
manuel-meneur.html          généré depuis le markdown
creation.html               l’atelier de création de personnage
fiche.html                  la fiche vierge, deux pages A4 à imprimer
table.html                  six scènes d’une partie, transcrites
licence.html                la licence expliquée en français clair
LICENSE                     ce que GitHub lit
CONTRIBUTING.md             les conditions pour contribuer
assets/                     styles, scripts, données de jeu
build.py                    le convertisseur Obsidian → HTML
carte.svg                   la carte du fleuve, insérée dans le manuel de lae meneureuse
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
   (Les noms de fichiers du dépôt sont volontairement sans accent : Windows et certains outils d'archive abiment les accents des *noms* de fichiers. Le contenu des notes, lui, reste en UTF-8 accentué sans problème.)
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

> **Un piège d’Obsidian.** Dans un **tableau**, le `|` d’un wikilink doit être échappé : `[[#Les marques\|les marques]]`. Sans l’antislash, la cellule se coupe au milieu du lien. `build.py` le signale désormais au moment du build, avec le fichier et le numéro de ligne — s’il n’affiche rien, tout va bien.

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

## Licence

Le contenu du jeu est sous **CC BY-NC-SA 4.0**, le code du site sous **PolyForm Noncommercial 1.0.0**. Dans les deux cas : libre à jouer, copier, imprimer, traduire et modifier, **jamais à vendre** sans autorisation écrite.

C’est écrit à trois endroits, et les trois comptent :

- une ligne dans le **pied de chaque page** du site *(et sur la fiche imprimée, qui circule seule)* ;
- **`licence.html`**, qui l’explique en français clair : ce qu’on peut faire sans demander, ce qui demande une autorisation, et ce que la licence ne couvre pas ;
- **`LICENSE`**, à la racine, que GitHub affiche.

Le fichier `LICENSE` contient une note à ton intention, à supprimer une fois lue : il désigne les licences sans en reproduire le texte intégral, et donne les deux commandes `curl` pour récupérer les textes officiels. Aucune licence non commerciale ne figure dans le menu déroulant de GitHub à la création d’un dépôt, ni dans son encadré « About » : c’est attendu, ça n’enlève rien à sa validité.

### Contribuer, et rester éditable

`CONTRIBUTING.md` pose une condition sur les contributions extérieures : qui propose une correction la place sous les mêmes licences **et** t’autorise, toi, à la rediffuser sous d’autres conditions — édition commerciale comprise.

Ça n’a l’air de rien, et c’est le seul verrou qui compte si tu veux faire éditer Bas-Gué un jour. Sans lui, chaque contribution fusionnée crée un droit d’auteur supplémentaire sur le jeu : au bout de vingt coquilles corrigées par quinze personnes, tu ne peux plus répondre *oui* à un éditeur qui demande si tu détiens bien tous les droits. Le fichier existe **avant** la première contribution, ce qui est le seul moment où c’est facile.

Le contributeur ou la contributrice ne cède rien : iel garde ses droits, et n’accorde qu’une autorisation non exclusive.

**Ton nom apparait à trois endroits** — `LICENSE`, `licence.html` et le pied de page — sous la forme `Kwigorl`. Remplace-le si tu veux signer autrement, et ajoute une adresse de contact dans `licence.html` si tu ne veux pas passer par les *issues* du dépôt.

## Les infobulles de vocabulaire

Sur les deux pages de manuel, les mots du chapitre II (Vocabulaire) reçoivent une infobulle partout où ils réapparaissent dans le texte courant. Toute la mécanique tient en trois fichiers, générés puis exécutés :

- **`build.py`** extrait les deux tables « Les mots du jeu » et « Les mots du monde » du `.md` source et écrit **`assets/glossaire-data.js`** — ne le modifie jamais à la main, il est régénéré à chaque build.
- **`assets/glossaire.js`** parcourt `.corps` au chargement de la page et pose une infobulle sur chaque mot qui correspond.

**Ce qu'il touche, et pourquoi seulement ça.** Le script ne réagit qu'aux mots déjà en **gras** dans le texte courant — jamais dans un tableau, jamais dans un titre. C'est volontaire : la moitié du vocabulaire (*Fait, Porte, Trait, Franc, Court…*) est aussi du français ordinaire, et seul le gras dit sans ambigüité que le mot est employé au sens du jeu. Un mot en gras déjà **lié** (beaucoup le sont) n'est pas transformé : un petit **ⓘ** est ajouté à côté, pour ne jamais gêner la navigation.

**Le piège du tiret final.** Les greffes s'écrivent `**Au fer —** …`, et le glossaire doit reconnaitre `Au fer` malgré le tiret. Mais les fiches d'adversaire du manuel des meneureuses écrivent aussi `**Fait —** il consigne.` — un tiret qui ne veut rien dire de spécial, sur un mot qui collisionne avec le terme de glossaire *Fait* (une preuve d'enquête). Le tiret final n'est donc toléré que pour les deux termes qui l'emploient réellement ainsi (`au fer`, `au calme`) ; ailleurs, un mot suivi d'un tiret ne matche rien. Si tu ajoutes un jour un nouveau terme au vocabulaire qui s'écrit lui aussi avec un tiret dans le texte courant, ajoute-le à `TOLERE_TIRET` en haut de `assets/glossaire.js`.

**Le gras peut envelopper le lien, ou l'inverse.** Le générateur produit tantôt `<a><strong>mot</strong></a>`, tantôt `<strong><a>mot</a></strong>` — selon que le wikilink ou le gras a été écrit en premier dans le `.md`. Le script cherche le lien **dans les deux sens** (`closest('a')` puis `querySelector('a')`) avant de décider s'il pose un mot cliquable ou un bouton ⓘ. Ne cherche jamais le lien dans un seul sens : c'est exactement ce qui a cassé deux liens (*Outrepasser*, *Un outil vivant*) la première fois — ils ouvraient l'infobulle au lieu de naviguer.

**Le ⓘ n'existe qu'au tactile.** Un mot qui est à la fois un terme et un lien ne pose un conflit que là où *taper* est le seul geste disponible : le **ⓘ** sert alors de seconde cible, pour que le tap sur le mot continue de naviguer. À la souris, survoler et cliquer sont deux gestes distincts — le script ne crée donc aucun bouton, branche la définition sur le **survol** du lien, et n'intercepte jamais le clic. C'est aussi le sens du garde-fou dans `brancherDeclencheur` : si un déclencheur se trouve malgré tout être un lien ou en contenir un, la navigation passe toujours avant l'infobulle.

Après toute modification du chapitre Vocabulaire, `python3 build.py` régénère `glossaire-data.js` tout seul ; rien d'autre à toucher.

**Au-delà du gras : une occurrence par chapitre.** Le gras seul ratait beaucoup de vraies occurrences — un mot du glossaire écrit en toutes lettres, capitalisé, jamais mis en valeur. `build.py` en marque désormais **une par grand chapitre (titre de niveau 1)**, dans le texte courant uniquement (jamais dans un tableau, un titre, un gras déjà traité, une italique — une italique nomme presque toujours un élément de règle précis, *Étai*, *Point faible*, et couper le mot en deux dedans serait moche). La fonction `marquer_premiere_occurrence()` fait ce travail, et `doc.glossaire_vu` se remet à zéro à chaque nouveau chapitre.

Deux noms propres en sont exclus — `EXCLUS_PREMIERE_OCCURRENCE` en tête de fichier — **Bas-Gué** et **Vasque** : le lecteur les comprend dès la première page, inutile de les redéfinir à chaque chapitre.

Ce marquage ne dépend d'aucune nouvelle logique côté navigateur : il produit directement `<span class="terme" data-terme="Nom">mot</span>`, que `assets/glossaire.js` reconnaissait déjà (c'est le même mécanisme que les marquages à la main de `table.html`).

## Convention d’écriture

Tout le site suit deux règles, à respecter pour toute modification future.

**Orthographe rectifiée de 1990.** Accent circonflexe retiré sur *i* et *u* (coute, goute, boite, maitre, paraitre, connaitre, bruler, ile, fraiche, traine, abime…), sauf les exceptions que la réforme garde : *dû, sûr, mûr, jeûne*. Soudures : *portemonnaie*. Le convertisseur `build.py` ne fait pas ça tout seul — c’est à la source `.md` de l’appliquer.

**Écriture inclusive.** La règle maison, dans l’ordre :

- *meneur* → **meneureuse**, avec l’article fusionné **lae** *(lae meneureuse)* ou **un·e** *(un·e meneureuse)*. Le manuel s’appelle *Manuel des meneureuses*, en parallèle de *Manuel des joueureuses*.
- *joueur* → **joueureuse** *(lae joueureuse, un·e joueureuse)*. Le pluriel **joueureuses** était déjà en place.
- Noms d’agent genrés → **point médian** : *un·e allié·e, un·e ennemi·e, un·e greffeur·euse, un·e batelier·ère, un·e habitué·e*. Le pluriel prend *·es* : *deux allié·es*.
- Noms épicènes → mot inchangé, seul l’article devient inclusif : *lae coupable, un·e juge, un·e adversaire, un·e témoin, lae commis*.
- Les participes et adjectifs qui s’accordent avec « tu » (le genre de qui lit est inconnu) prennent le médian : *désorienté·e, désarmé·e, resté·e à terre, lae seul·e, lae meilleur·e*.
- Là où le médian alourdirait, on reformule en épicène : *la personne qui mène, l’être touché, la personne qui viendra réclamer*.

**Deux choses qu’on ne touche pas.**

- Les **personnages nommés** — les dix habitué·es *(Poix, Sagne, Dame Verne…)*, les huit adversaires *(l’inspecteur de milice, le chien de ferme, la mère-souche…)* : ce sont des personnes précises, avec leur genre. On laisse aussi leurs pronoms *il/elle* tels quels. Les **noms de règles** figés restent aussi intacts : le trait *Doigts de greffeur*, la variante *Devant témoins*.
- Les **pronoms génériques** qui désignent une personne de genre inconnu passent à **iel** *(pluriel* iels*)* : « tout·e ennemi·e… **iel** peut le faire ». On ne convertit **que** ces cas-là. Restent au masculin : le *il* impersonnel *(il y a, il faut, il te faut)*, le *il/elle* qui renvoie à une **chose** *(un outil, un greffon, un mur qui pousse, le rang, la Gousse…)*, et les **personnages nommés** avec leurs pronoms. Les objets et pronoms compléments *(lui, le, la)* et les possessifs *(son, sa)* ne changent pas — ils s’accordent avec le nom, pas avec la personne.

Le `.md` reste la source. Après toute retouche, relance `python3 build.py` et le vérificateur de liens.

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
