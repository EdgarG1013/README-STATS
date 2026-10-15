document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const usernameInput = $("username");
  const themeSearch = $("theme-search");
  const themeGrid = $("theme-grid");
  const themeCurrent = $("theme-current");
  const tabs = document.querySelectorAll(".tab");
  const formatTabs = document.querySelectorAll(".format-tab");
  const previewContainer = $("preview-container");
  const previewBody = $("preview-body");
  const bgToggle = $("bg-toggle");
  const codeSection = $("code-section");
  const markdownCode = $("markdown-code");
  const copyCodeBtn = $("copy-code");
  const resetBtn = $("reset-btn");
  const toast = $("toast");
  const colorInputs = document.querySelectorAll(".color-grid input[type=color]");
  const ranges = ["border_radius", "langs_count", "days"].map($);

  const DEFAULTS = { theme: "dracula", border_radius: "14", langs_count: "6", days: "31" };
  const CARD_LABELS = {
    stats: "GitHub Stats",
    languages: "Top Languages",
    streak: "GitHub Streak",
    contributions: "Contribution Graph",
    all: "GitHub Stats",
  };

  const state = {
    card: "stats",
    format: "markdown",
    theme: DEFAULTS.theme,
    themes: {},
    colors: {}, // only colors the user explicitly changed
  };

  let debounceTimer;
  let controller;
  let currentObjectUrl;

  // ---------- Helpers ----------

  const normalizeHex = (hex) => {
    if (!hex) return null;
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : null;
  };

  function buildParams(card = state.card) {
    const params = new URLSearchParams({ username: usernameInput.value.trim() });
    if (state.theme !== DEFAULTS.theme) params.set("theme", state.theme);
    for (const [key, value] of Object.entries(state.colors)) params.set(key, value.replace("#", ""));

    const radius = $("border_radius").value;
    if (radius !== DEFAULTS.border_radius) params.set("border_radius", radius);
    if (["languages", "all"].includes(card) && $("langs_count").value !== DEFAULTS.langs_count) {
      params.set("langs_count", $("langs_count").value);
    }
    if (["contributions", "all"].includes(card) && $("days").value !== DEFAULTS.days) {
      params.set("days", $("days").value);
    }
    return params;
  }

  const cardUrl = (card = state.card) =>
    `${window.location.origin}/api/card/${card}?${buildParams(card).toString()}`;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("visible"), 1800);
  }

  function setPlaceholder(message, isError = false) {
    const p = document.createElement("p");
    p.className = "preview-placeholder" + (isError ? " error" : "");
    p.textContent = message;
    previewBody.replaceChildren(p);
    if (isError) {
      const retry = document.createElement("button");
      retry.className = "btn small ghost";
      retry.textContent = "Reintentar";
      retry.addEventListener("click", generateCard);
      previewBody.append(retry);
    }
  }

  // ---------- Themes ----------

  function renderThemeGrid() {
    const query = themeSearch.value.trim().toLowerCase();
    const names = Object.keys(state.themes).filter((n) => n.toLowerCase().includes(query));

    themeGrid.replaceChildren(
      ...names.map((name) => {
        const t = state.themes[name];
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "theme-swatch" + (name === state.theme ? " active" : "");
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", name === state.theme);
        btn.title = name;
        btn.style.setProperty("--sw-bg", normalizeHex(t.bg_color) || "#151515");
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
      const key = input.dataset.param;
      input.value = state.colors[key] || normalizeHex(t[key]) || "#000000";
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
      state.themes = { [DEFAULTS.theme]: {} };
    }
    if (!state.themes[state.theme]) state.theme = Object.keys(state.themes)[0];
    themeCurrent.textContent = state.theme;
    renderThemeGrid();
    syncColorPickers();
    themeGrid.querySelector(".active")?.scrollIntoView({ block: "nearest" });
  }

  // ---------- Preview ----------

  function scheduleGenerate(delay = 400) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(generateCard, delay);
  }

  async function generateCard() {
    const username = usernameInput.value.trim();
    syncUrl();
    if (!username) {
      codeSection.hidden = true;
      setPlaceholder("Escribe un usuario de GitHub para ver la vista previa");
      return;
    }

    controller?.abort();
    controller = new AbortController();

    const hasImage = previewBody.querySelector("img");
    if (hasImage) previewBody.classList.add("loading");
    else previewBody.replaceChildren(Object.assign(document.createElement("div"), { className: "skeleton" }));

    try {
      const response = await fetch(cardUrl(), { signal: controller.signal });
      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try {
          const data = await response.json();
          msg = data.error || data.secondaryMessage || msg;
        } catch {}
        throw new Error(msg);
      }

      const blob = await response.blob();
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.alt = `${CARD_LABELS[state.card]} de ${username}`;
      img.src = currentObjectUrl;
      await img.decode().catch(() => {});
      previewBody.replaceChildren(img);

      try { localStorage.setItem("rs:username", username); } catch {}
      updateCode();
      codeSection.hidden = false;
    } catch (error) {
      if (error.name === "AbortError") return;
      const m = error.message.toLowerCase();
      let message = error.message || "No se pudo cargar la tarjeta.";
      if (m.includes("token")) message = "Token de GitHub no configurado. Define GITHUB_TOKEN en el archivo .env.";
      else if (m.includes("404") || m.includes("not found") || m.includes("could not resolve")) {
        message = `No se encontró el usuario "${username}".`;
      }
      codeSection.hidden = true;
      setPlaceholder(message, true);
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
      return `<p align="center">\n  <img src="${url}" alt="${label} de ${username}" />\n</p>`;
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
    if (card && CARD_LABELS[card]) setActiveCard(card);

    ranges.forEach((input) => {
      if (params.has(input.id)) input.value = params.get(input.id);
      $(`${input.id}-value`).textContent = input.value;
    });

    colorInputs.forEach((input) => {
      const hex = normalizeHex(params.get(input.dataset.param));
      if (hex) state.colors[input.dataset.param] = hex;
    });
    if (Object.keys(state.colors).length) $("customize").open = true;
  }

  // ---------- Controls ----------

  function setActiveCard(card) {
    state.card = card;
    tabs.forEach((t) => {
      const active = t.dataset.card === card;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", active);
    });
    document.querySelectorAll("[data-only]").forEach((el) => {
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
  usernameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") scheduleGenerate(0);
  });

  themeSearch.addEventListener("input", renderThemeGrid);

  ranges.forEach((input) =>
    input.addEventListener("input", () => {
      $(`${input.id}-value`).textContent = input.value;
      scheduleGenerate();
    }),
  );

  colorInputs.forEach((input) =>
    input.addEventListener("input", () => {
      state.colors[input.dataset.param] = input.value;
      input.closest(".color-field").classList.add("dirty");
      scheduleGenerate();
    }),
  );

  resetBtn.addEventListener("click", () => {
    state.colors = {};
    syncColorPickers();
    scheduleGenerate(0);
  });

  bgToggle.addEventListener("click", () => {
    const next = previewContainer.dataset.bg === "dark" ? "light" : "dark";
    previewContainer.dataset.bg = next;
    bgToggle.textContent = `Fondo: ${next === "dark" ? "oscuro" : "claro"}`;
  });

  // ---------- Init ----------

  restoreFromUrl();
  setActiveCard(state.card);
  loadThemes().then(() => {
    if (usernameInput.value.trim()) generateCard();
  });
});
