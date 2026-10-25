/* Barbier de la Cité (site de demonstration).
   Meme moteur que La Maison du Carac : aucun ecouteur de scroll, les
   apparitions passent par IntersectionObserver, et les effets lies au
   defilement tournent dans une seule boucle rAF, ouverte uniquement pendant
   que l element concerne est a l ecran.                                      */
(function () {
  'use strict';

  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var avecIO = 'IntersectionObserver' in window;

  /* -- 1. apparitions --------------------------------------------------- */

  var blocs = document.querySelectorAll('[data-reveal]');
  if (!avecIO) {
    blocs.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var obsApparition = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        obsApparition.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.12 });
    blocs.forEach(function (el) { obsApparition.observe(el); });
  }

  /* -- 2. barre de navigation : transparente sur le hero, pleine ensuite -- */

  var nav = document.querySelector('.nav');
  var hero = document.querySelector('.hero');
  if (avecIO && nav && hero) {
    new IntersectionObserver(function (entrees) {
      nav.classList.toggle('is-solide', !entrees[0].isIntersecting);
    }, { rootMargin: '-88% 0px 0px 0px', threshold: 0 }).observe(hero);
  }

  /* -- 3. boucle unique pour les effets lies au defilement ---------------- */

  var actifs = [];
  var image = null;

  function boucle() {
    for (var i = 0; i < actifs.length; i++) actifs[i]();
    image = actifs.length ? requestAnimationFrame(boucle) : null;
  }
  function ouvrir(maj) {
    if (actifs.indexOf(maj) === -1) actifs.push(maj);
    if (!image) image = requestAnimationFrame(boucle);
  }
  function fermer(maj) {
    var i = actifs.indexOf(maj);
    if (i !== -1) actifs.splice(i, 1);
  }
  function lier(cible, maj) {
    if (reduit || !avecIO) return;
    maj();
    new IntersectionObserver(function (entrees) {
      if (entrees[0].isIntersecting) ouvrir(maj); else fermer(maj);
    }, { rootMargin: '12% 0px 12% 0px' }).observe(cible);
  }

  /* -- 4. hero : la photo s eloigne, le texte remonte et s efface --------- */

  var heroMedia = document.querySelector('.hero__media');
  var heroTexte = document.querySelector('.hero__copy');
  if (hero && heroMedia && heroTexte) {
    lier(hero, function () {
      var h = hero.offsetHeight || 1;
      var p = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / h));
      heroMedia.style.transform = 'translate3d(0,' + (p * 9).toFixed(2) + '%,0) scale(' + (1.04 + p * 0.09).toFixed(4) + ')';
      heroTexte.style.transform = 'translate3d(0,' + (p * -30).toFixed(1) + 'px,0)';
      heroTexte.style.opacity = Math.max(0, 1 - p * 1.4).toFixed(3);
    });
  }

  /* -- 5. poteaux : les rayures glissent avec le defilement --------------- */
  // la tuile se raccorde sans couture (voir styles.css), on peut donc
  // decaler la position sans borne

  document.querySelectorAll('.poteau').forEach(function (poteau) {
    lier(poteau, function () {
      poteau.style.backgroundPosition = (window.scrollY * 0.35).toFixed(1) + 'px 0';
    });
  });

  /* -- 6. les coupes : travelling lateral pendant que la scene reste collee */

  var pan = document.querySelector('.pan');
  var piste = pan && pan.querySelector('.pan__track');
  var cadre = pan && pan.querySelector('.pan__scroller');
  var mqPan = window.matchMedia('(min-width: 900px)');
  var course = 0;

  function majPan() {
    if (!course) return;
    var haut = pan.getBoundingClientRect().top;
    var trajet = pan.offsetHeight - window.innerHeight;
    if (trajet <= 0) return;
    var p = Math.min(1, Math.max(0, -haut / trajet));
    piste.style.transform = 'translate3d(' + (-p * course).toFixed(1) + 'px,0,0)';
  }

  function mesurerPan() {
    course = Math.max(0, piste.scrollWidth - cadre.clientWidth);
    // la hauteur de la section fixe le rapport entre defilement vertical
    // et deplacement horizontal : on vise un rapport proche de 1 pour 1
    pan.style.height = (window.innerHeight + course * 1.15) + 'px';
    majPan();
  }

  function reglerPan() {
    var epingler = mqPan.matches && !reduit && avecIO;
    pan.classList.toggle('is-pinned', epingler);
    if (!epingler) {
      pan.style.height = '';
      piste.style.transform = '';
      course = 0;
      return;
    }
    mesurerPan();
  }

  if (pan && piste && cadre) {
    reglerPan();
    mqPan.addEventListener('change', reglerPan);
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        if (pan.classList.contains('is-pinned')) mesurerPan();
      }).observe(document.documentElement);
    }
    lier(pan, majPan);
  }

  /* -- 7. ouvert ou ferme, d apres les horaires --------------------------- */
  // une seule source : [ouverture, fermeture] en minutes, par jour (0 = dimanche)

  var HORAIRES = {
    2: [540, 1140], 3: [540, 1140], 4: [540, 1200], 5: [540, 1140], 6: [510, 960]
  };
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  function hhmm(m) {
    return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2);
  }

  function statut(maintenant) {
    var j = maintenant.getDay();
    var m = maintenant.getHours() * 60 + maintenant.getMinutes();
    var h = HORAIRES[j];
    if (h && m >= h[0] && m < h[1]) return { ouvert: true, texte: 'Ouvert, ferme à ' + hhmm(h[1]) };
    if (h && m < h[0]) return { ouvert: false, texte: 'Fermé, ouvre à ' + hhmm(h[0]) };
    for (var k = 1; k <= 7; k++) {
      var s = (j + k) % 7;
      if (HORAIRES[s]) {
        var quand = k === 1 ? 'demain' : JOURS[s];
        return { ouvert: false, texte: 'Fermé, ouvre ' + quand + ' à ' + hhmm(HORAIRES[s][0]) };
      }
    }
  }

  var maintenant = new Date();
  var etat = statut(maintenant);
  document.querySelectorAll('[data-statut]').forEach(function (el) {
    el.textContent = etat.texte;
    el.classList.add(etat.ouvert ? 'is-ouvert' : 'is-ferme');
  });
  document.querySelectorAll('.horaires tr[data-jour]').forEach(function (tr) {
    if (tr.getAttribute('data-jour').split(' ').indexOf(String(maintenant.getDay())) !== -1) {
      tr.classList.add('is-aujourdhui');
    }
  });

  /* -- 8. demo : « Reserver » explique ce que ferait le vrai bouton ------- */
  // sans JS ou sans <dialog>, les liens menent simplement a « Nous trouver »

  var note = document.getElementById('note-demo');
  if (note && typeof note.showModal === 'function') {
    document.querySelectorAll('[data-reserver]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        note.showModal();
      });
    });
    // un clic sur le voile, hors de la boite, referme la note
    note.addEventListener('click', function (e) {
      if (e.target === note) note.close();
    });
  }

  // auto-verification des horaires, en console seulement : ?test
  if (/[?&]test\b/.test(location.search)) {
    var t = function (iso, attendu) {
      var r = statut(new Date(iso)).texte;
      console.assert(r === attendu, iso + ' -> ' + r + ' (attendu : ' + attendu + ')');
    };
    t('2026-10-27T10:00', 'Ouvert, ferme à 19:00');          // mardi
    t('2026-10-27T08:00', 'Fermé, ouvre à 09:00');
    t('2026-10-29T19:30', 'Ouvert, ferme à 20:00');          // jeudi nocturne
    t('2026-10-31T16:00', 'Fermé, ouvre mardi à 09:00');      // samedi soir
    t('2026-11-01T12:00', 'Fermé, ouvre mardi à 09:00');      // dimanche
    t('2026-11-02T12:00', 'Fermé, ouvre demain à 09:00');     // lundi
    console.log('horaires : tests passes');
  }
})();
