/* Barbier de la Cité (site de demonstration).
   Les apparitions passent par IntersectionObserver ; les effets lies au
   defilement tournent dans une seule boucle rAF, ouverte seulement quand
   l element concerne est a l ecran. Seule exception : le fil (section 8),
   toujours visible, suit un ecouteur de scroll passif limite a une image.   */
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

  /* -- 2. barre : un filet apparait des qu on quitte le haut de page ------ */

  var barre = document.querySelector('.barre');
  var haut = document.getElementById('haut');
  if (avecIO && barre && haut) {
    new IntersectionObserver(function (entrees) {
      barre.classList.toggle('is-defile', !entrees[0].isIntersecting);
    }).observe(haut);
  }

  // la rubrique en cours de lecture est soulignee dans la barre
  var liens = document.querySelectorAll('.barre__liens a');
  if (avecIO && liens.length) {
    var obsRubrique = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        liens.forEach(function (l) {
          if (e.target.id && l.getAttribute('href') === '#' + e.target.id) l.setAttribute('aria-current', 'true');
          else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    // toutes les sections, pour effacer le soulignement hors des rubriques de la barre
    document.querySelectorAll('main section[id], .hero').forEach(function (sec) { obsRubrique.observe(sec); });
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
    if (reduit || !avecIO || !cible) return;
    maj();
    new IntersectionObserver(function (entrees) {
      if (entrees[0].isIntersecting) ouvrir(maj); else fermer(maj);
    }, { rootMargin: '12% 0px 12% 0px' }).observe(cible);
  }
  function hauteurBarre() { return barre ? barre.offsetHeight : 0; }

  /* -- 4. photos : le hero se pose, le salon glisse doucement ------------- */

  var heroImg = document.querySelector('.hero__photo img');
  lier(heroImg && heroImg.parentNode, function () {
    var r = heroImg.parentNode.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, -r.top / (r.height || 1)));
    heroImg.style.transform = 'translate3d(0,' + (p * 8).toFixed(2) + '%,0) scale(' + (1.04 + p * 0.06).toFixed(4) + ')';
  });

  var salonImg = document.querySelector('.salon__photo img');
  lier(salonImg && salonImg.parentNode, function () {
    var r = salonImg.parentNode.getBoundingClientRect();
    var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
    p = Math.max(-1, Math.min(1, p));
    salonImg.style.transform = 'translate3d(0,' + (p * -6).toFixed(2) + '%,0)';
  });

  /* -- 5. coupes recentes : travelling lateral sous la barre epinglee ----- */

  var pan = document.querySelector('.pan');
  var piste = pan && pan.querySelector('.pan__piste');
  var cadre = pan && pan.querySelector('.pan__cadre');
  var mqPan = window.matchMedia('(min-width: 900px)');
  var course = 0;

  function majPan() {
    if (!course) return;
    var b = hauteurBarre();
    var trajet = pan.offsetHeight - (window.innerHeight - b);
    if (trajet <= 0) return;
    var p = Math.min(1, Math.max(0, (b - pan.getBoundingClientRect().top) / trajet));
    piste.style.transform = 'translate3d(' + (-p * course).toFixed(1) + 'px,0,0)';
  }
  function mesurerPan() {
    course = Math.max(0, piste.scrollWidth - cadre.clientWidth);
    // rapport proche de 1 pour 1 entre defilement vertical et horizontal
    pan.style.height = (window.innerHeight - hauteurBarre() + course * 1.1) + 'px';
    majPan();
  }
  function reglerPan() {
    var epingler = mqPan.matches && !reduit && avecIO;
    pan.classList.toggle('is-pinned', epingler);
    if (!epingler) { pan.style.height = ''; piste.style.transform = ''; course = 0; return; }
    mesurerPan();
  }
  if (pan && piste && cadre) {
    reglerPan();
    mqPan.addEventListener('change', reglerPan);
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { if (pan.classList.contains('is-pinned')) mesurerPan(); })
        .observe(document.documentElement);
    }
    lier(pan, majPan);
  }

  /* -- 6. heure de Lausanne, ouvert ou ferme ------------------------------ */
  // une seule source pour les horaires : [ouverture, fermeture] en minutes,
  // par jour de la semaine (0 = dimanche). Le statut se calcule a l heure du
  // salon (Europe/Zurich), pas a celle du visiteur.

  var HORAIRES = { 2: [540, 1140], 3: [540, 1140], 4: [540, 1200], 5: [540, 1140], 6: [510, 960] };
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  var formatLausanne = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Zurich', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
  });
  function heureLausanne(date) {
    var v = {};
    formatLausanne.formatToParts(date).forEach(function (x) { v[x.type] = +x.value; });
    var utc = Date.UTC(v.year, v.month - 1, v.day);
    return { utc: utc, jour: new Date(utc).getUTCDay(), minutes: v.hour * 60 + v.minute };
  }

  function hhmm(m) {
    return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2);
  }

  function statut(jour, minutes) {
    var h = HORAIRES[jour];
    if (h && minutes >= h[0] && minutes < h[1]) {
      return { ouvert: true, long: 'Ouvert, jusqu\'à ' + hhmm(h[1]), court: 'Ouvert' };
    }
    if (h && minutes < h[0]) {
      return { ouvert: false, long: 'Fermé, ouvre à ' + hhmm(h[0]), court: 'Fermé' };
    }
    for (var k = 1; k <= 7; k++) {
      var s = (jour + k) % 7;
      if (HORAIRES[s]) {
        var quand = k === 1 ? 'demain' : JOURS[s];
        return { ouvert: false, long: 'Fermé, ouvre ' + quand + ' à ' + hhmm(HORAIRES[s][0]), court: 'Fermé' };
      }
    }
  }

  function majStatut() {
    var maintenant = heureLausanne(new Date());
    var etat = statut(maintenant.jour, maintenant.minutes);
    document.querySelectorAll('[data-statut]').forEach(function (el) {
      el.innerHTML = '<span class="statut__long"></span><span class="statut__court"></span>';
      el.firstChild.textContent = etat.long;
      el.lastChild.textContent = etat.court;
      el.classList.toggle('is-ouvert', etat.ouvert);
      el.classList.toggle('is-ferme', !etat.ouvert);
      if (el.tagName === 'A') el.setAttribute('aria-label', etat.long + ', voir les horaires');
    });
    document.querySelectorAll('.horaires tr[data-jour]').forEach(function (tr) {
      var jours = tr.getAttribute('data-jour').split(' ');
      tr.classList.toggle('is-aujourdhui', jours.indexOf(String(maintenant.jour)) !== -1);
    });
  }
  majStatut();
  setInterval(majStatut, 60000);

  /* -- 7. reservation : vraie interface, envoi simule --------------------- */

  var SERVICES = {
    'coupe':        { nom: 'Coupe homme', duree: 30, prix: 45 },
    'degrade':      { nom: 'Dégradé à blanc', duree: 40, prix: 50 },
    'ciseaux':      { nom: 'Coupe aux ciseaux', duree: 45, prix: 55 },
    'enfant':       { nom: 'Coupe enfant', duree: 25, prix: 30 },
    'barbe':        { nom: 'Taille de barbe', duree: 20, prix: 30 },
    'rasage':       { nom: 'Rasage à la serviette chaude', duree: 30, prix: 40 },
    'contours':     { nom: 'Contours de barbe', duree: 10, prix: 15 },
    'coupe-barbe':  { nom: 'Coupe et barbe', duree: 50, prix: 65 },
    'coupe-rasage': { nom: 'Coupe et rasage', duree: 60, prix: 80 }
  };
  var BARBIERS = { luca: 'Luca', samir: 'Samir', noah: 'Noah' };
  var PAS = 30;   // un creneau toutes les 30 minutes

  // agenda de demonstration : un creneau est pris ou libre de facon stable
  // (meme reponse a chaque visite), un peu moins d un sur deux est pris
  function pris(utc, minutes, barbier) {
    var s = utc / 864e5 + ':' + minutes + ':' + barbier, h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % 100 < 46;
  }

  // jours proposes : les 6 prochains jours d ouverture, a partir d aujourd hui
  function joursOuverts(depuis) {
    var liste = [];
    for (var i = 0; i < 14 && liste.length < 6; i++) {
      var utc = depuis.utc + i * 864e5;
      var jour = new Date(utc).getUTCDay();
      if (!HORAIRES[jour]) continue;
      if (i === 0 && depuis.minutes > HORAIRES[jour][1] - 60) continue;   // trop tard aujourd hui
      liste.push({ ecart: i, utc: utc, jour: jour, date: new Date(utc) });
    }
    return liste;
  }

  // creneaux d un jour : libres pour le barbier choisi, ou pour au moins un
  // barbier si « peu importe » ; renvoie aussi le barbier attribue
  function creneaux(jourInfo, duree, barbier, maintenant) {
    var h = HORAIRES[jourInfo.jour], liste = [];
    for (var m = h[0]; m + duree <= h[1]; m += PAS) {
      if (jourInfo.ecart === 0 && m < maintenant.minutes + 30) continue;
      var attribue = null;
      if (barbier === 'tous') {
        for (var b in BARBIERS) { if (!pris(jourInfo.utc, m, b)) { attribue = b; break; } }
      } else if (!pris(jourInfo.utc, m, barbier)) {
        attribue = barbier;
      }
      liste.push({ minutes: m, libre: !!attribue, barbier: attribue });
    }
    return liste;
  }

  var form = document.getElementById('resa');
  if (form) {
    var choixService = form.querySelector('#resa-service');
    var zoneJours = form.querySelector('#resa-jours');
    var zoneHeures = form.querySelector('#resa-heures');
    var vide = form.querySelector('#resa-vide');
    var bouton = form.querySelector('.recap__ok');
    var recap = {
      service: document.getElementById('recap-service'),
      barbier: document.getElementById('recap-barbier'),
      quand: document.getElementById('recap-quand'),
      prix: document.getElementById('recap-prix')
    };
    var maintenantResa = heureLausanne(new Date());
    var jours = joursOuverts(maintenantResa);
    var listeCreneaux = [];

    function puce(nom, valeur, html, coche, desactive) {
      var label = document.createElement('label');
      label.className = 'puce';
      label.innerHTML = '<input type="radio" name="' + nom + '" value="' + valeur + '"' +
        (coche ? ' checked' : '') + (desactive ? ' disabled' : '') + '><span>' + html + '</span>';
      return label;
    }

    jours.forEach(function (j, i) {
      var titre = j.ecart === 0 ? 'Auj.' : j.ecart === 1 ? 'Demain' : JOURS_COURTS[j.jour];
      var sous = j.date.getUTCDate() + ' ' + MOIS[j.date.getUTCMonth()];
      zoneJours.appendChild(puce('jour', i, titre + '<small>' + sous + '</small>', i === 0));
    });

    function valeur(nom) {
      var el = form.querySelector('input[name="' + nom + '"]:checked');
      return el ? el.value : null;
    }

    function majHeures() {
      var service = SERVICES[choixService.value];
      var jour = jours[+valeur('jour') || 0];
      var avant = valeur('heure');
      listeCreneaux = jour ? creneaux(jour, service.duree, valeur('barbier'), maintenantResa) : [];
      zoneHeures.innerHTML = '';
      listeCreneaux.forEach(function (c) {
        var garde = c.libre && String(c.minutes) === avant;
        zoneHeures.appendChild(puce('heure', c.minutes, hhmm(c.minutes), garde, !c.libre));
      });
      vide.hidden = listeCreneaux.some(function (c) { return c.libre; });
      majRecap();
    }

    function majRecap() {
      var service = SERVICES[choixService.value];
      var barbier = valeur('barbier');
      var heure = valeur('heure');
      var jour = jours[+valeur('jour') || 0];
      recap.service.textContent = service.nom + ', ' + service.duree + ' min';
      recap.prix.textContent = 'CHF ' + service.prix;
      var c = heure && listeCreneaux.filter(function (x) { return String(x.minutes) === heure; })[0];
      if (c && jour) {
        recap.quand.textContent = JOURS[jour.jour] + ' ' + jour.date.getUTCDate() + ' ' +
          MOIS_LONGS[jour.date.getUTCMonth()] + ', ' + hhmm(c.minutes);
        recap.barbier.textContent = BARBIERS[c.barbier] + (barbier === 'tous' ? ' (premier disponible)' : '');
        bouton.disabled = false;
      } else {
        recap.quand.textContent = 'Choisissez une heure';
        recap.barbier.textContent = barbier === 'tous' ? 'Peu importe' : BARBIERS[barbier];
        bouton.disabled = true;
      }
    }

    form.addEventListener('change', function (e) {
      if (e.target.name === 'heure') majRecap(); else majHeures();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (bouton.disabled) return;
      ouvrirNote('Réservation de démonstration',
        recap.service.textContent + ' avec ' + recap.barbier.textContent.replace(' (premier disponible)', '') +
        ', ' + recap.quand.textContent + '. Sur votre site, cette réservation arriverait directement dans votre agenda ' +
        '(Planity, Fresha, Salonkee ou celui que vous utilisez) et le client recevrait un SMS de confirmation.');
    });

    // les tarifs et les portraits pre-remplissent le formulaire avant d y mener
    document.querySelectorAll('[data-service]').forEach(function (a) {
      a.addEventListener('click', function () {
        choixService.value = a.getAttribute('data-service');
        majHeures();
      });
    });
    document.querySelectorAll('[data-barbier]').forEach(function (a) {
      a.addEventListener('click', function () {
        var radio = form.querySelector('input[name="barbier"][value="' + a.getAttribute('data-barbier') + '"]');
        if (radio) { radio.checked = true; majHeures(); }
      });
    });

    majHeures();
  }

  // hero : prochain creneau libre, tous barbiers confondus, pour une coupe
  var prochain = document.querySelector('[data-prochain]');
  if (prochain) {
    var maintenantDispo = heureLausanne(new Date());
    var trouve = null;
    joursOuverts(maintenantDispo).some(function (j) {
      var c = creneaux(j, 30, 'tous', maintenantDispo).filter(function (x) { return x.libre; })[0];
      if (c) trouve = { jour: j, creneau: c };
      return !!c;
    });
    if (trouve) {
      var quand = trouve.jour.ecart === 0 ? 'aujourd\'hui' : trouve.jour.ecart === 1 ? 'demain' : JOURS[trouve.jour.jour];
      prochain.textContent = 'Prochain créneau libre : ' + quand + ' à ' + hhmm(trouve.creneau.minutes) +
        ' avec ' + BARBIERS[trouve.creneau.barbier] + '.';
      prochain.hidden = false;
    }
  }

  /* -- 8. le fil : les ciseaux descendent au rythme de la lecture --------- */

  var fil = document.querySelector('.fil');
  if (fil) {
    var lameA = fil.querySelector('.lame--a');
    var lameB = fil.querySelector('.lame--b');
    var COUPS = 18;          // nombre de coups de ciseaux sur toute la page
    var dernier = -1;
    var demande = false;

    var majFil = function () {
      demande = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (p === dernier) return;
      dernier = p;
      fil.style.setProperty('--p', p.toFixed(4));

      // couleur d apres le fond sous les ciseaux ; le fil est en
      // pointer-events: none, elementFromPoint voit donc ce qu il y a dessous
      var r = fil.getBoundingClientRect();
      var dessous = document.elementFromPoint(r.left + r.width / 2, r.top + p * r.height);
      var zone = dessous && dessous.closest('[data-fond]');
      if (zone) fil.setAttribute('data-fond', zone.getAttribute('data-fond'));

      if (reduit) return;    // position seulement, les lames restent fixes
      var a = 3 + 13 * (0.5 - 0.5 * Math.cos(p * Math.PI * 2 * COUPS));
      lameA.setAttribute('transform', 'rotate(' + (-a).toFixed(2) + ' 12 18)');
      lameB.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' 12 18)');
    };

    window.addEventListener('scroll', function () {
      if (!demande) { demande = true; requestAnimationFrame(majFil); }
    }, { passive: true });
    window.addEventListener('resize', function () { dernier = -1; majFil(); });
    majFil();
  }

  /* -- 9. note de demonstration -------------------------------------------- */
  // sans <dialog>, les liens gardent leur comportement d ancre

  var note = document.getElementById('note-demo');
  function ouvrirNote(titre, texte) {
    if (!note || typeof note.showModal !== 'function') return;
    note.querySelector('#note-demo-titre').textContent = titre;
    note.querySelector('#note-demo-texte').textContent = texte;
    note.showModal();
  }
  if (note) {
    note.addEventListener('click', function (e) { if (e.target === note) note.close(); });
  }
  document.querySelectorAll('[data-demo="appel"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      ouvrirNote('Ici, le téléphone du salon.',
        'Sur votre site, ce bouton compose directement votre numéro depuis un mobile.');
    });
  });

  /* -- auto-verification, en console seulement : ?test -------------------- */

  if (/[?&]test\b/.test(location.search)) {
    var ok = true;
    var t = function (jour, h, m, attendu) {
      var r = statut(jour, h * 60 + m).long;
      if (r !== attendu) { ok = false; console.error(jour, h, m, '->', r, '(attendu : ' + attendu + ')'); }
    };
    t(2, 10, 0, 'Ouvert, jusqu\'à 19:00');           // mardi
    t(2, 8, 0, 'Fermé, ouvre à 09:00');
    t(4, 19, 30, 'Ouvert, jusqu\'à 20:00');           // jeudi nocturne
    t(6, 16, 0, 'Fermé, ouvre mardi à 09:00');        // samedi a la fermeture
    t(0, 12, 0, 'Fermé, ouvre mardi à 09:00');        // dimanche
    t(1, 12, 0, 'Fermé, ouvre demain à 09:00');       // lundi
    // aucun creneau ne deborde de la fermeture, aucun n est propose dans le passe
    var lundi = { utc: Date.UTC(2026, 9, 26), jour: 1, minutes: 600 };
    joursOuverts(lundi).forEach(function (j) {
      creneaux(j, 60, 'tous', lundi).forEach(function (c) {
        if (c.minutes + 60 > HORAIRES[j.jour][1]) { ok = false; console.error('deborde', j, c); }
      });
    });
    var mardiMidi = { utc: Date.UTC(2026, 9, 27), jour: 2, minutes: 720 };
    creneaux(joursOuverts(mardiMidi)[0], 30, 'tous', mardiMidi).forEach(function (c) {
      if (c.minutes < 750) { ok = false; console.error('passe', c); }
    });
    console.log(ok ? 'tests passes' : 'TESTS EN ECHEC');
  }
})();
