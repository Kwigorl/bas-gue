#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Convertit les manuels Obsidian de Bas-Gué en pages HTML statiques,
en conservant toutes les ancres et tous les liens internes."""

import re, unicodedata, json, html, os, io

SRC = {
    "joueureuses": ("manuel-joueureuses.md", "manuel-joueureuses.html",
                    "Manuel des joueureuses"),
    "meneur": ("manuel-meneur.md", "manuel-meneur.html",
               "Manuel des meneureuses"),
}

# fichiers cibles des wikilinks vers d'autres notes
NOTE_TARGETS = {
    "Bas-Gué — Manuel des joueureuses": "manuel-joueureuses.html",
    "Bas-Gué — Manuel du meneur": "manuel-meneur.html",
}
# notes qui n'existent pas encore : rendues en "à venir"
MISSING_NOTES = {
    "Bas-Gué - Scénario - La commande",
    "Bas-Gué - Pré-tirés",
    "Bas-Gué - Notes d'arbitrage",
}


def slug(text):
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace("—", " ").replace("·", " ").replace("’", "'")
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def esc(s):
    return html.escape(s, quote=False)


class Doc:
    def __init__(self, key, path, out, title):
        self.key, self.path, self.out, self.title = key, path, out, title
        self.raw = io.open(path, encoding="utf-8").read()
        self.raw = re.sub(r"^---\n.*?\n---\n", "", self.raw, flags=re.S)
        self.headings = []  # (level, text, slug)
        self.anchors = {}   # texte brut d'ancre -> slug
        self.glossaire_ordre = []  # rempli dans main(), une fois le glossaire extrait
        self.glossaire_vu = set()  # termes déjà marqués depuis le dernier chapitre (h1)


def verifier_pipes(doc):
    """Un wikilink dans un tableau doit échapper son | (\\|), sinon la cellule se coupe."""
    souci = []
    for num, ligne in enumerate(doc.raw.split("\n"), 1):
        if ligne.lstrip().startswith("|"):
            if re.search(r"\[\[[^\]\\|]+\|", ligne):
                souci.append((num, ligne.strip()[:70]))
    for num, txt in souci:
        print("  ATTENTION %s ligne %d : wikilink à pipe non échappé — %s"
              % (doc.path, num, txt))
    return souci


def collect_headings(doc):
    for line in doc.raw.split("\n"):
        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            lvl = len(m.group(1))
            txt = m.group(2).strip()
            s = slug(txt)
            doc.headings.append((lvl, txt, s))
            doc.anchors[txt] = s
            doc.anchors[txt.lower()] = s


def extraire_glossaire(doc):
    """Isole les tables « Les mots du jeu » et « Les mots du monde » du chapitre II
    et les transforme en un dictionnaire terme -> définition, pour les infobulles."""
    t = doc.raw
    debut = t.find("## Les mots du jeu")
    fin = t.find("## Ne pas confondre")
    assert debut != -1 and fin != -1, "chapitre Vocabulaire introuvable"
    bloc = t[debut:fin]

    def cells(ligne):
        s = ligne.strip()
        if s.startswith("|"):
            s = s[1:]
        if s.endswith("|"):
            s = s[:-1]
        return [p.strip() for p in re.split(r"(?<!\\)\|", s)]

    glossaire = {}
    for ligne in bloc.split("\n"):
        s = ligne.strip()
        if not s.startswith("|") or re.match(r"^\|[\s:-]+\|", s):
            continue
        parts = cells(s)
        if len(parts) != 2 or parts[0] in ("Terme", ""):
            continue
        terme_brut, def_brut = parts
        terme_brut = re.sub(r"^\*\*|\*\*$", "", terme_brut.strip())
        if not terme_brut or terme_brut == "Terme":
            continue
        def_html = inline(def_brut, doc)
        # les liens internes d'une définition doivent rester valides même
        # affichés depuis l'autre manuel : on les rend absolus.
        def_html = def_html.replace('href="#', 'href="manuel-joueureuses.html#')
        for sous_terme in [x.strip() for x in terme_brut.split(" · ")]:
            if sous_terme:
                glossaire[sous_terme] = def_html
    return glossaire


# noms propres : le lecteur les comprend dès la première page, inutile de les
# redéfinir à chaque chapitre.
EXCLUS_PREMIERE_OCCURRENCE = {"Bas-Gué", "Vasque"}

MOTIF_PROTEGE = re.compile(
    r"\*\*.+?\*\*|\*[^*\n]+?\*|\[\[.+?\]\]|\x00TERME:[^\x00]+\x00[^\x00]*\x00/TERME\x00")


def marquer_premiere_occurrence(texte, doc):
    """Marque, au plus une fois par grand chapitre (titre de niveau 1), la
    première occurrence en toutes lettres — capitalisée, hors gras, hors
    wikilink — d'un terme du glossaire dans du texte courant. `doc.glossaire_vu`
    est remis à zéro à chaque nouveau chapitre (voir render_block_lines)."""
    if not doc.glossaire_ordre:
        return texte
    for terme in doc.glossaire_ordre:
        if terme in doc.glossaire_vu:
            continue
        segments, dernier = [], 0
        for m in MOTIF_PROTEGE.finditer(texte):
            segments.append((dernier, m.start()))
            dernier = m.end()
        segments.append((dernier, len(texte)))

        base = re.sub(r"^(L['’])", "", terme).split(" · ")[0]
        motif = re.compile(r"(?<![\wÀ-ÿ])" + re.escape(base) + r"s?(?![\wÀ-ÿ])")
        trouve = None
        for (a, b) in segments:
            cand = motif.search(texte, a, b)
            if cand:
                trouve = cand
                break
        if not trouve:
            continue
        doc.glossaire_vu.add(terme)
        mot = texte[trouve.start():trouve.end()]
        texte = (texte[:trouve.start()]
                 + "\x00TERME:%s\x00%s\x00/TERME\x00" % (terme, mot)
                 + texte[trouve.end():])
    return texte


DOCS = {}


def resolve_anchor(target, doc):
    """target = '#Titre' ou 'Note#Titre' ou 'Note'."""
    if target.startswith("#"):
        a = target[1:].strip()
        s = doc.anchors.get(a) or doc.anchors.get(a.lower()) or slug(a)
        return "#" + s
    if "#" in target:
        note, a = target.split("#", 1)
        note = note.strip()
        d = None
        for k, dd in DOCS.items():
            if dd.title == note or note in NOTE_TARGETS and NOTE_TARGETS[note] == dd.out:
                d = dd
        f = NOTE_TARGETS.get(note)
        if f:
            s = (d.anchors.get(a) if d else None) or slug(a)
            return f + "#" + s
        return None
    return NOTE_TARGETS.get(target.strip())


def inline(text, doc):
    # wikilinks : [[cible|libellé]] / [[cible]]
    def wl(m):
        body = m.group(1)
        if "|" in body:
            target, label = body.split("|", 1)
        else:
            target, label = body, body.lstrip("#")
        target, label = target.strip(), label.strip()
        href = resolve_anchor(target, doc)
        lab = esc(label)
        if href is None:
            base = target.split("#")[0].strip()
            if base in MISSING_NOTES:
                return ('<span class="lien-futur" title="Document à venir">%s</span>' % lab)
            return lab
        return '<a class="lien-interne" href="%s">%s</a>' % (href, lab)

    text = re.sub(r"!\[\[([^\]]+)\]\]", lambda m: "\x00IMG:%s\x00" % m.group(1), text)
    text = esc(text)
    text = re.sub(r"\[\[([^\]]+)\]\]", wl, text)
    text = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<![\w*])\*([^*\n]+?)\*(?![\w*])", r"<em>\1</em>", text)
    # reste des astérisques d'emphase « en alternance » (italique, mot romain, italique)
    if text.count("*") and text.count("*") % 2 == 0:
        morceaux, ouvert = [], True
        for ch in text:
            if ch == "*":
                morceaux.append("<em>" if ouvert else "</em>")
                ouvert = not ouvert
            else:
                morceaux.append(ch)
        text = "".join(morceaux)
    # première occurrence marquée par marquer_premiere_occurrence(), convertie
    # en un vrai déclencheur d'infobulle — le même système que celui posé à
    # l'exécution sur le gras (assets/glossaire.js reconnaît [data-terme]).
    text = re.sub(
        r"\x00TERME:([^\x00]+)\x00([^\x00]*)\x00/TERME\x00",
        lambda m: '<span class="terme" data-terme="%s">%s</span>' % (m.group(1), m.group(2)),
        text)
    text = text.replace("\\|", "|")
    return text


def render_table(rows, doc):
    head, body = rows[0], rows[2:]
    def cells(line):
        line = line.strip()
        if line.startswith("|"):
            line = line[1:]
        if line.endswith("|"):
            line = line[:-1]
        parts = re.split(r"(?<!\\)\|", line)
        return [p.strip() for p in parts]
    out = ['<div class="table-enveloppe"><table>']
    hc = cells(head)
    if any(c for c in hc):
        out.append("<thead><tr>" + "".join(
            "<th>%s</th>" % inline(c, doc) for c in hc) + "</tr></thead>")
    out.append("<tbody>")
    for r in body:
        cs = cells(r)
        out.append("<tr>" + "".join("<td>%s</td>" % inline(c, doc) for c in cs) + "</tr>")
    out.append("</tbody></table></div>")
    return "\n".join(out)


CALLOUT_LABEL = {"abstract": "Sommaire", "tip": "À côté", "note": "Note",
                 "warning": "Attention", "info": "Info"}


def render_block_lines(lines, doc):
    """Rend un ensemble de lignes markdown (utilisé aussi dans les callouts)."""
    out = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        s = line.strip()
        if not s:
            i += 1
            continue
        m = re.match(r"^(#{1,4})\s+(.*)$", s)
        if m:
            lvl, txt = len(m.group(1)), m.group(2).strip()
            if lvl == 1:
                doc.glossaire_vu = set()  # nouveau chapitre : on peut redéfinir
            sl = doc.anchors.get(txt, slug(txt))
            mn = re.match(r"^([IVXLC]+|\d+)\.\s+(.*)$", txt)
            if mn and lvl <= 2:
                interieur = ('<span class="chiffre">%s</span> <span class="intitule">%s</span>'
                             % (esc(mn.group(1)), inline(mn.group(2), doc)))
                cls = " titre-chiffre"
            else:
                interieur = '<span class="intitule">%s</span>' % inline(txt, doc)
                cls = ""
            out.append(
                '<h%d id="%s" class="titre-n%d%s">'
                '<a class="ancre" href="#%s" aria-label="Lien vers cette section">§</a>'
                '%s</h%d>' % (lvl, sl, lvl, cls, sl, interieur, lvl))
            i += 1
            continue
        if re.match(r"^-{3,}$", s):
            out.append('<hr class="separateur">')
            i += 1
            continue
        # une image seule sur sa ligne : bloc à part entière, jamais dans un <p>
        # (un <figure><svg> imbriqué dans un <p> est un HTML invalide, que les
        # navigateurs tolèrent silencieusement mais qu'un lecteur epub refuse)
        mi = re.match(r"^!\[\[([^\]]+)\]\]$", s)
        if mi:
            out.append("\x00IMG:%s\x00" % mi.group(1))
            i += 1
            continue
        # callout
        mc = re.match(r"^>\s*\[!(\w+)\]([+-]?)\s*(.*)$", s)
        if mc:
            kind, _, titre = mc.group(1).lower(), mc.group(2), mc.group(3).strip()
            i += 1
            inner = []
            while i < n and lines[i].strip().startswith(">"):
                inner.append(re.sub(r"^\s*>\s?", "", lines[i]))
                i += 1
            body = render_block_lines(inner, doc)
            lab = titre or CALLOUT_LABEL.get(kind, "")
            out.append('<aside class="encart encart-%s">%s%s</aside>' % (
                kind, '<p class="encart-titre">%s</p>' % inline(lab, doc) if lab else "", body))
            continue
        # citation
        if s.startswith(">"):
            inner = []
            while i < n and lines[i].strip().startswith(">"):
                inner.append(re.sub(r"^\s*>\s?", "", lines[i]))
                i += 1
            body = render_block_lines(inner, doc)
            out.append('<blockquote class="note">%s</blockquote>' % body)
            continue
        # tableau
        if s.startswith("|"):
            rows = []
            while i < n and lines[i].strip().startswith("|"):
                rows.append(lines[i])
                i += 1
            if len(rows) >= 2:
                out.append(render_table(rows, doc))
            continue
        # listes
        if re.match(r"^[-*]\s+", s):
            items = []
            while i < n and re.match(r"^\s*[-*]\s+", lines[i]):
                items.append(re.sub(r"^\s*[-*]\s+", "", lines[i]).strip())
                i += 1
            out.append("<ul>" + "".join(
                "<li>%s</li>" % inline(marquer_premiere_occurrence(x, doc), doc) for x in items) + "</ul>")
            continue
        if re.match(r"^\d+\.\s+", s):
            items = []
            while i < n and re.match(r"^\s*\d+\.\s+", lines[i]):
                items.append(re.sub(r"^\s*\d+\.\s+", "", lines[i]).strip())
                i += 1
            out.append("<ol>" + "".join(
                "<li>%s</li>" % inline(marquer_premiere_occurrence(x, doc), doc) for x in items) + "</ol>")
            continue
        # paragraphe (les sauts de ligne simples sont significatifs dans ces manuels)
        para = []
        while i < n and lines[i].strip() and not re.match(
                r"^\s*(#{1,4}\s|>|\||-{3,}$|[-*]\s|\d+\.\s)", lines[i]):
            para.append(lines[i].strip())
            i += 1
        txt = "<br>\n".join(inline(marquer_premiere_occurrence(p, doc), doc) for p in para)
        out.append("<p>%s</p>" % txt)
    return "\n".join(out)


IMAGES = {"Carte": "carte.svg", "Zones": "zones.svg"}


def image_placeholder(name, doc):
    for cle, fichier in IMAGES.items():
        if cle.lower() in name.lower():
            return io.open(fichier, encoding="utf-8").read()
    return ""


def build_body(doc):
    body = render_block_lines(doc.raw.split("\n"), doc)
    body = re.sub(r"\x00IMG:([^\x00]+)\x00",
                  lambda m: image_placeholder(m.group(1), doc), body)
    return body


def toc_html(doc):
    items = []
    for lvl, txt, sl in doc.headings:
        if lvl == 1 and sl.startswith("bas-gue"):
            continue
        if lvl > 3:
            continue
        label = re.sub(r"\*\*|\*", "", txt)
        items.append('<a class="toc-n%d" href="#%s" data-cible="%s">%s</a>'
                     % (lvl, sl, sl, esc(label)))
    return "\n".join(items)


def page(doc, tpl):
    return (tpl
            .replace("{{TITRE}}", esc(doc.title))
            .replace("{{TOC}}", toc_html(doc))
            .replace("{{CORPS}}", build_body(doc))
            .replace("{{NAV_ACTIVE_" + doc.key.upper() + "}}", ' aria-current="page"')
            )


def main():
    tpl = io.open("gabarit-manuel.html", encoding="utf-8").read()
    for key, (path, out, title) in SRC.items():
        DOCS[key] = Doc(key, path, out, title)
    for d in DOCS.values():
        verifier_pipes(d)
        collect_headings(d)

    glossaire = extraire_glossaire(DOCS["joueureuses"])
    io.open("assets/glossaire-data.js", "w", encoding="utf-8").write(
        "// Généré automatiquement par build.py depuis le chapitre II "
        "(Vocabulaire) du manuel des joueureuses. Ne pas éditer à la main.\n"
        "window.BG_GLOSSAIRE = " + json.dumps(glossaire, ensure_ascii=False, indent=1) + ";\n")
    print("écrit assets/glossaire-data.js,", len(glossaire), "termes")

    # première occurrence non grasse par chapitre : voir marquer_premiere_occurrence.
    # Bas-Gué et Vasque en sont exclus — des noms propres qu'on ne redéfinit pas
    # à chaque chapitre.
    ordre = [t for t in glossaire if t not in EXCLUS_PREMIERE_OCCURRENCE]
    for d in DOCS.values():
        d.glossaire_ordre = ordre

    for d in DOCS.values():
        h = page(d, tpl)
        h = re.sub(r"\{\{NAV_ACTIVE_\w+\}\}", "", h)
        io.open(d.out, "w", encoding="utf-8").write(h)
        print("écrit", d.out, len(h), "octets,", len(d.headings), "titres")
    # index des ancres, utile pour vérifier
    idx = {k: {t: s for _, t, s in d.headings} for k, d in DOCS.items()}
    io.open("assets/ancres.json", "w", encoding="utf-8").write(
        json.dumps(idx, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
