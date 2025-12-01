// js/widget.js

// -------------------------------------
// CHAT RENDERING ENGINE (window.CGPT_CHAT)
// -------------------------------------
window.CGPT_CHAT = (function () {
  const bodyEl = document.querySelector("#cgptBody");
  if (!bodyEl) {
    console.warn("C-GPT: #cgptBody not found – chat messages will not render.");
  }

  function createMessageElement(role, text) {
    const wrapper = document.createElement("div");
    wrapper.className =
      "cgpt-msg " + (role === "user" ? "cgpt-msg--user" : "cgpt-msg--bot");

    const bubble = document.createElement("div");
    bubble.className = "cgpt-msg-bubble";
    bubble.textContent = text;

    wrapper.appendChild(bubble);
    return wrapper;
  }

  function appendMessage(role, text) {
    if (!bodyEl) return;
    const el = createMessageElement(role, text);
    bodyEl.appendChild(el);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function botEcho(text) {
    appendMessage("bot", text);
  }

  return {
    appendMessage,
    botEcho,
  };
})();

// -------------------------------------
// WIDGET LOGIC
// -------------------------------------
(function () {
  // -------------------------------
  // CONFIG
  // -------------------------------
  const API_BASE = "https://chat-bot-tcs.onrender.com";
  // For local dev with local backend:
  // const API_BASE = "http://localhost:4000";

  // -------------------------------
  // DOM ELEMENTS
  // -------------------------------
  const panel = document.querySelector(".cgpt-panel");
  const btn = document.querySelector(".cgpt-btn");
  const input = document.querySelector("#cgptInput");
  const send = document.querySelector("#cgptSend");
  const bodyEl = document.querySelector("#cgptBody");

  const shareBtn = document.querySelector("#cgptShareBtn");
  const loginBtn = document.querySelector("#cgptLoginBtn");

  const loginModal = document.querySelector("#cgptLoginModal");
  const loginClose = document.querySelector("#cgptLoginClose");
  const loginCancel = document.querySelector("#cgptLoginCancel");
  const loginForm = document.querySelector("#cgptLoginForm");
  const loginUser = document.querySelector("#cgptLoginUser");
  const loginPass = document.querySelector("#cgptLoginPass");
  const loginPhone = document.querySelector("#cgptLoginPhone");
  const loginEmail = document.querySelector("#cgptLoginEmail");
  const loginMethod = document.querySelector("#cgptLoginMethod");
  const loginOtp = document.querySelector("#cgptLoginOtp");
  const loginError = document.querySelector("#cgptLoginError");
  const subtitleEl = document.querySelector(".cgpt-subtitle");

  const phoneField = document.querySelector("#cgptPhoneField");
  const emailField = document.querySelector("#cgptEmailField");

  const sendOtpBtn = document.querySelector("#cgptSendOtpBtn");
  const otpStatus = document.querySelector("#cgptOtpStatus");

  // NEW: menu bar + buttons + upload
  const menuBar = document.querySelector("#cgptMenuBar");
  const btnBalance = document.querySelector("#cgptBtnBalance");
  const btnMini = document.querySelector("#cgptBtnMini");
  const btnFull = document.querySelector("#cgptBtnFull");
  const btnFaq = document.querySelector("#cgptBtnFaq");
  const btnLLM = document.querySelector("#cgptBtnLLM");
  const uploadBtn = document.querySelector("#cgptUploadBtn");
  const fileInput = document.querySelector("#cgptFileInput");

  // THEME UI
  const themeBtn = document.querySelector("#cgptThemeBtn");
  const themePop = document.querySelector("#cgptThemePop");
  const themeOptions = document.querySelectorAll(".cgpt-theme-opt");
  const rootHtml = document.documentElement;

  // -------------------------------
  // SESSION / AUTH STATE
  // -------------------------------
  const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 mins inactivity
  let authToken = null;
  let isLoggedIn = false;
  let lastActivity = 0;
  let sessionTimeoutId = null;

  // app modes: menu | llm
  let appMode = "menu";

  // -------------------------------
  // MENU BAR HELPERS
  // -------------------------------
  function showMenuBar() {
    if (!menuBar) return;
    menuBar.style.display = "flex";
    menuBar.setAttribute("aria-hidden", "false");
  }

  function hideMenuBar() {
    if (!menuBar) return;
    menuBar.style.display = "none";
    menuBar.setAttribute("aria-hidden", "true");
  }

  hideMenuBar(); // start hidden

  // -------------------------------
  // AUTH UI
  // -------------------------------
  function updateAuthUI() {
    if (!loginBtn) return;
    if (isLoggedIn) {
      loginBtn.textContent = "Log out";
      if (subtitleEl) subtitleEl.textContent = "Signed in";
    } else {
      loginBtn.textContent = "Log in";
      if (subtitleEl) subtitleEl.textContent = "Bank Bot 🤖";
    }
  }

  function forceLogout(reason) {
    isLoggedIn = false;
    authToken = null;
    lastActivity = 0;
    if (sessionTimeoutId) {
      clearTimeout(sessionTimeoutId);
      sessionTimeoutId = null;
    }
    updateAuthUI();
    hideMenuBar();

    if (!window.CGPT_CHAT) return;

    if (reason === "inactivity") {
      window.CGPT_CHAT.appendMessage(
        "bot",
        "Your session expired due to 10 minutes of inactivity. Please log in again."
      );
    } else if (reason === "auth" || reason === "manual") {
      window.CGPT_CHAT.appendMessage("bot", "You have been logged out.");
    }
  }

  function scheduleSessionTimeout() {
    if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
    if (!isLoggedIn || !lastActivity) return;

    const now = Date.now();
    const elapsed = now - lastActivity;
    const remaining = SESSION_DURATION_MS - elapsed;

    if (remaining <= 0) {
      forceLogout("inactivity");
      return;
    }

    sessionTimeoutId = setTimeout(() => {
      forceLogout("inactivity");
    }, remaining);
  }

  function markActivity() {
    if (!isLoggedIn) return;
    lastActivity = Date.now();
    scheduleSessionTimeout();
  }

  updateAuthUI();

  // -------------------------------
  // THEME SWITCHER
  // -------------------------------
  function closeThemePop() {
    if (!themePop) return;
    themePop.setAttribute("aria-hidden", "true");
    themePop.style.display = "none";
  }

  function openThemePop() {
    if (!themePop) return;
    themePop.style.display = "block";
    themePop.setAttribute("aria-hidden", "false");
  }

  if (themeBtn && themePop) {
    themeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = themePop.getAttribute("aria-hidden") === "false";
      if (isOpen) closeThemePop();
      else openThemePop();
    });

    document.addEventListener("click", (e) => {
      if (!themePop) return;
      if (
        !themePop.contains(e.target) &&
        e.target !== themeBtn &&
        themePop.getAttribute("aria-hidden") === "false"
      ) {
        closeThemePop();
      }
    });
  }

  if (themeOptions && rootHtml) {
    themeOptions.forEach((opt) => {
      opt.addEventListener("click", () => {
        const theme = opt.getAttribute("data-theme") || "red";
        rootHtml.setAttribute("data-cgpt-theme", theme);
        closeThemePop();
      });
    });
  }

  // -------------------------------
  // PANEL OPEN/CLOSE
  // -------------------------------
  function openPanel() {
    if (!panel) return;
    panel.style.display = "flex";
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    setTimeout(() => input && input.focus(), 130);
    markActivity();
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove("open");
    panel.style.display = "none";
    panel.setAttribute("aria-hidden", "true");
  }

  if (btn) {
    btn.addEventListener("click", () => {
      if (panel && panel.classList.contains("open")) closePanel();
      else openPanel();
    });
  }

  // -------------------------------
  // LOGIN MODAL OPEN/CLOSE
  // -------------------------------
  function clearLoginFields() {
    if (loginUser) loginUser.value = "";
    if (loginPass) loginPass.value = "";
    if (loginPhone) loginPhone.value = "";
    if (loginEmail) loginEmail.value = "";
    if (loginOtp) loginOtp.value = "";
    if (loginError) loginError.textContent = "";
    if (otpStatus) {
      otpStatus.textContent = "";
      otpStatus.style.color = "";
    }
  }

  function openLoginModal() {
    if (!loginModal) return;
    loginModal.style.display = "flex";
    loginModal.classList.add("open");
    loginModal.setAttribute("aria-hidden", "false");

    if (loginError) loginError.textContent = "";
    if (otpStatus) {
      otpStatus.textContent =
        "Choose OTP method, enter phone/email, then click Send OTP.";
      otpStatus.style.color = "var(--cgpt-muted)";
    }

    if (loginMethod) loginMethod.value = "phone";
    if (phoneField) phoneField.style.display = "";
    if (emailField) emailField.style.display = "none";

    loginUser && loginUser.focus();
  }

  function closeLoginModal() {
    if (!loginModal) return;
    loginModal.classList.remove("open");
    loginModal.style.display = "none";
    loginModal.setAttribute("aria-hidden", "true");
    clearLoginFields();
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      if (isLoggedIn) {
        forceLogout("manual");
      } else {
        openLoginModal();
      }
    });
  }

  loginClose && loginClose.addEventListener("click", closeLoginModal);
  loginCancel && loginCancel.addEventListener("click", closeLoginModal);

  loginModal &&
    loginModal.addEventListener("click", (e) => {
      if (e.target === loginModal) closeLoginModal();
    });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (loginModal && loginModal.classList.contains("open")) {
        closeLoginModal();
      } else if (panel && panel.classList.contains("open")) {
        closePanel();
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPanel();
      input && input.focus();
    }
  });

  // -------------------------------
  // OTP METHOD SWITCH
  // -------------------------------
  if (loginMethod) {
    loginMethod.addEventListener("change", () => {
      const method = loginMethod.value;
      if (method === "phone") {
        if (phoneField) phoneField.style.display = "";
        if (emailField) emailField.style.display = "none";
      } else {
        if (phoneField) phoneField.style.display = "none";
        if (emailField) emailField.style.display = "";
      }
      if (otpStatus) {
        otpStatus.textContent =
          "Enter your " +
          (method === "phone" ? "phone number" : "email") +
          " and click Send OTP.";
        otpStatus.style.color = "var(--cgpt-muted)";
      }
    });
  }

  // -------------------------------
  // SHARE BUTTON
  // -------------------------------
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      window.open(window.location.href, "_blank", "noopener,noreferrer");
    });
  }

  // -------------------------------
  // API HELPERS
  // -------------------------------
  async function apiPost(path, body) {
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: "Bearer " + authToken } : {}),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (res.status === 401) {
      forceLogout("auth");
    }

    if (!res.ok) {
      try {
        const json = JSON.parse(text);
        if (json && json.error) {
          throw new Error(json.error);
        }
      } catch {
        // ignore parse
      }
      throw new Error(text || "API error");
    }

    return text ? JSON.parse(text) : {};
  }

  async function apiGet(path) {
    const res = await fetch(API_BASE + path, {
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: "Bearer " + authToken } : {}),
      },
    });

    const text = await res.text();

    if (res.status === 401) {
      forceLogout("auth");
    }

    if (!res.ok) {
      try {
        const json = JSON.parse(text);
        if (json && json.error) {
          throw new Error(json.error);
        }
      } catch {
        // ignore
      }
      throw new Error(text || "API error");
    }

    return text ? JSON.parse(text) : {};
  }

  // -------------------------------
  // SEND OTP
  // -------------------------------
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener("click", async () => {
      if (!loginMethod || !otpStatus) return;
      const method = loginMethod.value;
      const phone = loginPhone ? loginPhone.value.trim() : "";
      const email = loginEmail ? loginEmail.value.trim() : "";

      otpStatus.style.color = "var(--cgpt-muted)";

      try {
        if (method === "phone") {
          if (!/^\d{10}$/.test(phone)) {
            otpStatus.textContent = "Enter a valid 10-digit phone number.";
            otpStatus.style.color = "#ef4444";
            return;
          }
          await apiPost("/auth/send-otp", { method: "phone", phone });
          otpStatus.textContent =
            "OTP request sent for phone " +
            phone +
            ". Please check your SMS (demo logs if configured).";
        } else {
          if (!email || !email.includes("@")) {
            otpStatus.textContent = "Enter a valid email.";
            otpStatus.style.color = "#ef4444";
            return;
          }
          await apiPost("/auth/send-otp", { method: "email", email });
          otpStatus.textContent =
            "OTP request sent for email " +
            email +
            ". Please check your inbox.";
        }
      } catch (err) {
        console.error(err);
        otpStatus.textContent =
          err && err.message
            ? err.message
            : "Failed to send OTP. Check backend.";
        otpStatus.style.color = "#ef4444";
      }
    });
  }

  // -------------------------------
  // LOGIN SUBMIT
  // -------------------------------
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!loginUser || !loginPass || !loginMethod || !loginOtp || !loginError)
        return;

      const username = loginUser.value.trim();
      const password = loginPass.value.trim();
      const method = loginMethod.value;
      const phone = loginPhone ? loginPhone.value.trim() : "";
      const email = loginEmail ? loginEmail.value.trim() : "";
      const otp = loginOtp.value.trim();

      loginError.textContent = "";

      if (!username || !password || !otp) {
        loginError.textContent = "Username, password and OTP are required.";
        return;
      }

      if (method === "phone" && !/^\d{10}$/.test(phone)) {
        loginError.textContent = "Enter a valid 10-digit phone number.";
        return;
      }
      if (method === "email" && (!email || !email.includes("@"))) {
        loginError.textContent = "Enter a valid email.";
        return;
      }

      try {
        const payload = {
          username,
          password,
          method,
          otp,
        };
        if (method === "phone") payload.phone = phone;
        if (method === "email") payload.email = email;

        const res = await apiPost("/auth/login", payload);
        authToken = res.token;
        isLoggedIn = true;
        lastActivity = Date.now();
        scheduleSessionTimeout();
        updateAuthUI();

        closeLoginModal();

        if (window.CGPT_CHAT) {
          window.CGPT_CHAT.appendMessage(
            "bot",
            `Welcome, ${res.user.name}!\nYour secure banking session is now active.`
          );
        }

        appMode = "menu";
        showBankingMenu();
      } catch (err) {
        console.error(err);
        const msg =
          (err && err.message) || "Login failed. Check credentials and OTP.";
        loginError.textContent = msg;
        isLoggedIn = false;
        authToken = null;
        lastActivity = 0;
        if (sessionTimeoutId) {
          clearTimeout(sessionTimeoutId);
          sessionTimeoutId = null;
        }
        updateAuthUI();
        hideMenuBar();
      }
    });
  }

  // -------------------------------
  // BANKING MENU & HANDLERS
  // -------------------------------
  function showBankingMenu() {
    if (!window.CGPT_CHAT) return;

    showMenuBar();

    window.CGPT_CHAT.appendMessage(
      "bot",
      "Please choose an option (or use the buttons below):\n\n" +
        "1️⃣ Account Balance\n" +
        "2️⃣ Mini Statement (last 5 txns)\n" +
        "3️⃣ Account Statement (full)\n" +
        "4️⃣ FAQ\n" +
        "5️⃣ Chat with support bot (LLM mode)"
    );
  }

  async function handleBalance() {
    if (!window.CGPT_CHAT) return;
    if (!authToken) {
      window.CGPT_CHAT.appendMessage(
        "bot",
        "Please log in to view your balance."
      );
      return;
    }

    try {
      const data = await apiGet("/bank/balance");
      window.CGPT_CHAT.appendMessage(
        "bot",
        `Account Balance:\n\nAccount No: ${
          data.accountNumber
        }\nBalance: ₹${Number(data.balance).toFixed(2)}`
      );
    } catch (err) {
      console.error(err);
      window.CGPT_CHAT.appendMessage(
        "bot",
        err.message || "Unable to fetch balance right now."
      );
    }
  }

  function formatTxnRow(tx) {
    const date = tx.txn_time ? new Date(tx.txn_time).toLocaleString() : "";
    return `${date} | ${tx.description} | ${tx.txn_type} ₹${tx.amount} | Bal: ₹${tx.balance_after}`;
  }

  async function handleMiniStatement() {
    if (!window.CGPT_CHAT) return;
    if (!authToken) {
      window.CGPT_CHAT.appendMessage(
        "bot",
        "Please log in to view your statement."
      );
      return;
    }
    try {
      const txns = await apiGet("/bank/mini-statement");
      const lines = txns.map(formatTxnRow).join("\n");
      window.CGPT_CHAT.appendMessage(
        "bot",
        `Mini Statement (last ${txns.length} transactions):\n\n${lines}`
      );
    } catch (err) {
      console.error(err);
      window.CGPT_CHAT.appendMessage(
        "bot",
        err.message || "Unable to fetch mini statement."
      );
    }
  }

  async function handleFullStatement() {
    if (!window.CGPT_CHAT) return;
    if (!authToken) {
      window.CGPT_CHAT.appendMessage(
        "bot",
        "Please log in to view your statement."
      );
      return;
    }
    try {
      const txns = await apiGet("/bank/statement");
      const lines = txns.map(formatTxnRow).join("\n");
      window.CGPT_CHAT.appendMessage(
        "bot",
        `Account Statement (${txns.length} transactions):\n\n${lines}`
      );
    } catch (err) {
      console.error(err);
      window.CGPT_CHAT.appendMessage(
        "bot",
        err.message || "Unable to fetch account statement."
      );
    }
  }

  async function handleFAQ() {
    if (!window.CGPT_CHAT) return;
    try {
      const data = await apiGet("/bank/faq");
      if (data.faq) {
        window.CGPT_CHAT.appendMessage("bot", String(data.faq));
      } else if (Array.isArray(data.items)) {
        const lines = data.items
          .map((f, i) => `${i + 1}. ${f.q}\n   → ${f.a}`)
          .join("\n\n");
        window.CGPT_CHAT.appendMessage("bot", "FAQ:\n\n" + lines);
      } else {
        window.CGPT_CHAT.appendMessage("bot", "FAQ is not configured yet.");
      }
    } catch (err) {
      console.error(err);
      window.CGPT_CHAT.appendMessage(
        "bot",
        err.message || "Unable to fetch FAQ."
      );
    }
  }

  function enterLLMMode() {
    appMode = "llm";
    hideMenuBar();
    if (!window.CGPT_CHAT) return;
    window.CGPT_CHAT.appendMessage(
      "bot",
      "You are now chatting with the support bot (LLM mode).\n" +
        "Ask any complex query.\n\n" +
        "Type 'exit', 'back', or 'menu' anytime to return to banking options."
    );
  }

  function backToMenu() {
    appMode = "menu";
    if (!window.CGPT_CHAT) return;
    window.CGPT_CHAT.appendMessage("bot", "Switched back to banking options.");
    showBankingMenu();
  }

  // -------------------------------
  // ROUTING USER INPUT
  // -------------------------------
  function handleMenuInput(raw) {
    const msg = raw.trim().toLowerCase();

    if (msg === "1" || msg.includes("balance")) {
      handleBalance();
      return;
    }
    if (msg === "2" || msg.includes("mini")) {
      handleMiniStatement();
      return;
    }
    if (msg === "3" || msg.includes("statement")) {
      handleFullStatement();
      return;
    }
    if (msg === "4" || msg.includes("faq")) {
      handleFAQ();
      return;
    }
    if (msg === "5" || msg.includes("chat") || msg.includes("bot")) {
      enterLLMMode();
      return;
    }

    if (!window.CGPT_CHAT) return;
    window.CGPT_CHAT.appendMessage(
      "bot",
      "Sorry, I didn't understand that.\nPlease choose 1, 2, 3, 4, or 5 (or use the buttons)."
    );
  }

  function handleLLMInput(raw) {
    const msg = raw.trim().toLowerCase();

    if (msg === "exit" || msg === "back" || msg === "menu") {
      backToMenu();
      return;
    }

    if (!window.CGPT_CHAT) return;
    window.CGPT_CHAT.botEcho(
      "LLM (demo) response based on your query:\n\n" +
        raw +
        "\n\n(Connect this to a real LLM API later.)"
    );
  }

  function handleUserInput(raw) {
    if (!window.CGPT_CHAT) return;

    if (!isLoggedIn) {
      window.CGPT_CHAT.appendMessage(
        "bot",
        "Please log in using the button above to access banking options."
      );
      return;
    }

    markActivity();

    if (appMode === "menu") {
      handleMenuInput(raw);
    } else {
      handleLLMInput(raw);
    }
  }

  // -------------------------------
  // COMPOSER
  // -------------------------------
  function sendFromComposer() {
    if (!input || !window.CGPT_CHAT) return;
    const value = input.value.trim();
    if (!value) return;

    window.CGPT_CHAT.appendMessage("user", value);
    input.value = "";
    input.style.height = "auto";

    handleUserInput(value);
  }

  send && send.addEventListener("click", sendFromComposer);

  input &&
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendFromComposer();
      }
    });

  input &&
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 200) + "px";
    });

  // -------------------------------
  // MENU BUTTON HANDLERS
  // -------------------------------
  if (btnBalance) {
    btnBalance.addEventListener("click", () => {
      if (!isLoggedIn) {
        window.CGPT_CHAT?.appendMessage(
          "bot",
          "Please log in to view your balance."
        );
        return;
      }
      window.CGPT_CHAT?.appendMessage("user", "Show my account balance");
      markActivity();
      handleBalance();
    });
  }

  if (btnMini) {
    btnMini.addEventListener("click", () => {
      if (!isLoggedIn) {
        window.CGPT_CHAT?.appendMessage(
          "bot",
          "Please log in to view your mini statement."
        );
        return;
      }
      window.CGPT_CHAT?.appendMessage("user", "Mini statement");
      markActivity();
      handleMiniStatement();
    });
  }

  if (btnFull) {
    btnFull.addEventListener("click", () => {
      if (!isLoggedIn) {
        window.CGPT_CHAT?.appendMessage(
          "bot",
          "Please log in to view your account statement."
        );
        return;
      }
      window.CGPT_CHAT?.appendMessage("user", "Full account statement");
      markActivity();
      handleFullStatement();
    });
  }

  if (btnFaq) {
    btnFaq.addEventListener("click", () => {
      if (!isLoggedIn) {
        window.CGPT_CHAT?.appendMessage("bot", "Please log in to view FAQs.");
        return;
      }
      window.CGPT_CHAT?.appendMessage("user", "FAQ");
      markActivity();
      handleFAQ();
    });
  }

  if (btnLLM) {
    btnLLM.addEventListener("click", () => {
      if (!isLoggedIn) {
        window.CGPT_CHAT?.appendMessage(
          "bot",
          "Please log in, then you can chat with the support bot."
        );
        return;
      }
      window.CGPT_CHAT?.appendMessage("user", "Chat with support bot");
      markActivity();
      enterLLMMode();
    });
  }

  // -------------------------------
  // FILE UPLOAD (DEMO ONLY)
  // -------------------------------
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener("click", () => {
      if (!isLoggedIn) {
        window.CGPT_CHAT?.appendMessage(
          "bot",
          "Please log in before uploading documents."
        );
        return;
      }
      fileInput.click();
    });

    fileInput.addEventListener("change", () => {
      const files = Array.from(fileInput.files || []);
      if (!files.length) return;

      markActivity();

      files.forEach((file) => {
        const sizeKb = Math.max(1, Math.round(file.size / 1024));
        const summary = `Uploaded file: ${file.name} (${
          file.type || "unknown type"
        }, ~${sizeKb} KB)`;

        window.CGPT_CHAT?.appendMessage("user", summary);
      });

      window.CGPT_CHAT?.appendMessage(
        "bot",
        "Thanks for uploading your files. In this demo, they stay in the browser only.\n" +
          "Later, you can connect this button to a secure backend endpoint to process statements or documents."
      );

      fileInput.value = "";
    });
  }

  // -------------------------------
  // INITIAL GREETING
  // -------------------------------
  if (window.CGPT_CHAT) {
    window.CGPT_CHAT.appendMessage(
      "bot",
      "Hey! I’m the C-GPT Banking demo.\n\n" +
        "You can log in via phone+OTP or email+OTP using the Log in button.\n" +
        "Once logged in, I’ll show you banking options and you can switch to LLM chat for complex queries."
    );
  }

  // Expose some controls for debugging
  window.CGPT_WIDGET = {
    open: openPanel,
    close: closePanel,
  };
})();
