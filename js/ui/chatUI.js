// js/ui/chatUI.js
(function () {
  const body = document.querySelector("#cgptBody");

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
      .split("\n")
      .map((l) => `<div>${l}</div>`)
      .join("");
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function splitIntoChunks(s) {
    if (!s) return [""];
    const parts = s.split(/(\s+)/); // keep spaces
    const chunks = [];
    let acc = "";
    for (const p of parts) {
      acc += p;
      if (acc.length > 18) {
        chunks.push(acc);
        acc = "";
      }
    }
    if (acc) chunks.push(acc);
    return chunks;
  }

  function botEcho(text) {
    const placeholder = appendMessage("bot", "…");
    let acc = "";
    const chunks = splitIntoChunks(text);
    let i = 0;
    const baseDelay = 40;

    const timer = setInterval(() => {
      if (i >= chunks.length) {
        clearInterval(timer);
        placeholder.innerHTML = escapeHTML(text)
          .split("\n")
          .map((l) => `<div>${l}</div>`)
          .join("");
        body.scrollTop = body.scrollHeight;
        return;
      }
      acc += chunks[i++];
      placeholder.innerHTML = escapeHTML(acc)
        .split("\n")
        .map((l) => `<div>${l}</div>`)
        .join("");
      body.scrollTop = body.scrollHeight;
    }, baseDelay + Math.random() * 80);
  }

  window.CGPT_CHAT = {
    appendMessage,
    botEcho,
  };
})();
