(() => {
  "use strict";

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header: solid on scroll ---------- */
  const header = document.querySelector(".site-header");
  const onScrollHeader = () => {
    if (!header) return;
    header.classList.toggle("is-solid", window.scrollY > 24);
  };
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Bottom nav + desktop nav: active section highlight ---------- */
  const navLinks = document.querySelectorAll("[data-nav-link]");
  const sections = Array.from(navLinks)
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    const sectionIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = "#" + entry.target.id;
            navLinks.forEach((a) => {
              a.classList.toggle("is-active", a.getAttribute("href") === id);
            });
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach((s) => sectionIO.observe(s));
  }

  /* ---------- Gallery lightbox ---------- */
  const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));
  const lightbox = document.getElementById("lightbox");

  if (galleryItems.length && lightbox) {
    const lbImg = lightbox.querySelector(".lightbox__img");
    const lbCaption = lightbox.querySelector(".lightbox__caption");
    const lbCounter = lightbox.querySelector(".lightbox__counter");
    const btnClose = lightbox.querySelector(".lightbox__close");
    const btnPrev = lightbox.querySelector(".lightbox__prev");
    const btnNext = lightbox.querySelector(".lightbox__next");

    let currentIndex = 0;
    let lastFocused = null;

    const slides = galleryItems.map((item) => ({
      full: item.getAttribute("data-full"),
      caption: item.getAttribute("data-caption") || "",
    }));

    function openLightbox(index) {
      currentIndex = index;
      lastFocused = document.activeElement;
      updateSlide();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      btnClose.focus();
      document.addEventListener("keydown", onKeydown);
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeydown);
      if (lastFocused) lastFocused.focus();
    }

    function updateSlide() {
      const slide = slides[currentIndex];
      lbImg.src = slide.full;
      lbImg.alt = slide.caption;
      lbCaption.textContent = slide.caption;
      lbCounter.textContent = `${currentIndex + 1} / ${slides.length}`;
    }

    function next() {
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlide();
    }
    function prev() {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateSlide();
    }

    function onKeydown(e) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }

    galleryItems.forEach((item, i) => {
      item.addEventListener("click", () => openLightbox(i));
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(i);
        }
      });
    });

    btnClose.addEventListener("click", closeLightbox);
    btnNext.addEventListener("click", next);
    btnPrev.addEventListener("click", prev);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    /* touch swipe */
    let touchStartX = null;
    lightbox.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );
    lightbox.addEventListener(
      "touchend",
      (e) => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
          dx > 0 ? prev() : next();
        }
        touchStartX = null;
      },
      { passive: true }
    );
  }

  /* ---------- PWA install prompt (progressive enhancement) ---------- */
  let deferredPrompt = null;
  const installBtns = document.querySelectorAll(".install-btn");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtns.forEach((btn) => btn.classList.add("is-visible"));
  });

  installBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtns.forEach((b) => b.classList.remove("is-visible"));
    });
  });

  window.addEventListener("appinstalled", () => {
    installBtns.forEach((btn) => btn.classList.remove("is-visible"));
  });

  /* ---------- Service worker ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {
        /* silencioso: el sitio funciona perfectamente sin SW */
      });
    });
  }
})();
