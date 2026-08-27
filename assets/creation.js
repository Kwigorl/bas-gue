/* Bas-Gué — atelier de création. Tout tient dans un objet `perso`. */
(function () {
  'use strict';
  var D = window.BG;
  var CLE = 'basgue-personnage';
  var JETONS = [3, 3, 2, 2, 1];

  var perso = vide();

  function vide() {
    return {
      espece: '', morphologie: '', gabarit: '', sens: '', position: '',
      stats: { poigne: null, patte: null, nez: null, seve: null, verbe: null },
      greffes: [greffeVide(), greffeVide(), greffeVide()],
      arme: '', outil: '', nom: '', surnom: '', phrase: ''
    };
  }
  function greffeVide() { return { famille: '', greffe: null, variante: null }; }

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function par(liste, id) {
    for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i];
    return null;
  }

  /* ---------- listes d'options ---------- */
  function poserOptions(conteneur, liste, champ, gabarit) {
    conteneur.innerHTML = '';
    liste.forEach(function (o) {
      var lab = el('label', 'option');
      var inp = document.createElement('input');
      inp.type = 'radio'; inp.name = champ; inp.value = o.id;
      inp.checked = perso[champ] === o.id;
      inp.addEventListener('change', function () {
        perso[champ] = o.id;
        rafraichir();
      });
      lab.appendChild(inp);
      lab.appendChild(el('span', 'option-nom', o.nom));
      gabarit(lab, o);
      conteneur.appendChild(lab);
    });
  }

  function gabaritFaceOmbre(lab, o) {
    if (o.detail) lab.appendChild(el('span', 'option-detail', o.detail));
    if (o.face) lab.appendChild(el('span', 'option-face', o.face));
    if (o.ombre) lab.appendChild(el('span', 'option-ombre', o.ombre));
  }
  function gabaritPosition(lab, o) {
    lab.appendChild(el('span', 'option-detail', o.especes));
    lab.appendChild(el('span', 'option-face', o.acces));
    lab.appendChild(el('span', 'option-ombre', o.fermeture + ' — ' + o.obligation));
  }
  function gabaritArme(lab, o) {
    lab.appendChild(el('span', 'option-detail', o.detail + ' · ' + o.dgts));
    lab.appendChild(el('span', 'option-face', o.permet));
    if (o.prend && o.prend !== '—') lab.appendChild(el('span', 'option-ombre', o.prend));
  }
  function gabaritOutil(lab, o) {
    lab.appendChild(el('span', 'option-face', o.permet));
    lab.appendChild(el('span', 'option-ombre', o.prend));
  }

  /* ---------- statistiques ---------- */
  function poses() {
    return D.STATS.map(function (s) { return perso.stats[s.id]; })
      .filter(function (v) { return v != null; });
  }
  function restants(saufStat) {
    var reste = JETONS.slice();
    D.STATS.forEach(function (s) {
      if (s.id === saufStat) return;
      var v = perso.stats[s.id];
      if (v == null) return;
      var i = reste.indexOf(v);
      if (i > -1) reste.splice(i, 1);
    });
    return reste;
  }

  function dessinerStats() {
    var boite = $('stats');
    boite.innerHTML = '';
    D.STATS.forEach(function (s) {
      var ligne = el('div', 'stat-choix');
      var g = el('div');
      var nom = el('span', 'stat-nom', s.nom);
      g.appendChild(nom);
      g.appendChild(el('small', 'stat-dom', s.domaine));
      ligne.appendChild(g);

      var sel = document.createElement('select');
      sel.setAttribute('aria-label', s.nom);
      var dispo = restants(s.id);
      var valeurs = [];
      dispo.forEach(function (v) { if (valeurs.indexOf(v) === -1) valeurs.push(v); });
      valeurs.sort(function (a, b) { return b - a; });
      var o0 = document.createElement('option');
      o0.value = ''; o0.textContent = '–';
      sel.appendChild(o0);
      valeurs.forEach(function (v) {
        var o = document.createElement('option');
        o.value = String(v); o.textContent = String(v);
        sel.appendChild(o);
      });
      if (perso.stats[s.id] != null) {
        var cur = document.createElement('option');
        cur.value = String(perso.stats[s.id]); cur.textContent = String(perso.stats[s.id]);
        if (valeurs.indexOf(perso.stats[s.id]) === -1) sel.appendChild(cur);
        sel.value = String(perso.stats[s.id]);
      }
      sel.addEventListener('change', function () {
        perso.stats[s.id] = sel.value === '' ? null : parseInt(sel.value, 10);
        rafraichir();
      });
      ligne.appendChild(sel);
      boite.appendChild(ligne);
    });

    var liste = $('jetons-liste');
    liste.innerHTML = '';
    var reste = restants(null);
    if (!reste.length) {
      liste.appendChild(el('span', 'jetons-fini', 'tout est placé'));
    } else {
      reste.forEach(function (v) { liste.appendChild(el('span', 'jeton', String(v))); });
    }
  }

  function derivees() {
    var m = par(D.MORPHOLOGIES, perso.morphologie);
    var g = par(D.GABARITS, perso.gabarit);
    var st = perso.stats;
    var pv = st.poigne == null ? null :
      Math.max(1, 8 + st.poigne * 2 + (m ? m.pv : 0) + (g ? g.pv : 0));
    var def = st.patte == null ? null : 10 + st.patte + (m ? m.def : 0);
    var rec = st.seve == null ? null : st.seve + 2;
    return { pv: pv, def: def, rec: rec, m: m, g: g };
  }

  function dessinerDerivees() {
    var d = derivees(), boite = $('derivees');
    boite.innerHTML = '';
    function bloc(val, nom, calcul) {
      var n = el('div', 'derivee');
      n.appendChild(el('b', null, val == null ? '—' : String(val)));
      n.appendChild(el('span', null, nom));
      n.appendChild(el('em', null, calcul));
      boite.appendChild(n);
    }
    var mods = [];
    if (d.m && d.m.pv) mods.push(d.m.nom + ' ' + (d.m.pv > 0 ? '+' : '') + d.m.pv);
    if (d.g && d.g.pv) mods.push(d.g.nom + ' +' + d.g.pv);
    bloc(d.pv, 'Points de vie', '8 + Poigne×2' + (mods.length ? ' · ' + mods.join(' · ') : ''));
    bloc(d.def, 'Défense', '10 + Patte' + (d.m && d.m.def ? ' · ' + d.m.nom + ' +' + d.m.def : ''));
    bloc(d.rec, 'Récupération', 'Sève + 2 par nuit');
  }

  function rangFamille(f) {
    var a = perso.stats[f.stats[0]], b = perso.stats[f.stats[1]];
    if (a == null || b == null) return null;
    return Math.min(a, b);
  }

  function dessinerRangs() {
    var grille = $('rangs-grille');
    grille.innerHTML = '';
    D.FAMILLES.forEach(function (f) {
      var r = rangFamille(f);
      var c = el('div', 'rang-case rang-' + (r == null ? '0' : r));
      var g = el('div');
      g.appendChild(el('span', null, f.nom));
      g.appendChild(document.createElement('br'));
      g.appendChild(el('small', null, nomStat(f.stats[0]) + ' + ' + nomStat(f.stats[1])));
      c.appendChild(g);
      c.appendChild(el('b', null, r == null ? '—' : String(r)));
      c.title = r === 1 ? 'Rang 1 : la greffe ne vaut rien ici.' : '';
      grille.appendChild(c);
    });
  }
  function nomStat(id) { return par(D.STATS, id).nom; }

  /* ---------- greffes ---------- */
  function dessinerGreffes() {
    var boite = $('greffes');
    boite.innerHTML = '';
    perso.greffes.forEach(function (g, i) {
      var bloc = el('div', 'greffe-bloc');
      var entete = el('div', 'greffe-entete');
      entete.appendChild(el('span', 'greffe-index', 'Greffe ' + (i + 1)));

      var sel = document.createElement('select');
      sel.setAttribute('aria-label', 'Famille de la greffe ' + (i + 1));
      var o0 = document.createElement('option');
      o0.value = ''; o0.textContent = 'Choisir une famille…';
      sel.appendChild(o0);
      D.FAMILLES.forEach(function (f) {
        var r = rangFamille(f);
        var o = document.createElement('option');
        o.value = f.id;
        o.textContent = f.nom + ' (' + nomStat(f.stats[0]) + ' + ' + nomStat(f.stats[1]) + ')'
          + (r == null ? '' : ' — rang ' + r);
        sel.appendChild(o);
      });
      sel.value = g.famille;
      sel.addEventListener('change', function () {
        g.famille = sel.value; g.greffe = null; g.variante = null;
        rafraichir();
      });
      entete.appendChild(sel);

      var fam = par(D.FAMILLES, g.famille);
      if (fam) {
        var r = rangFamille(fam);
        var pastille = el('span', 'greffe-rang' + (r != null && r >= 2 ? ' fort' : ''),
          r == null ? 'rang à venir' : 'rang ' + r + ' · jet +' + (r + 2));
        entete.appendChild(pastille);
      }
      bloc.appendChild(entete);

      if (fam) {
        bloc.appendChild(el('p', 'etape-note', fam.devise));
        var choix = el('div', 'greffe-choix');
        fam.greffes.forEach(function (gr, k) {
          var ailleurs = perso.greffes.some(function (autre, j) {
            return j !== i && autre.famille === g.famille && autre.greffe === k;
          });
          var lab = el('label', 'option' + (ailleurs ? ' option-prise' : ''));
          var inp = document.createElement('input');
          inp.type = 'radio'; inp.name = 'greffe-' + i; inp.value = String(k);
          inp.checked = g.greffe === k;
          inp.disabled = ailleurs;
          inp.addEventListener('change', function () { g.greffe = k; g.variante = null; rafraichir(); });
          lab.appendChild(inp);
          lab.appendChild(el('span', 'option-nom', gr.nom));
          if (ailleurs) {
            lab.appendChild(el('span', 'option-detail', 'déjà prise — une greffe ne se porte qu\'une fois'));
            lab.title = 'Tu portes déjà cette greffe. Deux greffes d\'une même famille, oui ; deux fois la même, non.';
          }
          var f1 = el('span', 'greffe-usage');
          f1.appendChild(el('b', null, 'Au fer '));
          f1.appendChild(document.createTextNode(gr.fer));
          var f2 = el('span', 'greffe-usage calme');
          f2.appendChild(el('b', null, 'Au calme '));
          f2.appendChild(document.createTextNode(gr.calme));
          lab.appendChild(f1); lab.appendChild(f2);
          choix.appendChild(lab);
        });
        bloc.appendChild(choix);

        if (g.greffe != null) {
          var vs = el('div', 'variantes');
          fam.greffes[g.greffe].variantes.forEach(function (v, k) {
            var lab = el('label', 'option variante');
            var inp = document.createElement('input');
            inp.type = 'radio'; inp.name = 'variante-' + i; inp.value = String(k);
            inp.checked = g.variante === k;
            inp.addEventListener('change', function () { g.variante = k; rafraichir(); });
            lab.appendChild(inp);
            lab.appendChild(el('span', 'option-nom', v.nom));
            lab.appendChild(el('span', 'option-face', v.texte));
            vs.appendChild(lab);
          });
          bloc.appendChild(vs);
        }
      }
      boite.appendChild(bloc);
    });

    var choisies = perso.greffes.filter(function (g) { return g.famille && g.greffe != null; });
    var rangs = choisies.map(function (g) { return rangFamille(par(D.FAMILLES, g.famille)); });
    if (choisies.length === 3 && rangs.every(function (r) { return r != null && r < 2; })) {
      boite.appendChild(el('p', 'alerte',
        'Au moins une de tes trois greffes doit être de rang 2 ou plus. Là, elles sont toutes de rang 1 : elles ne vaudraient rien.'));
    }
    var vues = {}, doublon = null;
    choisies.forEach(function (g) {
      var cle = g.famille + ':' + g.greffe;
      if (vues[cle]) doublon = par(D.FAMILLES, g.famille).greffes[g.greffe].nom;
      vues[cle] = true;
    });
    if (doublon) {
      boite.appendChild(el('p', 'alerte',
        'Tu portes deux fois ' + doublon + '. Une greffe ne se prend qu\'une fois : elle ne refleurirait pas deux fois dans la scène. Deux greffes différentes d\'une même famille, en revanche, sont un choix parfaitement valide.'));
    }
    if (rangs.some(function (r) { return r === 1; })) {
      boite.appendChild(el('p', 'alerte',
        'Une greffe de rang 1 n’est pas interdite — elle ne vaut simplement rien. Vérifie que c’est un choix.'));
    }
  }

  /* ---------- la fiche ---------- */
  function texteGreffe(g) {
    var fam = par(D.FAMILLES, g.famille);
    if (!fam || g.greffe == null) return null;
    var gr = fam.greffes[g.greffe];
    var r = rangFamille(fam);
    return {
      nom: gr.nom, famille: fam.nom, rang: r,
      variante: g.variante != null ? gr.variantes[g.variante] : null
    };
  }

  function manques() {
    var m = [];
    if (!perso.nom) m.push('un nom');
    if (!perso.espece) m.push('une espèce');
    if (!perso.morphologie) m.push('une morphologie');
    if (!perso.gabarit) m.push('un gabarit');
    if (!perso.sens) m.push('un sens');
    if (!perso.position) m.push('une position');
    if (restants(null).length) m.push('la répartition 3/3/2/2/1');
    var pretes = perso.greffes.filter(function (g) {
      return g.famille && g.greffe != null && g.variante != null;
    });
    if (pretes.length < 3) m.push('trois greffes avec leur variante');
    var cles = {}, deuxfois = false;
    pretes.forEach(function (g) {
      var cle = g.famille + ':' + g.greffe;
      if (cles[cle]) deuxfois = true;
      cles[cle] = true;
    });
    if (deuxfois) m.push('trois greffes différentes');
    else {
      var ok = perso.greffes.some(function (g) {
        var f = par(D.FAMILLES, g.famille);
        return f && rangFamille(f) >= 2;
      });
      if (!ok) m.push('au moins une greffe de rang 2');
    }
    if (!perso.arme) m.push('une arme');
    if (!perso.outil) m.push('un outil vivant');
    if (!perso.phrase) m.push('pourquoi tu es sur la Gousse');
    return m;
  }

  function dessinerFiche() {
    var f = $('fiche');
    f.innerHTML = '';
    var d = derivees();

    f.appendChild(el('p', 'fiche-titre', perso.nom || 'Sans nom'));
    if (perso.surnom) f.appendChild(el('p', 'fiche-surnom', 'dit·e ' + perso.surnom));
    var ligne = [perso.espece, d.m ? d.m.nom : '', d.g ? d.g.nom : ''].filter(Boolean).join(' · ');
    f.appendChild(el('p', 'fiche-espece', ligne || 'espèce, corps, gabarit'));

    var ch = el('div', 'fiche-chiffres');
    D.STATS.forEach(function (s) {
      var c = el('div');
      c.appendChild(el('b', null, perso.stats[s.id] == null ? '–' : String(perso.stats[s.id])));
      c.appendChild(el('span', null, s.nom));
      ch.appendChild(c);
    });
    f.appendChild(ch);

    var dv = el('div', 'fiche-derivees');
    [[d.pv, 'Points de vie'], [d.def, 'Défense'], [d.rec, 'Récup./nuit']].forEach(function (p) {
      var c = el('div');
      c.appendChild(el('b', null, p[0] == null ? '–' : String(p[0])));
      c.appendChild(el('span', null, p[1]));
      dv.appendChild(c);
    });
    f.appendChild(dv);

    function section(titre, remplir) {
      var s = el('div', 'fiche-section');
      s.appendChild(el('h3', null, titre));
      remplir(s);
      f.appendChild(s);
    }

    var sens = par(D.SENS, perso.sens);
    if (sens) section('Sens dominant', function (s) {
      s.appendChild(el('p', null, sens.nom));
      s.appendChild(el('p', 'petit', sens.face));
      s.appendChild(el('p', 'petit', sens.ombre));
    });

    if (d.m) section('Corps', function (s) {
      s.appendChild(el('p', null, d.m.nom + (d.g ? ' · ' + d.g.nom : '')));
      s.appendChild(el('p', 'petit', d.m.face));
      s.appendChild(el('p', 'petit', d.m.ombre));
      if (d.g && d.g.ombre) s.appendChild(el('p', 'petit', d.g.face + ' ' + d.g.ombre));
    });

    var pos = par(D.POSITIONS, perso.position);
    if (pos) section('Position', function (s) {
      s.appendChild(el('p', null, pos.nom));
      s.appendChild(el('p', 'petit', 'Accès — ' + pos.acces));
      s.appendChild(el('p', 'petit', 'En amont — ' + pos.amont));
      s.appendChild(el('p', 'petit', 'Fermeture — ' + pos.fermeture));
      s.appendChild(el('p', 'petit', 'Obligation — ' + pos.obligation));
    });

    var gs = perso.greffes.map(texteGreffe).filter(Boolean);
    if (gs.length) section('Greffes', function (s) {
      gs.forEach(function (g) {
        var b = el('div', 'fiche-greffe');
        var t = el('p');
        t.appendChild(el('b', null, g.nom));
        t.appendChild(document.createTextNode(' '));
        t.appendChild(el('span', 'jet', g.rang == null ? '' : 'rang ' + g.rang + ' · jet +' + (g.rang + 2)));
        b.appendChild(t);
        b.appendChild(el('span', 'petit', g.famille + (g.variante ? ' · variante ' + g.variante.nom : '')));
        if (g.variante) b.appendChild(el('span', 'petit', g.variante.texte));
        s.appendChild(b);
      });
    });

    var arme = par(D.ARMES, perso.arme), outil = par(D.OUTILS, perso.outil);
    if (arme || outil) section('Ce que tu portes', function (s) {
      if (arme) s.appendChild(el('p', null, 'Arme ' + arme.nom.toLowerCase() + ' — ' + arme.dgts + ' · ' + arme.detail));
      if (outil) {
        s.appendChild(el('p', null, outil.nom));
        s.appendChild(el('p', 'petit', outil.prend));
      }
      s.appendChild(el('p', 'petit', 'Et ce que l’accès de la Position couvre.'));
    });

    section('Inclinaison', function (s) {
      s.appendChild(el('p', null, '0 — au Gué'));
      s.appendChild(el('p', 'petit', 'Passeur : une fois par séance, un refus devient un oui, à une condition.'));
    });

    section('Traits · marques · dettes', function (s) {
      s.appendChild(el('p', 'petit', 'Rien encore. Ça s’attrape en jouant.'));
    });

    if (perso.phrase) section('Pourquoi tu es sur la Gousse', function (s) {
      s.appendChild(el('p', 'fiche-phrase', '« ' + perso.phrase + ' »'));
    });

    var m = manques();
    if (m.length) {
      var mm = el('div', 'fiche-manque');
      mm.appendChild(el('b', null, 'Il manque encore'));
      mm.appendChild(document.createTextNode(m.join(', ') + '.'));
      f.appendChild(mm);
    }
  }

  function dessinerJalons() {
    var faits = {
      1: !!perso.espece, 2: !!(perso.morphologie && perso.gabarit), 3: !!perso.sens,
      4: !!perso.position, 5: restants(null).length === 0,
      6: perso.greffes.every(function (g) { return g.famille && g.greffe != null && g.variante != null; }),
      7: !!(perso.arme && perso.outil), 8: true, 9: true,
      10: !!(perso.nom && perso.phrase)
    };
    var ol = $('jalons');
    ol.innerHTML = '';
    for (var i = 1; i <= 10; i++) {
      var li = el('li');
      var a = el('a', faits[i] ? 'fait' : '', String(i));
      a.href = '#etape-' + i;
      a.title = 'Étape ' + i;
      li.appendChild(a);
      ol.appendChild(li);
    }
  }

  /* ---------- persistance ---------- */
  var etatMinuterie;
  function etat(msg) {
    var n = $('fiche-etat');
    n.textContent = msg;
    clearTimeout(etatMinuterie);
    etatMinuterie = setTimeout(function () { n.textContent = ''; }, 3000);
  }
  function enregistrer() {
    try { localStorage.setItem(CLE, JSON.stringify(perso)); } catch (e) {}
  }
  function charger() {
    try {
      var b = localStorage.getItem(CLE);
      if (b) fusionner(JSON.parse(b));
    } catch (e) {}
  }
  function fusionner(o) {
    if (!o || typeof o !== 'object') return;
    var n = vide();
    ['espece', 'morphologie', 'gabarit', 'sens', 'position', 'arme', 'outil', 'nom', 'surnom', 'phrase']
      .forEach(function (k) { if (typeof o[k] === 'string') n[k] = o[k]; });
    if (o.stats) D.STATS.forEach(function (s) {
      var v = o.stats[s.id];
      if (v === 1 || v === 2 || v === 3) n.stats[s.id] = v;
    });
    if (Array.isArray(o.greffes)) o.greffes.slice(0, 3).forEach(function (g, i) {
      if (!g) return;
      n.greffes[i] = {
        famille: typeof g.famille === 'string' ? g.famille : '',
        greffe: (g.greffe === 0 || g.greffe === 1) ? g.greffe : null,
        variante: (g.variante === 0 || g.variante === 1) ? g.variante : null
      };
    });
    perso = n;
  }

  /* ---------- rafraîchissement général ---------- */
  var premier = true;
  function rafraichir() {
    if (premier) {
      poserOptions($('opt-morphologie'), D.MORPHOLOGIES, 'morphologie', gabaritFaceOmbre);
      poserOptions($('opt-gabarit'), D.GABARITS, 'gabarit', gabaritFaceOmbre);
      poserOptions($('opt-sens'), D.SENS, 'sens', gabaritFaceOmbre);
      poserOptions($('opt-position'), D.POSITIONS, 'position', gabaritPosition);
      poserOptions($('opt-arme'), D.ARMES, 'arme', gabaritArme);
      poserOptions($('opt-outil'), D.OUTILS, 'outil', gabaritOutil);
      premier = false;
    }
    dessinerStats();
    dessinerDerivees();
    dessinerRangs();
    dessinerGreffes();
    dessinerFiche();
    dessinerJalons();
    enregistrer();
  }

  /* ---------- branchements ---------- */
  function champTexte(id, cle) {
    var n = $(id);
    n.value = perso[cle] || '';
    n.addEventListener('input', function () {
      perso[cle] = n.value;
      dessinerFiche(); dessinerJalons(); enregistrer();
    });
  }

  function demarrer() {
    charger();
    rafraichir();
    champTexte('espece', 'espece');
    champTexte('nom', 'nom');
    champTexte('surnom', 'surnom');
    champTexte('phrase', 'phrase');

    var am = $('amorces');
    D.AMORCES.forEach(function (t) {
      var b = el('button', 'amorce', '« ' + t + ' »');
      b.type = 'button';
      b.addEventListener('click', function () {
        $('phrase').value = t;
        perso.phrase = t;
        dessinerFiche(); dessinerJalons(); enregistrer();
      });
      am.appendChild(b);
    });

    $('stats-hasard').addEventListener('click', function () {
      var j = JETONS.slice();
      for (var i = j.length - 1; i > 0; i--) {
        var k = Math.floor(Math.random() * (i + 1));
        var t = j[i]; j[i] = j[k]; j[k] = t;
      }
      D.STATS.forEach(function (s, i) { perso.stats[s.id] = j[i]; });
      rafraichir();
    });
    $('stats-vider').addEventListener('click', function () {
      D.STATS.forEach(function (s) { perso.stats[s.id] = null; });
      rafraichir();
    });

    $('imprimer').addEventListener('click', function () { window.print(); });

    $('exporter').addEventListener('click', function () {
      var nom = (perso.nom || 'personnage').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
      var b = new Blob([JSON.stringify(perso, null, 2)], { type: 'application/json' });
      var u = URL.createObjectURL(b);
      var a = document.createElement('a');
      a.href = u; a.download = 'bas-gue-' + nom + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
      etat('Fiche enregistrée.');
    });

    $('importer-declencheur').addEventListener('click', function () { $('importer').click(); });
    $('importer').addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          fusionner(JSON.parse(r.result));
          premier = true;
          rafraichir();
          ['espece', 'nom', 'surnom', 'phrase'].forEach(function (k) { $(k).value = perso[k] || ''; });
          etat('Fiche chargée.');
        } catch (err) {
          etat('Ce fichier n’est pas une fiche Bas-Gué.');
        }
      };
      r.readAsText(f);
      e.target.value = '';
    });

    $('effacer').addEventListener('click', function () {
      if (!window.confirm('Effacer cette fiche et repartir de zéro ?')) return;
      perso = vide();
      try { localStorage.removeItem(CLE); } catch (e) {}
      premier = true;
      rafraichir();
      ['espece', 'nom', 'surnom', 'phrase'].forEach(function (k) { $(k).value = ''; });
      etat('Fiche effacée.');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else { demarrer(); }
})();
