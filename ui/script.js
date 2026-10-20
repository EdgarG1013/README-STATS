document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const usernameInput = $("username");
  const userForm = $("user-form");
  const themeSearch = $("theme-search");
  const themeGrid = $("theme-grid");
  const themeCurrent = $("theme-current");
  const tabs = $$(".tab");
  const formatTabs = $$(".format-tab");
  const previewContainer = $("preview-container");
  const previewBody = $("preview-body");
  const bgOptions = $$(".bg-opt");
  const statusEl = $("status");
  const codeSection = $("code-section");
  const markdownCode = $("markdown-code");
  const copyCodeBtn = $("copy-code");
  const resetBtn = $("reset-btn");
  const toast = $("toast");
  const gradientToggle = $("gradient");
  const gradientFields = $("gradient-fields");
  const gradientEnd = $("bg_color2");
  const gradientAngle = $("gradient_angle");

  // Controls that map 1:1 to a query param (checkboxes, ranges, text inputs).
  const paramFields = $$(".controls [data-param]");
  const colorInputs = $$("[data-color]");
  const statRows = $$("[data-hide]");
  const ranges = $$(".controls input[type=range]");

  const DEFAULT_THEME = "dracula";
  const SUGGESTIONS = ["EdgarG1013", "torvalds", "gaearon", "sindresorhus"];
  const CARD_LABELS = {
    stats: "GitHub Stats",
    languages: "Top Languages",
    streak: "GitHub Streak",
    contributions: "Contribution Graph",
    all: "GitHub Stats",
  };
  const ERROR_MESSAGES = {
    400: "Ese nombre de usuario no es válido en GitHub.",
    404: (u) => `No se encontró el usuario "${u}".`,
    429: "Demasiadas peticiones. Espera un minuto e inténtalo de nuevo.",
    500: "El servidor no tiene un token de GitHub configurado (GITHUB_TOKEN).",
    502: "No se pudieron obtener los datos de GitHub. Inténtalo de nuevo.",
    503: "Se alcanzó el límite de la API de GitHub. Inténtalo más tarde.",
  };

  const state = {
    card: "stats",
    format: "markdown",
    theme: DEFAULT_THEME,
    themes: {},
    colors: {}, // only colors the user explicitly changed
  };

  let debounceTimer;
  let controller;
  let currentObjectUrl;

  // ---------- Helpers ----------

  const normalizeHex = (hex) => {
    if (!hex) return null;
    hex = String(hex).replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : null;
  };

  // "35,4158d0,c850c0" -> { angle, stops: ["#4158d0", "#c850c0"] }
  const parseGradient = (value) => {
    const parts = String(value || "").split(",");
    if (parts.length < 3) return null;
    const stops = parts.slice(1).map(normalizeHex);
    return stops.every(Boolean) ? { angle: Number(parts[0]) || 0, stops } : null;
  };

  // Same fallbacks the server applies (api/themes.cjs getCardColors).
  function themeColor(theme, key) {
    const gradient = key === "bg_color" && parseGradient(theme.bg_color);
    if (gradient) return gradient.stops[0];
    if (key === "ring_color") return normalizeHex(theme.ring_color || theme.title_color);
    if (key === "border_color") return normalizeHex(theme.border_color || "e4e2e2");
    return normalizeHex(theme[key]);
  }

  const inScope = (el, card = state.card) => {
    const scope = el.closest("[data-only]");
    return !scope || scope.dataset.only.split(" ").includes(card);
  };

  function buildParams(card = state.card) {
    const params = new URLSearchParams({ username: usernameInput.value.trim() });
    if (state.theme !== DEFAULT_THEME) params.set("theme", state.theme);

    for (const [key, value] of Object.entries(state.colors)) params.set(key, value.replace("#", ""));

    if (gradientToggle.checked) {
      const start = (state.colors.bg_color || themeColor(state.themes[state.theme] || {}, "bg_color") || "#151515").replace("#", "");
      params.set("bg_color", `${gradientAngle.value},${start},${gradientEnd.value.replace("#", "")}`);
    }

    for (const el of paramFields) {
      if (!inScope(el, card)) continue;
      const name = el.dataset.param;
      if (el.type === "checkbox") {
        // data-invert: the checkbox reads "Ocultar X" but the param is show_x.
        const invert = "invert" in el.dataset;
        if (el.checked) params.set(name, String(!invert));
      } else {
        const value = el.value.trim();
        if (value && value !== (el.dataset.default || "")) params.set(name, value);
      }
    }

    const hidden = statRows.filter((c) => !c.checked).map((c) => c.dataset.hide);
    if (hidden.length && inScope(statRows[0], card)) params.set("hide", hidden.join(","));

    return params;
  }

  const cardUrl = (card = state.card) =>
    // Commas are valid in a query string; keeping them readable makes the README URL nicer.
    `${window.location.origin}/api/card/${card}?${buildParams(card).toString().replace(/%2C/g, ",")}`;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("visible"), 1800);
  }

  function setStatus(kind, text) {
    statusEl.dataset.state = kind;
    statusEl.textContent = text;
  }

  function paintRange(input) {
    const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty("--fill", `${pct}%`);
    const out = document.querySelector(`output[for="${input.id}"]`);
    if (out) out.textContent = input.id === "gradient_angle" ? `${input.value}°` : input.value;
  }

  function showEmptyState() {
    const wrap = document.createElement("div");
    wrap.className = "empty-state";
    wrap.innerHTML = `
      <div class="empty-grid" aria-hidden="true">${"<i></i>".repeat(28)}</div>
      <p class="empty-title">Escribe tu usuario para empezar</p>
      <p class="empty-sub">o prueba con alguno de estos:</p>`;
    const chips = document.createElement("div");
    chips.className = "chips";
    SUGGESTIONS.forEach((name) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = name;
      chip.addEventListener("click", () => {
        usernameInput.value = name;
        generateCard();
      });
      chips.append(chip);
    });
    wrap.append(chips);
    previewBody.replaceChildren(wrap);
    setStatus("idle", "Esperando usuario");
  }

  function showError(message) {
    const p = document.createElement("p");
    p.className = "preview-placeholder error";
    p.textContent = message;
    const retry = document.createElement("button");
    retry.className = "btn small ghost";
    retry.textContent = "Reintentar";
    retry.addEventListener("click", generateCard);
    previewBody.replaceChildren(p, retry);
  }

  // ---------- Themes ----------

  function renderThemeGrid() {
    const query = themeSearch.value.trim().toLowerCase();
    const names = Object.keys(state.themes).filter((n) => n.toLowerCase().includes(query));

    themeGrid.replaceChildren(
      ...names.map((name) => {
        const t = state.themes[name];
        const gradient = parseGradient(t.bg_color);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "theme-swatch" + (name === state.theme ? " active" : "");
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", name === state.theme);
        btn.title = name;
        btn.style.setProperty(
          "--sw-bg",
          gradient
            ? `linear-gradient(${gradient.angle + 90}deg, ${gradient.stops.join(", ")})`
            : normalizeHex(t.bg_color) || "#151515",
        );
        btn.style.setProperty("--sw-title", normalizeHex(t.title_color) || "#ffffff");
        btn.style.setProperty("--sw-icon", normalizeHex(t.icon_color) || "#79ff97");
        btn.style.setProperty("--sw-text", normalizeHex(t.text_color) || "#9f9f9f");
        btn.innerHTML = `<span class="sw-dots"><i></i><i></i><i></i></span>`;
        const label = document.createElement("span");
        label.className = "sw-name";
        label.textContent = name.replace(/[_-]/g, " ");
        btn.append(label);
        btn.addEventListener("click", () => selectTheme(name));
        return btn;
      }),
    );

    if (!names.length) {
      const empty = document.createElement("p");
      empty.className = "theme-empty";
      empty.textContent = "Sin resultados";
      themeGrid.append(empty);
    }
  }

  function syncColorPickers() {
    const t = state.themes[state.theme] || {};
    colorInputs.forEach((input) => {
      const key = input.dataset.color;
      input.value = state.colors[key] || themeColor(t, key) || "#000000";
      input.closest(".color-field").classList.toggle("dirty", key in state.colors);
    });
  }

  function selectTheme(name) {
    state.theme = name;
    themeCurrent.textContent = name;
    renderThemeGrid();
    syncColorPickers();
    scheduleGenerate(0);
  }

  async function loadThemes() {
    try {
      const res = await fetch("/api/themes");
      const data = await res.json();
      state.themes = data.details || {};
    } catch {
      state.themes = { [DEFAULT_THEME]: {} };
    }
    if (!state.themes[state.theme]) state.theme = DEFAULT_THEME in state.themes ? DEFAULT_THEME : Object.keys(state.themes)[0];
    themeCurrent.textContent = state.theme;
    renderThemeGrid();
    syncColorPickers();
    const active = themeGrid.querySelector(".active");
    if (active) themeGrid.scrollTop = active.offsetTop - themeGrid.clientHeight / 2 + active.offsetHeight / 2;
  }

  // ---------- Preview ----------

  function scheduleGenerate(delay = 400) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(generateCard, delay);
  }

  async function generateCard() {
    clearTimeout(debounceTimer);
    const username = usernameInput.value.trim();
    syncUrl();
    if (!username) {
      codeSection.hidden = true;
      showEmptyState();
      return;
    }

    controller?.abort();
    controller = new AbortController();

    setStatus("loading", "Generando…");
    if (previewBody.querySelector("img")) previewBody.classList.add("loading");
    else previewBody.replaceChildren(Object.assign(document.createElement("div"), { className: "skeleton" }));

    try {
      const response = await fetch(cardUrl(), { signal: controller.signal });
      if (!response.ok) {
        const known = ERROR_MESSAGES[response.status];
        const message = typeof known === "function" ? known(username) : known;
        throw new Error(message || `Error inesperado (HTTP ${response.status}).`);
      }

      const blob = await response.blob();
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.alt = `${CARD_LABELS[state.card]} de ${username}`;
      img.src = currentObjectUrl;
      await img.decode().catch(() => {});
      previewBody.replaceChildren(img);
      setStatus("ok", `@${username}`);

      try { localStorage.setItem("rs:username", username); } catch {}
      updateCode();
      codeSection.hidden = false;
    } catch (error) {
      if (error.name === "AbortError") return;
      codeSection.hidden = true;
      setStatus("error", "Error");
      showError(error.message || "No se pudo cargar la tarjeta.");
      console.error(error);
    } finally {
      previewBody.classList.remove("loading");
    }
  }

  // ---------- Code output ----------

  function buildSnippet() {
    const username = usernameInput.value.trim();
    const label = CARD_LABELS[state.card];
    const url = cardUrl();

    if (state.format === "url") return url;
    if (state.format === "html") {
      return `<p align="center">\n  <img src="${url.replace(/&/g, "&amp;")}" alt="${label} de ${username}" />\n</p>`;
    }
    return `![${label}](${url})`;
  }

  function updateCode() {
    markdownCode.textContent = buildSnippet();
  }

  copyCodeBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(markdownCode.textContent);
      showToast("Copiado al portapapeles ✓");
    } catch {
      showToast("No se pudo copiar");
    }
  });

  // ---------- URL state ----------

  function syncUrl() {
    const params = buildParams();
    if (!params.get("username")) params.delete("username");
    if (state.card !== "stats") params.set("card", state.card);
    const qs = params.toString();
    history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  function restoreFromUrl() {
    const params = new URLSearchParams(window.location.search);
    let saved = null;
    try { saved = localStorage.getItem("rs:username"); } catch {}
    usernameInput.value = params.get("username") || saved || "";
    if (params.get("theme")) state.theme = params.get("theme");

    const card = params.get("card");
    if (card && CARD_LABELS[card]) state.card = card;

    for (const el of paramFields) {
      const value = params.get(el.dataset.param);
      if (value === null) continue;
      if (el.type === "checkbox") el.checked = "invert" in el.dataset ? value === "false" : value === "true";
      else el.value = value;
    }

    const hidden = (params.get("hide") || "").split(",");
    statRows.forEach((c) => (c.checked = !hidden.includes(c.dataset.hide)));

    colorInputs.forEach((input) => {
      const key = input.dataset.color;
      const value = params.get(key);
      const gradient = key === "bg_color" && parseGradient(value);
      if (gradient) {
        gradientToggle.checked = true;
        gradientAngle.value = gradient.angle;
        gradientEnd.value = gradient.stops.at(-1);
        state.colors.bg_color = gradient.stops[0];
      } else if (normalizeHex(value)) {
        state.colors[key] = normalizeHex(value);
      }
    });
    gradientFields.hidden = !gradientToggle.checked;
  }

  // ---------- Controls ----------

  function setActiveCard(card) {
    state.card = card;
    tabs.forEach((t) => {
      const active = t.dataset.card === card;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", active);
    });
    $$("[data-only]").forEach((el) => {
      el.hidden = !el.dataset.only.split(" ").includes(card);
    });
  }

  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      setActiveCard(tab.dataset.card);
      generateCard();
    }),
  );

  formatTabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      formatTabs.forEach((t) => t.classList.toggle("active", t === tab));
      state.format = tab.dataset.format;
      updateCode();
    }),
  );

  usernameInput.addEventListener("input", () => scheduleGenerate(600));
  userForm.addEventListener("submit", (e) => {
    e.preventDefault();
    generateCard();
  });

  themeSearch.addEventListener("input", renderThemeGrid);

  ranges.forEach((input) => input.addEventListener("input", () => paintRange(input)));

  // Any option change regenerates the preview (text fields wait a bit longer).
  $$(".controls input").forEach((input) => {
    if (input === themeSearch || input.type === "color") return;
    input.addEventListener("input", () => scheduleGenerate(input.type === "text" ? 700 : 350));
  });

  colorInputs.forEach((input) =>
    input.addEventListener("input", () => {
      state.colors[input.dataset.color] = input.value;
      input.closest(".color-field").classList.add("dirty");
      scheduleGenerate();
    }),
  );

  gradientEnd.addEventListener("input", () => scheduleGenerate());
  gradientToggle.addEventListener("change", () => {
    gradientFields.hidden = !gradientToggle.checked;
  });

  resetBtn.addEventListener("click", () => {
    state.colors = {};
    gradientToggle.checked = false;
    gradientFields.hidden = true;
    const radius = $("border_radius");
    radius.value = radius.dataset.default;
    paintRange(radius);
    syncColorPickers();
    scheduleGenerate(0);
  });

  bgOptions.forEach((btn) =>
    btn.addEventListener("click", () => {
      previewContainer.dataset.bg = btn.dataset.bg;
      bgOptions.forEach((b) => b.classList.toggle("active", b === btn));
    }),
  );

  // ---------- Init ----------

  restoreFromUrl();
  setActiveCard(state.card);
  ranges.forEach(paintRange);
  showEmptyState();
  loadThemes().then(() => {
    if (usernameInput.value.trim()) generateCard();
  });
});
