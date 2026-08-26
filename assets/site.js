/* Bas-Gué — comportements communs : la lampe, le sommaire, la recherche. */
(function () {
  'use strict';

  /* --- la lampe-lichen : jour / nuit --- */
  var racine = document.documentElement;
  var lampe = document.getElementById('lampe');
  function etat() { return racine.dataset.lampe === 'nuit'; }
  function poser(v) {
    racine.dataset.lampe = v ? 'nuit' : 'jour';
    if (lampe) {
      lampe.setAttribute('aria-pressed', v ? 'true' : 'false');
      lampe.title = v ? 'Éteindre le lichen' : 'Allumer le lichen';
    }
    try { localStorage.setItem('basgue-lampe', v ? 'nuit' : 'jour'); } catch (e) {}
  }
  if (!racine.dataset.lampe) {
    var nuit = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    racine.dataset.lampe = nuit ? 'nuit' : 'jour';
  }
  poser(etat());
  if (lampe) lampe.addEventListener('click', function () { poser(!etat()); });

  /* --- sommaire repliable sur petit écran --- */
  var bouton = document.getElementById('ouvrir-sommaire');
  var sommaire = document.getElementById('sommaire');
  if (bouton && sommaire) {
    bouton.addEventListener('click', function () {
      var ouvert = sommaire.classList.toggle('ouvert');
      bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
    sommaire.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.innerWidth <= 900) {
        sommaire.classList.remove('ouvert');
        bouton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --- recherche : filtre le sommaire --- */
  var champ = document.getElementById('recherche');
  var liens = sommaire ? Array.prototype.slice.call(sommaire.querySelectorAll('a')) : [];
  var vide = document.getElementById('sommaire-vide');
  function sansAccent(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  if (champ && liens.length) {
    var titres = liens.map(function (a) { return sansAccent(a.textContent); });
    champ.addEventListener('input', function () {
      var q = sansAccent(champ.value.trim());
      var trouves = 0;
      liens.forEach(function (a, i) {
        var ok = !q || titres[i].indexOf(q) !== -1;
        a.hidden = !ok;
        if (ok) trouves++;
      });
      if (vide) vide.hidden = !(q && trouves === 0);
      if (sommaire && window.innerWidth <= 900 && q) sommaire.classList.add('ouvert');
    });
    champ.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { champ.value = ''; champ.dispatchEvent(new Event('input')); }
      if (e.key === 'Enter') {
        var premier = liens.filter(function (a) { return !a.hidden; })[0];
        if (premier) { premier.click(); champ.blur(); }
      }
    });
  }

  /* --- suivi de lecture dans le sommaire --- */
  var titresPage = Array.prototype.slice.call(
    document.querySelectorAll('.corps h1[id], .corps h2[id], .corps h3[id]'));
  if (titresPage.length && liens.length && 'IntersectionObserver' in window) {
    var parId = {};
    liens.forEach(function (a) { parId[a.getAttribute('data-cible')] = a; });
    var vus = new Set();
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) vus.add(e.target.id); else vus.delete(e.target.id);
      });
      var courant = titresPage.filter(function (h) { return vus.has(h.id); })[0];
      if (!courant) return;
      liens.forEach(function (a) { a.classList.remove('actif'); });
      var a = parId[courant.id];
      if (a) {
        a.classList.add('actif');
        if (a.offsetParent && sommaire.scrollHeight > sommaire.clientHeight) {
          var haut = a.offsetTop - sommaire.clientHeight / 2;
          sommaire.scrollTo({ top: haut, behavior: 'auto' });
        }
      }
    }, { rootMargin: '-70px 0px -65% 0px' });
    titresPage.forEach(function (h) { obs.observe(h); });
  }

  /* --- bouton remonter --- */
  var haut = document.getElementById('haut');
  if (haut) {
    haut.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', function () {
      haut.classList.toggle('visible', window.scrollY > 900);
    }, { passive: true });
  }
})();
