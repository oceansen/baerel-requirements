/* Bærel: enter the company's access code to open its requirements specification. */
(function () {
  "use strict";

  var T = {
    nb: {
      eyebrow: "Egenrapportert kravspesifikasjon",
      title: "Kravspesifikasjon for dataplattform for sirkulær elektronikk",
      lede: "Skriv inn tilgangskoden virksomheten din har fått fra Bærel-prosjektet. Koden gir tilgang til virksomhetens egen kravspesifikasjon, som alle med koden fyller ut og oppdaterer sammen.",
      label: "Tilgangskode",
      go: "Åpne kravspesifikasjonen",
      busy: "Sjekker …",
      wrong: "Koden er ikke gyldig. Sjekk at du har skrevet den riktig – eller be kontaktpersonen i prosjektet om en ny kode hvis den er byttet ut.",
      limit: "For mange forsøk. Vent 15 minutter og prøv igjen.",
      net: "Fikk ikke kontakt med serveren. Prøv igjen.",
      hint: "Store og små bokstaver og bindestreker spiller ingen rolle.",
      note: "Del koden bare internt i virksomheten. Får prosjektet en ny kode til dere, slutter den gamle å virke med en gang.",
      lang: "English"
    },
    en: {
      eyebrow: "Self-reported requirements specification",
      title: "Requirements specification for a circular-electronics data platform",
      lede: "Enter the access code your organisation received from the Bærel project. It opens your organisation's own requirements specification, which everyone holding the code fills in and updates together.",
      label: "Access code",
      go: "Open the specification",
      busy: "Checking …",
      wrong: "That code is not valid. Check that it is typed correctly — or ask your project contact for a new code if it has been replaced.",
      limit: "Too many attempts. Wait 15 minutes and try again.",
      net: "Could not reach the server. Try again.",
      hint: "Upper or lower case and dashes do not matter.",
      note: "Share the code only inside your organisation. When the project issues a new code, the old one stops working at once.",
      lang: "Norsk"
    }
  };
  var lang = "nb";
  try { var l = localStorage.getItem("baerel-lang"); if (l === "en" || l === "nb") lang = l; } catch (e) {}
  var main = document.getElementById("main");

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function logo() {
    var pic = document.createElement("picture");
    pic.className = "logo logo-lg";
    var src = document.createElement("source");
    src.setAttribute("srcset", "/assets/logo-light.png");
    src.setAttribute("media", "(prefers-color-scheme: dark)");
    pic.appendChild(src);
    var img = document.createElement("img");
    img.src = "/assets/logo.png"; img.alt = "Bærel"; img.width = 171; img.height = 52;
    pic.appendChild(img);
    return pic;
  }

  /* Show the code in groups of four while typing, without fighting the caret. */
  function group(v) {
    var s = v.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 16);
    return s.replace(/(.{4})(?=.)/g, "$1-");
  }

  function render(keep) {
    var t = T[lang];
    document.documentElement.lang = lang === "nb" ? "no" : "en";
    main.textContent = "";
    var input = el("input", {
      type: "text", id: "code", class: "code-in", autocomplete: "off", autocapitalize: "characters", spellcheck: "false",
      inputmode: "text", placeholder: "XXXX-XXXX-XXXX-XXXX", "aria-describedby": "code-hint", maxlength: "24"
    });
    if (keep) input.value = keep;
    var err = el("p", { class: "err", role: "alert" });
    var btn = el("button", { class: "btn primary", type: "submit", text: t.go });
    var langBtn = el("button", { class: "btn ghost", type: "button", text: t.lang });
    langBtn.addEventListener("click", function () {
      lang = lang === "nb" ? "en" : "nb";
      try { localStorage.setItem("baerel-lang", lang); } catch (e) {}
      render(input.value);
    });
    var form = el("form", { class: "panel hero access" }, [
      el("div", { class: "access-top" }, [logo(), langBtn]),
      el("p", { class: "eyebrow", style: "margin-top:22px", text: t.eyebrow }),
      el("h1", { text: t.title }),
      el("p", { class: "lede", text: t.lede }),
      el("label", { for: "code", class: "eyebrow access-label", text: t.label }),
      input,
      el("p", { id: "code-hint", class: "a-meta", text: t.hint }),
      err,
      el("div", { class: "row" }, [btn]),
      el("p", { class: "notice", text: t.note })
    ]);
    input.addEventListener("input", function () {
      var atEnd = input.selectionStart === input.value.length;
      var g = group(input.value);
      if (g !== input.value && atEnd) input.value = g;
      err.textContent = "";
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var code = input.value.trim();
      if (!code) { input.focus(); return; }
      btn.disabled = true; btn.textContent = t.busy; err.textContent = "";
      fetch("/api/access", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code })
      }).then(function (r) {
        if (r.ok) { location.replace("/spec"); return; }
        err.textContent = r.status === 429 ? t.limit : t.wrong;
        btn.disabled = false; btn.textContent = t.go; input.select();
      })["catch"](function () {
        err.textContent = t.net; btn.disabled = false; btn.textContent = t.go;
      });
    });
    main.appendChild(form);
    input.focus();
  }

  render("");
})();
