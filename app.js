const toggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navToggleBtn = toggle;
toggle.addEventListener("click", () => {
  const expanded = navToggleBtn.getAttribute("aria-expanded") === "true";
  navToggleBtn.setAttribute("aria-expanded", String(!expanded));
  navLinks.classList.toggle("open");
  // show/hide inline lang item
  const langInline = document.querySelector(".lang-inline");
  if (langInline)
    langInline.style.display = navLinks.classList.contains("open")
      ? "flex"
      : "none";
});

// Language dropdowns (desktop and mobile)
document.querySelectorAll(".lang").forEach((container) => {
  const btn = container.querySelector(".lang-btn");
  const menu = container.querySelector(".lang-menu");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = container.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));
  });
  // select language
  menu &&
    menu.addEventListener("click", (e) => {
      const target = e.target.closest("button[data-lang]");
      if (!target) return;
      const lang = target.dataset.lang;
      // Example action: set button text and close menu
      btn.textContent =
        lang === "en"
          ? "EN ▾"
          : lang === "vi"
          ? "VI ▾"
          : lang.toUpperCase() + " ▾";
      container.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      // TODO: implement actual language change logic (e.g., reload resources, set cookie)
      console.log("Language chosen:", lang);
    });
});

// Close menus when clicking outside
document.addEventListener("click", (e) => {
  document.querySelectorAll(".lang.open").forEach((c) => {
    if (!c.contains(e.target)) {
      c.classList.remove("open");
      const btn = c.querySelector(".lang-btn");
      if (btn) btn.setAttribute("aria-expanded", "false");
    }
  });
});

// Accessibility: close nav with Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // close nav
    if (navLinks.classList.contains("open")) {
      navLinks.classList.remove("open");
      navToggleBtn.setAttribute("aria-expanded", "false");
      const langInline = document.querySelector(".lang-inline");
      if (langInline) langInline.style.display = "none";
    }
    // close language menus
    document.querySelectorAll(".lang.open").forEach((c) => {
      c.classList.remove("open");
      const btn = c.querySelector(".lang-btn");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }
});

// Ensure mobile inline lang item hidden by default
(function init() {
  const langInline = document.querySelector(".lang-inline");
  if (langInline) langInline.style.display = "none";
})();

document.addEventListener("DOMContentLoaded", () => {
  // simple debounce
  const debounce = (fn, t = 120) => {
    let id;
    return (...a) => {
      clearTimeout(id);
      id = setTimeout(() => fn(...a), t);
    };
  };

  document.querySelectorAll(".carousel").forEach(initCarousel);

  function initCarousel(root) {
    const track = root.querySelector(".carousel-track");
    const slides = Array.from(root.querySelectorAll(".carousel-slide"));
    const prev = root.querySelector(".carousel-prev");
    const next = root.querySelector(".carousel-next");
    const dotsWrap = root.querySelector(".carousel-dots");
    const intervalMs = Number(root.dataset.interval) || 3000;
    let visible = calcVisible();
    let index = 0;
    let playing = true;
    let timer = null;

    function calcVisible() {
      const w = window.innerWidth;
      if (w >= 980) return 4;
      if (w >= 560) return 2;
      return 1;
    }

    function layout() {
      visible = calcVisible();
      slides.forEach((s) => (s.style.flex = `0 0 ${100 / visible}%`));
      buildDots();
      clampIndex();
      goto(index, false);
    }

    function buildDots() {
      const pages = Math.max(1, Math.ceil(slides.length / visible));
      dotsWrap.innerHTML = "";
      for (let i = 0; i < pages; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.page = i;
        btn.addEventListener("click", () => {
          goto(i * visible);
          restartAutoplay();
        });
        if (i === 0) btn.classList.add("is-active");
        dotsWrap.appendChild(btn);
      }
    }

    function clampIndex() {
      const maxStart = Math.max(0, slides.length - visible);
      if (index > maxStart) index = maxStart;
      if (index < 0) index = 0;
    }

    function updateDots() {
      const pages = Array.from(dotsWrap.children);
      const currentPage = Math.floor(index / visible);
      pages.forEach((b, i) =>
        b.classList.toggle("is-active", i === currentPage)
      );
    }

    function goto(i, animate = true) {
      index = Math.max(0, Math.min(i, Math.max(0, slides.length - visible)));
      const percent = -(index * (100 / visible));
      if (!animate) track.style.transition = "none";
      else track.style.transition = "";
      track.style.transform = `translateX(${percent}%)`;
      // force reflow if needed when transition disabled
      if (!animate) {
        void track.offsetHeight;
        track.style.transition = "";
      }
      updateDots();
    }

    prev.addEventListener("click", () => {
      goto(index - 1);
      restartAutoplay();
    });
    next.addEventListener("click", () => {
      goto(index + 1);
      restartAutoplay();
    });

    // autoplay
    function startAutoplay() {
      stopAutoplay();
      timer = setInterval(() => {
        if (!playing) return;
        if (index < slides.length - visible) goto(index + 1);
        else goto(0);
      }, intervalMs);
    }
    function stopAutoplay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    function restartAutoplay() {
      startAutoplay();
    }

    root.addEventListener("mouseenter", () => (playing = false));
    root.addEventListener("mouseleave", () => {
      playing = true;
    });

    window.addEventListener("resize", debounce(layout, 120));

    // initial
    layout();
    startAutoplay();
  }
});

