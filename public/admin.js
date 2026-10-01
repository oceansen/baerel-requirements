/* Bærel admin console: create companies, manage their access codes and specification versions. */
(function () {
  "use strict";

  var boot = JSON.parse(document.getElementById("boot").textContent);
  var main = document.getElementById("main");
  var top = document.getElementById("topactions");
  var state = { companies: [], fresh: null, busy: false };

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  function api(method, url, body) {
    return fetch(url, {
      method: method,
      credentials: "same-origin",
      headers: body !== undefined ? { "Content-Type": "application/json" } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 401 && url !== "/api/admin/login") { location.reload(); }
        if (!r.ok) { var e = new Error(d.message || ("HTTP " + r.status)); e.code = d.error; throw e; }
        return d;
      });
    });
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
    catch (e) { return iso.slice(0, 10); }
  }

  function flash(btn, text) {
    var old = btn.textContent;
    btn.textContent = text;
    setTimeout(function () { btn.textContent = old; }, 1600);
  }

  function copy(text, btn) {
    var ok = function () { flash(btn, "Copied"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, function () { fallbackCopy(text); ok(); });
    } else { fallbackCopy(text); ok(); }
  }
  function fallbackCopy(text) {
    var ta = el("textarea", { style: "position:fixed;opacity:0" }); ta.value = text;
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    ta.remove();
  }

  function invitation(c) {
    return [
      "Hei,",
      "",
      "Her er tilgangen til " + c.name + " sin egenrapporterte kravspesifikasjon i Bærel-prosjektet.",
      "",
      "Nettside: " + c.access_url,
      "Tilgangskode: " + c.code,
      "",
      "Alle i virksomheten som har koden, fyller ut og oppdaterer den samme kravspesifikasjonen. Alt lagres fortløpende, og tidligere versjoner kan hentes fram igjen. Del koden bare internt, og behandle den som et passord.",
      "",
      "—",
      "",
      "Hi,",
      "",
      "Here is access to the self-reported requirements specification for " + c.name + " in the Bærel project.",
      "",
      "Website: " + c.access_url,
      "Access code: " + c.code,
      "",
      "Everyone in your organisation holding the code fills in and updates the same specification. Everything is saved as you go, and earlier versions can be restored. Share the code only internally and treat it like a password."
    ].join("\n");
  }

  /* Two-step confirm without a modal: first click arms, second click acts. */
  function armed(label, confirmLabel, cls, action) {
    var b = el("button", { class: "btn " + (cls || ""), type: "button", text: label });
    var timer = null;
    b.addEventListener("click", function () {
      if (b.getAttribute("data-armed") === "1") {
        clearTimeout(timer);
        b.disabled = true;
        action().finally(function () { b.disabled = false; });
        return;
      }
      b.setAttribute("data-armed", "1");
      b.classList.add("armed");
      b.textContent = confirmLabel;
      timer = setTimeout(function () {
        b.removeAttribute("data-armed"); b.classList.remove("armed"); b.textContent = label;
      }, 4000);
    });
    return b;
  }

  function downloadJson(filename, obj) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    var a = el("a", { href: URL.createObjectURL(blob), download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function replaceCompany(c) {
    state.companies = state.companies.map(function (x) { return x.id === c.id ? c : x; });
    if (state.fresh && state.fresh.id === c.id) state.fresh = c;
    render();
  }

  /* ------------------------------------------------------------ login */

  function renderLogin() {
    main.textContent = "";
    var pw = el("input", { type: "password", autocomplete: "current-password", placeholder: "Admin password", "aria-label": "Admin password" });
    var err = el("p", { class: "err", role: "alert" });
    var form = el("form", { class: "panel login" }, [
      el("p", { class: "eyebrow", text: "Bærel · Admin" }),
      el("h2", { text: "Log in", style: "font-size:28px;margin-top:6px" }),
      pw,
      err,
      el("div", { class: "row", style: "margin-top:14px" }, [el("button", { class: "btn primary", type: "submit", text: "Log in" })])
    ]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.textContent = "";
      api("POST", "/api/admin/login", { password: pw.value })
        .then(function () { location.reload(); })
        .catch(function (x) { err.textContent = x.message; pw.select(); });
    });
    main.appendChild(form);
    pw.focus();
  }

  /* ------------------------------------------------------------ console */

  function codeBox(c) {
    if (!c.code) return el("p", { class: "co-meta", text: "No active code — nobody can open this specification. Generate a new code to give the company access again." });
    return el("div", { class: "codebox" }, [
      el("code", { class: "code", text: c.code }),
      el("button", { class: "btn primary", type: "button", text: "Copy code", onclick: function (e) { copy(c.code, e.currentTarget); } }),
      el("button", { class: "btn", type: "button", text: "Copy invitation", onclick: function (e) { copy(invitation(c), e.currentTarget); } }),
      el("span", { class: "where", text: "Entered at " + c.access_url })
    ]);
  }

  function post(c, action) {
    return api("POST", "/api/admin/companies/" + c.id + "/" + action, {}).then(function (d) { replaceCompany(d.company); });
  }

  function companyCard(c) {
    var pills = [
      el("span", { class: "pill " + (c.submissions_open ? "ok" : "warn"), text: c.submissions_open ? "Open for changes" : "Closed for changes" }),
      el("span", { class: "pill " + (c.code_active ? "ok" : "warn"), text: c.code_active ? "Code active" : "No active code" })
    ];
    var meta = c.id + " · created " + fmtDate(c.created_at) + " · " +
      (c.spec_updated_at ? c.spec_completion + "% complete · last change " + fmtTime(c.spec_updated_at) + " · " + c.version_count + (c.version_count === 1 ? " version" : " versions") : "not started") +
      (c.code_generations > 1 ? " · code generation " + c.code_generations : "");

    var verBox = el("div");
    var actions = el("div", { class: "co-actions" }, [
      armed(c.code_active ? "Generate new code" : "Generate code", "Confirm — the old code stops working", "", function () { return post(c, "rotate"); }),
      c.code_active ? armed("Revoke access", "Confirm revoke", "danger", function () { return post(c, "revoke"); }) : null,
      c.submissions_open
        ? armed("Close for changes", "Confirm close", "danger", function () { return post(c, "close"); })
        : el("button", { class: "btn", type: "button", text: "Reopen for changes", onclick: function () { post(c, "reopen"); } }),
      c.spec_updated_at ? el("a", { class: "btn", href: "/admin/analysis?company=" + encodeURIComponent(c.id), text: "Analysis" }) : null,
      c.spec_updated_at ? el("button", { class: "btn ghost", type: "button", text: "Download (JSON)", onclick: function () {
        api("GET", "/api/admin/companies/" + c.id + "/submissions").then(function (d) {
          downloadJson("baerel-kravspesifikasjon-" + c.slug + "-" + new Date().toISOString().slice(0, 10) + ".json", d.responses[0] || {});
        });
      } }) : null,
      c.version_count ? el("button", { class: "btn ghost", type: "button", text: "Versions", onclick: function (e) {
        var btn = e.currentTarget;
        if (verBox.childNodes.length) { verBox.textContent = ""; btn.textContent = "Versions"; return; }
        btn.textContent = "Hide versions";
        api("GET", "/api/admin/companies/" + c.id + "/versions").then(function (d) { verBox.appendChild(versionList(c, d.versions)); });
      } }) : null
    ]);

    return el("li", { class: "co" }, [
      el("div", { class: "co-top" }, [el("h3", { text: c.name })].concat(pills)),
      el("p", { class: "co-meta mono", text: meta }),
      codeBox(c),
      actions,
      verBox
    ]);
  }

  function fmtTime(iso) {
    try { return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
    catch (e) { return iso; }
  }

  var REASON = { first: "first save", auto: "auto", manual: "saved", "export": "export", migrated: "migrated", "before-restore": "before restore" };
  function reasonText(r) { return REASON[r] || (/^restored-v(\d+)$/.test(r) ? "restored v" + r.slice(10) : r); }

  /* The specification is one living document; every version is a timestamped snapshot.
     Restoring saves the current state as a version first, so it can be undone. */
  function versionList(c, list) {
    var ul = el("ul", { class: "ver-list" });
    list.forEach(function (v, i) {
      ul.appendChild(el("li", {}, [
        el("span", { class: "mono", text: "v" + v.n }),
        el("span", { text: fmtTime(v.saved_at) + " · " + reasonText(v.reason) + " · " + v.completion + "%" }),
        el("span", { class: "ver-acts" }, [
          el("a", { class: "btn ghost", href: "/api/admin/companies/" + c.id + "/versions/" + v.n, text: "Download" }),
          i === 0 ? el("span", { class: "pill", text: "latest" }) : armed("Restore", "Confirm restore v" + v.n, "", function () {
            return api("POST", "/api/admin/companies/" + c.id + "/versions/" + v.n + "/restore", {}).then(function () {
              return api("GET", "/api/admin/companies").then(function (d) { state.companies = d.companies; render(); });
            });
          })
        ])
      ]));
    });
    return ul;
  }

  function renderConsole() {
    main.textContent = "";
    top.textContent = "";
    var total = state.companies.filter(function (c) { return c.spec_updated_at; }).length;
    if (total) {
      top.appendChild(el("a", { class: "btn", href: "/admin/analysis", text: "Analysis — all companies" }));
      top.appendChild(el("a", { class: "btn ghost", href: "/api/admin/export", text: "Download all (JSON)" }));
    }
    top.appendChild(el("button", { class: "btn ghost", type: "button", text: "Log out", onclick: function () {
      api("POST", "/api/admin/logout").then(function () { location.reload(); });
    } }));

    var head = el("section", { class: "panel" });
    head.appendChild(el("p", { class: "eyebrow", text: state.companies.length + (state.companies.length === 1 ? " company" : " companies") + " · " + total + (total === 1 ? " specification started" : " specifications started") }));
    head.appendChild(el("h2", { style: "font-size:clamp(24px,3.4vw,33px);margin-top:6px", text: "Add a company" }));
    head.appendChild(el("p", { style: "color:var(--ink-2);max-width:62ch;margin:8px 0 0", text: "Enter the company name. Its specification, internal ID and a random secret access code are generated for you." }));

    var name = el("input", { type: "text", placeholder: "e.g. Kongsberg Maritime", "aria-label": "Company name", maxlength: "120", autocomplete: "off" });
    var err = el("p", { class: "err", role: "alert" });
    var form = el("form", { class: "adm-new" }, [name, el("button", { class: "btn primary", type: "submit", text: "Add company" })]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.textContent = "";
      var v = name.value.trim();
      if (!v) { name.focus(); return; }
      api("POST", "/api/admin/companies", { name: v }).then(function (d) {
        state.companies.unshift(d.company);
        state.fresh = d.company;
        render();
      }).catch(function (x) { err.textContent = x.message; name.select(); });
    });
    head.appendChild(form);
    head.appendChild(err);

    if (state.fresh) {
      var f = state.fresh;
      head.appendChild(el("div", { class: "adm-fresh", role: "status" }, [
        el("h3", { text: f.name + " is ready" }),
        el("p", { text: "Send the code to the company's contact, ideally by a different channel than the website address. Anyone holding it can open and change the specification, so treat it like a password." }),
        codeBox(f)
      ]));
    }
    main.appendChild(head);

    if (!state.companies.length) {
      main.appendChild(el("p", { class: "co-empty", text: "No companies yet." }));
      return;
    }
    var list = el("ul", { class: "co-list" });
    state.companies.forEach(function (c) { list.appendChild(companyCard(c)); });
    main.appendChild(list);
  }

  function render() { if (boot.authed) renderConsole(); else renderLogin(); }

  if (boot.authed) {
    api("GET", "/api/admin/companies").then(function (d) { state.companies = d.companies; render(); });
  } else {
    render();
  }
})();
