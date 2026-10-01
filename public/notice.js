(function () {
  var d = JSON.parse(document.getElementById("boot").textContent);
  var box = document.getElementById("notice");
  function add(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; n.textContent = text; box.appendChild(n); }
  var pic = document.createElement("picture"); pic.className = "logo logo-lg";
  var src = document.createElement("source"); src.setAttribute("srcset", "/assets/logo-light.png"); src.setAttribute("media", "(prefers-color-scheme: dark)");
  var img = document.createElement("img"); img.src = "/assets/logo.png"; img.alt = "Bærel"; img.width = 171; img.height = 52;
  pic.appendChild(src); pic.appendChild(img); box.appendChild(pic);
  add("h1", "", d.titleNb);
  add("p", "lede", d.bodyNb);
  add("h2", "notice-en", d.titleEn);
  add("p", "", d.bodyEn);
})();
