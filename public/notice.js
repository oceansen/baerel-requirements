(function () {
  var d = JSON.parse(document.getElementById("boot").textContent);
  var box = document.getElementById("notice");
  function add(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; n.textContent = text; box.appendChild(n); }
  add("p", "eyebrow", "Bærel");
  add("h1", "", d.titleNb);
  add("p", "lede", d.bodyNb);
  add("h2", "notice-en", d.titleEn);
  add("p", "", d.bodyEn);
})();
