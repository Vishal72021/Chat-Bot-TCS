window.CGPT_STATE = (function () {
  const SESSION_DURATION_MS = 10 * 60 * 1000;

  let isLoggedIn = localStorage.getItem("cgpt_logged_in") === "true";
  let lastActivity = Number(localStorage.getItem("cgpt_session_last") || 0);
  let sessionTimeoutId = null;

  function markActivity() {
    if (!isLoggedIn) return;
    lastActivity = Date.now();
    localStorage.setItem("cgpt_session_last", String(lastActivity));
  }

  function forceLogout(reason) {
    isLoggedIn = false;
    localStorage.setItem("cgpt_logged_in", "false");
    localStorage.removeItem("cgpt_user");
    localStorage.removeItem("cgpt_session_last");

    if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
    sessionTimeoutId = null;

    if (window.CGPT_CHAT_UI) {
      window.CGPT_CHAT_UI.appendBot(
        reason === "inactivity"
          ? "Your session expired due to inactivity."
          : "You have been logged out."
      );
    }

    window.CGPT_AUTH_UI.updateHeader();
  }

  function scheduleTimeout() {
    if (!isLoggedIn || !lastActivity) return;

    const elapsed = Date.now() - lastActivity;
    const remaining = SESSION_DURATION_MS - elapsed;

    if (remaining <= 0) {
      forceLogout("inactivity");
      return;
    }

    sessionTimeoutId = setTimeout(() => {
      forceLogout("inactivity");
    }, remaining);
  }

  function login(userName) {
    isLoggedIn = true;
    localStorage.setItem("cgpt_logged_in", "true");
    localStorage.setItem("cgpt_user", userName);
    markActivity();
    scheduleTimeout();
  }

  function logout() {
    forceLogout("manual");
  }

  return {
    isLoggedIn: () => isLoggedIn,
    login,
    logout,
    markActivity,
    scheduleTimeout,
  };
})();
