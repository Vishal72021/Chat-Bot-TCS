// js/ui/themeUI.js
(function () {
  const root = document.documentElement;
  const themeBtn = document.querySelector("#cgptThemeBtn");
  const themePop = document.querySelector("#cgptThemePop");

  function setTheme(mode) {
    root.setAttribute("data-cgpt-theme", mode);
    localStorage.setItem("cgpt_theme_mode", mode);
  }

  // init from saved theme (default red)
  const saved = localStorage.getItem("cgpt_theme_mode") || "red";
  setTheme(saved);

  themeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    themePop.classList.toggle("open");
  });

  themePop.addEventListener("click", (e) => {
    const opt = e.target.closest(".cgpt-theme-opt");
    if (!opt) return;
    const t = opt.getAttribute("data-theme");
    setTheme(t);
    themePop.classList.remove("open");
  });

  document.addEventListener("click", (e) => {
    if (!themePop.contains(e.target) && e.target !== themeBtn) {
      themePop.classList.remove("open");
    }
  });

  window.CGPT_THEME = {
    setTheme,
  };
})();
