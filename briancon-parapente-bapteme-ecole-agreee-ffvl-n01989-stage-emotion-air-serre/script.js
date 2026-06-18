/* Emotion'Air — version Cinéma : navbar, burger, reveal, carrousel avis, lightbox, hero vidéo */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Hero vidéo : pause si mouvement réduit, fallback poster si échec ---------- */
  var heroVideo = document.getElementById("heroVideo");
  if (heroVideo) {
    if (reduceMotion) { heroVideo.removeAttribute("autoplay"); try { heroVideo.pause(); } catch (e) {} }
    heroVideo.addEventListener("error", function () { heroVideo.style.display = "none"; }, true);
    var src = heroVideo.querySelector("source");
    if (src) src.addEventListener("error", function () { heroVideo.style.display = "none"; });
  }

  /* ---------- Hero YouTube : lecture pilotée par l'API, révélée seulement quand ça joue ----------
     Tant que la vidéo ne JOUE pas (chargement, titre/boutons, erreur d'embed), le wrapper reste
     invisible → c'est le poster hero.jpg qui s'affiche. Aucune chrome YouTube visible. */
  var ytMount = document.getElementById("heroYtMount");
  var ytWrap = document.querySelector(".hero__video--yt");
  if (ytWrap && reduceMotion) {
    ytWrap.style.display = "none";              // mouvement réduit → poster
  } else if (ytMount && ytWrap) {
    var ytId = ytMount.getAttribute("data-yt-id");
    window.onYouTubeIframeAPIReady = function () {
      try {
        new YT.Player("heroYtMount", {
          videoId: ytId,
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 1, mute: 1, controls: 0, loop: 1, playlist: ytId,
            modestbranding: 1, playsinline: 1, rel: 0, fs: 0, disablekb: 1,
            iv_load_policy: 3, start: 0, origin: location.origin
          },
          events: {
            onReady: function (e) { try { e.target.mute(); e.target.playVideo(); } catch (x) {} },
            onStateChange: function (e) {
              if (e.data === 1) ytWrap.classList.add("is-playing");            // PLAYING → révèle
              else if (e.data === 0) { try { e.target.seekTo(0); e.target.playVideo(); } catch (x) {} } // ENDED → boucle
            },
            onError: function () { ytWrap.style.display = "none"; }            // non embeddable → poster
          }
        });
      } catch (x) { ytWrap.style.display = "none"; }
    };
    var ytTag = document.createElement("script");
    ytTag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(ytTag);
  }

  /* ---------- Navbar : état au scroll (fonctionne en natif ET via Locomotive) ---------- */
  var nav = document.getElementById("nav");
  function setNav(y) { nav.classList.toggle("nav--scrolled", y > 40); }
  window.addEventListener("scroll", function () { setNav(window.scrollY); }, { passive: true });
  setNav(window.scrollY);

  /* ---------- Menu burger (mobile) ---------- */
  var burger = document.getElementById("burger");
  var links = document.getElementById("navLinks");
  function closeMenu() {
    links.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }
  burger.addEventListener("click", function () {
    var open = links.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") closeMenu();
  });

  /* ---------- Reveal au scroll ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Carrousels avis : badge Google vérifié + duplication pour la boucle ---------- */
  var googleLogo =
    '<svg viewBox="0 0 48 48" aria-hidden="true">' +
    '<path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>' +
    '<path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>' +
    '<path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>' +
    '<path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>' +
    '</svg>';
  var badgeHTML =
    '<span class="review__google" title="Avis Google vérifié">' +
    googleLogo +
    '<span>Vérifié</span>' +
    '<span class="review__check" aria-hidden="true">✔</span>' +
    "</span>";
  Array.prototype.forEach.call(document.querySelectorAll(".review__top"), function (top) {
    top.insertAdjacentHTML("beforeend", badgeHTML);
  });

  if (!reduceMotion) {
    var tracks = document.querySelectorAll(".reviews__track");
    Array.prototype.forEach.call(tracks, function (track) {
      var clone = track.cloneNode(true);
      Array.prototype.forEach.call(clone.children, function (c) {
        c.setAttribute("aria-hidden", "true");
      });
      while (clone.firstChild) track.appendChild(clone.firstChild);
    });
  }

  /* ---------- Lightbox galerie ---------- */
  var gallery = document.getElementById("gallery");
  if (gallery) {
    var imgs = Array.prototype.map.call(gallery.querySelectorAll("img"), function (i) {
      return { src: i.getAttribute("src"), alt: i.getAttribute("alt") || "" };
    });
    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML =
      '<button class="lightbox__close" aria-label="Fermer">&times;</button>' +
      '<button class="lightbox__nav lightbox__prev" aria-label="Précédent">&#8249;</button>' +
      '<img class="lightbox__img" alt="">' +
      '<button class="lightbox__nav lightbox__next" aria-label="Suivant">&#8250;</button>';
    document.body.appendChild(box);

    var bigImg = box.querySelector(".lightbox__img");
    var current = 0;
    function show(i) {
      current = (i + imgs.length) % imgs.length;
      bigImg.src = imgs[current].src;
      bigImg.alt = imgs[current].alt;
    }
    function open(i) {
      show(i);
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function close() {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
    Array.prototype.forEach.call(gallery.querySelectorAll(".gallery__item"), function (btn, i) {
      btn.addEventListener("click", function () { open(i); });
    });
    box.querySelector(".lightbox__close").addEventListener("click", close);
    box.querySelector(".lightbox__prev").addEventListener("click", function (e) { e.stopPropagation(); show(current - 1); });
    box.querySelector(".lightbox__next").addEventListener("click", function (e) { e.stopPropagation(); show(current + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(current - 1);
      else if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---------- Pré-remplissage du formulaire selon le bouton cliqué ---------- */
  var msgField = document.querySelector('.contact__form [name="message"]');
  var nameField = document.querySelector('.contact__form [name="nom"]');
  var canFocus = window.matchMedia("(pointer: fine)").matches;
  Array.prototype.forEach.call(document.querySelectorAll("[data-prefill]"), function (el) {
    el.addEventListener("click", function () {
      if (!msgField) return;
      msgField.value = el.getAttribute("data-prefill");
      msgField.classList.add("is-prefilled");
      if (canFocus && nameField) nameField.focus({ preventScroll: true });
    });
  });

  /* ---------- Formulaire : envoi AJAX, reste sur la page ---------- */
  var form = document.querySelector(".contact__form");
  if (form) {
    var statusEl = form.querySelector(".contact__status");
    var submitBtn = form.querySelector('button[type="submit"]');
    function setStatus(ok, msg) {
      statusEl.hidden = false;
      statusEl.textContent = msg;
      statusEl.classList.toggle("is-ok", ok);
      statusEl.classList.toggle("is-err", !ok);
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.hasAttribute("data-demo")) {
        form.reset();
        setStatus(true, "Merci ! Votre demande a bien été envoyée (démo). Réponse sous 24 h.");
        return;
      }
      var label = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Envoi…";
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (r) {
          if (r.ok) {
            form.reset();
            setStatus(true, "Merci ! Votre demande a bien été envoyée. Réponse sous 24 h.");
          } else {
            setStatus(false, "Envoi impossible. Contactez-nous par téléphone ou WhatsApp.");
          }
        })
        .catch(function () {
          setStatus(false, "Envoi impossible. Contactez-nous par téléphone ou WhatsApp.");
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = label;
        });
    });
  }

})();
