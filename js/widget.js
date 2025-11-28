// ===== WIDGET LOGIC (ECHO BOT) =====

(function () {
  const panel = document.querySelector(".cgpt-panel");
  const btn = document.querySelector(".cgpt-btn");
  const body = document.querySelector("#cgptBody");
  const input = document.querySelector("#cgptInput");
  const send = document.querySelector("#cgptSend");
  const themeBtn = document.querySelector("#cgptThemeBtn");
  const themePop = document.querySelector("#cgptThemePop");

  /* THEME HANDLING */
  function applyTheme(mode) {
    const root = document.documentElement;
    if (mode === "red") {
      root.style.setProperty("--cgpt-panel-bg", "#fffafa");
      root.style.setProperty("--cgpt-muted", "#7b3a3a");
    } else if (mode === "black") {
      root.style.setProperty("--cgpt-panel-bg", "#0f1115");
      root.style.setProperty("--cgpt-muted", "#9da6b2");
    } else {
      // white
      root.style.setProperty("--cgpt-panel-bg", "#ffffff");
      root.style.setProperty("--cgpt-muted", "#6f6f6f");
    }
    localStorage.setItem("cgpt_standalone_theme", mode);
  }
  const savedTheme = localStorage.getItem("cgpt_standalone_theme") || "red";
  applyTheme(savedTheme);

  /* PANEL OPEN/CLOSE */
  function openPanel() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    setTimeout(() => input.focus(), 120);
  }
  function closePanel() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  btn.addEventListener("click", () => {
    if (panel.classList.contains("open")) closePanel();
    else openPanel();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPanel();
      input.focus();
    }
  });

  /* THEME MENU */
  themeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    themePop.classList.toggle("open");
  });
  themePop.addEventListener("click", (e) => {
    const opt = e.target.closest(".cgpt-theme-opt");
    if (!opt) return;
    const t = opt.getAttribute("data-theme");
    applyTheme(t);
    themePop.classList.remove("open");
  });
  document.addEventListener("click", (e) => {
    if (!themePop.contains(e.target) && e.target !== themeBtn) {
      themePop.classList.remove("open");
    }
  });

  /* MESSAGE RENDERING */
  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function appendMessage(who, text) {
    const el = document.createElement("div");
    el.className = "cgpt-msg " + (who === "user" ? "user" : "bot");
    el.innerHTML = escapeHTML(text)
      .split("\\n")
      .map((l) => "<div>" + l + "</div>")
      .join("");
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  /* SIMPLE ECHO BOT */
  function splitIntoChunks(s) {
    if (!s) return [""];
    const words = s.split(/(\\s+)/);
    const chunks = [];
    let acc = "";
    for (const w of words) {
      acc += w;
      if (acc.length > 20) {
        chunks.push(acc);
        acc = "";
      }
    }
    if (acc) chunks.push(acc);
    return chunks;
  }

  function botEcho(text) {
    const placeholder = appendMessage("bot", "...");
    let acc = "";
    const chunks = splitIntoChunks(text);
    let i = 0;
    const base = 40;
    const timer = setInterval(() => {
      if (i >= chunks.length) {
        clearInterval(timer);
        placeholder.innerHTML = escapeHTML(text)
          .split("\\n")
          .map((l) => "<div>" + l + "</div>")
          .join("");
        body.scrollTop = body.scrollHeight;
        return;
      }
      acc += chunks[i++];
      placeholder.innerHTML = escapeHTML(acc)
        .split("\\n")
        .map((l) => "<div>" + l + "</div>")
        .join("");
      body.scrollTop = body.scrollHeight;
    }, base + Math.random() * 80);
  }

  /* COMPOSER */
  function sendMessage() {
    const t = input.value.trim();
    if (!t) return;
    appendMessage("user", t);
    input.value = "";
    input.style.height = "auto";
    setTimeout(() => botEcho(t), 250 + Math.random() * 400);
  }

  send.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 220) + "px";
  });

  /* INITIAL GREETING */
  appendMessage(
    "bot",
    "Hey! I am the standalone C-GPT demo.\nRight now I just echo what you type.\nLater you can plug me into a real backend / API."
  );
})();