(async function () {
  const LANG_STORAGE_KEY = "site_lang";
  const translations = await fetch("./translation.json")
    .then((r) => r.json())
    .catch(() => ({}));

  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("primary-navigation");
  const langInline = document.querySelector(".lang-inline");
  const allLangButtons = Array.from(
    document.querySelectorAll(".lang-menu [data-lang]")
  );
  const langToggles = Array.from(document.querySelectorAll(".lang-btn"));

  function getPreferredLang() {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && translations[stored]) return stored;
    const nav = (navigator.language || navigator.userLanguage || "en")
      .slice(0, 2)
      .toLowerCase();
    if (translations[nav]) return nav;
    return "en";
  }

  function getByPath(obj, path) {
    return path
      .split(".")
      .reduce((o, p) => (o && p in o ? o[p] : undefined), obj);
  }

  function updateTexts(lang) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = getByPath(translations[lang], key);
      if (val !== undefined) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.value = val;
        else el.textContent = val;
      }
    });
    // update visible lang buttons labels
    langToggles.forEach((btn) => (btn.textContent = lang.toUpperCase() + " ▾"));
  }

  function setLang(lang) {
    if (!translations[lang]) return;
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    updateTexts(lang);
  }

  // initialize
  const initialLang = getPreferredLang();
  setLang(initialLang);

  // open/close mobile nav and show inline language item when opened
  if (navToggle && navLinks && langInline) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      // mobile inline language visibility (simple, avoids changing CSS)
      langInline.style.display = open ? "block" : "none";
    });
  }

  // language dropdown toggles
  document.addEventListener("click", (e) => {
    // toggle a lang menu
    if (e.target.matches(".lang-btn")) {
      const parent = e.target.closest(".lang");
      const isOpen = parent.classList.toggle("open");
      e.target.setAttribute("aria-expanded", isOpen ? "true" : "false");
      return;
    }

    // language selection click
    if (e.target.matches(".lang-menu [data-lang]")) {
      const chosen = e.target.getAttribute("data-lang");
      setLang(chosen);
      // close all lang menus
      document.querySelectorAll(".lang.open").forEach((el) => {
        el.classList.remove("open");
        const btn = el.querySelector(".lang-btn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
      return;
    }

    // click outside: close any open language menus
    if (!e.target.closest(".lang")) {
      document.querySelectorAll(".lang.open").forEach((el) => {
        el.classList.remove("open");
        const btn = el.querySelector(".lang-btn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    }
  });

  // keyboard support: close menu on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".lang.open").forEach((el) => {
        el.classList.remove("open");
        const btn = el.querySelector(".lang-btn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
      if (navLinks) {
        navLinks.classList.remove("open");
        navToggle && navToggle.setAttribute("aria-expanded", "false");
        langInline && (langInline.style.display = "none");
      }
    }
  });
})();
