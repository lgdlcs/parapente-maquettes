/* Libre Envol — interactions : navbar, burger, reveal, carrousel avis, lightbox */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Navbar : état au scroll ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add("nav--scrolled");
    else nav.classList.remove("nav--scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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
})();
