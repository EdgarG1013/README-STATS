document.addEventListener("DOMContentLoaded", () => {
  // ── Elements ──────────────────────────────────────────────
  const usernameInput   = document.getElementById("username");
  const themeSelect     = document.getElementById("theme");
  const tabs            = document.querySelectorAll(".tab");
  const previewContainer= document.getElementById("preview-container");
  const generateBtn     = document.getElementById("generate-btn");
  const copyBtn         = document.getElementById("copy-btn");
  const downloadBtn     = document.getElementById("download-btn");
  const codeSection     = document.getElementById("code-section");
  const markdownCode    = document.getElementById("markdown-code");
  const copyCodeBtn     = document.getElementById("copy-code");
  const toastEl         = document.getElementById("toast");

  // Colors
  const colorIds = ["title_color","text_color","icon_color","bg_color","border_color","ring_color"];

  // Appearance
  const borderRadiusInput = document.getElementById("border_radius");
  const radiusValue       = document.getElementById("radius-value");
  const cardWidthInput    = document.getElementById("card_width");
  const widthValue        = document.getElementById("width-value");
  const showIconsInput    = document.getElementById("show_icons");
  const hideTitleInput    = document.getElementById("hide_title");
  const hideBorderInput   = document.getElementById("hide_border");
  const hideRankInput     = document.getElementById("hide_rank");

  // Stats hide
  const hideStars   = document.getElementById("hide_stars");
  const hideCommits = document.getElementById("hide_commits");
  const hidePRs     = document.getElementById("hide_prs");
  const hideIssues  = document.getElementById("hide_issues");
  const hideContribs= document.getElementById("hide_contribs");

  // Languages
  const langsCountInput = document.getElementById("langs_count");
  const langsCountValue = document.getElementById("langs-count-value");
  const layoutBtns      = document.querySelectorAll(".seg");
  const hideProgressInput = document.getElementById("hide_progress");

  // Contributions
  const contribDaysInput = document.getElementById("contrib_days");
  const daysValue        = document.getElementById("days-value");

  // Card-specific option panels
  const statsOptions    = document.getElementById("stats-options");
  const langsOptions    = document.getElementById("languages-options");
  const contribOptions  = document.getElementById("contributions-options");

  // ── State ─────────────────────────────────────────────────
  let activeCard      = "stats";
  let activeLayout    = "compact";
  let currentUrl      = "";
  let debounceTimer   = null;
  let customColorsOn  = false;

  // ── Collapsible sections ──────────────────────────────────
  document.querySelectorAll(".section-header").forEach(header => {
    header.addEventListener("click", () => {
      const bodyId = header.dataset.toggle;
      const body   = document.getElementById(bodyId);
      if (!body) return;
      const collapsed = body.style.display === "none";
      body.style.display = collapsed ? "" : "none";
      header.classList.toggle("collapsed", !collapsed);
    });
  });

  // ── Tab switching ─────────────────────────────────────────
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeCard = tab.dataset.card;
      updateCardSpecificUI();
      scheduleAutoGenerate();
    });
  });

  function updateCardSpecificUI() {
    statsOptions.style.display   = activeCard === "stats"         ? "" : "none";
    langsOptions.style.display   = activeCard === "languages"     ? "" : "none";
    contribOptions.style.display = activeCard === "contributions" ? "" : "none";

    // ring color only relevant for stats
    document.getElementById("ring-color-row").style.display =
      activeCard === "stats" ? "" : "none";

    // hide-rank only for stats
    document.getElementById("hide-rank-row").style.display =
      activeCard === "stats" ? "" : "none";

    // show-icons only for stats/languages
    document.getElementById("show-icons-row").style.display =
      (activeCard === "stats" || activeCard === "languages") ? "" : "none";

    // card-width row hidden for contributions (fixed size)
    document.getElementById("card-width-row").style.display =
      activeCard === "contributions" ? "none" : "";
  }

  // ── Layout segmented control ──────────────────────────────
  layoutBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      layoutBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeLayout = btn.dataset.value;
      scheduleAutoGenerate();
    });
  });

  // ── Sliders ───────────────────────────────────────────────
  borderRadiusInput.addEventListener("input", () => {
    radiusValue.textContent = borderRadiusInput.value;
    scheduleAutoGenerate();
  });

  cardWidthInput.addEventListener("input", () => {
    widthValue.textContent = cardWidthInput.value;
    scheduleAutoGenerate();
  });

  langsCountInput.addEventListener("input", () => {
    langsCountValue.textContent = langsCountInput.value;
    scheduleAutoGenerate();
  });

  contribDaysInput.addEventListener("input", () => {
    daysValue.textContent = contribDaysInput.value;
    scheduleAutoGenerate();
  });

  // ── Color pickers ─────────────────────────────────────────
  colorIds.forEach(id => {
    const picker = document.getElementById(id);
    const hexInput = document.getElementById(id + "_hex");
    if (!picker || !hexInput) return;

    picker.addEventListener("input", () => {
      const hex = picker.value.replace("#", "");
      hexInput.value = hex.toUpperCase();
      customColorsOn = true;
      scheduleAutoGenerate();
    });

    hexInput.addEventListener("input", () => {
      const val = hexInput.value.replace(/[^0-9a-fA-F]/g, "");
      hexInput.value = val.toUpperCase();
      if (val.length === 6) {
        picker.value = "#" + val;
        customColorsOn = true;
        scheduleAutoGenerate();
      }
    });
  });

  document.getElementById("reset-colors-btn").addEventListener("click", () => {
    customColorsOn = false;
    scheduleAutoGenerate();
    showToast("Colors reset to theme defaults");
  });

  // ── Toggles & checkboxes ──────────────────────────────────
  [showIconsInput, hideTitleInput, hideBorderInput, hideRankInput,
   hideStars, hideCommits, hidePRs, hideIssues, hideContribs,
   hideProgressInput].forEach(el => {
    if (el) el.addEventListener("change", scheduleAutoGenerate);
  });

  // ── Theme change ──────────────────────────────────────────
  themeSelect.addEventListener("change", () => {
    customColorsOn = false;
    scheduleAutoGenerate();
  });

  // ── Username input ────────────────────────────────────────
  usernameInput.addEventListener("input", scheduleAutoGenerate);
  usernameInput.addEventListener("keypress", e => {
    if (e.key === "Enter") generateCard();
  });

  generateBtn.addEventListener("click", generateCard);

  // ── Auto-generate with debounce ───────────────────────────
  function scheduleAutoGenerate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (usernameInput.value.trim()) generateCard();
    }, 600);
  }

  // ── Build API URL ─────────────────────────────────────────
  function buildUrl(username) {
    const base  = window.location.origin;
    const theme = themeSelect.value;
    const params = new URLSearchParams({ username, theme });

    // Custom colors (override theme)
    if (customColorsOn) {
      colorIds.forEach(id => {
        if (id === "ring_color" && activeCard !== "stats") return;
        const hexInput = document.getElementById(id + "_hex");
        if (hexInput) params.set(id, hexInput.value.toLowerCase());
      });
    }

    // Appearance
    params.set("border_radius", borderRadiusInput.value);

    if (activeCard !== "contributions") {
      params.set("card_width", cardWidthInput.value);
    }

    if (hideBorderInput.checked) params.set("hide_border", "true");
    if (hideTitleInput.checked)  params.set("hide_title",  "true");

    if (activeCard === "stats" || activeCard === "languages") {
      if (showIconsInput.checked) params.set("show_icons", "true");
    }

    if (activeCard === "stats") {
      if (hideRankInput.checked) params.set("hide_rank", "true");

      const hidden = [];
      if (hideStars.checked)   hidden.push("stars");
      if (hideCommits.checked) hidden.push("commits");
      if (hidePRs.checked)     hidden.push("prs");
      if (hideIssues.checked)  hidden.push("issues");
      if (hideContribs.checked) hidden.push("contribs");
      if (hidden.length) params.set("hide", hidden.join(","));

      return `${base}/api/card/stats?${params}`;
    }

    if (activeCard === "languages") {
      params.set("layout",     activeLayout);
      params.set("langs_count", langsCountInput.value);
      if (hideProgressInput.checked) params.set("hide_progress", "true");
      return `${base}/api/card/languages?${params}`;
    }

    if (activeCard === "streak") {
      return `${base}/api/card/streak?${params}`;
    }

    if (activeCard === "contributions") {
      params.set("days", contribDaysInput.value);
      return `${base}/api/card/contributions?${params}`;
    }

    return `${base}/api/card/stats?${params}`;
  }

  // ── Generate card ─────────────────────────────────────────
  async function generateCard() {
    const username = usernameInput.value.trim();
    if (!username) {
      previewContainer.innerHTML = `
        <div class="preview-placeholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
          <p>Enter your GitHub username to preview</p>
        </div>`;
      return;
    }

    const apiUrl = buildUrl(username);
    currentUrl   = apiUrl;

    previewContainer.innerHTML = `
      <div class="loading-wrapper">
        <div class="spinner"></div>
        <span>Fetching stats…</span>
      </div>`;

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.secondaryMessage || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const svg = await response.text();
      previewContainer.innerHTML = svg;

      // Update markdown
      markdownCode.textContent = buildMarkdown(username, apiUrl);
      codeSection.style.display = "block";
      copyBtn.disabled    = false;
      downloadBtn.disabled = false;

    } catch (error) {
      let message = "Error loading card. Check the username and try again.";
      if (error.message.includes("401") || error.message.includes("token")) {
        message = "GitHub token not configured. Add GITHUB_TOKEN to your .env file.";
      } else if (error.message.includes("404") || error.message.includes("not found")) {
        message = "User not found. Please check the username.";
      } else if (error.message) {
        message = error.message;
      }
      previewContainer.innerHTML = `
        <div class="preview-placeholder" style="color:var(--error)">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>${message}</p>
        </div>`;
    }
  }

  // ── Build markdown ────────────────────────────────────────
  function buildMarkdown(username, url) {
    const cardName = activeCard.charAt(0).toUpperCase() + activeCard.slice(1);
    return `![${cardName}](${url})`;
  }

  // ── Copy markdown ─────────────────────────────────────────
  function copyToClipboard(text, label = "Copied!") {
    navigator.clipboard.writeText(text).then(() => showToast(label));
  }

  copyBtn.addEventListener("click", () => {
    copyToClipboard(markdownCode.textContent, "Markdown copied!");
  });

  copyCodeBtn.addEventListener("click", () => {
    copyToClipboard(markdownCode.textContent, "Copied!");
  });

  // ── Download SVG ──────────────────────────────────────────
  downloadBtn.addEventListener("click", () => {
    const svgEl = previewContainer.querySelector("svg");
    if (!svgEl) return;
    const blob = new Blob([svgEl.outerHTML], { type: "image/svg+xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `github-stats-${activeCard}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("SVG downloaded!");
  });

  // ── Toast ─────────────────────────────────────────────────
  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  // ── Init ──────────────────────────────────────────────────
  updateCardSpecificUI();
});
