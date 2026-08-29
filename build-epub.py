#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fabrique un .epub par manuel, à partir du HTML déjà généré par build.py.
Réutilise donc les mêmes titres, ancres, tableaux et liens internes que le site."""

import re, io, uuid
from ebooklib import epub

SOURCES = [
    ("manuel-joueureuses.html", "bas-gue-manuel-joueureuses.epub",
     "Bas-Gué — Manuel des joueureuses", "manuel-joueureuses"),
    ("manuel-meneur.html", "bas-gue-manuel-meneur.epub",
     "Bas-Gué — Manuel des meneureuses", "manuel-meneur"),
]

CSS = """
@page { margin: 2.2em 1.6em; }
body {
  font-family: "Georgia","Palatino",serif;
  line-height: 1.55;
  color: #1B2018;
  margin: 0 1em;
}
h1 { font-size: 1.7em; margin: 1.6em 0 .5em; border-bottom: 1px solid #999; padding-bottom: .3em; }
h1:first-of-type { margin-top: 0; }
h2 { font-size: 1.28em; margin: 1.6em 0 .5em; color: #3E6B4C; }
h3 { font-size: 1.08em; margin: 1.3em 0 .4em; }
h4 { font-size: 1em; margin: 1.1em 0 .3em; color: #4E574A; }
p { margin: 0 0 .8em; }
ul, ol { margin: 0 0 .9em; padding-left: 1.3em; }
li { margin: .25em 0; }
hr { border: 0; border-top: 1px solid #ccc; margin: 1.8em 0; }
table { border-collapse: collapse; width: 100%; margin: 0 0 1.2em; font-size: .92em; }
th, td { border-bottom: 1px solid #ccc; padding: .35em .5em; text-align: left; vertical-align: top; }
thead th { border-bottom: 2px solid #1B2018; font-weight: 600; }
blockquote, aside {
  margin: 1em 0; padding: .6em 1em;
  border-left: 3px solid #8E9C2A;
  background: #f2efe6;
}
blockquote p:last-child, aside p:last-child { margin-bottom: 0; }
a { color: #2E6C79; text-decoration: none; }
strong { font-weight: 700; }
em { font-style: italic; }
.mono, code { font-family: "Courier New", monospace; }
svg { max-width: 100%; height: auto; }
.ancre, .lampe, .barre, .sommaire, .haut, .saut-contenu { display: none !important; }
"""


def extraire_corps(chemin):
    """Isole le contenu de <main class="corps">…</main> et nettoie ce qui ne
    concerne que l'interface web (barre, sommaire, bouton remonter, etc.)."""
    html = io.open(chemin, encoding="utf-8").read()
    m = re.search(r'<main class="corps"[^>]*>(.*?)</main>', html, re.S)
    corps = m.group(1)
    corps = re.sub(r'<div class="fil-eau"[^>]*></div>', "", corps)
    corps = re.sub(r'<footer class="pied">.*?</footer>', "", corps, flags=re.S)
    # ancres de titre (le petit § cliquable) : on les retire, inutiles en epub
    corps = re.sub(r'<a class="ancre"[^>]*>§</a>', "", corps)
    # les liens vers l'autre manuel ne fonctionnent pas dans un epub séparé :
    # on les transforme en texte simple pour ne pas laisser de lien mort.
    # (avec ou sans ancre : "manuel-X.html" seul, ou "manuel-X.html#section")
    corps = re.sub(
        r'<a[^>]*\shref="manuel-(?:joueureuses|meneur)\.html(?:#[^"]*)?"[^>]*>(.*?)</a>',
        r"\1", corps)
    # un epub exige du XHTML strict : tout <svg> doit déclarer son espace de
    # noms, sans quoi le lecteur epub le rejette (les navigateurs, eux, le
    # devinent silencieusement — d'où l'absence de ce souci sur le site).
    corps = re.sub(r"<svg(?![^>]*xmlns=)", '<svg xmlns="http://www.w3.org/2000/svg"', corps)
    return corps.strip()


def construire(fichier_html, fichier_epub, titre, identifiant):
    corps = extraire_corps(fichier_html)

    livre = epub.EpubBook()
    livre.set_identifier("bas-gue-" + identifiant + "-" + str(uuid.uuid4())[:8])
    livre.set_title(titre)
    livre.set_language("fr")
    livre.add_author("Kwigorl")
    livre.add_metadata("DC", "rights",
        "CC BY-NC-SA 4.0 — libre à jouer, copier et modifier, jamais à vendre.")
    livre.add_metadata("DC", "description",
        "Bas-Gué, jeu de rôle : " + titre.split("—")[-1].strip() + ".")

    style = epub.EpubItem(uid="style", file_name="style/style.css",
                           media_type="text/css", content=CSS)
    livre.add_item(style)

    page_titre = epub.EpubHtml(title=titre, file_name="titre.xhtml", lang="fr")
    page_titre.content = (
        '<div style="text-align:center;margin-top:30%">'
        '<h1 style="border:0;font-size:2em">' + titre + '</h1>'
        '<p style="font-family:monospace;letter-spacing:.15em;'
        'text-transform:uppercase;color:#4E574A">jeu de r\u00f4le</p>'
        '<p style="margin-top:4em;font-size:.85em;color:#4E574A">'
        'Kwigorl \u2014 licence CC BY-NC-SA 4.0<br>'
        'basgue.github.io</p></div>'
    )
    page_titre.add_item(style)
    livre.add_item(page_titre)

    page_corps = epub.EpubHtml(title=titre, file_name="contenu.xhtml", lang="fr")
    page_corps.content = '<div>' + corps + '</div>'
    page_corps.add_item(style)
    if "<svg" in corps:
        page_corps.properties.append("svg")  # requis par l'OPF quand du SVG est intégré
    livre.add_item(page_corps)

    # une table des matières epub construite depuis les vrais titres h1/h2 du manuel
    titres = re.findall(r'<h([12]) id="([^"]+)"[^>]*>.*?<span[^>]*>(.*?)</span></h\1>', corps)

    def texte_seul(s):
        return re.sub(r"<[^>]+>", "", s).strip()

    entrees = []
    for niveau, ancre, libelle in titres:
        lib = texte_seul(libelle)
        if not lib:
            continue
        # l'id de navPoint doit être un nom XML valide : il ne peut pas
        # commencer par un chiffre (nos ancres, elles, le peuvent — "1-ton-espece").
        id_nav = ancre if not ancre[0].isdigit() else "t-" + ancre
        lien = epub.Link("contenu.xhtml#" + ancre, lib, id_nav)
        entrees.append((int(niveau), lien))

    toc = []
    courant_h1 = None
    enfants = []
    for niveau, lien in entrees:
        if niveau == 1:
            if courant_h1 is not None:
                toc.append((courant_h1, enfants) if enfants else courant_h1)
            courant_h1 = lien
            enfants = []
        else:
            enfants.append(lien)
    if courant_h1 is not None:
        toc.append((courant_h1, enfants) if enfants else courant_h1)

    livre.toc = tuple(toc)
    livre.add_item(epub.EpubNcx())
    livre.add_item(epub.EpubNav())

    livre.spine = ["nav", page_titre, page_corps]

    epub.write_epub(fichier_epub, livre)
    print("écrit", fichier_epub, "—", len(entrees), "entrées de table des matières")


if __name__ == "__main__":
    for html_src, epub_out, titre, ident in SOURCES:
        construire(html_src, epub_out, titre, ident)
