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

  function fmtBytes(n) {
    if (!n) return "0 B";
    if (n < 1048576) return Math.max(1, Math.round(n / 1024)) + " kB";
    return (n / 1048576).toFixed(1) + " MB";
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

  /* The company offered as a worked example in invitations, if any. Not offered to the
     example company itself, nor when its code is inactive. */
  function exampleFor(c) {
    var ex = state.companies.filter(function (x) { return x.id === state.example; })[0];
    return ex && ex.id !== c.id && ex.code_active ? ex : null;
  }

  /* Norwegian genitive: "Safrans", but "Hydro Aluminium AS'" for names ending in s, x or z. */
  function genitive(name) { return /[sxz]$/i.test(name) ? name + "\u2019" : name + "s"; }

  var MONTHS = {
    nb: ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  };
  function deadlineText(iso, lang) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return "";
    var d = Number(m[3]), mo = MONTHS[lang][Number(m[2]) - 1];
    return lang === "nb" ? d + ". " + mo : d + " " + mo;
  }

  /* The invitation, following the project's template. The recipient's name stays as
     [navn] / [name] to fill in; deadline and signature come from the Invitation panel. */
  function invitation(c, lang) {
    var ex = exampleFor(c), sender = state.inviteSender || (lang === "en" ? "[name]" : "[navn]");
    var deadline = deadlineText(state.inviteDeadline, lang || "nb");
    if (lang === "en") {
      return [
        "Hi [name],",
        "We have been working on a digital tool for collecting self-reported requirements for the data platform to be developed in H2, including a reference architecture that will build further on your input.",
        "Here is access to " + c.name + "\u2019s self-reported requirements specification in the Bærel project:",
        "Website:",
        c.access_url,
        "Access code: " + c.code,
        "",
        "Feel free to share this with relevant people at " + c.name + "."
      ].concat(ex ? ["If you would like to see a completed example before you start, you can use the code " + ex.code + " on the same website. It opens a fictional but realistic requirements specification for " + ex.name + ", made to demonstrate how the tool can be used, including usage scenarios, sample data and metadata." +
        (ex.submissions_open ? "" : " The example is read-only and contains no real company data.")] : [],
        deadline ? ["We hope to receive your input by " + deadline + ", if that suits you."] : [],
        ["Please get in touch if you have any questions or anything is unclear.", "Best regards,", sender]).join("\n");
    }
    return [
      "Hei [navn],",
      "Vi har jobbet med et digitalt verktøy for innhenting av egenrapporterte krav til dataplattformen som skal utvikles i H2, inkludert en referansearkitektur som vil bygges videre på innspillene deres.",
      "Her er tilgangen til " + genitive(c.name) + " egenrapporterte kravspesifikasjon i Bærel-prosjektet:",
      "Nettside:",
      c.access_url,
      "Tilgangskode: " + c.code,
      "",
      "Del gjerne denne videre med relevante personer hos " + c.name + "."
    ].concat(ex ? ["Dersom dere ønsker å se et ferdig utfylt eksempel før dere begynner, kan dere bruke koden " + ex.code + " på samme nettside. Denne åpner en oppdiktet, men realistisk kravspesifikasjon for " + ex.name + ", laget for å demonstrere hvordan verktøyet kan brukes, inkludert bruksscenarioer, eksempeldata og metadata." +
      (ex.submissions_open ? "" : " Eksempelet er skrivebeskyttet og inneholder ingen reelle virksomhetsdata.")] : [],
      deadline ? ["Vi håper å få innspill innen " + deadline + ", dersom det passer."] : [],
      ["Ta gjerne kontakt dersom det er spørsmål eller noe som er uklart.", "Mvh,", sender]).join("\n");
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
      el("button", { class: "btn", type: "button", text: "Copy invitation", title: "Norwegian, from the project template", onclick: function (e) { copy(invitation(c, "nb"), e.currentTarget); } }),
      el("button", { class: "btn ghost", type: "button", text: "English", title: "The same invitation in English", onclick: function (e) { copy(invitation(c, "en"), e.currentTarget); } }),
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
      (c.sample_files ? " · " + c.sample_files + (c.sample_files === 1 ? " sample file" : " sample files") + " (" + fmtBytes(c.sample_bytes) + ")" : "") +
      (c.code_generations > 1 ? " · code generation " + c.code_generations : "");

    var verBox = el("div");
    var actions = el("div", { class: "co-actions" }, [
      armed(c.code_active ? "Generate new code" : "Generate code", "Confirm — the old code stops working", "", function () { return post(c, "rotate"); }),
      c.code_active ? armed("Revoke access", "Confirm revoke", "danger", function () { return post(c, "revoke"); }) : null,
      c.submissions_open
        ? armed("Close for changes", "Confirm close", "danger", function () { return post(c, "close"); })
        : el("button", { class: "btn", type: "button", text: "Reopen for changes", onclick: function () { post(c, "reopen"); } }),
      c.spec_updated_at ? el("a", { class: "btn", href: "/admin/analysis?company=" + encodeURIComponent(c.id), text: "Analysis" }) : null,
      c.spec_updated_at ? el("a", { class: "btn ghost", href: "/api/admin/companies/" + c.id + "/export",
        title: "The specification with every sample file and scenario image embedded — can be imported again here or on another site",
        text: "Export (JSON)" }) : null,
      importButton(c),
      c.sample_files ? el("a", { class: "btn ghost", href: "/api/admin/companies/" + c.id + "/samples.zip", text: "Sample data (ZIP)" }) : null,
      c.version_count ? el("button", { class: "btn ghost", type: "button", text: "Versions", onclick: function (e) {
        var btn = e.currentTarget;
        if (verBox.childNodes.length) { verBox.textContent = ""; btn.textContent = "Versions"; return; }
        btn.textContent = "Hide versions";
        api("GET", "/api/admin/companies/" + c.id + "/versions").then(function (d) { verBox.appendChild(versionList(c, d.versions)); });
      } }) : null
    ]);

    return el("li", { class: "co", "data-co": c.id }, [
      el("div", { class: "co-top" }, [el("h3", { text: c.name })].concat(pills)),
      el("p", { class: "co-meta mono", text: meta }),
      codeBox(c),
      actions,
      verBox
    ]);
  }

  /* Import an exported specification (JSON) into this company. Embedded files and images are
     stored again, and the import becomes a new version — the previous one can be restored. */
  function importButton(c) {
    var msg = el("span", { class: "co-meta", style: "margin-left:6px" });
    function pick() {
      var input = el("input", { type: "file", accept: ".json,application/json", style: "display:none" });
      input.addEventListener("change", function () {
        var f = input.files && input.files[0];
        input.remove();
        if (!f) return;
        msg.textContent = "Importing …";
        f.text().then(function (txt) {
          var obj;
          try { obj = JSON.parse(txt); } catch (e) { throw new Error("That file is not JSON."); }
          if (obj && Array.isArray(obj.responses) && obj.responses.length === 1) obj = obj.responses[0];
          return api("POST", "/api/admin/companies/" + c.id + "/import", { response: obj });
        }).then(function (d) {
          replaceCompany(d.company);
          var m = "Imported as version " + d.version + (d.files_added ? " · " + d.files_added + " files and images" : "") + (d.skipped && d.skipped.length ? " · " + d.skipped.length + " skipped" : "");
          var card = document.querySelector('[data-co="' + c.id + '"] .co-meta.mono');
          if (card) card.textContent += " · " + m;
        }).catch(function (x) { msg.textContent = "Import failed: " + x.message; });
      });
      document.body.appendChild(input);
      input.click();
    }
    var b = c.spec_updated_at
      ? armed("Import (JSON)", "Confirm — replaces the current content (kept as a version)", "", function () { pick(); return Promise.resolve(); })
      : el("button", { class: "btn ghost", type: "button", text: "Import (JSON)", onclick: pick });
    return el("span", {}, [b, msg]);
  }

  function fmtTime(iso) {
    try { return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
    catch (e) { return iso; }
  }

  var REASON = { "import": "imported", first: "first save", auto: "auto", manual: "saved", "export": "export", migrated: "migrated", "before-restore": "before restore" };
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

    main.appendChild(questionSetPanel());
    main.appendChild(accessPanel());
    main.appendChild(examplePanel());
    main.appendChild(invitePanel());

    if (!state.companies.length) {
      main.appendChild(el("p", { class: "co-empty", text: "No companies yet." }));
      return;
    }
    var list = el("ul", { class: "co-list" });
    state.companies.forEach(function (c) { list.appendChild(companyCard(c)); });
    main.appendChild(list);
  }

  /* Which question set the companies see. Switching only changes what is shown:
     answers to questions outside the lean set are kept and come back with the full set. */
  function questionSetPanel() {
    var box = el("section", { class: "panel qset" });
    box.appendChild(el("p", { class: "eyebrow", text: "Question set" }));
    var seg = el("div", { class: "seg", role: "group", "aria-label": "Question set" });
    [["full", "Full — 207 questions, 21 sections"], ["lean", "Lean — 50 questions, 5 sections"]].forEach(function (o) {
      seg.appendChild(el("button", { type: "button", "aria-pressed": String(state.questionSet === o[0]), text: o[1], onclick: function () {
        if (state.questionSet === o[0]) return;
        api("POST", "/api/admin/settings", { question_set: o[0] }).then(function (d) { state.questionSet = d.question_set; render(); });
      } }));
    });
    box.appendChild(seg);
    box.appendChild(el("p", { class: "co-meta", style: "margin-top:10px", text:
      "Applies to every company the next time they open or reload their page. Switching never deletes anything: answers to questions outside the lean set are kept and reappear with the full set. Analysis follows the same setting." }));
    return box;
  }

  /* Read-only or read/write for every specification at once. Opening all leaves the
     invitation example read-only unless the box is ticked. */
  function accessPanel() {
    var box = el("section", { class: "panel qset" });
    var open = state.companies.filter(function (c) { return c.submissions_open; }).length;
    var closed = state.companies.length - open;
    box.appendChild(el("p", { class: "eyebrow", text: "Access for all specifications" }));
    box.appendChild(el("p", { class: "co-meta", style: "margin:4px 0 12px", text: open + " open for changes · " + closed + " read-only" }));
    var incl = el("input", { type: "checkbox", id: "access-include-example" });
    var ex = state.companies.filter(function (x) { return x.id === state.example; })[0];
    var err = el("p", { class: "err", role: "alert" });
    function setAll(isOpen) {
      return api("POST", "/api/admin/access-all", { open: isOpen, include_example: incl.checked })
        .then(function (d) { state.companies = d.companies; render(); })
        .catch(function (x) { err.textContent = x.message; });
    }
    box.appendChild(el("div", { class: "row", style: "display:flex;flex-wrap:wrap;gap:10px;align-items:center" }, [
      armed("Make all read-only", "Confirm — nobody can change any specification", "danger", function () { return setAll(false); }),
      armed("Make all read/write", "Confirm — every specification opens for changes", "", function () { return setAll(true); }),
      ex ? el("label", { "for": "access-include-example", style: "display:inline-flex;gap:6px;align-items:center" }, [incl, "Also open the invitation example (" + ex.name + ")"]) : null
    ]));
    box.appendChild(err);
    box.appendChild(el("p", { class: "co-meta", style: "margin-top:10px", text:
      "Read-only specifications can still be opened, read and exported with their code. Each company can also be switched on its own card below." }));
    return box;
  }

  /* Which company's specification invitations offer as a worked example. The example
     should be closed for changes, since everyone invited gets its code. */
  function examplePanel() {
    var box = el("section", { class: "panel qset" });
    box.appendChild(el("p", { class: "eyebrow", text: "Example in invitations" }));
    var sel = el("select", { id: "example-company", "aria-label": "Example specification offered in invitations" });
    sel.appendChild(el("option", { value: "", text: "None — invitations carry only the company's own code" }));
    state.companies.forEach(function (c) {
      var o = el("option", { value: c.id, text: c.name + (c.submissions_open ? " (open for changes)" : " (read-only)") });
      if (c.id === state.example) o.selected = true;
      sel.appendChild(o);
    });
    var err = el("p", { class: "err", role: "alert" });
    sel.addEventListener("change", function () {
      err.textContent = "";
      api("POST", "/api/admin/settings", { example_company: sel.value || null })
        .then(function (d) { state.example = d.example_company; render(); })
        .catch(function (x) { err.textContent = x.message; });
    });
    box.appendChild(sel);
    box.appendChild(err);
    var ex = state.companies.filter(function (x) { return x.id === state.example; })[0];
    var msg = !ex ? "Choose a filled-in specification to offer every invited company as an example they can open with its code."
      : !ex.code_active ? ex.name + " has no active code, so invitations leave the example out. Generate a code for it."
      : ex.submissions_open ? "Warning: " + ex.name + " is open for changes, and everyone invited gets its code. Close it for changes to make the example read-only."
      : "Every invitation now offers " + ex.name + " (code " + ex.code + ") as a read-only example. If you generate a new code for it, invitations follow automatically.";
    box.appendChild(el("p", { class: "co-meta" + (ex && (ex.submissions_open || !ex.code_active) ? " err" : ""), style: "margin-top:10px", text: msg }));
    return box;
  }

  /* Deadline and signature used in every copied invitation. */
  function invitePanel() {
    var box = el("section", { class: "panel qset" });
    box.appendChild(el("p", { class: "eyebrow", text: "Invitation" }));
    var dl = el("input", { type: "date", id: "invite-deadline", value: state.inviteDeadline || "" });
    var who = el("input", { type: "text", id: "invite-sender", maxlength: "120", placeholder: "Your name — signs the invitation", value: state.inviteSender || "" });
    var err = el("p", { class: "err", role: "alert" });
    var saved = el("span", { class: "co-meta" });
    function save(body) {
      err.textContent = "";
      api("POST", "/api/admin/settings", body).then(function (d) {
        state.inviteDeadline = d.invite_deadline; state.inviteSender = d.invite_sender;
        saved.textContent = "Saved"; setTimeout(function () { saved.textContent = ""; }, 1500);
      }).catch(function (x) { err.textContent = x.message; });
    }
    dl.addEventListener("change", function () { save({ invite_deadline: dl.value || "" }); });
    who.addEventListener("change", function () { save({ invite_sender: who.value }); });
    box.appendChild(el("div", { style: "display:flex;flex-wrap:wrap;gap:12px;align-items:end" }, [
      el("label", { "for": "invite-deadline", style: "display:flex;flex-direction:column;gap:4px" }, [el("span", { class: "co-meta", text: "Input wanted by" }), dl]),
      el("label", { "for": "invite-sender", style: "display:flex;flex-direction:column;gap:4px;flex:1;min-width:220px" }, [el("span", { class: "co-meta", text: "Signed by" }), who]),
      saved
    ]));
    box.appendChild(err);
    box.appendChild(el("p", { class: "co-meta", style: "margin-top:10px", text:
      "Copy invitation gives the Norwegian text from the project template; English gives the same text in English. Replace [navn] / [name] with the recipient before sending. Without a date, the line about the deadline is left out." }));
    return box;
  }

  function render() { if (boot.authed) renderConsole(); else renderLogin(); }

  if (boot.authed) {
    Promise.all([api("GET", "/api/admin/companies"), api("GET", "/api/admin/settings")]).then(function (r) {
      state.companies = r[0].companies; state.questionSet = r[1].question_set; state.example = r[1].example_company; state.inviteDeadline = r[1].invite_deadline; state.inviteSender = r[1].invite_sender; render();
    });
  } else {
    render();
  }
})();
