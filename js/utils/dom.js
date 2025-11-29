window.CGPT_DOM = {
  qs(sel) {
    return document.querySelector(sel);
  },
  qsa(sel) {
    return Array.from(document.querySelectorAll(sel));
  },
  create(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  },
};
