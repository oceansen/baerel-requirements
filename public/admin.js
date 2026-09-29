/* Bærel admin console: create company workspaces and manage their links. */
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
      "Her er lenken til arbeidsområdet for " + c.name + " i Bærel-kravkartleggingen:",
      c.url,
      "",
      "Alle i virksomheten som har lenken kan åpne den og bidra – del den gjerne internt, men ikke utenfor virksomheten. Hver person fyller ut sitt eget svar, og kan oppdatere det senere fra samme nettleser.",
      "",
      "—",
      "",
      "Hi,",
      "",
      "Here is the link to the " + c.name + " workspace in the Bærel requirements survey:",
      c.url,
      "",
      "Anyone in your organisation with the link can open it and contribute — share it internally, but not outside the organisation. Each person fills in their own response and can update it later from the same browser."
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

  function linkBox(c) {
    if (!c.url) return el("p", { class: "co-meta", text: "No active link — nobody can open this workspace. Generate a new link to share it again." });
    return el("div", { class: "linkbox" }, [
      el("code", { text: c.url, title: c.url }),
      el("button", { class: "btn primary", type: "button", text: "Copy link", onclick: function (e) { copy(c.url, e.currentTarget); } }),
      el("button", { class: "btn", type: "button", text: "Copy invitation", onclick: function (e) { copy(invitation(c), e.currentTarget); } }),
      el("a", { class: "btn", href: c.url, target: "_blank", rel: "noreferrer noopener", text: "Open" })
    ]);
  }

  function companyCard(c) {
    var pills = [
      el("span", { class: "pill " + (c.submissions_open ? "ok" : "warn"), text: c.submissions_open ? "Accepting submissions" : "Submissions closed" }),
      el("span", { class: "pill " + (c.link_active ? "ok" : "warn"), text: c.link_active ? "Link active" : "No active link" })
    ];
    var meta = c.id + " · created " + fmtDate(c.created_at) + " · " +
      c.submission_count + (c.submission_count === 1 ? " contribution" : " contributions") +
      (c.last_submission_at ? " · last " + fmtDate(c.last_submission_at) : "") +
      (c.link_generations > 1 ? " · link generation " + c.link_generations : "");

    var actions = el("div", { class: "co-actions" }, [
      armed(c.link_active ? "Generate new link" : "Generate link", "Confirm — old link stops working", "", function () {
        return api("POST", "/api/admin/companies/" + c.id + "/rotate").then(function (d) { replaceCompany(d.company); });
      }),
      c.link_active ? armed("Revoke link", "Confirm revoke", "danger", function () {
        return api("POST", "/api/admin/companies/" + c.id + "/revoke").then(function (d) { replaceCompany(d.company); });
      }) : null,
      c.submissions_open
        ? armed("Close submissions", "Confirm close", "danger", function () {
            return api("POST", "/api/admin/companies/" + c.id + "/close").then(function (d) { replaceCompany(d.company); });
          })
        : el("button", { class: "btn", type: "button", text: "Reopen submissions", onclick: function () {
            api("POST", "/api/admin/companies/" + c.id + "/reopen").then(function (d) { replaceCompany(d.company); });
          } }),
      c.submission_count ? el("a", { class: "btn", href: "/admin/analysis?company=" + encodeURIComponent(c.id), text: "Analysis" }) : null,
      c.submission_count ? el("button", { class: "btn ghost", type: "button", text: "Download responses", onclick: function () {
        api("GET", "/api/admin/companies/" + c.id + "/submissions").then(function (d) {
          downloadJson("baerel-" + c.slug + "-" + new Date().toISOString().slice(0, 10) + ".json", d.responses);
        });
      } }) : null
    ]);

    var ivBox = el("div");
    if (c.submission_count) {
      actions.appendChild(el("button", { class: "btn ghost", type: "button", text: "Interviews and versions", onclick: function (e) {
        var btn = e.currentTarget;
        if (ivBox.childNodes.length) { ivBox.textContent = ""; btn.textContent = "Interviews and versions"; return; }
        btn.textContent = "Hide interviews";
        api("GET", "/api/admin/companies/" + c.id + "/interviews").then(function (d) { ivBox.appendChild(interviewList(d.interviews)); });
      } }));
    }

    return el("li", { class: "co" }, [
      el("div", { class: "co-top" }, [el("h3", { text: c.name })].concat(pills)),
      el("p", { class: "co-meta mono", text: meta }),
      linkBox(c),
      actions,
      ivBox
    ]);
  }

  function fmtTime(iso) {
    try { return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
    catch (e) { return iso; }
  }

  /* Each interview is a living document; every version is a timestamped snapshot. */
  function interviewList(list) {
    var ul = el("ul", { class: "iv-list" });
    list.forEach(function (iv) {
      var who = [iv.role || "Role not given", iv.interviewer && ("interviewer " + iv.interviewer), iv.interviewee && ("interviewee " + iv.interviewee)].filter(Boolean).join(" · ");
      var vers = el("div", { class: "iv-vers" });
      iv.versions.forEach(function (v) {
        vers.appendChild(el("a", {
          href: "/api/admin/submissions/" + iv.id + "/versions/" + v.n,
          title: v.reason + " · " + v.completion + "% complete",
          text: "v" + v.n + " · " + fmtTime(v.saved_at) + (v.reason === "export" ? " · export" : v.reason === "manual" ? " · saved" : "")
        }));
      });
      ul.appendChild(el("li", { class: "iv" }, [
        el("div", { class: "iv-top" }, [
          el("b", { text: who }),
          el("span", { class: "co-meta mono", text: iv.completion + "% · last change " + fmtTime(iv.updated_at) + " · " + iv.versions.length + (iv.versions.length === 1 ? " version" : " versions") })
        ]),
        vers
      ]));
    });
    return ul;
  }

  function renderConsole() {
    main.textContent = "";
    top.textContent = "";
    var total = state.companies.reduce(function (n, c) { return n + c.submission_count; }, 0);
    if (total) {
      top.appendChild(el("a", { class: "btn", href: "/admin/analysis", text: "Analysis — all companies" }));
      top.appendChild(el("a", { class: "btn ghost", href: "/api/admin/export", text: "Download all (JSON)" }));
    }
    top.appendChild(el("button", { class: "btn ghost", type: "button", text: "Log out", onclick: function () {
      api("POST", "/api/admin/logout").then(function () { location.reload(); });
    } }));

    var head = el("section", { class: "panel" });
    head.appendChild(el("p", { class: "eyebrow", text: state.companies.length + (state.companies.length === 1 ? " workspace" : " workspaces") + " · " + total + " contributions" }));
    head.appendChild(el("h2", { style: "font-size:clamp(24px,3.4vw,33px);margin-top:6px", text: "Add a company" }));
    head.appendChild(el("p", { style: "color:var(--ink-2);max-width:62ch;margin:8px 0 0", text: "Enter the company name. The workspace, internal ID, secret token and private link are generated for you." }));

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
        el("p", { text: "Send this link to the company's contact. Anyone holding it can open the workspace and contribute, so treat it like a password." }),
        linkBox(f)
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
