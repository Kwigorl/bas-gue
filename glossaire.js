/* Bas-Gué — infobulles de vocabulaire.
   Ne touche qu'aux mots déjà en gras dans le texte courant (jamais dans un
   tableau, jamais dans un titre) : c'est justement là que le manuel signale
   lui-même qu'un mot est employé au sens du jeu, ce qui évite les faux sens
   sur les mots ordinaires (« elle fait », « une porte de bois », etc.).
   Sur un mot déjà lié, on ajoute un petit ⓘ à côté plutôt que de toucher au
   lien, pour ne jamais interférer avec la navigation — surtout au tactile,
   où il n'y a qu'un tap et pas de survol. */
(function () {
  'use strict';
  var DONNEES = window.BG_GLOSSAIRE;
  if (!DONNEES) return;
  var corps = document.querySelector('.corps');

  var ARTICLES = /^(l['’]|le |la |les |un |une |des )/i;
  // le tiret final (« Au fer — ») n'est toléré que pour les deux termes qui
  // l'emploient réellement ainsi dans le texte ; ailleurs, un mot suivi d'un
  // tiret est presque toujours une étiquette de bloc (« Fait —, Ombre —,
  // Veut — » dans les fiches d'adversaire), pas le terme du glossaire.
  var TOLERE_TIRET = { 'au fer': true, 'au calme': true };

  function cle(texte, garderTiret) {
    var t = texte.trim();
    if (!garderTiret) t = t.replace(/[\s—–-]+$/g, '');
    t = t.replace(/[\s:;.,!?]+$/g, '').replace(ARTICLES, '');
    return t.toLowerCase();
  }

  var INDEX = {};
  Object.keys(DONNEES).forEach(function (terme) {
    INDEX[cle(terme, true)] = { libelle: terme, def: DONNEES[terme] };
  });

  function chercher(texte) {
    var k = cle(texte, true);
    if (INDEX[k]) return INDEX[k];
    var kSansTiret = cle(texte, false);
    if (kSansTiret !== k && TOLERE_TIRET[kSansTiret]) return INDEX[kSansTiret];
    return null;
  }

  /* --- la bulle, une seule instance réutilisée --- */
  var bulle = document.createElement('div');
  bulle.className = 'bulle-terme';
  bulle.setAttribute('role', 'tooltip');
  bulle.hidden = true;
  document.body.appendChild(bulle);
  var declencheurActif = null;

  function fermer() {
    bulle.hidden = true;
    if (declencheurActif) declencheurActif.setAttribute('aria-expanded', 'false');
    declencheurActif = null;
  }

  function ouvrir(cible, entree) {
    if (declencheurActif === cible) { fermer(); return; }
    fermer();
    bulle.innerHTML =
      '<p class="bulle-terme-nom">' + entree.libelle + '</p>' +
      '<p class="bulle-terme-def">' + entree.def + '</p>';
    bulle.hidden = false;
    cible.setAttribute('aria-expanded', 'true');
    declencheurActif = cible;

    var r = cible.getBoundingClientRect();
    var largeur = bulle.offsetWidth, hauteur = bulle.offsetHeight;
    var marge = 10;
    var gauche = r.left + r.width / 2 - largeur / 2;
    gauche = Math.max(marge, Math.min(gauche, window.innerWidth - largeur - marge));
    var haut = r.top - hauteur - 8;
    var sousLeMot = haut < marge;
    if (sousLeMot) haut = r.bottom + 8;
    bulle.style.left = (gauche + window.scrollX) + 'px';
    bulle.style.top = (haut + window.scrollY) + 'px';
    bulle.classList.toggle('bulle-dessous', sousLeMot);
  }

  var surAppareilTactile = !(window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  function brancherDeclencheur(el, entree) {
    el.setAttribute('aria-expanded', 'false');
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      ouvrir(el, entree);
    });
    if (!surAppareilTactile) {
      el.addEventListener('mouseenter', function () { ouvrir(el, entree); });
      el.addEventListener('mouseleave', fermer);
      el.addEventListener('focus', function () { ouvrir(el, entree); });
      el.addEventListener('blur', fermer);
    }
  }

  /* --- on parcourt le texte courant, jamais les tableaux ni les titres ---
     (seulement sur les pages qui ont une zone .corps : les deux manuels) */
  var candidats = corps ? corps.querySelectorAll(
    'p strong, li strong, aside strong, blockquote strong') : [];

  candidats.forEach(function (fort) {
    if (fort.closest('table')) return;
    if (fort.dataset.termeFait) return; // déjà traité (texte imbriqué ***gras+italique***)

    var texte = fort.textContent;
    var entree = chercher(texte);
    if (!entree) return;

    var lien = fort.closest('a') || fort.querySelector('a');
    if (lien) {
      // mot déjà lié : on ne touche pas au lien, on ajoute un ⓘ à côté,
      // visible surtout là où il n'y a pas de survol pour peek avant de cliquer.
      // (le lien peut être un ancêtre du gras — <a><strong>mot</strong></a> —
      // ou, tout aussi souvent ici, l'inverse — <strong><a>mot</a></strong> :
      // dans les deux cas, on s'accroche juste après le <a> lui-même, jamais
      // sur le <strong>, pour ne jamais intercepter le clic du lien.)
      fort.dataset.termeFait = '1';
      if (lien.nextElementSibling && lien.nextElementSibling.classList &&
          lien.nextElementSibling.classList.contains('terme-info')) return;
      var bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'terme-info';
      bouton.setAttribute('aria-label', 'Définition de ' + entree.libelle);
      bouton.textContent = 'ⓘ';
      lien.insertAdjacentElement('afterend', bouton);
      brancherDeclencheur(bouton, entree);
    } else {
      fort.dataset.termeFait = '1';
      fort.classList.add('terme');
      fort.tabIndex = 0;
      fort.setAttribute('role', 'button');
      brancherDeclencheur(fort, entree);
    }
  });

  /* --- marquage explicite : <span class="terme" data-terme="Nom exact">
     posé à la main dans une page qui n'écrit pas systématiquement en gras
     (le transcript « une soirée à table », par exemple). Cible exacte,
     pas de normalisation floue : c'est l'auteur qui choisit le mot. --- */
  document.querySelectorAll('[data-terme]').forEach(function (el) {
    if (el.dataset.termeFait) return;
    var entree = DONNEES[el.dataset.terme]
      ? { libelle: el.dataset.terme, def: DONNEES[el.dataset.terme] }
      : null;
    if (!entree) return;
    el.dataset.termeFait = '1';
    if (!el.classList.contains('terme-info')) {
      el.classList.add('terme');
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
    }
    brancherDeclencheur(el, entree);
  });

  document.addEventListener('click', function (e) {
    if (!bulle.hidden && !bulle.contains(e.target)) fermer();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fermer();
  });
  window.addEventListener('scroll', fermer, { passive: true });
  window.addEventListener('resize', fermer);
})();
