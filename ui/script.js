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
        apiUrl = `${baseUrl}/api/card/stats?username=${username}&theme=${theme}&show_icons=true`;
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
      const contentType = response.headers.get("content-type");

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

      // Generate markdown code
      const markdown = generateMarkdown(username, theme);
      markdownCode.textContent = markdown;
      codeSection.style.display = "block";
      copyBtn.disabled = false;
    } catch (error) {
      let message = "Error loading card. Please check the username and try again.";
      if (error.message.includes("401") || error.message.includes("token")) {
        message = "GitHub token not configured. Set GITHUB_TOKEN in .env file.";
      } else if (error.message.includes("404") || error.message.includes("not found")) {
        message = "User not found. Please check the username.";
      } else if (error.message) {
        message = error.message;
      }
      previewContainer.innerHTML = `
        <div class="preview-placeholder" style="color: var(--error);">
          ${message}
        </div>`;
      console.error(error);
    }
  }

  function generateMarkdown(username, theme) {
    const baseUrl = window.location.origin;
    const cards = [];

    if (activeCard === "all") {
      cards.push(
        `![Stats](${baseUrl}/api/card/stats?username=${username}&theme=${theme}&show_icons=true)`,
        `![Languages](${baseUrl}/api/card/languages?username=${username}&theme=${theme})`,
        `![Streak](${baseUrl}/api/card/streak?username=${username}&theme=${theme})`
      );
    } else {
      const cardName = activeCard.charAt(0).toUpperCase() + activeCard.slice(1);
      const extraParams = activeCard === "stats" ? "&show_icons=true" : "";
      cards.push(`![${cardName}](${baseUrl}/api/card/${activeCard}?username=${username}&theme=${theme}${extraParams})`);
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
