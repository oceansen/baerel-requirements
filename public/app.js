/* Bærel requirements survey — wizard, bilingual UI, local draft, export and analysis.
   Served by the workspace server in one of two modes (see the #boot data block):
     workspace       — opened through a company's private link; the draft is kept per
                       company in this browser and submitted to that company's workspace
     admin-analysis  — the admin's analysis view, loaded with responses from the server
   With no boot data it behaves as before: local draft, export a file, local analysis. */

(function () {
  "use strict";

  var BOOT = (function () {
    try { var n = document.getElementById("boot"); return n ? JSON.parse(n.textContent) : {}; }
    catch (e) { return {}; }
  })();
  var WS = BOOT.mode === "workspace" && BOOT.token && BOOT.company ? BOOT : null;
  var ADMIN = BOOT.mode === "admin-analysis" ? BOOT : null;

  var SCHEMA = "baerel-circular-electronics-requirements";
  var SCHEMA_VERSION = 1;
  // One draft per company workspace, so the same browser can serve two companies.
  var DRAFT_KEY = "baerel-survey-draft-v1" + (WS ? ":" + WS.company.id : "");
  var SUB_KEY = WS ? "baerel-submission-v1:" + WS.company.id : null;
  var ANALYSIS_KEY = "baerel-analysis-v1";

  /* ---------------------------------------------------------------- strings */

  var T = {
    nb: {
      program: "Bærel", modeForm: "Undersøkelse", modeAnalyse: "Analyse",
      start: "Start undersøkelsen", resume: "Fortsett der du slapp", restart: "Start på nytt",
      sections: "seksjoner", questions: "spørsmål", minutes: "min",
      estimate: "Anslått tid", langLabel: "Språk",
      of: "av", answered: "besvart", section: "Seksjon",
      next: "Neste", prev: "Forrige", finish: "Fullfør og eksporter", review: "Til oppsummering",
      autosaveOn: "Svarene lagres automatisk i denne nettleseren mens du fyller ut",
      savedAt: "Lagret", sessionOnly: "gjelder bare til fanen lukkes",
      memoryOnly: "Nettleseren tillater ikke lagring – svarene forsvinner hvis du lukker fanen. Eksporter underveis.",
      saveFailed: "Kunne ikke lagre – eksporter svarene dine nå",
      restoredHere: "Vi fortsatte der du slapp – svarene dine var lagret i denne nettleseren.",
      newRespondent: "Tøm skjemaet for ny respondent", confirmReset: "Bekreft – slett alle svar",
      tech: "Teknisk – valgfritt", multi: "Velg alle som passer", single: "Velg ett", scaleHint: "1 = ikke viktig, 5 = kritisk",
      other: "Annet – spesifiser", freeHint: "Skriv så konkret du kan.",
      reviewTitle: "Oppsummering og eksport",
      reviewLede: "Gå gjennom hva som er besvart, og eksporter svarene som fil. Send filen til kontaktpersonen for kartleggingen.",
      exportJson: "Last ned svar (JSON)", exportCsv: "Last ned svar (CSV)", copyJson: "Kopier svar",
      copied: "Kopiert til utklippstavlen", copyFail: "Kunne ikke kopiere – marker teksten og kopier manuelt",
      showRaw: "Vis rådata", hideRaw: "Skjul rådata",
      downloaded: "Filen er lastet ned", declined: "Nedlasting avbrutt",
      noDownload: "Nedlasting er ikke tilgjengelig her – kopier svarene i stedet",
      backToForm: "Tilbake til skjemaet", jump: "Gå til seksjon",
      analyseTitle: "Analyse av innsamlede svar",
      analyseLede: "Legg inn svarfilene du har fått tilbake fra virksomhetene. Alt regnes ut lokalt i nettleseren – ingenting lastes opp.",
      dropHere: "Slipp JSON-filer her, eller",
      chooseFiles: "velg filer",
      pasteLabel: "…eller lim inn innholdet i én svarfil:",
      pasteBtn: "Legg til limt inn svar",
      clearAll: "Fjern alle", responses: "svar", orgs: "virksomheter", roles: "roller i verdikjeden", completion: "gj.sn. utfylling",
      filterRole: "Filtrer på posisjon i verdikjeden", allRoles: "Alle posisjoner", filterSection: "Seksjon", allSections: "Alle seksjoner",
      mean: "snitt", nAnswers: "svar", noAnswers: "Ingen svar", exportWide: "Last ned samlet CSV", exportBundle: "Last ned alle svar (JSON)",
      respondents: "Respondenter", org: "Virksomhet", role: "Rolle", position: "Posisjon", complete: "Utfylt", when: "Levert",
      badFile: "Kunne ikke lese filen", notSurvey: "Filen er ikke et svar fra denne undersøkelsen",
      dupe: "Allerede lagt inn", anonymous: "Anonym", noData: "Ingen svarfiler lagt inn ennå.",
      requiredNone: "Ingen spørsmål er obligatoriske – hopp over det som ikke er relevant.",
      pathCoreTitle: "Kjernespørsmål", pathCoreBtn: "Start kjernespørsmål",
      pathCoreBody: "Det vi trenger fra alle virksomheter. Du kan åpne fordypningen i hver enkelt seksjon underveis hvis temaet er ditt.",
      pathFullTitle: "Full kartlegging", pathFullBtn: "Start full kartlegging",
      pathFullBody: "Alt, inkludert datamodell og arkitektur, teknologivalg, bærekraftsdetaljer, egosentriske data og robotisering.",
      deepLead: "Denne seksjonen har fordypningsspørsmål for dem som jobber med temaet til daglig.",
      openDeep: "Vis {n} fordypningsspørsmål", closeDeep: "Skjul fordypningsspørsmålene",
      scope: "Omfang", scopeCore: "Kjerne", scopeFull: "Full",
      home: "Til forsiden", switchKeeps: "Du kan bytte omfang uten å miste svarene du allerede har gitt.",
      modeOpps: "Muligheter",
      oppsTitle: "Hva kan dette bli?",
      oppsLede: "Svarene dine peker mot konkrete produkter og tjenester – dataprodukter, KI-tjenester, plattform- og driftstjenester – som blir mulige hvis valgene under er på plass. Listen oppdateres mens du fyller ut.",
      oppsEarly: "Svar på noen flere spørsmål, så blir bildet skarpere. Foreløpig viser vi alt som kan åpne seg, og hva hver enkelt mulighet hviler på.",
      oppsCaveat: "Dette er en pekepinn generert av svarene dine, ikke en anbefaling. Bruk den til å se hvilke valg som faktisk låser opp verdi – og ta gjerne opp de nære mulighetene i oppfølgingssamtalen.",
      st_ready: "Klar", st_near: "Nær", st_far: "Ikke ennå",
      restsOn: "Hviler på svarene dine:", stillNeeds: "Forutsetninger:",
      oppsTop: "Dette åpner svarene dine for:", oppsSeeAll: "Se alle mulighetene",
      oppsAgg: "Muligheter på tvers av respondentene", oppsAggLede: "Antall virksomheter der alle forutsetningene for hver mulighet er på plass.",
      moreAvailable: "Du har svart på kjernespørsmålene.", switchFull: "Åpne alle spørsmålene"
    },
    en: {
      program: "Bærel", modeForm: "Survey", modeAnalyse: "Analysis",
      start: "Start the survey", resume: "Continue where you left off", restart: "Start over",
      sections: "sections", questions: "questions", minutes: "min",
      estimate: "Estimated time", langLabel: "Language",
      of: "of", answered: "answered", section: "Section",
      next: "Next", prev: "Back", finish: "Finish and export", review: "Go to summary",
      autosaveOn: "Your answers are saved automatically in this browser as you go",
      savedAt: "Saved", sessionOnly: "only until this tab closes",
      memoryOnly: "This browser blocks storage — answers are lost if you close the tab. Export as you go.",
      saveFailed: "Could not save — export your responses now",
      restoredHere: "Picked up where you left off — your answers were saved in this browser.",
      newRespondent: "Clear the form for a new respondent", confirmReset: "Confirm — delete all answers",
      tech: "Technical – optional", multi: "Select all that apply", single: "Select one", scaleHint: "1 = not important, 5 = critical",
      other: "Other – please specify", freeHint: "Be as concrete as you can.",
      reviewTitle: "Summary and export",
      reviewLede: "Check what has been answered, then export your responses as a file and send it to the survey contact.",
      exportJson: "Download responses (JSON)", exportCsv: "Download responses (CSV)", copyJson: "Copy responses",
      copied: "Copied to clipboard", copyFail: "Could not copy — select the text and copy manually",
      showRaw: "Show raw data", hideRaw: "Hide raw data",
      downloaded: "File downloaded", declined: "Download cancelled",
      noDownload: "Downloads are not available here — copy the responses instead",
      backToForm: "Back to the form", jump: "Jump to section",
      analyseTitle: "Analysis of collected responses",
      analyseLede: "Load the response files you received back from companies. Everything is computed locally in your browser — nothing is uploaded.",
      dropHere: "Drop JSON files here, or",
      chooseFiles: "choose files",
      pasteLabel: "…or paste the contents of a single response file:",
      pasteBtn: "Add pasted response",
      clearAll: "Clear all", responses: "responses", orgs: "organisations", roles: "value-chain positions", completion: "avg. completion",
      filterRole: "Filter by position in the value chain", allRoles: "All positions", filterSection: "Section", allSections: "All sections",
      mean: "mean", nAnswers: "answers", noAnswers: "No answers", exportWide: "Download combined CSV", exportBundle: "Download all responses (JSON)",
      respondents: "Respondents", org: "Organisation", role: "Role", position: "Position", complete: "Complete", when: "Submitted",
      badFile: "Could not read the file", notSurvey: "That file is not a response to this survey",
      dupe: "Already loaded", anonymous: "Anonymous", noData: "No response files loaded yet.",
      requiredNone: "No question is mandatory — skip anything that is not relevant.",
      pathCoreTitle: "Core questions", pathCoreBtn: "Start the core questions",
      pathCoreBody: "What we need from every organisation. You can open the deeper track in any section as you go, if that subject is yours.",
      pathFullTitle: "Full survey", pathFullBtn: "Start the full survey",
      pathFullBody: "Everything, including data model and architecture, technology choices, sustainability detail, egocentric data and robotics.",
      deepLead: "This section has deeper questions for people who work with the subject day to day.",
      openDeep: "Show {n} deeper questions", closeDeep: "Hide the deeper questions",
      scope: "Scope", scopeCore: "Core", scopeFull: "Full",
      home: "Back to the start page", switchKeeps: "You can change scope without losing the answers you have already given.",
      modeOpps: "Opportunities",
      oppsTitle: "What could this become?",
      oppsLede: "Your answers point at concrete products and services — data products, AI services, platform and operations services — that become possible once the choices below are in place. The list updates as you fill in the survey.",
      oppsEarly: "Answer a few more questions and the picture sharpens. For now we show everything that could open up, and what each one rests on.",
      oppsCaveat: "This is an indication generated from your answers, not a recommendation. Use it to see which choices actually unlock value — and bring the near ones to the follow-up conversation.",
      st_ready: "Ready", st_near: "Close", st_far: "Not yet",
      restsOn: "Rests on your answers:", stillNeeds: "Preconditions:",
      oppsTop: "What your answers open up:", oppsSeeAll: "See all the opportunities",
      oppsAgg: "Opportunities across respondents", oppsAggLede: "Number of organisations where every precondition for an opportunity is already in place.",
      moreAvailable: "You have answered the core questions.", switchFull: "Open all the questions"
    }
  };


  /* Interview-guide wording. The tool is run by an interviewer in conversation with
     someone from the company, so the copy speaks to the interviewer. */
  var INTERVIEW_T = {
    nb: {
      modeForm: "Intervjuguide",
      autosaveOn: "Svar og notater lagres automatisk i denne nettleseren underveis",
      restoredHere: "Vi fortsatte der du slapp – intervjuet var lagret i denne nettleseren.",
      newRespondent: "Start et nytt intervju", confirmReset: "Bekreft – tøm svar og notater",
      requiredNone: "Ingen spørsmål er obligatoriske – hopp over det som ikke er relevant for intervjuobjektet.",
      reviewTitle: "Oppsummering av intervjuet",
      reviewLede: "Gå gjennom hva intervjuet har dekket, og eksporter svar og notater som fil.",
      pathCoreTitle: "Kjerneintervju", pathCoreBtn: "Start kjerneintervjuet",
      pathCoreBody: "Det vi trenger fra alle virksomheter. Åpne fordypningen i en seksjon underveis når samtalen går i dybden på et tema.",
      pathFullTitle: "Fullt intervju", pathFullBtn: "Start fullt intervju",
      pathFullBody: "Alle temaene, inkludert datamodell og arkitektur, teknologivalg, bærekraftsdetaljer, egosentriske data og robotisering. Egner seg best over to økter.",
      analyseTitle: "Analyse av intervjuene",
      analyseLede: "Legg inn intervjufilene. Alt regnes ut lokalt i nettleseren – ingenting lastes opp.",
      responses: "intervjuer", respondents: "Intervjuer", noData: "Ingen intervjufiler lagt inn ennå.",
      notePh: "Notat …", noteFor: "Notat til", qNote: "Notat til spørsmålet",
      qNotePh: "Hva ble sagt, forbehold, sitater, oppfølging …", notesCount: "notater",
      metaTitle: "Om intervjuet", metaInterviewer: "Intervjuer", metaInterviewerPh: "Ditt navn",
      metaInterviewee: "Intervjuobjekt", metaIntervieweePh: "Navn eller initialer (valgfritt)", metaDate: "Dato",
      notSelected: "ikke valgt", notesHead: "Intervjuernotater",
      minutesCore: "ca. 45–60", minutesFull: "90–120", minutesRange: "45–120",
      start: "Start intervjuet", notSurvey: "Filen er ikke fra denne intervjuguiden",
      oppsLede: "Svarene peker mot konkrete produkter og tjenester – dataprodukter, KI-tjenester, plattform- og driftstjenester – som blir mulige hvis valgene under er på plass. Listen oppdateres etter hvert som intervjuet skrider fram. Bruk den gjerne som samtalestøtte mot slutten."
    },
    en: {
      modeForm: "Interview guide",
      autosaveOn: "Answers and notes are saved automatically in this browser as you go",
      restoredHere: "Picked up where you left off — the interview was saved in this browser.",
      newRespondent: "Start a new interview", confirmReset: "Confirm — clear answers and notes",
      requiredNone: "No question is mandatory — skip anything that is not relevant to the interviewee.",
      reviewTitle: "Interview summary",
      reviewLede: "Check what the interview covered, then export the answers and notes as a file.",
      pathCoreTitle: "Core interview", pathCoreBtn: "Start the core interview",
      pathCoreBody: "What we need from every organisation. Open a section's deeper track whenever the conversation goes into depth on that subject.",
      pathFullTitle: "Full interview", pathFullBtn: "Start the full interview",
      pathFullBody: "Every subject, including data model and architecture, technology choices, sustainability detail, egocentric data and robotics. Works best over two sessions.",
      analyseTitle: "Analysis of the interviews",
      analyseLede: "Load the interview files. Everything is computed locally in your browser — nothing is uploaded.",
      responses: "interviews", respondents: "Interviews", noData: "No interview files loaded yet.",
      notePh: "Note …", noteFor: "Note on", qNote: "Note on the question",
      qNotePh: "What was said, caveats, quotes, follow-ups …", notesCount: "notes",
      metaTitle: "About the interview", metaInterviewer: "Interviewer", metaInterviewerPh: "Your name",
      metaInterviewee: "Interviewee", metaIntervieweePh: "Name or initials (optional)", metaDate: "Date",
      notSelected: "not selected", notesHead: "Interviewer notes",
      minutesCore: "c. 45–60", minutesFull: "90–120", minutesRange: "45–120",
      start: "Start the interview", notSurvey: "That file is not from this interview guide",
      oppsLede: "The answers point at concrete products and services — data products, AI services, platform and operations services — that become possible once the choices below are in place. The list updates as the interview progresses; it works well as a prompt towards the end of the conversation."
    }
  };
  ["nb", "en"].forEach(function (l) { Object.keys(INTERVIEW_T[l]).forEach(function (k) { T[l][k] = INTERVIEW_T[l][k]; }); });

  /* Workspace wording. Overrides the export-first wording when the survey is opened
     through a company link, where submitting is the main path and export the backup. */
  var WS_T = {
    nb: {
      wsLabel: "Arbeidsområde", wsOpen: "Tar imot svar", wsClosed: "Stengt for nye svar",
      wsContribs: "intervjuer", wsContrib1: "intervju", wsNone: "Ingen intervjuer er sendt inn ennå.",
      wsWho: "Registrerte intervjuer", wsYou: "dette intervjuet", wsRoleless: "Rolle ikke oppgitt",
      wsPrivacy: "Intervjuet sendes til arbeidsområdet for {org}. Andre med lenken ser at et intervju er registrert (rolle, utfyllingsgrad og dato) – ikke svar eller notater. Ikke del lenken utenfor prosjektet og virksomheten.",
      finish: "Til innsending", review: "Til innsending",
      reviewTitle: "Oppsummering og innsending",
      reviewLede: "Gå gjennom hva intervjuet har dekket, og send svar og notater inn til arbeidsområdet. Du kan oppdatere innsendingen så lenge arbeidsområdet er åpent.",
      submitTitle: "Send inn intervjuet til {org}",
      submitBody: "Svar og notater lagres i arbeidsområdet til {org}. Fra denne nettleseren kan du oppdatere innsendingen senere.",
      submitBtn: "Send inn intervjuet", updateBtn: "Oppdater innsendt intervju",
      submitting: "Sender …", submittedAt: "Sendt inn {when}", upToDate: "Innsendt versjon er oppdatert.",
      changedSince: "Du har endret svar siden forrige innsending – oppdater for å ta dem med.",
      submitFail: "Kunne ikke sende inn. Prøv igjen, eller last ned svarene som fil og send den til kontaktpersonen.",
      closedBody: "Arbeidsområdet tar ikke imot flere svar. Du kan fortsatt laste ned svarene dine som fil.",
      linkGone: "Lenken er ikke lenger aktiv. Last ned svarene dine som fil, og be kontaktpersonen om den nye lenken.",
      backupLabel: "Sikkerhetskopi:"
    },
    en: {
      wsLabel: "Workspace", wsOpen: "Accepting responses", wsClosed: "Closed to new responses",
      wsContribs: "interviews", wsContrib1: "interview", wsNone: "No interviews submitted yet.",
      wsWho: "Recorded interviews", wsYou: "this interview", wsRoleless: "Role not given",
      wsPrivacy: "The interview goes to the {org} workspace. Others with the link see that an interview was recorded (role, completion and date) — not the answers or notes. Keep the link within the project and the organisation.",
      finish: "Go to submission", review: "Go to submission",
      reviewTitle: "Summary and submission",
      reviewLede: "Check what the interview covered, then submit the answers and notes to the workspace. You can update the submission while the workspace is open.",
      submitTitle: "Submit the interview to {org}",
      submitBody: "Answers and notes are stored in the {org} workspace. From this browser you can update the submission later.",
      submitBtn: "Submit the interview", updateBtn: "Update submitted interview",
      submitting: "Submitting …", submittedAt: "Submitted {when}", upToDate: "The submitted version is up to date.",
      changedSince: "You have changed answers since your last submission — update to include them.",
      submitFail: "Could not submit. Try again, or download your responses as a file and send it to your contact.",
      closedBody: "This workspace no longer accepts responses. You can still download your answers as a file.",
      linkGone: "This link is no longer active. Download your answers as a file and ask your contact for the new link.",
      backupLabel: "Backup:"
    }
  };
  if (WS) ["nb", "en"].forEach(function (l) { Object.keys(WS_T[l]).forEach(function (k) { T[l][k] = WS_T[l][k]; }); });

  T.nb.adminLede = "Svar fra virksomhetenes arbeidsområder, hentet fra serveren. Du kan fortsatt legge til svarfiler som har kommet på e-post.";
  T.en.adminLede = "Responses from the company workspaces, fetched from the server. You can still add response files that arrived by email.";
  T.nb.adminBack = "Tilbake til arbeidsområdene"; T.en.adminBack = "Back to workspaces";

  /* ---------------------------------------------------------------- state */

  var ALL_Q = [];
  var Q_BY_ID = {};
  SURVEY.sections.forEach(function (s) {
    s.questions.forEach(function (q) { q._section = s.id; ALL_Q.push(q); Q_BY_ID[q.id] = q; });
  });

  /* Normalised access to an answer, for the opportunity rules. */
  function localGet(qid) {
    var q = Q_BY_ID[qid], a = state.answers[qid];
    if (!q) return { sel: [], val: null };
    if (q.t === "scale") return { sel: [], val: typeof a === "number" ? a : null };
    if (q.t === "multi") return { sel: (a && a.i) ? a.i : [], val: null };
    if (q.t === "single") return { sel: (a && typeof a.i === "number") ? [a.i] : [], val: null };
    return { sel: [], val: null };
  }

  function responseGet(resp) {
    var m = {};
    (resp.answers || []).forEach(function (r) { m[r.id] = r; });
    return function (qid) {
      var r = m[qid];
      if (!r) return { sel: [], val: null };
      return { sel: r.selected || [], val: typeof r.value === "number" ? r.value : null };
    };
  }

  function sortedOpportunities(get) {
    var rank = { ready: 0, near: 1, far: 2 };
    return evalOpportunities(get).sort(function (a, b) {
      if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
      return b.ratio - a.ratio;
    });
  }

  var state = {
    lang: "nb",
    mode: "form",
    view: "start",
    path: "core",      // "core" = the short path, "full" = every question
    tracks: [],        // section ids opened out to full depth while on the core path
    lastView: "form",
    section: 0,
    answers: {},
    notes: {},         // interviewer notes: notes[qid][optionIndex] and notes[qid].q (whole question)
    meta: { interviewer: "", interviewee: "", date: "" },
    started: null
  };

  var analysis = { responses: [] };
  var restored = false;
  var lastSaved = null;
  var saveFailed = false;

  function t(k) { return T[state.lang][k]; }
  function L(o) { return o[state.lang]; }

  /* Storage with graceful fallback: localStorage survives a reload and a closed
     browser; sessionStorage survives a reload only; memory survives neither.
     Private windows and locked-down corporate profiles hit the lower tiers, and
     the save indicator says which one is in force. */
  var store = (function () {
    function usable(s) {
      try { s.setItem("__baerel_probe", "1"); s.removeItem("__baerel_probe"); return true; }
      catch (e) { return false; }
    }
    function wrap(kind, s) {
      return {
        kind: kind,
        get: function (k) { try { return s.getItem(k); } catch (e) { return null; } },
        set: function (k, v) { s.setItem(k, v); },
        del: function (k) { try { s.removeItem(k); } catch (e) {} }
      };
    }
    try { if (window.localStorage && usable(window.localStorage)) return wrap("local", window.localStorage); } catch (e) {}
    try { if (window.sessionStorage && usable(window.sessionStorage)) return wrap("session", window.sessionStorage); } catch (e) {}
    var mem = {};
    return {
      kind: "memory",
      get: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      set: function (k, v) { mem[k] = v; },
      del: function (k) { delete mem[k]; }
    };
  })();

  function loadDraft() {
    var raw = store.get(DRAFT_KEY);
    if (!raw) return null;
    try {
      var d = JSON.parse(raw);
      return d && d.answers ? d : null;
    } catch (e) { return null; }
  }

  function saveDraft() {
    try {
      store.set(DRAFT_KEY, JSON.stringify({
        lang: state.lang, section: state.section, view: state.view,
        path: state.path, tracks: state.tracks,
        answers: state.answers, notes: state.notes, meta: state.meta,
        started: state.started, saved_at: new Date().toISOString()
      }));
      lastSaved = new Date();
      saveFailed = false;
      setSaveState();
      return true;
    } catch (e) {
      saveFailed = true;
      setSaveState();
      return false;
    }
  }

  function clearDraft() {
    store.del(DRAFT_KEY);
    lastSaved = null;
    saveFailed = false;
  }

  function saveAnalysis() {
    if (ADMIN) return true; // server is the record; don't copy every response into this browser
    try {
      var s = JSON.stringify(analysis.responses);
      if (s.length > 3000000) { store.del(ANALYSIS_KEY); return false; }
      store.set(ANALYSIS_KEY, s);
      return true;
    } catch (e) { return false; }
  }

  function loadAnalysis() {
    if (ADMIN) return;
    var raw = store.get(ANALYSIS_KEY);
    if (!raw) return;
    try {
      var a = JSON.parse(raw);
      if (a && a.length) analysis.responses = a;
    } catch (e) {}
  }

  /* ---------------------------------------------------------------- answers */

  /* On the core path a section shows its core questions, plus everything if the
     respondent has opened that section's deep track. */
  function visibleQs(sec) {
    if (state.path === "full" || state.tracks.indexOf(sec.id) > -1) return sec.questions;
    return sec.questions.filter(function (q) { return q.core; });
  }

  function hiddenCount(sec) { return sec.questions.length - visibleQs(sec).length; }

  function coreTotal() {
    var n = 0;
    SURVEY.sections.forEach(function (s) { n += s.questions.filter(function (q) { return q.core; }).length; });
    return n;
  }

  function isAnswered(q) {
    var a = state.answers[q.id];
    if (a === undefined || a === null) return false;
    if (q.t === "text" || q.t === "longtext") return String(a).trim().length > 0;
    if (q.t === "scale") return typeof a === "number";
    if (q.t === "single") return a && (typeof a.i === "number");
    if (q.t === "multi") return a && a.i && a.i.length > 0;
    return false;
  }

  function sectionProgress(s) {
    var qs = visibleQs(s);
    var done = 0;
    qs.forEach(function (q) { if (isAnswered(q)) done++; });
    return { done: done, total: qs.length };
  }

  function totalProgress() {
    var done = 0, total = 0;
    SURVEY.sections.forEach(function (s) {
      visibleQs(s).forEach(function (q) { total++; if (isAnswered(q)) done++; });
    });
    return { done: done, total: total || 1 };
  }

  /* ---------------------------------------------------------------- export */

  function answerRecord(q) {
    var a = state.answers[q.id];
    var rec = { id: q.id, type: q.t, section: q._section, question_en: q.en.q, question_nb: q.nb.q };
    if (q.t === "text" || q.t === "longtext") {
      rec.text = a ? String(a) : "";
    } else if (q.t === "scale") {
      rec.value = (typeof a === "number") ? a : null;
    } else if (q.t === "single") {
      rec.selected = (a && typeof a.i === "number") ? [a.i] : [];
      rec.labels_en = rec.selected.map(function (i) { return q.en.o[i]; });
      rec.labels_nb = rec.selected.map(function (i) { return q.nb.o[i]; });
      if (a && a.other) rec.other = a.other;
    } else if (q.t === "multi") {
      rec.selected = (a && a.i) ? a.i.slice().sort(function (x, y) { return x - y; }) : [];
      rec.labels_en = rec.selected.map(function (i) { return q.en.o[i]; });
      rec.labels_nb = rec.selected.map(function (i) { return q.nb.o[i]; });
      if (a && a.other) rec.other = a.other;
    }
    var n = state.notes[q.id];
    if (n) {
      if (n.q && n.q.trim()) rec.note = n.q.trim();
      if (q.en.o) {
        var on = Object.keys(n).filter(function (k) { return k !== "q" && n[k] && n[k].trim(); })
          .map(Number).sort(function (x, y) { return x - y; })
          .map(function (k) {
            return { index: k, selected: (rec.selected || []).indexOf(k) > -1, label_en: q.en.o[k], label_nb: q.nb.o[k], note: n[k].trim() };
          });
        if (on.length) rec.option_notes = on;
      }
    }
    return rec;
  }

  function buildResponse() {
    var p = totalProgress();
    return {
      schema: SCHEMA,
      schema_version: SCHEMA_VERSION,
      language: state.lang,
      path: state.path,
      tracks: state.tracks.slice(),
      format: "interview",
      interview: {
        interviewer: String(state.meta.interviewer || "").trim(),
        interviewee: String(state.meta.interviewee || "").trim(),
        date: state.meta.date || ""
      },
      answered_count: p.done,
      asked_count: p.total,
      started_at: state.started,
      exported_at: new Date().toISOString(),
      completion: Math.round((p.done / p.total) * 100),
      respondent: {
        role: state.answers.q1 ? String(state.answers.q1) : "",
        organisation: state.answers.q2 ? String(state.answers.q2) : ""
      },
      answers: ALL_Q.map(answerRecord),
      opportunities: evalOpportunities(localGet).map(function (r) {
        return { id: r.opp.id, status: r.status, ratio: Math.round(r.ratio * 100) / 100 };
      })
    };
  }

  function answerToText(rec, lang) {
    var noteWord = lang === "nb" ? "notat" : "note";
    var s;
    if (rec.type === "text" || rec.type === "longtext") return rec.text || "";
    if (rec.type === "scale") s = rec.value == null ? "" : String(rec.value);
    else {
      var notes = {};
      (rec.option_notes || []).forEach(function (o) { notes[o.index] = o; });
      var parts = (rec.selected || []).map(function (i, k) {
        var lab = ((lang === "nb" ? rec.labels_nb : rec.labels_en) || [])[k] || "";
        return notes[i] ? lab + " [" + noteWord + ": " + notes[i].note + "]" : lab;
      });
      if (rec.other) parts.push(rec.other);
      (rec.option_notes || []).forEach(function (o) {
        if (!o.selected) parts.push("(" + (lang === "nb" ? "ikke valgt" : "not selected") + ") " + (lang === "nb" ? o.label_nb : o.label_en) + " [" + noteWord + ": " + o.note + "]");
      });
      s = parts.join(" | ");
    }
    if (rec.note) s = (s ? s + " | " : "") + noteWord + ": " + rec.note;
    return s;
  }

  function csvCell(v) {
    v = v == null ? "" : String(v);
    return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function responseCsv(resp) {
    var rows = [["question_id", "section", "type", "question_en", "question_nb", "answer"]];
    resp.answers.forEach(function (r) {
      rows.push([r.id, r.section, r.type, r.question_en, r.question_nb, answerToText(r, resp.language)]);
    });
    return rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n");
  }

  function slug(s) {
    return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "anonym";
  }

  var downloadsPromise = null;
  function getDownloads() {
    if (downloadsPromise) return downloadsPromise;
    if (window.claude && typeof window.claude.use === "function") {
      downloadsPromise = window.claude.use("downloads").catch(function () { return null; });
    } else {
      downloadsPromise = Promise.resolve(null);
    }
    return downloadsPromise;
  }

  var framed = !!(window.claude && typeof window.claude.use === "function");

  function saveFile(filename, text, onStatus) {
    getDownloads().then(function (dl) {
      if (dl) {
        dl.save({ filename: filename, data: text }).then(function () {
          onStatus(t("downloaded"));
        })["catch"](function (err) {
          onStatus(err && err.code === "declined" ? t("declined") : t("noDownload"));
        });
        return;
      }
      if (framed) { onStatus(t("noDownload")); return; }
      try {
        var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        onStatus(t("downloaded"));
      } catch (e) { onStatus(t("noDownload")); }
    });
  }

  function copyText(text, onStatus) {
    var done = function () { onStatus(t("copied")); };
    var fail = function () { onStatus(t("copyFail")); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done)["catch"](fail);
    } else { fail(); }
  }

  /* ---------------------------------------------------------------- workspace */

  var ws = {
    info: WS ? { company: WS.company, contributions: [] } : null,
    gone: false, busy: false, msg: ""
  };

  if (WS) {
    SURVEY.privacy = {
      nb: "Svar og notater lagres i denne nettleseren under intervjuet, og sendes til arbeidsområdet først når du trykker «Send inn».",
      en: "Answers and notes are kept in this browser during the interview, and only go to the workspace when you press “Submit”."
    };
  }

  function fill(s) { return s.replace(/\{org\}/g, ws.info ? ws.info.company.name : ""); }

  function fmtWhen(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var loc = state.lang === "nb" ? "nb-NO" : "en-GB";
    try { return d.toLocaleDateString(loc, { day: "numeric", month: "short" }) + " " + clockTime(d); }
    catch (e) { return iso.slice(0, 16).replace("T", " "); }
  }

  /* Cheap signature of the answers, to tell whether the submitted copy is stale. */
  function answersSig() {
    var s = JSON.stringify(state.answers), h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0) + ":" + s.length;
  }

  function mySubmission() {
    if (!SUB_KEY) return null;
    try { var r = store.get(SUB_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function rememberSubmission(o) { try { store.set(SUB_KEY, JSON.stringify(o)); } catch (e) {} }

  function wsFetch(method, suffix, body) {
    return fetch("/api/w/" + WS.token + suffix, {
      method: method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer"
    }).then(function (r) {
      return r.json()["catch"](function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.message || ("HTTP " + r.status)); e.status = r.status; e.code = d.error; throw e; }
        return d;
      });
    });
  }

  function loadWorkspace() {
    return wsFetch("GET", "").then(function (d) { ws.info = d; })["catch"](function (e) {
      if (e.status === 404 || e.status === 410) ws.gone = true;
    });
  }

  function submitToWorkspace() {
    var mine = mySubmission();
    var resp = buildResponse();
    var sig = answersSig();
    ws.busy = true; ws.msg = ""; render();
    var req = mine
      ? wsFetch("PUT", "/submissions/" + encodeURIComponent(mine.id), { response: resp, edit_key: mine.edit_key })["catch"](function (e) {
          // Our copy is gone or the key no longer matches: file a fresh submission instead.
          if (e.status === 403) return wsFetch("POST", "/submissions", { response: resp });
          throw e;
        })
      : wsFetch("POST", "/submissions", { response: resp });
    req.then(function (d) {
      rememberSubmission({ id: d.id, edit_key: d.edit_key || mine.edit_key, updated_at: d.updated_at, sig: sig });
      return loadWorkspace();
    })["catch"](function (e) {
      if (e.status === 423) ws.info.company.open = false;
      else if (e.status === 404 || e.status === 410) ws.gone = true;
      else ws.msg = t("submitFail");
    }).then(function () { ws.busy = false; render(); });
  }

  function wsBand() {
    var c = ws.info.company, n = ws.info.contributions.length;
    return el("div", { class: "ws-band" }, [
      el("span", { class: "eyebrow", text: t("wsLabel") }),
      el("b", { text: c.name }),
      el("span", { class: "pill " + (ws.gone ? "closed" : c.open ? "open" : "closed"), text: ws.gone ? "—" : c.open ? t("wsOpen") : t("wsClosed") }),
      el("span", { class: "a-meta mono", style: "margin:0", text: n + " " + (n === 1 ? t("wsContrib1") : t("wsContribs")) })
    ]);
  }

  function wsContribList() {
    var mine = mySubmission();
    var box = el("div", { style: "margin-top:26px" });
    box.appendChild(el("p", { class: "eyebrow", text: t("wsWho") }));
    var list = ws.info.contributions;
    if (!list.length) { box.appendChild(el("p", { class: "a-meta", text: t("wsNone") })); return box; }
    var ul = el("ul", { class: "contrib" });
    list.forEach(function (s) {
      var me = !!(mine && mine.id === s.id);
      ul.appendChild(el("li", { class: me ? "mine" : "" }, [
        el("span", { text: (s.role || t("wsRoleless")) + (me ? " (" + t("wsYou") + ")" : "") }),
        el("span", { class: "count num", text: s.completion + "%" }),
        el("span", { class: "count when", text: fmtWhen(s.updated_at) })
      ]));
    });
    box.appendChild(ul);
    return box;
  }

  function wsSubmitBox() {
    var c = ws.info.company, mine = mySubmission();
    var box = el("div", { class: "submit-box" });
    box.appendChild(el("h3", { text: fill(t("submitTitle")) }));
    var when = mine ? t("submittedAt").replace("{when}", fmtWhen(mine.updated_at)) : "";
    if (ws.gone) { box.appendChild(el("p", { text: t("linkGone") })); return box; }
    if (!c.open) {
      box.appendChild(el("p", { text: t("closedBody") }));
      if (mine) box.appendChild(el("p", { class: "a-meta", text: when }));
      return box;
    }
    box.appendChild(el("p", { text: fill(t("submitBody")) }));
    var changed = !!(mine && mine.sig !== answersSig());
    if (mine) box.appendChild(el("p", { class: "a-meta", text: when + " · " + (changed ? t("changedSince") : t("upToDate")) }));
    var btn = el("button", {
      class: "btn primary", type: "button",
      text: ws.busy ? t("submitting") : (mine ? t("updateBtn") : t("submitBtn")),
      onclick: submitToWorkspace
    });
    if (ws.busy || (mine && !changed)) btn.disabled = true;
    box.appendChild(el("div", { class: "row" }, [btn]));
    if (ws.msg) box.appendChild(el("p", { class: "err", role: "alert", text: ws.msg }));
    return box;
  }

  /* Admin analysis: pull every stored response (or one company's) from the server. */
  function loadServerResponses() {
    var url = ADMIN.company ? "/api/admin/companies/" + encodeURIComponent(ADMIN.company) + "/submissions" : "/api/admin/submissions";
    return fetch(url, { credentials: "same-origin", cache: "no-store" }).then(function (r) {
      if (r.status === 401) { location.href = "/admin"; return { responses: [] }; }
      return r.json();
    }).then(function (d) {
      (d.responses || []).forEach(function (r) { addResponse(r, r._server ? r._server.company_name : ""); });
      setStatus((state.lang === "nb" ? "Hentet " : "Loaded ") + (d.responses || []).length + (state.lang === "nb" ? " svar fra serveren" : " responses from the server"));
    });
  }


  /* ---------------------------------------------------------------- interviewer notes */

  function noteGet(qid, key) { var n = state.notes[qid]; return (n && n[key]) || ""; }
  function noteSet(qid, key, v) {
    var n = state.notes[qid] || (state.notes[qid] = {});
    if (v && v.trim()) n[key] = v; else { delete n[key]; if (!Object.keys(n).length) delete state.notes[qid]; }
    persist();
  }

  /* A small pen button that opens a note field under whatever it is attached to.
     A field with content stays open, so notes are never hidden by accident. */
  function noteControl(host, q, key, label, cls) {
    var has = !!noteGet(q.id, key).trim();
    var ta = el("textarea", {
      class: cls + (has ? "" : " hidden"), rows: "2",
      placeholder: t("notePh"), "aria-label": t("noteFor") + " " + label
    });
    ta.value = noteGet(q.id, key);
    var btn = el("button", {
      class: "note-btn" + (has ? " on" : ""), type: "button",
      title: t("noteFor") + " " + label, "aria-label": t("noteFor") + " " + label,
      "aria-expanded": String(has)
    }, [el("span", { "aria-hidden": "true", text: "✎" })]);
    btn.addEventListener("click", function () {
      var open = ta.classList.toggle("hidden") === false;
      btn.setAttribute("aria-expanded", String(open));
      if (open) ta.focus();
    });
    ta.addEventListener("input", function () {
      noteSet(q.id, key, ta.value);
      btn.classList.toggle("on", !!ta.value.trim());
    });
    ta.addEventListener("blur", function () {
      flushDraft();
      if (!ta.value.trim()) { ta.classList.add("hidden"); btn.setAttribute("aria-expanded", "false"); }
    });
    host.appendChild(btn);
    host.appendChild(ta);
  }

  function questionNote(q) {
    var has = !!noteGet(q.id, "q").trim();
    var box = el("div", { class: "q-note" });
    var ta = el("textarea", { class: "q-note-in" + (has ? "" : " hidden"), rows: "2", placeholder: t("qNotePh"), "aria-label": t("qNote") });
    ta.value = noteGet(q.id, "q");
    var btn = el("button", { class: "note-link" + (has ? " on" : ""), type: "button", "aria-expanded": String(has) }, [
      el("span", { "aria-hidden": "true", text: "✎ " }), el("span", { text: t("qNote") })
    ]);
    btn.addEventListener("click", function () {
      var open = ta.classList.toggle("hidden") === false;
      btn.setAttribute("aria-expanded", String(open));
      if (open) ta.focus();
    });
    ta.addEventListener("input", function () { noteSet(q.id, "q", ta.value); btn.classList.toggle("on", !!ta.value.trim()); });
    ta.addEventListener("blur", function () {
      flushDraft();
      if (!ta.value.trim()) { ta.classList.add("hidden"); btn.setAttribute("aria-expanded", "false"); }
    });
    box.appendChild(btn);
    box.appendChild(ta);
    return box;
  }

  function noteCount() {
    var n = 0;
    Object.keys(state.notes).forEach(function (q) { n += Object.keys(state.notes[q]).length; });
    return n;
  }

  /* Interview details: who ran it, with whom, when. Kept with the draft and exported. */
  function interviewPanel() {
    if (!state.meta.date) state.meta.date = new Date().toISOString().slice(0, 10);
    function field(key, type, labelKey, phKey) {
      var inp = el("input", { type: type, id: "meta-" + key, placeholder: phKey ? t(phKey) : "" });
      inp.value = state.meta[key] || "";
      inp.addEventListener("input", function () { state.meta[key] = inp.value; persist(); });
      inp.addEventListener("blur", flushDraft);
      return el("label", { class: "meta-f", "for": "meta-" + key }, [el("span", { class: "eyebrow", text: t(labelKey) }), inp]);
    }
    return el("div", { class: "meta-panel" }, [
      el("p", { class: "eyebrow", text: t("metaTitle") }),
      el("div", { class: "meta-grid" }, [
        field("interviewer", "text", "metaInterviewer", "metaInterviewerPh"),
        field("interviewee", "text", "metaInterviewee", "metaIntervieweePh"),
        field("date", "date", "metaDate", null)
      ])
    ]);
  }

  /* ---------------------------------------------------------------- dom helpers */

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  var app = document.getElementById("app");
  var statusBox = null;

  function setStatus(msg) {
    if (!statusBox) return;
    statusBox.textContent = msg;
  }

  function clockTime(d) {
    try { return d.toLocaleTimeString(state.lang === "nb" ? "nb-NO" : "en-GB", { hour: "2-digit", minute: "2-digit" }); }
    catch (e) { return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  }

  function setSaveState() {
    if (!statusBox) return;
    if (saveFailed) { statusBox.textContent = t("saveFailed"); return; }
    if (store.kind === "memory") { statusBox.textContent = t("memoryOnly"); return; }
    if (!lastSaved) { statusBox.textContent = t("autosaveOn"); return; }
    var msg = t("savedAt") + " " + clockTime(lastSaved);
    if (store.kind === "session") msg += " · " + t("sessionOnly");
    statusBox.textContent = msg;
  }

  /* ---------------------------------------------------------------- chrome */

  function renderTopbar() {
    var bar = document.getElementById("topbar-in");
    bar.textContent = "";
    bar.appendChild(el("button", {
      class: "brand", type: "button", title: t("home"), "aria-label": t("home"),
      onclick: ADMIN ? function () { location.href = "/admin"; } : goHome
    }, [
      el("span", { class: "eyebrow", text: WS ? WS.company.name : t("program") }),
      el("b", { text: L(SURVEY.title) })
    ]));

    var modes = el("div", { class: "seg", role: "group" }, [
      el("button", {
        type: "button", "aria-pressed": String(state.mode === "form"), text: t("modeForm"),
        onclick: function () { state.mode = "form"; render(); }
      }),
      el("button", {
        type: "button", "aria-pressed": String(state.mode === "opps"), text: t("modeOpps"),
        onclick: function () { state.mode = "opps"; render(); window.scrollTo(0, 0); }
      }),
      WS ? null : el("button", {
        type: "button", "aria-pressed": String(state.mode === "analyse"), text: t("modeAnalyse"),
        onclick: function () { state.mode = "analyse"; render(); }
      })
    ]);
    if (ADMIN) modes = el("a", { class: "btn ghost", href: "/admin", text: "← " + t("adminBack") });

    var langs = el("div", { class: "seg", role: "group", "aria-label": t("langLabel") }, [
      el("button", {
        type: "button", "aria-pressed": String(state.lang === "nb"), text: "NO",
        onclick: function () { state.lang = "nb"; saveDraft(); render(); }
      }),
      el("button", {
        type: "button", "aria-pressed": String(state.lang === "en"), text: "EN",
        onclick: function () { state.lang = "en"; saveDraft(); render(); }
      })
    ]);

    bar.appendChild(modes);
    bar.appendChild(langs);
  }

  function spine() {
    var p = totalProgress();
    var wrap = el("nav", { class: "spine", "aria-label": t("jump") });
    wrap.appendChild(el("div", { class: "eyebrow", text: p.done + " / " + p.total + " " + t("answered") }));
    wrap.appendChild(el("div", { class: "meter", style: "margin-top:8px" }, [
      el("i", { style: "width:" + Math.round((p.done / p.total) * 100) + "%" })
    ]));
    var ol = el("ol");
    SURVEY.sections.forEach(function (s, idx) {
      var sp = sectionProgress(s);
      var st = sp.done === 0 ? "none" : (sp.done === sp.total ? "done" : "part");
      var li = el("li", { "data-state": st, "aria-current": String(state.view === "form" && idx === state.section) }, [
        el("button", {
          type: "button",
          onclick: function () { state.section = idx; state.view = "form"; render(); window.scrollTo(0, 0); }
        }, [
          el("span", { text: L(s).title }),
          el("span", { class: "count", text: sp.done + "/" + sp.total })
        ])
      ]);
      ol.appendChild(li);
    });
    wrap.appendChild(ol);
    return wrap;
  }

  function actionBar(kids) {
    var bar = el("div", { class: "actions" });
    var inner = el("div", { class: "actions-in" });
    statusBox = el("p", { class: "status", role: "status", "aria-live": "polite", text: "" });
    inner.appendChild(statusBox);
    kids.forEach(function (k) { inner.appendChild(k); });
    bar.appendChild(inner);
    setSaveState();
    return bar;
  }

  /* ---------------------------------------------------------------- start view */

  function renderStart() {
    var draft = loadDraft();
    var p = totalProgress();
    var wrap = el("div", { class: "shell single" });
    var main = el("main");

    var hero = el("section", { class: "panel hero" });
    hero.appendChild(el("p", { class: "eyebrow", text: t("program") + " · " + (state.lang === "nb" ? "Intervjuguide" : "Interview guide") }));
    hero.appendChild(el("h1", { text: L(SURVEY.title) }));
    /* Two columns on wide screens: the purpose reads on the left at a comfortable
       measure, the practical facts and caveats sit alongside it on the right. */
    var intro = el("div", { class: "hero-main" });
    L(SURVEY.intro).forEach(function (para, i) {
      intro.appendChild(el("p", { class: i === 0 ? "lede" : "", text: para }));
    });
    var side = el("aside", { class: "hero-side" });
    side.appendChild(el("ul", { class: "facts" }, [
      el("li", {}, [el("b", { class: "num", text: String(SURVEY.sections.length) }), el("span", { text: t("sections") })]),
      el("li", {}, [el("b", { class: "num", text: String(coreTotal()) + "–" + String(ALL_Q.length) }), el("span", { text: t("questions") })]),
      el("li", {}, [el("b", { class: "num", text: t("minutesRange") }), el("span", { text: t("estimate") + " (" + t("minutes") + ")" })])
    ]));
    side.appendChild(el("p", { class: "notice", text: SURVEY.notice[state.lang] }));
    side.appendChild(el("p", { class: "notice calm", text: SURVEY.privacy[state.lang] + " " + SURVEY.techNote[state.lang] + " " + t("requiredNone") }));
    if (WS) side.appendChild(el("p", { class: "notice calm", text: fill(t("wsPrivacy")) }));
    intro.appendChild(interviewPanel());
    hero.appendChild(el("div", { class: "hero-grid" }, [intro, side]));

    function begin(path) {
      // The workspace already says which organisation this is; prefill it rather than ask.
      if (WS && state.answers.q2 === undefined) state.answers.q2 = WS.company.name;
      state.path = path;
      state.tracks = [];
      if (!state.started) state.started = new Date().toISOString();
      state.section = 0;
      state.view = "form";
      saveDraft();
      render();
      window.scrollTo(0, 0);
    }

    var paths = el("div", { class: "paths" }, [
      el("div", { class: "path-card" }, [
        el("h3", { text: t("pathCoreTitle") }),
        el("p", { class: "num", text: coreTotal() + " " + t("questions") + " · " + t("minutesCore") + " " + t("minutes") }),
        el("p", { text: t("pathCoreBody") }),
        el("button", { class: "btn primary", type: "button", text: t("pathCoreBtn"), onclick: function () { begin("core"); } })
      ]),
      el("div", { class: "path-card" }, [
        el("h3", { text: t("pathFullTitle") }),
        el("p", { class: "num", text: ALL_Q.length + " " + t("questions") + " · " + t("minutesFull") + " " + t("minutes") }),
        el("p", { text: t("pathFullBody") }),
        el("button", { class: "btn", type: "button", text: t("pathFullBtn"), onclick: function () { begin("full"); } })
      ])
    ]);
    hero.appendChild(paths);

    var inMemory = Object.keys(state.answers).length > 0;
    var onDisk = draft && Object.keys(draft.answers).length > 0;

    if (inMemory || onDisk) {
      var prog = inMemory ? totalProgress() : null;
      var row = el("div", { class: "row" });
      row.appendChild(el("button", {
        class: "btn primary", type: "button",
        text: t("resume") + (prog ? " (" + prog.done + "/" + prog.total + ")" : ""),
        onclick: function () {
          if (!inMemory) {
            state.answers = draft.answers;
            state.notes = draft.notes || {};
            state.meta = draft.meta || state.meta;
            state.path = draft.path === "full" ? "full" : "core";
            state.tracks = draft.tracks || [];
            state.section = draft.section || 0;
            state.started = draft.started || new Date().toISOString();
          }
          state.view = state.lastView === "review" ? "review" : "form";
          render(); window.scrollTo(0, 0);
        }
      }));
      row.appendChild(el("button", {
        class: "btn ghost", type: "button", text: t("newRespondent"),
        onclick: function (e) {
          if (e.target.getAttribute("data-armed") === "1") { resetForm(); return; }
          e.target.setAttribute("data-armed", "1");
          e.target.textContent = t("confirmReset");
        }
      }));
      hero.appendChild(row);
      hero.appendChild(el("p", { class: "a-meta", style: "margin-top:10px", text: t("switchKeeps") }));
    }

    var toc = el("ol", { class: "toc" });
    SURVEY.sections.forEach(function (s, i) {
      toc.appendChild(el("li", {}, [
        el("span", { class: "num", text: String(i + 1).padStart(2, "0") }),
        el("span", {}, [
          el("span", { text: L(s).title }),
          el("span", { style: "display:block;color:var(--ink-3);font-size:13px", text: L(s).lead })
        ]),
        el("span", { class: "count", text: s.questions.length + " " + t("questions") })
      ]));
    });
    if (WS) hero.appendChild(wsContribList());
    hero.appendChild(toc);

    if (WS) main.appendChild(wsBand());
    main.appendChild(hero);
    wrap.appendChild(main);
    app.appendChild(wrap);
  }

  /* ---------------------------------------------------------------- form view */

  function questionNode(q, number) {
    var node = el("section", { class: "q", id: "q-" + q.id });
    var head = el("div", { class: "q-head" }, [
      el("span", { class: "q-no mono", text: String(number).padStart(2, "0") }),
      el("h3", { class: "q-text" }, [
        document.createTextNode(L(q).q + " "),
        q.tech ? el("span", { class: "pill", text: t("tech") }) : null
      ])
    ]);
    node.appendChild(head);

    if (q.t === "multi" || q.t === "single") {
      node.appendChild(el("p", { class: "q-hint", text: q.t === "multi" ? t("multi") : t("single") }));
      var opts = el("div", { class: "opts" + (L(q).o.length > 7 ? " cols" : "") });
      L(q).o.forEach(function (label, i) {
        var cur = state.answers[q.id];
        var checked = q.t === "multi"
          ? !!(cur && cur.i && cur.i.indexOf(i) > -1)
          : !!(cur && cur.i === i);
        var input = el("input", {
          type: q.t === "multi" ? "checkbox" : "radio",
          name: q.id, id: q.id + "-o" + i, value: String(i)
        });
        input.checked = checked;
        input.addEventListener("change", function () {
          var a = state.answers[q.id] || (q.t === "multi" ? { i: [] } : {});
          if (q.t === "multi") {
            var arr = (a.i || []).slice();
            var at = arr.indexOf(i);
            if (input.checked) { if (at === -1) arr.push(i); } else if (at > -1) { arr.splice(at, 1); }
            a.i = arr;
          } else {
            a.i = i;
          }
          state.answers[q.id] = a;
          persist();
          refreshSpine();
          toggleOther(q);
        });
        var row = el("div", { class: "opt-row" }, [
          el("label", { class: "opt", "for": q.id + "-o" + i }, [input, el("span", { text: label })])
        ]);
        noteControl(row, q, String(i), label, "opt-note");
        opts.appendChild(row);
      });
      node.appendChild(opts);

      if (q.other) {
        var box = el("div", { class: "field tight other-in", id: "other-" + q.id });
        var inp = el("input", { type: "text", placeholder: t("other"), id: q.id + "-other" });
        inp.value = (state.answers[q.id] && state.answers[q.id].other) || "";
        inp.addEventListener("input", function () {
          var a = state.answers[q.id] || (q.t === "multi" ? { i: [] } : {});
          a.other = inp.value; state.answers[q.id] = a; persist();
        });
        inp.addEventListener("blur", flushDraft);
        box.appendChild(inp);
        node.appendChild(box);
      }
      node.appendChild(questionNote(q));
    } else if (q.t === "scale") {
      node.appendChild(el("p", { class: "q-hint", text: L(q).hint || t("scaleHint") }));
      var sc = el("div", { class: "scale", role: "radiogroup" });
      SCALE_LABELS[state.lang].forEach(function (lab, i) {
        var v = i + 1;
        var input = el("input", { type: "radio", name: q.id, id: q.id + "-s" + v, value: String(v) });
        input.checked = state.answers[q.id] === v;
        input.addEventListener("change", function () {
          state.answers[q.id] = v; persist(); refreshSpine();
        });
        // A question with its own hint sets the meaning of the poles, so the
        // generic "not important / critical" sub-labels are dropped there.
        var parts = lab.split(" – ");
        sc.appendChild(el("label", { "for": q.id + "-s" + v }, [
          input,
          el("b", { text: String(v) }),
          el("span", { text: L(q).hint ? "" : (parts[1] || "") })
        ]));
      });
      node.appendChild(sc);
      node.appendChild(questionNote(q));
    } else {
      var field = el("div", { class: "field" });
      var input;
      if (q.t === "longtext") {
        input = el("textarea", { rows: "3", id: q.id + "-in", placeholder: t("freeHint") });
      } else {
        input = el("input", { type: "text", id: q.id + "-in" });
      }
      input.value = state.answers[q.id] || "";
      input.addEventListener("input", function () { state.answers[q.id] = input.value; persist(); });
      input.addEventListener("change", refreshSpine);
      input.addEventListener("blur", flushDraft);
      field.appendChild(input);
      node.appendChild(field);
    }
    return node;
  }

  function toggleOther(q) {
    if (!q.other) return;
    var box = document.getElementById("other-" + q.id);
    if (!box) return;
    var a = state.answers[q.id];
    var last = L(q).o.length - 1;
    var on = q.t === "multi" ? !!(a && a.i && a.i.indexOf(last) > -1) : !!(a && a.i === last);
    box.classList.toggle("hidden", !on);
  }

  var persistTimer = null;

  /* Typing saves on a short debounce; everything else saves at once. flushDraft
     also runs when the tab is hidden or closed, so a draft never depends on the
     debounce having fired. */
  function persist() {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(function () { persistTimer = null; saveDraft(); }, 600);
  }

  function flushDraft() {
    if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
    if (state.started) saveDraft();
  }

  window.addEventListener("beforeunload", flushDraft);
  window.addEventListener("pagehide", flushDraft);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flushDraft();
  });

  /* Non-destructive return to the landing page: the draft is flushed first, so
     nothing is lost and the respondent can pick up where they left off. */
  function goHome() {
    flushDraft();
    if (state.view === "form" || state.view === "review") state.lastView = state.view;
    state.mode = "form";
    state.view = "start";
    render();
    window.scrollTo(0, 0);
  }

  function resetForm() {
    state.answers = {};
    state.notes = {};
    state.meta = { interviewer: state.meta.interviewer, interviewee: "", date: "" };
    // A new interview is a new submission, not an update of the previous one.
    if (SUB_KEY) store.del(SUB_KEY);
    state.path = "core";
    state.tracks = [];
    state.section = 0;
    state.started = null;
    state.view = "start";
    restored = false;
    clearDraft();
    render();
    window.scrollTo(0, 0);
  }

  function refreshSpine() {
    // Update in place: replacing the node would detach a nav button mid-click
    // when a text field blurs into it.
    var root = document.querySelector(".spine");
    if (!root) return;
    var p = totalProgress();
    var eb = root.querySelector(".eyebrow");
    if (eb) eb.textContent = p.done + " / " + p.total + " " + t("answered");
    var bar = root.querySelector(".meter i");
    if (bar) bar.style.width = Math.round((p.done / p.total) * 100) + "%";
    var lis = root.querySelectorAll("li");
    SURVEY.sections.forEach(function (s, idx) {
      var li = lis[idx];
      if (!li) return;
      var sp = sectionProgress(s);
      li.setAttribute("data-state", sp.done === 0 ? "none" : (sp.done === sp.total ? "done" : "part"));
      var c = li.querySelector(".count");
      if (c) c.textContent = sp.done + "/" + sp.total;
    });
  }

  function renderForm() {
    var s = SURVEY.sections[state.section];
    var wrap = el("div", { class: "shell" });
    wrap.appendChild(spine());

    var main = el("main");

    if (restored) {
      restored = false;
      var banner = el("p", { class: "notice calm", style: "margin:0 0 20px" }, [
        el("span", { text: t("restoredHere") + " " }),
        el("button", {
          class: "btn ghost", type: "button", style: "font-size:13px;text-decoration:underline",
          text: t("newRespondent"),
          onclick: function () { resetForm(); }
        })
      ]);
      main.appendChild(banner);
    }

    var head = el("header", { class: "sec-head" }, [
      el("p", { class: "eyebrow", text: t("section") + " " + (state.section + 1) + " " + t("of") + " " + SURVEY.sections.length }),
      el("h2", { text: L(s).title }),
      el("p", { text: L(s).lead })
    ]);
    main.appendChild(head);

    var shown = visibleQs(s);
    var list = el("div", { class: "qlist prose" });
    var start = 0;
    for (var i = 0; i < state.section; i++) start += visibleQs(SURVEY.sections[i]).length;
    shown.forEach(function (q, i) { list.appendChild(questionNode(q, start + i + 1)); });
    main.appendChild(list);

    var hidden = hiddenCount(s);
    var opened = state.tracks.indexOf(s.id) > -1;
    if (hidden > 0 || opened) {
      var track = el("div", { class: "track prose" });
      if (hidden > 0) {
        track.appendChild(el("p", { class: "track-lead", text: t("deepLead") }));
        track.appendChild(el("button", {
          class: "btn", type: "button",
          text: t("openDeep").replace("{n}", String(hidden)),
          onclick: function () {
            state.tracks = state.tracks.concat([s.id]);
            saveDraft(); render();
          }
        }));
      } else {
        track.appendChild(el("button", {
          class: "btn ghost", type: "button", text: t("closeDeep"),
          onclick: function () {
            state.tracks = state.tracks.filter(function (x) { return x !== s.id; });
            saveDraft(); render();
          }
        }));
      }
      main.appendChild(track);
    }

    wrap.appendChild(main);
    app.appendChild(wrap);

    shown.forEach(toggleOther);

    var readyNow = evalOpportunities(localGet).filter(function (r) { return r.status === "ready"; }).length;
    var last = state.section === SURVEY.sections.length - 1;
    app.appendChild(actionBar([
      el("button", {
        class: "btn ghost", type: "button",
        text: t("modeOpps") + " · " + readyNow,
        title: t("oppsTitle"),
        onclick: function () { state.mode = "opps"; render(); window.scrollTo(0, 0); }
      }),
      el("button", {
        class: "btn ghost", type: "button", text: t("review"),
        onclick: function () { state.view = "review"; render(); window.scrollTo(0, 0); }
      }),
      el("button", {
        class: "btn", type: "button", text: t("prev"), disabled: state.section === 0 ? "disabled" : null,
        onclick: function () { if (state.section > 0) { state.section--; render(); window.scrollTo(0, 0); } }
      }),
      el("button", {
        class: "btn primary", type: "button", text: last ? t("finish") : t("next"),
        onclick: function () {
          if (last) { state.view = "review"; } else { state.section++; }
          saveDraft(); render(); window.scrollTo(0, 0);
        }
      })
    ]));
  }

  /* ---------------------------------------------------------------- review view */

  function renderReview() {
    var resp = buildResponse();
    var p = totalProgress();
    var wrap = el("div", { class: "shell" });
    wrap.appendChild(spine());
    var main = el("main");

    var panel = el("section", { class: "panel" });
    panel.appendChild(el("p", { class: "eyebrow", text: t("program") }));
    panel.appendChild(el("h2", { style: "font-size:clamp(24px,3.4vw,33px);margin-top:6px", text: t("reviewTitle") }));
    panel.appendChild(el("p", { style: "color:var(--ink-2);max-width:62ch", text: t("reviewLede") }));

    panel.appendChild(el("ul", { class: "facts" }, [
      el("li", {}, [el("b", { class: "num", text: p.done + "/" + p.total }), el("span", { text: t("answered") })]),
      el("li", {}, [el("b", { text: state.path === "full" ? t("scopeFull") : t("scopeCore") }), el("span", { text: t("scope") })]),
      el("li", {}, [el("b", { class: "num", text: resp.completion + "%" }), el("span", { text: state.lang === "nb" ? "utfylt" : "complete" })]),
      el("li", {}, [el("b", { text: resp.respondent.organisation || t("anonymous") }), el("span", { text: t("org") })]),
      el("li", {}, [el("b", { class: "num", text: String(noteCount()) }), el("span", { text: t("notesCount") })]),
      state.meta.interviewer ? el("li", {}, [el("b", { text: state.meta.interviewer }), el("span", { text: t("metaInterviewer") })]) : null
    ]));

    var toc = el("ol", { class: "toc" });
    SURVEY.sections.forEach(function (s, i) {
      var sp = sectionProgress(s);
      toc.appendChild(el("li", {}, [
        el("span", { class: "num", text: String(i + 1).padStart(2, "0") }),
        el("button", {
          class: "btn ghost", type: "button", style: "text-align:left;padding:0", text: L(s).title,
          onclick: function () { state.section = i; state.view = "form"; render(); window.scrollTo(0, 0); }
        }),
        el("span", { class: "count", text: sp.done + "/" + sp.total })
      ]));
    });
    panel.appendChild(toc);

    var oppReady = sortedOpportunities(localGet).filter(function (r) { return r.status === "ready"; });
    if (oppReady.length) {
      var oppBox = el("div", { class: "opp-summary" });
      oppBox.appendChild(el("p", { class: "eyebrow", text: t("oppsTop") }));
      var ul = el("ul", { class: "opp-list" });
      oppReady.slice(0, 5).forEach(function (r) {
        ul.appendChild(el("li", {}, [
          el("span", { class: "pill", text: OPP_TYPES[r.opp.type][state.lang] }),
          el("span", { text: L(r.opp).title })
        ]));
      });
      oppBox.appendChild(ul);
      oppBox.appendChild(el("button", {
        class: "btn ghost", type: "button", style: "padding-inline:0;text-decoration:underline",
        text: t("oppsSeeAll") + (oppReady.length > 5 ? " (" + oppReady.length + ")" : ""),
        onclick: function () { state.mode = "opps"; render(); window.scrollTo(0, 0); }
      }));
      panel.appendChild(oppBox);
    }

    var json = JSON.stringify(resp, null, 2);
    var base = "baerel-" + slug(resp.respondent.organisation) + "-" + new Date().toISOString().slice(0, 10);

    var raw = el("textarea", { rows: "10", class: "hidden", id: "raw", readonly: "readonly", style: "margin-top:16px;font-size:12px" });
    raw.value = json;

    if (state.path !== "full") {
      panel.appendChild(el("p", { class: "notice calm" }, [
        el("span", { text: t("moreAvailable") + " " }),
        el("button", {
          class: "btn ghost", type: "button", style: "font-size:13px;text-decoration:underline",
          text: t("switchFull"),
          onclick: function () { state.path = "full"; state.view = "form"; state.section = 0; saveDraft(); render(); window.scrollTo(0, 0); }
        })
      ]));
    }

    if (WS) panel.appendChild(wsSubmitBox());

    var row = el("div", { class: "row" }, [
      WS ? el("span", { class: "a-meta", style: "margin:0", text: t("backupLabel") }) : null,
      el("button", {
        class: WS ? "btn" : "btn primary", type: "button", text: t("exportJson"),
        onclick: function () { saveFile(base + ".json", json, setStatus); }
      }),
      el("button", {
        class: "btn", type: "button", text: t("exportCsv"),
        onclick: function () { saveFile(base + ".csv", responseCsv(resp), setStatus); }
      }),
      el("button", {
        class: "btn", type: "button", text: t("copyJson"),
        onclick: function () { copyText(json, setStatus); }
      }),
      el("button", {
        class: "btn ghost", type: "button", text: t("showRaw"),
        onclick: function (e) {
          var hidden = raw.classList.toggle("hidden");
          e.target.textContent = hidden ? t("showRaw") : t("hideRaw");
          if (!hidden) { raw.focus(); raw.select(); }
        }
      })
    ]);
    panel.appendChild(row);
    panel.appendChild(raw);
    if (framed) panel.appendChild(el("p", { class: "notice calm", text: SURVEY.privacy[state.lang] }));

    if (WS) main.appendChild(wsBand());
    main.appendChild(panel);
    wrap.appendChild(main);
    app.appendChild(wrap);

    app.appendChild(actionBar([
      el("button", {
        class: "btn ghost", type: "button", text: t("newRespondent"),
        onclick: function (e) {
          if (e.target.getAttribute("data-armed") === "1") { resetForm(); return; }
          e.target.setAttribute("data-armed", "1");
          e.target.textContent = t("confirmReset");
        }
      }),
      el("button", {
        class: "btn", type: "button", text: t("backToForm"),
        onclick: function () { state.view = "form"; render(); window.scrollTo(0, 0); }
      })
    ]));
  }


  /* ---------------------------------------------------------------- opportunities */

  function oppCard(r) {
    var o = r.opp;
    var card = el("article", { class: "opp opp-" + r.status });
    card.appendChild(el("div", { class: "opp-top" }, [
      el("span", { class: "pill status-" + r.status, text: t("st_" + r.status) }),
      el("span", { class: "pill", text: OPP_TYPES[o.type][state.lang] })
    ]));
    card.appendChild(el("h3", { text: L(o).title }));
    card.appendChild(el("p", { class: "opp-pitch", text: L(o).pitch }));

    var list = el("ul", { class: "opp-needs" });
    r.met.forEach(function (n) {
      list.appendChild(el("li", { class: "met" }, [
        el("span", { class: "tick", "aria-hidden": "true", text: "✓" }),
        el("span", { text: n[state.lang] })
      ]));
    });
    r.missing.forEach(function (n) {
      list.appendChild(el("li", { class: "unmet" }, [
        el("span", { class: "tick", "aria-hidden": "true", text: "·" }),
        el("span", { text: n[state.lang] })
      ]));
    });
    card.appendChild(el("p", { class: "opp-lead", text: r.status === "ready" ? t("restsOn") : t("stillNeeds") }));
    card.appendChild(list);
    return card;
  }

  function renderOpportunities() {
    var results = sortedOpportunities(localGet);
    var ready = results.filter(function (r) { return r.status === "ready"; });
    var near = results.filter(function (r) { return r.status === "near"; });
    var p = totalProgress();

    var wrap = el("div", { class: "shell single" });
    var main = el("main");

    var head = el("section", { class: "panel" });
    head.appendChild(el("p", { class: "eyebrow", text: t("program") + " · " + t("modeOpps") }));
    head.appendChild(el("h2", { style: "font-size:clamp(24px,3.4vw,33px);margin-top:6px", text: t("oppsTitle") }));
    head.appendChild(el("p", { style: "color:var(--ink-2);max-width:64ch", text: t("oppsLede") }));
    head.appendChild(el("ul", { class: "facts" }, [
      el("li", {}, [el("b", { class: "num", text: String(ready.length) }), el("span", { text: t("st_ready") })]),
      el("li", {}, [el("b", { class: "num", text: String(near.length) }), el("span", { text: t("st_near") })]),
      el("li", {}, [el("b", { class: "num", text: p.done + "/" + p.total }), el("span", { text: t("answered") })])
    ]));
    if (p.done < 8) head.appendChild(el("p", { class: "notice calm", text: t("oppsEarly") }));
    else head.appendChild(el("p", { class: "notice", text: t("oppsCaveat") }));
    main.appendChild(head);

    var grid = el("div", { class: "opp-grid" });
    results.forEach(function (r) { grid.appendChild(oppCard(r)); });
    main.appendChild(grid);

    wrap.appendChild(main);
    app.appendChild(wrap);

    app.appendChild(actionBar([
      el("button", {
        class: "btn primary", type: "button", text: t("backToForm"),
        onclick: function () { state.mode = "form"; if (state.view === "start") state.view = "form"; render(); window.scrollTo(0, 0); }
      })
    ]));
  }

  /* ---------------------------------------------------------------- analysis */

  function addResponse(obj, name) {
    if (!obj || obj.schema !== SCHEMA || !obj.answers) { setStatus(t("notSurvey") + (name ? " (" + name + ")" : "")); return false; }
    var key = obj._server ? obj._server.submission_id : (obj.respondent && obj.respondent.organisation || "") + "|" + obj.exported_at;
    var dupe = analysis.responses.some(function (r) { return r._key === key; });
    if (dupe) { setStatus(t("dupe") + (name ? " (" + name + ")" : "")); return false; }
    obj._key = key;
    obj._name = name || "";
    analysis.responses.push(obj);
    saveAnalysis();
    return true;
  }

  function readFiles(files) {
    var list = Array.prototype.slice.call(files);
    var pending = list.length;
    if (!pending) return;
    list.forEach(function (f) {
      var fr = new FileReader();
      fr.onload = function () {
        try { addResponse(JSON.parse(String(fr.result)), f.name); }
        catch (e) { setStatus(t("badFile") + " (" + f.name + ")"); }
        if (--pending === 0) render();
      };
      fr.onerror = function () { setStatus(t("badFile") + " (" + f.name + ")"); if (--pending === 0) render(); };
      fr.readAsText(f);
    });
  }

  function scopeLabel(r) {
    if (!r.path) return t("scopeFull");
    if (r.path === "full") return t("scopeFull");
    var extra = (r.tracks && r.tracks.length) ? " +" + r.tracks.length : "";
    return t("scopeCore") + extra;
  }

  function filtered() {
    var sel = analysis.role;
    if (sel === undefined || sel === "" || sel === null) return analysis.responses;
    return analysis.responses.filter(function (r) {
      var a = r.answers.filter(function (x) { return x.id === "q3"; })[0];
      return a && a.selected && a.selected.indexOf(Number(sel)) > -1;
    });
  }

  function bars(items, total, tone) {
    var max = 0;
    items.forEach(function (it) { if (it.n > max) max = it.n; });
    var chart = el("div", { class: "chart" });
    items.forEach(function (it) {
      var pct = total ? Math.round((it.n / total) * 100) : 0;
      chart.appendChild(el("div", { class: "bar-row" }, [
        el("span", { class: "lab", text: it.label }),
        el("div", { class: "bar-track" }, [
          el("div", { class: "bar-fill" + (tone === "copper" ? " copper" : ""), style: "width:" + (max ? Math.round((it.n / max) * 100) : 0) + "%" })
        ]),
        el("span", { class: "count", text: it.n + "  ·  " + pct + "%" })
      ]));
    });
    return chart;
  }

  function distribution(counts, meanVal, n) {
    var max = Math.max.apply(null, counts.concat([1]));
    var ramp = ["var(--patina-soft)", "color-mix(in srgb, var(--patina) 35%, var(--surface-2))", "color-mix(in srgb, var(--patina) 55%, var(--surface-2))", "color-mix(in srgb, var(--patina) 78%, var(--surface-2))", "var(--patina)"];
    var d = el("div", { class: "dist" });
    counts.forEach(function (c, i) {
      d.appendChild(el("div", { class: "col" }, [
        el("b", { class: "num", text: String(c) }),
        el("i", { style: "height:" + Math.round((c / max) * 58) + "px;background:" + ramp[i] }),
        el("span", { class: "num", text: String(i + 1) })
      ]));
    });
    var wrap = el("div");
    wrap.appendChild(d);
    wrap.appendChild(el("p", { class: "a-meta", text: t("mean") + " " + meanVal.toFixed(2) + " · " + n + " " + t("nAnswers") }));
    return wrap;
  }

  function renderAnalyse() {
    var wrap = el("div", { class: "shell single" });
    var main = el("main");

    var head = el("section", { class: "panel" });
    head.appendChild(el("p", { class: "eyebrow", text: t("program") + " · " + t("modeAnalyse") }));
    head.appendChild(el("h2", { style: "font-size:clamp(24px,3.4vw,33px);margin-top:6px", text: t("analyseTitle") }));
    head.appendChild(el("p", { style: "color:var(--ink-2);max-width:62ch", text: ADMIN ? t("adminLede") : t("analyseLede") }));

    var fileInput = el("input", { type: "file", accept: ".json,application/json", multiple: "multiple", class: "sr", id: "files" });
    fileInput.addEventListener("change", function () { readFiles(fileInput.files); fileInput.value = ""; });

    var drop = el("div", { class: "drop", style: "margin-top:22px" }, [
      el("p", { style: "margin:0" }, [
        document.createTextNode(t("dropHere") + " "),
        el("label", { "for": "files", style: "color:var(--copper-ink);text-decoration:underline;cursor:pointer", text: t("chooseFiles") })
      ])
    ]);
    ["dragenter", "dragover"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); });
    });
    drop.addEventListener("drop", function (e) {
      if (e.dataTransfer && e.dataTransfer.files) readFiles(e.dataTransfer.files);
    });
    head.appendChild(drop);
    head.appendChild(fileInput);

    var paste = el("textarea", { rows: "3", placeholder: "{ ... }", style: "margin-top:12px;font-size:12px" });
    head.appendChild(el("p", { class: "a-meta", style: "margin-top:16px", text: t("pasteLabel") }));
    head.appendChild(paste);
    head.appendChild(el("div", { class: "row", style: "margin-top:12px" }, [
      el("button", {
        class: "btn", type: "button", text: t("pasteBtn"),
        onclick: function () {
          try { if (addResponse(JSON.parse(paste.value), "")) render(); }
          catch (e) { setStatus(t("badFile")); }
        }
      }),
      analysis.responses.length ? el("button", {
        class: "btn ghost", type: "button", text: t("clearAll"),
        onclick: function () { analysis.responses = []; analysis.role = ""; saveAnalysis(); render(); }
      }) : null
    ]));
    main.appendChild(head);

    if (!analysis.responses.length) {
      main.appendChild(el("p", { class: "a-meta", style: "margin-top:22px", text: t("noData") }));
      wrap.appendChild(main);
      app.appendChild(wrap);
      app.appendChild(actionBar([]));
      return;
    }

    var rows = filtered();
    var orgs = {}, roleSet = {}, compSum = 0;
    rows.forEach(function (r) {
      var o = (r.respondent && r.respondent.organisation || "").trim();
      if (o) orgs[o.toLowerCase()] = true;
      compSum += (r.completion || 0);
      var q3 = r.answers.filter(function (x) { return x.id === "q3"; })[0];
      if (q3 && q3.selected) q3.selected.forEach(function (i) { roleSet[i] = true; });
    });

    var stats = el("div", { class: "stats" }, [
      el("div", { class: "stat" }, [el("b", { class: "num", text: String(rows.length) }), el("span", { text: t("responses") })]),
      el("div", { class: "stat" }, [el("b", { class: "num", text: String(Object.keys(orgs).length) }), el("span", { text: t("orgs") })]),
      el("div", { class: "stat" }, [el("b", { class: "num", text: String(Object.keys(roleSet).length) }), el("span", { text: t("roles") })]),
      el("div", { class: "stat" }, [el("b", { class: "num", text: (rows.length ? Math.round(compSum / rows.length) : 0) + "%" }), el("span", { text: t("completion") })])
    ]);
    main.appendChild(stats);

    var q3q = ALL_Q.filter(function (q) { return q.id === "q3"; })[0];
    var roleSel = el("select", {});
    roleSel.appendChild(el("option", { value: "", text: t("allRoles") }));
    L(q3q).o.forEach(function (lab, i) {
      var o = el("option", { value: String(i), text: lab });
      if (String(analysis.role) === String(i)) o.selected = true;
      roleSel.appendChild(o);
    });
    roleSel.addEventListener("change", function () { analysis.role = roleSel.value; render(); });

    var secSel = el("select", {});
    secSel.appendChild(el("option", { value: "", text: t("allSections") }));
    SURVEY.sections.forEach(function (s, i) {
      var o = el("option", { value: s.id, text: (i + 1) + ". " + L(s).title });
      if (analysis.section === s.id) o.selected = true;
      secSel.appendChild(o);
    });
    secSel.addEventListener("change", function () { analysis.section = secSel.value; render(); });

    main.appendChild(el("div", { class: "filters" }, [
      el("span", { class: "eyebrow", text: t("filterRole") }), roleSel,
      el("span", { class: "eyebrow", text: t("filterSection") }), secSel
    ]));

    // which opportunities the respondents collectively unlock
    var aggCounts = {};
    OPPORTUNITIES.forEach(function (o) { aggCounts[o.id] = { ready: 0, near: 0 }; });
    rows.forEach(function (r) {
      evalOpportunities(responseGet(r)).forEach(function (res) {
        if (res.status === "ready") aggCounts[res.opp.id].ready++;
        else if (res.status === "near") aggCounts[res.opp.id].near++;
      });
    });
    var aggItems = OPPORTUNITIES.map(function (o) {
      return { label: L(o).title, n: aggCounts[o.id].ready, near: aggCounts[o.id].near };
    }).filter(function (x) { return x.n > 0 || x.near > 0; })
      .sort(function (a, b) { return (b.n - a.n) || (b.near - a.near); });

    if (aggItems.length) {
      main.appendChild(el("section", { class: "a-q", style: "border-top:1px solid var(--line-strong);padding-top:22px" }, [
        el("p", { class: "eyebrow", text: t("oppsAgg") }),
        el("p", { class: "a-meta", style: "margin:6px 0 0", text: t("oppsAggLede") })
      ]));
      main.appendChild(bars(aggItems.map(function (x) { return { label: x.label, n: x.n }; }), rows.length, "copper"));
    }

    // respondents table
    var tbl = el("table", { class: "resp" });
    tbl.appendChild(el("thead", {}, [el("tr", {}, [
      el("th", { text: t("org") }), el("th", { text: t("role") }), el("th", { text: t("scope") }), el("th", { text: t("complete") }), el("th", { text: t("when") })
    ])]));
    var tb = el("tbody");
    rows.forEach(function (r) {
      tb.appendChild(el("tr", {}, [
        el("td", { text: (r.respondent && r.respondent.organisation) || t("anonymous") }),
        el("td", { text: (r.respondent && r.respondent.role) || "—" }),
        el("td", { text: scopeLabel(r) }),
        el("td", { class: "num", text: (r.completion || 0) + "%" }),
        el("td", { class: "num", text: (r.exported_at || "").slice(0, 10) })
      ]));
    });
    tbl.appendChild(tb);
    main.appendChild(el("details", { open: "open", style: "margin:18px 0" }, [
      el("summary", { style: "cursor:pointer;font-size:13.5px;color:var(--ink-2)", text: t("respondents") + " (" + rows.length + ")" }),
      el("div", { class: "scroll-x", style: "margin-top:10px" }, [tbl])
    ]));

    // per-question results
    var num = 0;
    SURVEY.sections.forEach(function (s) {
      var sectionShown = !analysis.section || analysis.section === s.id;
      if (sectionShown) {
        main.appendChild(el("h3", {
          class: "eyebrow",
          style: "margin:34px 0 0;padding-top:16px;border-top:1px solid var(--line-strong)",
          text: L(s).title
        }));
      }
      s.questions.forEach(function (q) {
        num++;
        if (!sectionShown) return;
        var recs = rows.map(function (r) { return r.answers.filter(function (x) { return x.id === q.id; })[0]; }).filter(Boolean);
        var block = el("section", { class: "a-q" });
        block.appendChild(el("h3", {}, [
          el("span", { class: "q-no mono", text: String(num).padStart(2, "0") + "  " }),
          document.createTextNode(L(q).q)
        ]));

        if (q.t === "scale") {
          var counts = [0, 0, 0, 0, 0], sum = 0, n = 0;
          recs.forEach(function (r) { if (r.value) { counts[r.value - 1]++; sum += r.value; n++; } });
          if (!n) block.appendChild(el("p", { class: "a-meta", text: t("noAnswers") }));
          else block.appendChild(distribution(counts, sum / n, n));
          block.appendChild(notesBlock(rows, q));
        } else if (q.t === "multi" || q.t === "single") {
          var tally = L(q).o.map(function (lab) { return { label: lab, n: 0 }; });
          var answered = 0, others = [];
          recs.forEach(function (r) {
            if (r.selected && r.selected.length) { answered++; r.selected.forEach(function (i) { if (tally[i]) tally[i].n++; }); }
            if (r.other) others.push({ text: r.other, who: "" });
          });
          tally.sort(function (a, b) { return b.n - a.n; });
          if (!answered) block.appendChild(el("p", { class: "a-meta", text: t("noAnswers") }));
          else {
            block.appendChild(bars(tally.filter(function (x) { return x.n > 0; }), answered, q.t === "single" ? "copper" : ""));
            block.appendChild(el("p", { class: "a-meta", text: answered + " " + t("nAnswers") }));
          }
          if (others.length) {
            var ol = el("div", { class: "verbatims" });
            others.forEach(function (o) { ol.appendChild(el("p", { class: "verbatim", text: o.text })); });
            block.appendChild(ol);
          }
          block.appendChild(notesBlock(rows, q));
        } else {
          var texts = [];
          rows.forEach(function (r) {
            var rec = r.answers.filter(function (x) { return x.id === q.id; })[0];
            if (rec && rec.text && rec.text.trim()) {
              texts.push({ text: rec.text.trim(), who: (r.respondent && r.respondent.organisation) || t("anonymous") });
            }
          });
          if (!texts.length) block.appendChild(el("p", { class: "a-meta", text: t("noAnswers") }));
          else {
            var v = el("div", { class: "verbatims" });
            texts.forEach(function (x) {
              v.appendChild(el("blockquote", { class: "verbatim", style: "margin:0" }, [
                el("span", { text: x.text }),
                el("cite", { text: x.who })
              ]));
            });
            block.appendChild(v);
            block.appendChild(el("p", { class: "a-meta", text: texts.length + " " + t("nAnswers") }));
          }
        }
        main.appendChild(block);
      });
    });

    wrap.appendChild(main);
    app.appendChild(wrap);

    app.appendChild(actionBar([
      el("button", {
        class: "btn", type: "button", text: t("exportBundle"),
        onclick: function () {
          saveFile("baerel-responses-" + new Date().toISOString().slice(0, 10) + ".json",
            JSON.stringify({ schema: SCHEMA + "-bundle", exported_at: new Date().toISOString(), responses: analysis.responses }, null, 2), setStatus);
        }
      }),
      el("button", {
        class: "btn primary", type: "button", text: t("exportWide"),
        onclick: function () { saveFile("baerel-responses-" + new Date().toISOString().slice(0, 10) + ".csv", wideCsv(rows), setStatus); }
      })
    ]));
  }

  /* Interviewer notes for one question across all loaded interviews. */
  function notesBlock(rows, q) {
    var items = [];
    rows.forEach(function (r) {
      var rec = r.answers.filter(function (x) { return x.id === q.id; })[0];
      if (!rec) return;
      var who = (r.respondent && r.respondent.organisation) || t("anonymous");
      if (r.respondent && r.respondent.role) who += " · " + r.respondent.role;
      (rec.option_notes || []).forEach(function (o) {
        items.push({ tag: (state.lang === "nb" ? o.label_nb : o.label_en) + (o.selected ? "" : " (" + t("notSelected") + ")"), text: o.note, who: who });
      });
      if (rec.note) items.push({ tag: t("qNote"), text: rec.note, who: who });
    });
    var box = el("div");
    if (!items.length) return box;
    box.appendChild(el("p", { class: "eyebrow", style: "margin-top:16px", text: t("notesHead") + " · " + items.length }));
    var v = el("div", { class: "verbatims" });
    items.forEach(function (x) {
      v.appendChild(el("blockquote", { class: "verbatim note-v", style: "margin:0" }, [
        el("span", { class: "note-tag", text: x.tag }),
        el("span", { text: x.text }),
        el("cite", { text: x.who })
      ]));
    });
    box.appendChild(v);
    return box;
  }

  function wideCsv(rows) {
    var header = ["organisation", "role", "interviewer", "interviewee", "interview_date", "language", "completion", "exported_at"];
    ALL_Q.forEach(function (q) { header.push(q.id + " — " + q.en.q); });
    var out = [header];
    rows.forEach(function (r) {
      var line = [
        (r.respondent && r.respondent.organisation) || "",
        (r.respondent && r.respondent.role) || "",
        (r.interview && r.interview.interviewer) || "",
        (r.interview && r.interview.interviewee) || "",
        (r.interview && r.interview.date) || "",
        r.language || "", r.completion == null ? "" : r.completion, r.exported_at || ""
      ];
      ALL_Q.forEach(function (q) {
        var rec = r.answers.filter(function (x) { return x.id === q.id; })[0];
        line.push(rec ? answerToText(rec, "en") : "");
      });
      out.push(line);
    });
    return out.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n");
  }

  /* ---------------------------------------------------------------- render */

  function render() {
    renderTopbar();
    app.textContent = "";
    document.documentElement.lang = state.lang === "nb" ? "nb" : "en";
    if (state.mode === "analyse") { renderAnalyse(); return; }
    if (state.mode === "opps") { renderOpportunities(); return; }
    if (state.view === "start") renderStart();
    else if (state.view === "review") renderReview();
    else renderForm();
  }

  var boot = loadDraft();
  if (boot && boot.lang) state.lang = boot.lang;
  if (boot && boot.answers && Object.keys(boot.answers).length) {
    state.answers = boot.answers;
    state.notes = boot.notes || {};
    if (boot.meta) state.meta = boot.meta;
    state.path = boot.path === "full" ? "full" : "core";
    state.tracks = boot.tracks && boot.tracks.length ? boot.tracks : [];
    state.section = boot.section || 0;
    state.started = boot.started || new Date().toISOString();
    state.view = boot.view === "review" ? "review" : "form";
    if (boot.saved_at) { var d = new Date(boot.saved_at); if (!isNaN(d.getTime())) lastSaved = d; }
    restored = true;
  }
  loadAnalysis();

  if (WS) {
    render();
    loadWorkspace().then(render);
  } else if (ADMIN) {
    state.mode = "analyse";
    render();
    loadServerResponses().then(render).then(function () {
      setStatus((state.lang === "nb" ? "Hentet " : "Loaded ") + analysis.responses.length + (state.lang === "nb" ? " svar fra serveren" : " responses from the server"));
    });
  } else {
    render();
  }
})();
