/* AlpWind — version Cinéma : navbar, burger, reveal, carrousel avis, lightbox, hero vidéo */
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

  /* ---------- Carrousel avis : duplique les cards pour la boucle ---------- */
  var track = document.getElementById("reviewsTrack");
  if (track && !reduceMotion) {
    var clone = track.cloneNode(true);
    Array.prototype.forEach.call(clone.children, function (c) {
      c.setAttribute("aria-hidden", "true");
    });
    while (clone.firstChild) track.appendChild(clone.firstChild);
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

  /* ---------- Locomotive Scroll : défilement fluide + parallaxe du hero ----------
     Chargé en defer → on initialise au load. Hors reduced-motion ; sur mobile/tablette
     le smooth est désactivé (perf). Si le CDN échoue, on garde le scroll natif. */
  function forceReveal() {
    var h = window.innerHeight * 0.9;
    Array.prototype.forEach.call(revealEls, function (el) {
      if (!el.classList.contains("is-visible") && el.getBoundingClientRect().top < h) el.classList.add("is-visible");
    });
  }
  function initLoco() {
    if (reduceMotion || !window.LocomotiveScroll) return;
    var el = document.querySelector("[data-scroll-container]");
    if (!el) return;
    try {
      var scroll = new LocomotiveScroll({
        el: el, smooth: true, lerp: 0.085, multiplier: 0.95,
        smartphone: { smooth: false }, tablet: { smooth: false }
      });
      scroll.on("scroll", function (args) { setNav(args.scroll.y); forceReveal(); });
      Array.prototype.forEach.call(document.querySelectorAll('a[href^="#"]'), function (a) {
        a.addEventListener("click", function (e) {
          var id = a.getAttribute("href");
          if (id.length < 2) { e.preventDefault(); scroll.scrollTo(0); return; }
          var t = document.querySelector(id);
          if (t) { e.preventDefault(); scroll.scrollTo(t, { offset: -74 }); }
        });
      });
      setTimeout(function () { scroll.update(); }, 600);
    } catch (err) { /* fallback : scroll natif */ }
  }
  if (document.readyState === "complete") initLoco();
  else window.addEventListener("load", initLoco);
})();
