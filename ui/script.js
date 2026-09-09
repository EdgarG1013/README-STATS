document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const themeSelect = document.getElementById("theme");
  const tabs = document.querySelectorAll(".tab");
  const previewContainer = document.getElementById("preview-container");
  const generateBtn = document.getElementById("generate-btn");
  const copyBtn = document.getElementById("copy-btn");
  const codeSection = document.getElementById("code-section");
  const markdownCode = document.getElementById("markdown-code");
  const copyCodeBtn = document.getElementById("copy-code");

  let activeCard = "stats";
  let currentUsername = "";

  // Tab switching
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeCard = tab.dataset.card;

      if (currentUsername) {
        generateCard();
      }
    });
  });

  // Generate card
  generateBtn.addEventListener("click", generateCard);

  usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      generateCard();
    }
  });

  async function generateCard() {
    const username = usernameInput.value.trim();
    if (!username) {
      previewContainer.innerHTML = `
        <div class="preview-placeholder">
          Please enter a GitHub username
        </div>`;
      return;
    }

    currentUsername = username;
    const theme = themeSelect.value;
    const baseUrl = window.location.origin;

    let apiUrl;
    switch (activeCard) {
      case "stats":
        apiUrl = `${baseUrl}/api/card/stats?username=${username}&theme=${theme}`;
        break;
      case "languages":
        apiUrl = `${baseUrl}/api/card/languages?username=${username}&theme=${theme}`;
        break;
      case "streak":
        apiUrl = `${baseUrl}/api/card/streak?username=${username}&theme=${theme}`;
        break;
      case "contributions":
        apiUrl = `${baseUrl}/api/card/contributions?username=${username}&theme=${theme}`;
        break;
      default:
        apiUrl = `${baseUrl}/api/card/stats?username=${username}&theme=${theme}`;
    }

    try {
      previewContainer.innerHTML = `
        <div class="preview-placeholder">
          Loading...
        </div>`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const svg = await response.text();
      previewContainer.innerHTML = svg;

      // Generate markdown code
      const markdown = generateMarkdown(username, theme);
      markdownCode.textContent = markdown;
      codeSection.style.display = "block";
      copyBtn.disabled = false;
    } catch (error) {
      previewContainer.innerHTML = `
        <div class="preview-placeholder" style="color: var(--error);">
          Error loading card. Please check the username and try again.
        </div>`;
      console.error(error);
    }
  }

  function generateMarkdown(username, theme) {
    const baseUrl = window.location.origin;
    const cards = [];

    if (activeCard === "all") {
      cards.push(
        `![Stats](${baseUrl}/api/card/stats?username=${username}&theme=${theme})`,
        `![Languages](${baseUrl}/api/card/languages?username=${username}&theme=${theme})`,
        `![Streak](${baseUrl}/api/card/streak?username=${username}&theme=${theme})`
      );
    } else {
      const cardName = activeCard.charAt(0).toUpperCase() + activeCard.slice(1);
      cards.push(`![${cardName}](${baseUrl}/api/card/${activeCard}?username=${username}&theme=${theme})`);
    }

    return cards.join("\n");
  }

  // Copy to clipboard
  copyBtn.addEventListener("click", () => {
    const markdown = markdownCode.textContent;
    navigator.clipboard.writeText(markdown).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    });
  });

  copyCodeBtn.addEventListener("click", () => {
    const markdown = markdownCode.textContent;
    navigator.clipboard.writeText(markdown).then(() => {
      const originalText = copyCodeBtn.textContent;
      copyCodeBtn.textContent = "Copied!";
      setTimeout(() => {
        copyCodeBtn.textContent = originalText;
      }, 2000);
    });
  });
});
