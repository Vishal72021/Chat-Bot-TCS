// js/widget.js
(function () {
  const root = document.documentElement;

  const panel = document.querySelector(".cgpt-panel");
  const btn = document.querySelector(".cgpt-btn");
  const body = document.querySelector("#cgptBody");
  const input = document.querySelector("#cgptInput");
  const send = document.querySelector("#cgptSend");

  const shareBtn = document.querySelector("#cgptShareBtn");
  const loginBtn = document.querySelector("#cgptLoginBtn");

  const loginModal = document.querySelector("#cgptLoginModal");
  const loginClose = document.querySelector("#cgptLoginClose");
  const loginCancel = document.querySelector("#cgptLoginCancel");
  const loginForm = document.querySelector("#cgptLoginForm");
  const loginUser = document.querySelector("#cgptLoginUser");
  const loginPhone = document.querySelector("#cgptLoginPhone");
  const loginPass = document.querySelector("#cgptLoginPass");
  const loginOtp = document.querySelector("#cgptLoginOtp");
  const loginError = document.querySelector("#cgptLoginError");
  const subtitleEl = document.querySelector(".cgpt-subtitle");

  const sendOtpBtn = document.querySelector("#cgptSendOtpBtn");
  const otpStatus = document.querySelector("#cgptOtpStatus");

  // ---------- SESSION & AUTH STATE ----------
  const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes
  const DEMO_PHONE = "9178332513";
  let currentOtp = null;

  let isLoggedIn = localStorage.getItem("cgpt_logged_in") === "true";
  let lastActivity = Number(localStorage.getItem("cgpt_session_last") || 0);
  let sessionTimeoutId = null;

  function updateAuthUI() {
    if (!loginBtn) return;
    if (isLoggedIn) {
      loginBtn.textContent = "Log out";
      if (subtitleEl) subtitleEl.textContent = "Signed in as Vishal";
    } else {
      loginBtn.textContent = "Log in";
      if (subtitleEl) subtitleEl.textContent = "Assistant";
    }
  }

  function forceLogout(reason) {
    isLoggedIn = false;
    localStorage.setItem("cgpt_logged_in", "false");
    localStorage.removeItem("cgpt_user");
    localStorage.removeItem("cgpt_session_last");

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
    } else if (reason === "manual") {
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
    localStorage.setItem("cgpt_session_last", String(lastActivity));
    scheduleSessionTimeout();
  }

  // on load, validate previous session
  if (isLoggedIn) {
    if (!lastActivity || Date.now() - lastActivity > SESSION_DURATION_MS) {
      forceLogout("inactivity");
    } else {
      scheduleSessionTimeout();
    }
  }
  updateAuthUI();

  // ---------- PANEL OPEN/CLOSE ----------
  function openPanel() {
    panel.classList.remove("closing");
    panel.style.display = "flex";
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    setTimeout(() => input.focus(), 130);
    markActivity();
  }

  function closePanel() {
    if (!panel.classList.contains("open")) return;
    panel.classList.remove("open");
    panel.classList.add("closing");
    panel.setAttribute("aria-hidden", "true");
    // if you want animation, keep classes; otherwise force hide
    setTimeout(() => {
      if (panel.classList.contains("closing")) {
        panel.classList.remove("closing");
        panel.style.display = "none";
      }
    }, 200);
  }

  btn.addEventListener("click", () => {
    if (panel.classList.contains("open")) closePanel();
    else openPanel();
  });

  // ---------- LOGIN MODAL OPEN/CLOSE (FIXED) ----------
  function openLoginModal() {
    loginModal.classList.remove("closing");
    loginModal.style.display = "flex";
    loginModal.classList.add("open");
    loginModal.setAttribute("aria-hidden", "false");

    loginError.textContent = "";
    otpStatus.textContent =
      "Enter the OTP you receive. For this demo, it will appear here after clicking Send OTP.";
    otpStatus.style.color = "var(--cgpt-muted)";
    currentOtp = null;

    loginUser.focus();
  }

  function clearLoginFields() {
    loginUser.value = "";
    loginPhone.value = "";
    loginPass.value = "";
    loginOtp.value = "";
    loginError.textContent = "";
    currentOtp = null;
  }

  function closeLoginModal() {
    // HARD CLOSE: no animation dependency
    loginModal.classList.remove("open");
    loginModal.classList.remove("closing");
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

  // click on backdrop (outside dialog) closes modal
  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) {
      closeLoginModal();
    }
  });

  // ---------- GLOBAL ESCAPE KEY (FIXED) ----------
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (
        loginModal.classList.contains("open") &&
        loginModal.style.display !== "none"
      ) {
        // close only modal
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

  // ---------- SHARE ----------
  shareBtn.addEventListener("click", () => {
    window.open(window.location.href, "_blank", "noopener,noreferrer");
  });

  // ---------- SEND OTP (DEMO) ----------
  sendOtpBtn.addEventListener("click", () => {
    const phone = loginPhone.value.trim();

    if (!/^\d{10}$/.test(phone)) {
      otpStatus.textContent =
        "Please enter a valid 10-digit phone number first.";
      otpStatus.style.color = "#ef4444";
      currentOtp = null;
      return;
    }

    if (phone !== DEMO_PHONE) {
      otpStatus.textContent = "For this demo, use phone number 9178332513.";
      otpStatus.style.color = "#ef4444";
      currentOtp = null;
      return;
    }

    currentOtp = String(Math.floor(100000 + Math.random() * 900000));
    otpStatus.textContent = `Demo OTP for ${phone}: ${currentOtp}`;
    otpStatus.style.color = "var(--cgpt-muted)";
  });

  // ---------- LOGIN SUBMIT ----------
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const user = loginUser.value.trim();
    const phone = loginPhone.value.trim();
    const pass = loginPass.value.trim();
    const otp = loginOtp.value.trim();

    const phoneOk = /^\d{10}$/.test(phone);
    const otpOk = currentOtp && otp === currentOtp;

    if (
      user === "vishal-chat" &&
      pass === "vishal-pass" &&
      phoneOk &&
      phone === DEMO_PHONE &&
      otpOk
    ) {
      isLoggedIn = true;
      localStorage.setItem("cgpt_logged_in", "true");
      localStorage.setItem("cgpt_user", "Vishal");

      lastActivity = Date.now();
      localStorage.setItem("cgpt_session_last", String(lastActivity));
      scheduleSessionTimeout();

      loginError.textContent = "";
      closeLoginModal();
      updateAuthUI();

      window.CGPT_CHAT.appendMessage(
        "bot",
        "You are now signed in as Vishal. ✅\nYour session will expire after 10 minutes of inactivity."
      );
    } else {
      let msg = "Invalid credentials.";
      if (!phoneOk) msg = "Please enter a valid 10-digit phone number.";
      else if (phone !== DEMO_PHONE)
        msg = "For this demo, the allowed phone number is 9178332513.";
      else if (!currentOtp) msg = "Click 'Send OTP' to receive a code first.";
      else if (!otpOk) msg = "Invalid OTP. Please enter the code shown above.";

      loginError.textContent = msg;
      isLoggedIn = false;
      localStorage.setItem("cgpt_logged_in", "false");
      localStorage.removeItem("cgpt_user");
      localStorage.removeItem("cgpt_session_last");
      if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
        sessionTimeoutId = null;
      }
      updateAuthUI();
    }
  });

  // ---------- CHAT SEND ----------
  function sendFromComposer() {
    const value = input.value.trim();
    if (!value) return;

    window.CGPT_CHAT.appendMessage("user", value);
    input.value = "";
    input.style.height = "auto";

    markActivity();

    setTimeout(
      () => window.CGPT_CHAT.botEcho(value),
      250 + Math.random() * 350
    );
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
    "Hey! I’m the C-GPT demo.\nRight now I just echo what you type.\nUse the Log in button to sign in with username + phone + password + OTP."
  );

  // ---------- DEV HOOK ----------
  window.CGPT_WIDGET = {
    open: openPanel,
    close: closePanel,
    setTheme: window.CGPT_THEME.setTheme,
    appendMessage: window.CGPT_CHAT.appendMessage,
  };
})();
