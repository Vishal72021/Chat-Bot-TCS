// js/widget.js
(function () {
  const API_BASE = "http://localhost:4000"; // backend

  const panel = document.querySelector(".cgpt-panel");
  const btn = document.querySelector(".cgpt-btn");
  const input = document.querySelector("#cgptInput");
  const send = document.querySelector("#cgptSend");

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

  // ---------- SESSION / AUTH STATE ----------
  const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 mins inactivity
  let authToken = null; // JWT from backend, kept only in memory
  let isLoggedIn = false;
  let lastActivity = 0;
  let sessionTimeoutId = null;

  // menu vs LLM modes
  let appMode = "menu";

  function updateAuthUI() {
    if (!loginBtn) return;
    if (isLoggedIn) {
      loginBtn.textContent = "Log out";
      if (subtitleEl) subtitleEl.textContent = "Signed in";
    } else {
      loginBtn.textContent = "Log in";
      if (subtitleEl) subtitleEl.textContent = "Assistant";
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

  updateAuthUI(); // we always start logged out on refresh

  // ---------- PANEL OPEN/CLOSE ----------
  function openPanel() {
    panel.style.display = "flex";
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    setTimeout(() => input.focus(), 130);
    markActivity();
  }

  function closePanel() {
    panel.classList.remove("open");
    panel.style.display = "none";
    panel.setAttribute("aria-hidden", "true");
  }

  btn.addEventListener("click", () => {
    if (panel.classList.contains("open")) closePanel();
    else openPanel();
  });

  // ---------- LOGIN MODAL OPEN/CLOSE ----------
  function clearLoginFields() {
    loginUser.value = "";
    loginPass.value = "";
    loginPhone.value = "";
    loginEmail.value = "";
    loginOtp.value = "";
    loginError.textContent = "";
    otpStatus.textContent = "";
  }

  function openLoginModal() {
    loginModal.style.display = "flex";
    loginModal.classList.add("open");
    loginModal.setAttribute("aria-hidden", "false");

    loginError.textContent = "";
    otpStatus.textContent =
      "Choose OTP method, enter phone/email, then click Send OTP.";
    otpStatus.style.color = "var(--cgpt-muted)";

    // default to phone mode
    loginMethod.value = "phone";
    phoneField.style.display = "";
    emailField.style.display = "none";

    loginUser.focus();
  }

  function closeLoginModal() {
    loginModal.classList.remove("open");
    loginModal.style.display = "none";
    loginModal.setAttribute("aria-hidden", "true");
    clearLoginFields();
  }

  loginBtn.addEventListener("click", () => {
    if (isLoggedIn) {
      forceLogout("manual");
    } else {
      openLoginModal();
    }
  });

  loginClose.addEventListener("click", closeLoginModal);
  loginCancel.addEventListener("click", closeLoginModal);

  // click backdrop
  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) closeLoginModal();
  });

  // ESC key: close modal first, then panel
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (
        loginModal.classList.contains("open") &&
        loginModal.style.display !== "none"
      ) {
        closeLoginModal();
      } else if (panel.classList.contains("open")) {
        closePanel();
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPanel();
      input.focus();
    }
  });

  // ---------- OTP METHOD SWITCH (phone/email) ----------
  loginMethod.addEventListener("change", () => {
    const method = loginMethod.value;
    if (method === "phone") {
      phoneField.style.display = "";
      emailField.style.display = "none";
    } else {
      phoneField.style.display = "none";
      emailField.style.display = "";
    }
    otpStatus.textContent =
      "Enter your " +
      (method === "phone" ? "phone number" : "email") +
      " and click Send OTP.";
    otpStatus.style.color = "var(--cgpt-muted)";
  });

  // ---------- SHARE BUTTON ----------
  shareBtn.addEventListener("click", () => {
    window.open(window.location.href, "_blank", "noopener,noreferrer");
  });

  // ---------- SIMPLE API HELPERS ----------
  async function apiPost(path, body) {
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: "Bearer " + authToken } : {}),
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      forceLogout("auth");
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "API error");
    }

    return res.json();
  }

  async function apiGet(path) {
    const res = await fetch(API_BASE + path, {
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: "Bearer " + authToken } : {}),
      },
    });

    if (res.status === 401) {
      forceLogout("auth");
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "API error");
    }

    return res.json();
  }

  // ---------- SEND OTP (backend) ----------
  sendOtpBtn.addEventListener("click", async () => {
    const method = loginMethod.value;
    const phone = loginPhone.value.trim();
    const email = loginEmail.value.trim();

    otpStatus.style.color = "var(--cgpt-muted)";

    try {
      if (method === "phone") {
        if (!/^\d{10}$/.test(phone)) {
          otpStatus.textContent = "Enter a valid 10-digit phone number.";
          otpStatus.style.color = "#ef4444";
          return;
        }
        await apiPost("/auth/send-otp", { method: "phone", phone });
        otpStatus.textContent = `OTP sent to phone ${phone} (in this demo, check server logs).`;
      } else {
        if (!email || !email.includes("@")) {
          otpStatus.textContent = "Enter a valid email.";
          otpStatus.style.color = "#ef4444";
          return;
        }
        await apiPost("/auth/send-otp", { method: "email", email });
        otpStatus.textContent = `OTP sent to email ${email} (in this demo, check server logs).`;
      }
    } catch (err) {
      console.error(err);
      otpStatus.textContent = "Failed to send OTP. Check backend.";
      otpStatus.style.color = "#ef4444";
    }
  });

  // ---------- LOGIN SUBMIT (backend) ----------
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = loginUser.value.trim();
    const password = loginPass.value.trim();
    const method = loginMethod.value;
    const phone = loginPhone.value.trim();
    const email = loginEmail.value.trim();
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

      window.CGPT_CHAT.appendMessage(
        "bot",
        `Welcome, ${res.user.name}!\nYour secure banking session is now active.`
      );

      appMode = "menu";
      showBankingMenu();
    } catch (err) {
      console.error(err);
      let msg = "Login failed. Check credentials and OTP.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) msg = parsed.error;
      } catch {
        // ignore
      }
      loginError.textContent = msg;
      isLoggedIn = false;
      authToken = null;
      lastActivity = 0;
      if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
        sessionTimeoutId = null;
      }
      updateAuthUI();
    }
  });

  // ---------- BANKING MENU & HANDLERS (using backend) ----------
  function showBankingMenu() {
    window.CGPT_CHAT.appendMessage(
      "bot",
      "Please choose an option:\n\n" +
        "1️⃣ Account Balance\n" +
        "2️⃣ Mini Statement (last 5 txns)\n" +
        "3️⃣ Account Statement (full)\n" +
        "4️⃣ FAQ\n" +
        "5️⃣ Chat with support bot (LLM mode)"
    );
  }

  async function handleBalance() {
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
        "Unable to fetch balance right now."
      );
    }
  }

  function formatTxnRow(tx) {
    const date = tx.txn_time ? new Date(tx.txn_time).toLocaleString() : "";
    return `${date} | ${tx.description} | ${tx.txn_type} ₹${tx.amount} | Bal: ₹${tx.balance_after}`;
  }

  async function handleMiniStatement() {
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
      window.CGPT_CHAT.appendMessage("bot", "Unable to fetch mini statement.");
    }
  }

  async function handleFullStatement() {
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
        "Unable to fetch account statement."
      );
    }
  }

  async function handleFAQ() {
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
      window.CGPT_CHAT.appendMessage("bot", "Unable to fetch FAQ.");
    }
  }

  function enterLLMMode() {
    appMode = "llm";
    window.CGPT_CHAT.appendMessage(
      "bot",
      "You are now chatting with the support bot (LLM mode).\n" +
        "Ask any complex query.\n\n" +
        "Type 'exit', 'back', or 'menu' anytime to return to banking options."
    );
  }

  function backToMenu() {
    appMode = "menu";
    window.CGPT_CHAT.appendMessage("bot", "Switched back to banking options.");
    showBankingMenu();
  }

  // ---------- ROUTING USER INPUT ----------
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

    window.CGPT_CHAT.appendMessage(
      "bot",
      "Sorry, I didn't understand that.\nPlease choose 1, 2, 3, 4, or 5."
    );
  }

  function handleLLMInput(raw) {
    const msg = raw.trim().toLowerCase();

    if (msg === "exit" || msg === "back" || msg === "menu") {
      backToMenu();
      return;
    }

    // Demo LLM: just echo with label
    window.CGPT_CHAT.botEcho(
      "LLM (demo) response based on your query:\n\n" +
        raw +
        "\n\n(Connect this to a real LLM API later.)"
    );
  }

  function handleUserInput(raw) {
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

  // ---------- COMPOSER ----------
  function sendFromComposer() {
    const value = input.value.trim();
    if (!value) return;

    window.CGPT_CHAT.appendMessage("user", value);
    input.value = "";
    input.style.height = "auto";

    handleUserInput(value);
  }

  send.addEventListener("click", sendFromComposer);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendFromComposer();
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 200) + "px";
  });

  // ---------- INITIAL GREETING ----------
  window.CGPT_CHAT.appendMessage(
    "bot",
    "Hey! I’m the C-GPT Banking demo.\n\n" +
      "You can log in via phone+OTP or email+OTP using the Log in button.\n" +
      "Once logged in, I’ll show you banking options and you can switch to LLM chat for complex queries."
  );

  // dev hook
  window.CGPT_WIDGET = {
    open: openPanel,
    close: closePanel,
  };
})();
