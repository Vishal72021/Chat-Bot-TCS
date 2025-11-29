window.CGPT_AUTH_UI = (function () {
  const modal = document.querySelector("#cgptLoginModal");
  const closeBtn = document.querySelector("#cgptLoginClose");
  const cancelBtn = document.querySelector("#cgptLoginCancel");
  const loginBtn = document.querySelector("#cgptLoginBtn");
  const subtitle = document.querySelector(".cgpt-subtitle");

  function open() {
    modal.classList.add("open");
  }

  function close() {
    modal.classList.remove("open");
  }

  function updateHeader() {
    if (window.CGPT_STATE.isLoggedIn()) {
      loginBtn.textContent = "Log out";
      subtitle.textContent = "Signed in as Vishal";
    } else {
      loginBtn.textContent = "Log in";
      subtitle.textContent = "Assistant";
    }
  }

  loginBtn.addEventListener("click", () => {
    if (window.CGPT_STATE.isLoggedIn()) {
      window.CGPT_STATE.logout();
    } else {
      open();
    }
  });

  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);

  updateHeader();

  return { open, close, updateHeader };
})();
