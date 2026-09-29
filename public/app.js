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
      exportBtn: "Eksporter", exportDoc: "Lesbart dokument (HTML)", exportData: "Data (JSON) – kan åpnes igjen", exportTable: "Tabell (CSV)",
      exportedAt: "Eksportert", saveVersion: "Lagre versjon nå", versionWord: "versjon",
      syncedAt: "synkronisert", syncPending: "synkroniseres …", syncFail: "kunne ikke synkronisere – lagret lokalt, prøver igjen ved neste endring",
      syncClosed: "arbeidsområdet er stengt – endringer lagres bare lokalt",
      importBtn: "Åpne eksportert intervju (JSON)", importOk: "Intervjuet er lastet inn – fortsett der det slapp.", importBad: "Filen er ikke en intervjufil fra denne guiden.",
      importReplace: "Bekreft – erstatt intervjuet som er åpent nå",
      liveTitle: "Levende dokument", lastChanged: "Sist endret",
      docAnswer: "Svar", docNotes: "Notater", docNotSelected: "ikke valgt", docOther: "Annet", docOf: "av", docGenerated: "Generert av Bærel intervjuguide",
      scImages: "Bilder (valgfritt)", scAddImg: "+ Legg til bilde", scImgCaption: "Bildetekst (valgfritt)",
      scUploading: "Laster opp …", scImgFail: "Bildet kunne ikke lastes opp – prøv igjen.", scImgMax: "Maks 6 bilder per scenario.",
      scImgWord: "bilder",
      scTitle: "Scenario", scAdd: "+ Legg til scenario", scDup: "Dupliser", scRemove: "Fjern", scRemoveConfirm: "Bekreft – fjern",
      scPriority: "Prioritet", scPrioNone: "–", scPrio: { high: "Høy", medium: "Middels", low: "Lav" },
      scCount: "scenarier", scPreview: "Slik leses scenarioet",
      scHint: "Ett scenario per konkret situasjon. Fyll inn det dere vet – resten kan stå åpent.",
      scFrom: "scenarier fra", scInterviews: "intervjuer", scInterview1: "intervju",
      scLab: { situation: "Når", actor: "trenger", goal: "å", data: "ved hjelp av", source: "som kommer fra", outcome: "slik at" },
      scPh: { situation: "situasjon eller utløser – f.eks. en returnert enhet kommer inn til reparasjon",
              actor: "hvem – f.eks. reparatøren",
              goal: "mål eller beslutning – f.eks. avgjøre om kretskortet kan gjenbrukes",
              data: "hvilke data – f.eks. feillogg, reparasjonshistorikk og komponentdata",
              source: "hvor dataene kommer fra – f.eks. produktpasset og produsentens servicesystem",
              outcome: "utfall – f.eks. enheten repareres i stedet for å kasseres" },
      scActors: ["designeren", "innkjøperen", "produksjonslederen", "kvalitetsingeniøren", "serviceteknikeren", "reparatøren", "ombruksaktøren", "gjenvinneren", "kunden", "sluttbrukeren", "myndigheten", "revisoren", "en KI-agent"],
      scSources: ["ERP-systemet", "PLM-systemet", "MES", "leverandøren", "produktpasset", "sensorer i produksjonen", "testutstyret", "servicesystemet", "kunden", "offentlige registre"],
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
      exportBtn: "Export", exportDoc: "Readable document (HTML)", exportData: "Data (JSON) — can be reopened", exportTable: "Table (CSV)",
      exportedAt: "Exported", saveVersion: "Save a version now", versionWord: "version",
      syncedAt: "synced", syncPending: "syncing …", syncFail: "could not sync — saved locally, will retry on the next change",
      syncClosed: "the workspace is closed — changes are only saved locally",
      importBtn: "Open an exported interview (JSON)", importOk: "The interview is loaded — carry on where it left off.", importBad: "That file is not an interview from this guide.",
      importReplace: "Confirm — replace the interview that is open now",
      liveTitle: "Living document", lastChanged: "Last changed",
      docAnswer: "Answer", docNotes: "Notes", docNotSelected: "not selected", docOther: "Other", docOf: "of", docGenerated: "Generated by the Bærel interview guide",
      scImages: "Images (optional)", scAddImg: "+ Add image", scImgCaption: "Caption (optional)",
      scUploading: "Uploading …", scImgFail: "The image could not be uploaded — try again.", scImgMax: "At most 6 images per scenario.",
      scImgWord: "images",
      scTitle: "Scenario", scAdd: "+ Add scenario", scDup: "Duplicate", scRemove: "Remove", scRemoveConfirm: "Confirm — remove",
      scPriority: "Priority", scPrioNone: "–", scPrio: { high: "High", medium: "Medium", low: "Low" },
      scCount: "scenarios", scPreview: "How the scenario reads",
      scHint: "One scenario per concrete situation. Fill in what is known — the rest can stay open.",
      scFrom: "scenarios from", scInterviews: "interviews", scInterview1: "interview",
      scLab: { situation: "When", actor: "who", goal: "needs to", data: "using", source: "which comes from", outcome: "so that" },
      scPh: { situation: "situation or trigger — e.g. a returned unit arrives for repair",
              actor: "actor — e.g. the repair technician",
              goal: "goal or decision — e.g. decide whether the circuit board can be reused",
              data: "which data — e.g. fault log, repair history and component data",
              source: "where the data comes from — e.g. the product passport and the manufacturer’s service system",
              outcome: "outcome — e.g. the unit is repaired instead of scrapped" },
      scActors: ["the designer", "the buyer", "the production manager", "the quality engineer", "the service technician", "the repair technician", "the refurbisher", "the recycler", "the customer", "the end user", "the authority", "the auditor", "an AI agent"],
      scSources: ["the ERP system", "the PLM system", "MES", "the supplier", "the product passport", "sensors in production", "test equipment", "the service system", "the customer", "public registers"],
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
      wsPrivacy: "Intervjuet lagres i arbeidsområdet for {org}. Ingen andre med lenken kan se svar, notater eller hvem som er intervjuet – bare prosjektet ser intervjuene samlet.",
      finish: "Til innsending", review: "Til innsending",
      reviewTitle: "Oppsummering og innsending",
      reviewLede: "Gå gjennom hva intervjuet har dekket, og send svar og notater inn til arbeidsområdet. Du kan oppdatere innsendingen så lenge arbeidsområdet er åpent.",
      submitTitle: "Levende dokument i arbeidsområdet til {org}",
      submitBody: "Intervjuet lagres automatisk i arbeidsområdet mens du jobber. Ved hver eksport – og minst hvert kvarter – tas en tidsstemplet versjon, så tidligere tilstander kan hentes fram. Du kan eksportere og oppdatere når som helst.",
      submitBtn: "Send inn intervjuet", updateBtn: "Oppdater innsendt intervju",
      submitting: "Sender …", submittedAt: "Sendt inn {when}", upToDate: "Innsendt versjon er oppdatert.",
      changedSince: "Du har endret svar siden forrige innsending – oppdater for å ta dem med.",
      submitFail: "Kunne ikke sende inn. Prøv igjen, eller last ned svarene som fil og send den til kontaktpersonen.",
      closedBody: "Arbeidsområdet tar ikke imot flere svar. Du kan fortsatt laste ned svarene dine som fil.",
      linkGone: "Lenken er ikke lenger aktiv. Last ned svarene dine som fil, og be kontaktpersonen om den nye lenken.",
      backupLabel: "Sikkerhetskopi:",
      newRespondent: "+ Nytt intervju",
      ivHere: "Intervjuer på denne enheten", ivNew: "+ Nytt intervju", ivOpen: "Åpne", ivActive: "Åpent nå", ivUnnamed: "Uten navn",
      ivNotStarted: "ikke startet", ivRemove: "Fjern fra enheten", ivRemoveConfirm: "Bekreft – fjern herfra",
      ivRemoved: "Intervjuet er fjernet fra denne enheten. Det ligger fortsatt trygt i arbeidsområdet.",
      ivLink: "Personlig lenke", ivLinkCopied: "Personlig lenke kopiert. Del den bare med den som skal fortsette akkurat dette intervjuet.",
      ivLinkNotYet: "Lenken blir tilgjengelig når intervjuet er lagret i arbeidsområdet – svar på ett spørsmål først.",
      ivTotal: "{n} intervjuer registrert i arbeidsområdet totalt.",
      ivPrivacy: "Hvert intervju er privat. Andre med lenken til arbeidsområdet ser verken svar, notater eller hvem som er intervjuet – bare prosjektet ser intervjuene samlet. Deler flere samme enhet: fjern intervjuet fra enheten når dere er ferdige.",
      ivResumed: "Intervjuet er åpnet fra den personlige lenken.", ivResumeFail: "Den personlige lenken er ikke gyldig.",
      ivServerNewer: "Hentet en nyere versjon av intervjuet fra arbeidsområdet.",
      ivNewOk: "Nytt intervju – det forrige ligger fortsatt i listen over intervjuer på denne enheten.",
      ivDone: "Ferdig – lagre og fjern fra denne enheten"
    },
    en: {
      wsLabel: "Workspace", wsOpen: "Accepting responses", wsClosed: "Closed to new responses",
      wsContribs: "interviews", wsContrib1: "interview", wsNone: "No interviews submitted yet.",
      wsWho: "Recorded interviews", wsYou: "this interview", wsRoleless: "Role not given",
      wsPrivacy: "The interview is stored in the {org} workspace. Nobody else with the link can see the answers, the notes or who was interviewed — only the project sees the interviews together.",
      finish: "Go to submission", review: "Go to submission",
      reviewTitle: "Summary and submission",
      reviewLede: "Check what the interview covered, then submit the answers and notes to the workspace. You can update the submission while the workspace is open.",
      submitTitle: "Living document in the {org} workspace",
      submitBody: "The interview saves itself to the workspace as you work. Every export — and at least every fifteen minutes — takes a timestamped version, so earlier states can be retrieved. You can export and update at any time.",
      submitBtn: "Submit the interview", updateBtn: "Update submitted interview",
      submitting: "Submitting …", submittedAt: "Submitted {when}", upToDate: "The submitted version is up to date.",
      changedSince: "You have changed answers since your last submission — update to include them.",
      submitFail: "Could not submit. Try again, or download your responses as a file and send it to your contact.",
      closedBody: "This workspace no longer accepts responses. You can still download your answers as a file.",
      linkGone: "This link is no longer active. Download your answers as a file and ask your contact for the new link.",
      backupLabel: "Backup:",
      newRespondent: "+ New interview",
      ivHere: "Interviews on this device", ivNew: "+ New interview", ivOpen: "Open", ivActive: "Open now", ivUnnamed: "Unnamed",
      ivNotStarted: "not started", ivRemove: "Remove from device", ivRemoveConfirm: "Confirm — remove from here",
      ivRemoved: "The interview is removed from this device. It is still safe in the workspace.",
      ivLink: "Personal link", ivLinkCopied: "Personal link copied. Share it only with whoever will continue this particular interview.",
      ivLinkNotYet: "The link becomes available once the interview is saved to the workspace — answer one question first.",
      ivTotal: "{n} interviews recorded in the workspace in total.",
      ivPrivacy: "Each interview is private. Others with the workspace link see neither answers, notes nor who was interviewed — only the project sees the interviews together. If several people share this device, remove the interview from it when you are done.",
      ivResumed: "The interview was opened from its personal link.", ivResumeFail: "That personal link is not valid.",
      ivServerNewer: "Loaded a newer version of the interview from the workspace.",
      ivNewOk: "New interview — the previous one is still in the list of interviews on this device.",
      ivDone: "Done — save and remove from this device"
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
    started: null,
    updatedAt: null,   // last change to answers, notes or details
    exportSeq: 0       // how many times this interview has been exported
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
        started: state.started, updated_at: state.updatedAt, export_seq: state.exportSeq,
        saved_at: new Date().toISOString()
      }));
      lastSaved = new Date();
      saveFailed = false;
      if (WS && ACTIVE_IV) ivPatch(ACTIVE_IV, ivSummary());
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
    if (q.t === "scenarios") return Array.isArray(a) && a.some(scenarioFilled);
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
    } else if (q.t === "scenarios") {
      rec.scenarios = (Array.isArray(a) ? a : []).filter(scenarioFilled).map(function (sc) {
        var o = {};
        SC_FIELDS.forEach(function (f) { o[f] = String(sc[f] || "").trim(); });
        if (sc.priority) o.priority = sc.priority;
        if (sc.images && sc.images.length) o.images = sc.images.map(function (im) {
          var x = { caption: im.caption || "" };
          if (im.id) x.id = im.id;
          if (im.w) { x.w = im.w; x.h = im.h; }
          if (im.data && !WS) x.data = im.data;
          return x;
        });
        o.sentence_nb = scenarioSentence(sc, "nb");
        o.sentence_en = scenarioSentence(sc, "en");
        return o;
      });
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
      updated_at: state.updatedAt,
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
    if (rec.type === "scenarios") {
      return (rec.scenarios || []).map(function (sc, i) {
        var pr = sc.priority ? " (" + (T[lang] || T.en).scPrio[sc.priority] + ")" : "";
        var ni = sc.images && sc.images.length ? " [" + sc.images.length + " " + (T[lang] || T.en).scImgWord + "]" : "";
        return (i + 1) + pr + ": " + (lang === "nb" ? sc.sentence_nb : sc.sentence_en) + ni;
      }).join(" || ");
    }
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
    info: WS ? { company: WS.company, count: 0 } : null,
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
  function rememberSubmission(o, key, lid) {
    try { store.set(key || SUB_KEY, JSON.stringify(o)); } catch (e) {}
    if (WS && (lid || ACTIVE_IV)) ivPatch(lid || ACTIVE_IV, { subId: o.id });
  }

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


  /* ---------------------------------------------------------------- several interviews per company

     Each interview on a device has its own draft and its own submission key, listed
     in a small per-company index. Switching interviews never mixes them; starting a
     new one never touches the previous. A personal link (#resume=<id>.<key>) opens a
     single interview on another device — the fragment never reaches the server. */

  var IV_INDEX_KEY = null, IV_ACTIVE_KEY = null, ACTIVE_IV = null;
  var DRAFT_BASE = "baerel-survey-draft-v1";

  function newLid() { return "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function ivKeys(lid) {
    return { draft: DRAFT_BASE + ":" + WS.company.id + ":" + lid, sub: "baerel-submission-v1:" + WS.company.id + ":" + lid };
  }
  function ivList() { try { return JSON.parse(store.get(IV_INDEX_KEY) || "[]"); } catch (e) { return []; } }
  function ivStore(list) { try { store.set(IV_INDEX_KEY, JSON.stringify(list)); } catch (e) {} }
  function ivPatch(lid, patch) {
    var list = ivList(), e = null;
    list.forEach(function (x) { if (x.lid === lid) e = x; });
    if (!e) { e = { lid: lid, created: new Date().toISOString() }; list.push(e); }
    Object.keys(patch).forEach(function (k) { e[k] = patch[k]; });
    ivStore(list);
  }
  function readSub(lid) { try { var r = store.get(ivKeys(lid).sub); return r ? JSON.parse(r) : null; } catch (e) { return null; } }

  function useInterview(lid) {
    ACTIVE_IV = lid;
    var k = ivKeys(lid);
    DRAFT_KEY = k.draft;
    SUB_KEY = k.sub;
    try { store.set(IV_ACTIVE_KEY, lid); } catch (e) {}
  }

  function setupInterviews() {
    IV_INDEX_KEY = "baerel-interviews-v1:" + WS.company.id;
    IV_ACTIVE_KEY = "baerel-interview-active-v1:" + WS.company.id;
    var list = ivList();
    if (!list.length) {
      // First run, or a browser that used the single-interview version: adopt what is there.
      var lid = newLid(), k = ivKeys(lid);
      var oldDraft = store.get(DRAFT_BASE + ":" + WS.company.id), oldSub = store.get("baerel-submission-v1:" + WS.company.id);
      if (oldDraft) { try { store.set(k.draft, oldDraft); } catch (e) {} store.del(DRAFT_BASE + ":" + WS.company.id); }
      if (oldSub) { try { store.set(k.sub, oldSub); } catch (e) {} store.del("baerel-submission-v1:" + WS.company.id); }
      list = [{ lid: lid, created: new Date().toISOString() }];
      ivStore(list);
    }
    var act = store.get(IV_ACTIVE_KEY);
    if (!list.some(function (x) { return x.lid === act; })) act = list[list.length - 1].lid;
    useInterview(act);
  }

  function ivSummary() {
    var p = totalProgress();
    return {
      label: String(state.meta.interviewee || "").trim(),
      role: String(state.answers.q1 || "").trim(),
      completion: Math.round((p.done / p.total) * 100),
      updatedAt: state.updatedAt
    };
  }

  function blankInterview(keepInterviewer) {
    clearTimeout(sync.timer);
    state.answers = {}; state.notes = {};
    state.meta = { interviewer: keepInterviewer || "", interviewee: "", date: "" };
    state.updatedAt = null; state.exportSeq = 0;
    state.path = "core"; state.tracks = []; state.section = 0; state.started = null; state.view = "start";
    restored = false; lastSaved = null;
    sync.last = null; sync.version = null; sync.err = ""; sync.dirty = false;
  }

  function applyDraft(d) {
    if (!d) return false;
    if (d.lang === "nb" || d.lang === "en") state.lang = d.lang;
    state.answers = d.answers || {};
    state.notes = d.notes || {};
    if (d.meta) state.meta = { interviewer: d.meta.interviewer || "", interviewee: d.meta.interviewee || "", date: d.meta.date || "" };
    state.updatedAt = d.updated_at || d.saved_at || null;
    state.exportSeq = d.export_seq || 0;
    state.path = d.path === "full" ? "full" : "core";
    state.tracks = d.tracks && d.tracks.length ? d.tracks : [];
    state.section = d.section || 0;
    state.started = d.started || new Date().toISOString();
    state.view = d.view === "review" ? "review" : (Object.keys(state.answers).length ? "form" : "start");
    if (d.saved_at) { var dt = new Date(d.saved_at); if (!isNaN(dt.getTime())) lastSaved = dt; }
    return true;
  }

  /* Leave the current interview cleanly: save locally, push to the server, and
     forget it entirely if nothing was ever entered. */
  function leaveCurrent() {
    flushDraft();
    var empty = !hasContent() && !mySubmission() && !String(state.meta.interviewee || "").trim();
    if (empty && ACTIVE_IV) {
      var k = ivKeys(ACTIVE_IV), gone = ACTIVE_IV;
      store.del(k.draft); store.del(k.sub);
      ivStore(ivList().filter(function (x) { return x.lid !== gone; }));
    } else if (sync.dirty || sync.inflight) {
      doSync();
    }
  }

  function openInterview(lid) {
    if (lid === ACTIVE_IV) return;
    leaveCurrent();
    blankInterview(state.meta.interviewer);
    useInterview(lid);
    applyDraft(loadDraft());
    render(); window.scrollTo(0, 0);
    refreshFromServer();
  }

  function newInterview() {
    leaveCurrent();
    blankInterview(state.meta.interviewer);
    var lid = newLid();
    var list = ivList(); list.push({ lid: lid, created: new Date().toISOString() }); ivStore(list);
    useInterview(lid);
    render(); window.scrollTo(0, 0);
    setStatus(t("ivNewOk"));
  }

  function removeInterview(lid) {
    var wasActive = lid === ACTIVE_IV;
    if (wasActive) { flushDraft(); clearTimeout(sync.timer); }
    var k = ivKeys(lid);
    store.del(k.draft); store.del(k.sub);
    var list = ivList().filter(function (x) { return x.lid !== lid; });
    ivStore(list);
    if (wasActive) {
      blankInterview(state.meta.interviewer);
      if (list.length) { useInterview(list[list.length - 1].lid); applyDraft(loadDraft()); state.view = "start"; }
      else { var nl = newLid(); ivStore([{ lid: nl, created: new Date().toISOString() }]); useInterview(nl); }
    }
    render(); window.scrollTo(0, 0);
    setStatus(t("ivRemoved"));
  }

  function personalLink(lid) {
    var sub = readSub(lid);
    if (!sub || !sub.id || !sub.edit_key) return null;
    return location.origin + location.pathname + "#resume=" + sub.id + "." + sub.edit_key;
  }

  function fetchOwn(sub) {
    return fetch("/api/w/" + WS.token + "/submissions/" + encodeURIComponent(sub.id), {
      headers: { "x-edit-key": sub.edit_key }, credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer"
    }).then(function (r) { if (!r.ok) throw new Error("own"); return r.json(); });
  }

  /* The same interview may have been continued on another device: take the newer copy. */
  function refreshFromServer() {
    var sub = mySubmission(), lidAt = ACTIVE_IV;
    if (!sub || !sub.edit_key) return Promise.resolve();
    return fetchOwn(sub).then(function (d) {
      if (lidAt !== ACTIVE_IV || sync.dirty || sync.inflight) return;
      var serverAt = d.response && d.response.updated_at;
      if (serverAt && (!state.updatedAt || serverAt > state.updatedAt)) {
        var view = state.view, section = state.section;
        applyDraft(draftFromExport(d.response));
        state.view = view; state.section = section;
        saveDraft(); render();
        setStatus(t("ivServerNewer"));
      }
    })["catch"](function () {});
  }

  function resumeFromHash() {
    var m = /^#resume=([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(location.hash || "");
    if (!m) return Promise.resolve(false);
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}   // the key leaves the address bar at once
    var subId = m[1], key = m[2];
    var list = ivList();
    for (var i = 0; i < list.length; i++) {
      var s0 = readSub(list[i].lid);
      if (s0 && s0.id === subId) { openInterview(list[i].lid); return Promise.resolve(true); }
    }
    return fetchOwn({ id: subId, edit_key: key }).then(function (d) {
      leaveCurrent();
      blankInterview(state.meta.interviewer);
      var lid = newLid();
      var l2 = ivList(); l2.push({ lid: lid, created: new Date().toISOString(), subId: subId }); ivStore(l2);
      useInterview(lid);
      applyDraft(draftFromExport(d.response));
      rememberSubmission({ id: subId, edit_key: key, updated_at: d.updated_at, version: d.version, sig: answersSig() }, SUB_KEY, lid);
      if (state.view === "start") state.view = "form";
      saveDraft(); render(); window.scrollTo(0, 0);
      setStatus(t("ivResumed"));
      return true;
    })["catch"](function () { setStatus(t("ivResumeFail")); return false; });
  }

  function interviewsPanel() {
    var box = el("div", { class: "iv-panel" });
    box.appendChild(el("p", { class: "eyebrow", text: t("ivHere") }));
    var ul = el("ul", { class: "iv-local" });
    ivList().slice().reverse().forEach(function (e) {
      var active = e.lid === ACTIVE_IV;
      var info = active ? ivSummary() : e;
      var bits = [info.role, info.updatedAt ? info.completion + " %" : null, info.updatedAt ? fmtWhen(info.updatedAt) : t("ivNotStarted")]
        .filter(Boolean).join(" · ");
      var acts = el("span", { class: "iv-acts" });
      if (active) acts.appendChild(el("span", { class: "pill open", text: t("ivActive") }));
      else acts.appendChild(el("button", { class: "btn", type: "button", text: t("ivOpen"), onclick: function () { openInterview(e.lid); } }));
      acts.appendChild(el("button", { class: "btn ghost", type: "button", text: t("ivLink"), onclick: function () {
        var u = personalLink(e.lid);
        if (!u) { setStatus(t("ivLinkNotYet")); return; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(u).then(function () { setStatus(t("ivLinkCopied")); }, function () { setStatus(t("copyFail")); });
        } else setStatus(t("copyFail"));
      } }));
      var rm = el("button", { class: "btn ghost", type: "button", text: t("ivRemove") });
      rm.addEventListener("click", function () {
        if (rm.getAttribute("data-armed") !== "1") {
          rm.setAttribute("data-armed", "1"); rm.textContent = t("ivRemoveConfirm");
          setTimeout(function () { rm.removeAttribute("data-armed"); rm.textContent = t("ivRemove"); }, 4000);
          return;
        }
        var go = function () { removeInterview(e.lid); };
        if (active && hasContent()) doSync().then(go); else go();
      });
      acts.appendChild(rm);
      ul.appendChild(el("li", { class: active ? "active" : "" }, [
        el("span", { class: "iv-name" }, [el("b", { text: info.label || t("ivUnnamed") }), el("span", { class: "count", text: bits })]),
        acts
      ]));
    });
    box.appendChild(ul);
    box.appendChild(el("div", { class: "row", style: "margin-top:12px" }, [
      el("button", { class: "btn", type: "button", text: t("ivNew"), onclick: newInterview })
    ]));
    box.appendChild(el("p", { class: "a-meta", text: t("ivTotal").replace("{n}", String(ws.info.count || 0)) }));
    return box;
  }

  function wsBand() {
    var c = ws.info.company, n = ws.info.count || 0;
    return el("div", { class: "ws-band" }, [
      el("span", { class: "eyebrow", text: t("wsLabel") }),
      el("b", { text: c.name }),
      el("span", { class: "pill " + (ws.gone ? "closed" : c.open ? "open" : "closed"), text: ws.gone ? "—" : c.open ? t("wsOpen") : t("wsClosed") }),
      el("span", { class: "a-meta mono", style: "margin:0", text: n + " " + (n === 1 ? t("wsContrib1") : t("wsContribs")) })
    ]);
  }

  function wsSubmitBox() {
    var c = ws.info.company, mine = mySubmission();
    var box = el("div", { class: "submit-box" });
    box.appendChild(el("h3", { text: fill(t("submitTitle")) }));
    var when = mine ? t("submittedAt").replace("{when}", fmtWhen(mine.updated_at)) + (mine.version ? " · " + t("versionWord") + " " + mine.version : "") : "";
    if (ws.gone) { box.appendChild(el("p", { text: t("linkGone") })); return box; }
    if (!c.open) {
      box.appendChild(el("p", { text: t("closedBody") }));
      if (mine) box.appendChild(el("p", { class: "a-meta", text: when }));
      return box;
    }
    box.appendChild(el("p", { text: fill(t("submitBody")) }));
    if (mine) box.appendChild(el("p", { class: "a-meta", text: when }));
    box.appendChild(el("div", { class: "row" }, [
      el("button", { class: "btn primary", type: "button", text: t("saveVersion"),
        onclick: function (e) { var b = e.currentTarget; b.disabled = true; doSync("manual").then(function () { render(); }); } }),
      el("button", { class: "btn", type: "button", text: t("exportDoc"), onclick: function () { doExport("doc"); } }),
      el("button", { class: "btn ghost", type: "button", text: t("ivDone"), onclick: function (e) {
        var b = e.currentTarget; b.disabled = true;
        var lid = ACTIVE_IV;
        doSync("manual").then(function () { removeInterview(lid); });
      } })
    ]));
    if (sync.err) box.appendChild(el("p", { class: "err", role: "alert", text: sync.err }));
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




  /* ---------------------------------------------------------------- living document

     In a workspace the interview syncs itself to the server a few seconds after
     each change; the server keeps timestamped versions. Export works from every
     page, at any time, and stamps the file with date, time and a running number.
     A JSON export carries the full draft, so it can be opened again anywhere. */

  var sync = { timer: null, inflight: null, dirty: false, again: false, last: null, version: null, err: "" };

  function hasContent() {
    return ALL_Q.some(isAnswered) || noteCount() > 0;
  }

  function scheduleSync() {
    if (!WS || ADMIN || ws.gone || !ws.info.company.open) return;
    sync.dirty = true;
    clearTimeout(sync.timer);
    sync.timer = setTimeout(function () { doSync(); }, 5000);
    setSaveState();
  }

  function doSync(reason) {
    if (!WS || ADMIN || ws.gone || !ws.info.company.open) return Promise.resolve(null);
    if (!reason && !hasContent()) { sync.dirty = false; setSaveState(); return Promise.resolve(null); }
    if (sync.inflight) { sync.again = true; if (reason) sync.pendingReason = reason; return sync.inflight; }
    clearTimeout(sync.timer);
    sync.dirty = false;
    var mine = mySubmission();
    var resp = buildResponse();
    var sig = answersSig();
    var subKey = SUB_KEY, lidAt = ACTIVE_IV;   // the interview being saved, even if the user switches meanwhile
    var body = { response: resp };
    if (reason) body.snapshot = reason;
    var req;
    if (mine) {
      body.edit_key = mine.edit_key;
      req = wsFetch("PUT", "/submissions/" + encodeURIComponent(mine.id), body)["catch"](function (e) {
        // Our copy is gone or the key no longer matches: file a fresh submission instead.
        if (e.status === 403) return wsFetch("POST", "/submissions", { response: resp, snapshot: reason || undefined });
        throw e;
      });
    } else {
      req = wsFetch("POST", "/submissions", body);
    }
    sync.inflight = req.then(function (d) {
      rememberSubmission({ id: d.id, edit_key: d.edit_key || (mine && mine.edit_key), updated_at: d.updated_at, sig: sig, version: d.version }, subKey, lidAt);
      if (lidAt === ACTIVE_IV) { sync.last = new Date(); sync.version = d.version; sync.err = ""; }
      if (d.edit_key && ws.info) ws.info.count = (ws.info.count || 0) + 1;   // a new interview was just filed
      return d;
    })["catch"](function (e) {
      if (e.status === 423) ws.info.company.open = false;
      else if (e.status === 404 || e.status === 410) ws.gone = true;
      else sync.err = t("syncFail");
      return null;
    }).then(function (d) {
      var again = sync.again, pr = sync.pendingReason;
      sync.inflight = null; sync.again = false; sync.pendingReason = null;
      setSaveState();
      if (pr) doSync(pr); else if (again || sync.dirty) scheduleSync();
      return d;
    });
    setSaveState();
    return sync.inflight;
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden" && sync.dirty) doSync();
  });

  function pad2(n) { return ("0" + n).slice(-2); }
  function fileStamp(d) {
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + "-" + pad2(d.getHours()) + pad2(d.getMinutes());
  }
  function longStamp(d) {
    try {
      return d.toLocaleString(state.lang === "nb" ? "nb-NO" : "en-GB", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return d.toISOString(); }
  }

  function doExport(kind) {
    flushDraft();
    if (kind !== "csv") {
      // Pictures stored on the server are fetched once and embedded, so the file stands on its own.
      imageDataMap().then(function (map) { finishExport(kind, map); });
      return;
    }
    finishExport(kind, {});
  }

  function finishExport(kind, imgMap) {
    state.exportSeq = (state.exportSeq || 0) + 1;
    saveDraft();
    var now = new Date();
    var resp = buildResponse();
    resp.exported_at = now.toISOString();
    resp.export_seq = state.exportSeq;
    var mine = mySubmission();
    if (mine) resp.workspace_submission = mine.id;
    var who = resp.respondent.organisation || t("anonymous");
    var base = "baerel-intervju-" + slug(who) + (state.meta.interviewee ? "-" + slug(state.meta.interviewee) : "") +
      "-" + fileStamp(now) + "-v" + state.exportSeq;
    if (kind === "json") {
      // The draft travels with the data so the file can be opened and continued later.
      var answersCopy = JSON.parse(JSON.stringify(state.answers));
      ALL_Q.forEach(function (q) {
        if (q.t !== "scenarios" || !Array.isArray(answersCopy[q.id])) return;
        answersCopy[q.id].forEach(function (sc) { (sc.images || []).forEach(function (im) { if (!im.data && im.id && imgMap[im.id]) im.data = imgMap[im.id]; }); });
      });
      resp.draft = { answers: answersCopy, notes: state.notes, meta: state.meta, path: state.path, tracks: state.tracks,
        lang: state.lang, started: state.started, updated_at: state.updatedAt, export_seq: state.exportSeq };
      saveFile(base + ".json", JSON.stringify(resp, null, 2), setStatus);
    } else if (kind === "csv") {
      saveFile(base + ".csv", responseCsv(resp), setStatus);
    } else {
      saveFile(base + ".html", interviewDocument(resp, now, imgMap), setStatus);
    }
    if (WS) doSync("export");
  }

  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  /* A self-contained, printable record of the interview in the current language. */
  function interviewDocument(resp, when, imgMap) {
    imgMap = imgMap || {};
    var lang = state.lang, T0 = T[lang];
    var recById = {};
    resp.answers.forEach(function (r) { recById[r.id] = r; });
    var meta = [
      [T0.org, resp.respondent.organisation || T0.anonymous],
      [T0.role, resp.respondent.role],
      [T0.metaInterviewer, state.meta.interviewer],
      [T0.metaInterviewee, state.meta.interviewee],
      [T0.metaDate, state.meta.date],
      [T0.scope, state.path === "full" ? T0.scopeFull : T0.scopeCore],
      [T0.answered.charAt(0).toUpperCase() + T0.answered.slice(1), resp.answered_count + " / " + resp.asked_count + " (" + resp.completion + " %)"],
      [T0.lastChanged, state.updatedAt ? longStamp(new Date(state.updatedAt)) : ""],
      [T0.exportedAt, longStamp(when) + " · " + T0.versionWord + " " + state.exportSeq]
    ].filter(function (x) { return x[1]; });

    var body = "";
    SURVEY.sections.forEach(function (s) {
      var items = "";
      s.questions.forEach(function (q) {
        var r = recById[q.id];
        if (!r) return;
        var ans = "", has = false;
        if (q.t === "text" || q.t === "longtext") {
          if (r.text && r.text.trim()) { has = true; ans = "<p>" + esc(r.text.trim()).replace(/\n/g, "<br>") + "</p>"; }
        } else if (q.t === "scale") {
          if (r.value != null) { has = true; ans = "<p class=\"val\"><b>" + r.value + "</b> " + T0.docOf + " 5</p>"; }
        } else if (q.t === "scenarios") {
          if (r.scenarios && r.scenarios.length) {
            has = true;
            ans = "<ol class=\"sc\">" + r.scenarios.map(function (sc) {
              var pics = (sc.images || []).map(function (im) {
                var src = im.data || (im.id && imgMap[im.id]) || "";
                if (!src) return "";
                return "<figure><img src=\"" + src + "\" alt=\"" + esc(im.caption || "") + "\">" + (im.caption ? "<figcaption>" + esc(im.caption) + "</figcaption>" : "") + "</figure>";
              }).join("");
              return "<li>" + esc(lang === "nb" ? sc.sentence_nb : sc.sentence_en) +
                (sc.priority ? " <span class=\"tag\">" + esc(T0.scPriority + ": " + T0.scPrio[sc.priority]) + "</span>" : "") +
                (pics ? "<div class=\"imgs\">" + pics + "</div>" : "") + "</li>";
            }).join("") + "</ol>";
          }
        } else {
          var notesBy = {};
          (r.option_notes || []).forEach(function (o) { notesBy[o.index] = o; });
          var lis = (r.selected || []).map(function (i, k) {
            var lab = (lang === "nb" ? r.labels_nb : r.labels_en)[k];
            return "<li>" + esc(lab) + (notesBy[i] ? "<div class=\"note\">" + esc(notesBy[i].note) + "</div>" : "") + "</li>";
          });
          if (r.other) lis.push("<li>" + esc(T0.docOther + ": " + r.other) + "</li>");
          (r.option_notes || []).forEach(function (o) {
            if (!o.selected) lis.push("<li class=\"uns\">" + esc((lang === "nb" ? o.label_nb : o.label_en) + " (" + T0.docNotSelected + ")") + "<div class=\"note\">" + esc(o.note) + "</div></li>");
          });
          if (lis.length) { has = true; ans = "<ul>" + lis.join("") + "</ul>"; }
        }
        if (r.note) { has = true; ans += "<div class=\"note qn\"><span>" + esc(T0.qNote) + ":</span> " + esc(r.note) + "</div>"; }
        if (!has) return;
        items += "<section class=\"q\"><h3>" + esc(L(q).q) + (q.std ? " <span class=\"tag\">" + esc(q.std) + "</span>" : "") + "</h3>" + ans + "</section>";
      });
      if (items) body += "<h2>" + esc(L(s).title) + "</h2>" + items;
    });

    var title = (lang === "nb" ? "Intervju – " : "Interview — ") + (resp.respondent.organisation || T0.anonymous);
    return "<!doctype html><html lang=\"" + (lang === "nb" ? "nb" : "en") + "\"><head><meta charset=\"utf-8\">" +
      "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + esc(title) + "</title><style>" +
      "body{margin:0;background:#f1f3f0;color:#111a18;font:15.5px/1.6 Georgia,'Times New Roman',serif}" +
      "main{max-width:46rem;margin:0 auto;padding:40px 24px 64px;background:#fbfcfa}" +
      "h1{font:600 30px/1.15 system-ui,sans-serif;margin:6px 0 18px;letter-spacing:-.01em}" +
      ".eyebrow{font:11px/1 ui-monospace,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:#6d7f79}" +
      "table{border-collapse:collapse;width:100%;font:14px/1.45 system-ui,sans-serif;margin:0 0 28px}" +
      "td{padding:6px 0;border-bottom:1px solid #d4ddd6;vertical-align:top}td:first-child{color:#6d7f79;width:34%;padding-right:16px}" +
      "h2{font:600 19px/1.3 system-ui,sans-serif;margin:34px 0 6px;padding-top:14px;border-top:2px solid #a4542b}" +
      "h3{font-size:16.5px;font-weight:600;margin:18px 0 6px}" +
      "p,li{text-align:justify;hyphens:auto}ul,ol{margin:4px 0 0;padding-left:22px}li{margin:3px 0}" +
      ".uns{color:#6d7f79}.note{font:13.5px/1.45 system-ui,sans-serif;color:#42534e;border-left:2px solid #a4542b;padding:2px 0 2px 10px;margin:4px 0 6px}" +
      ".qn span{color:#8c4523}.tag{font:10.5px ui-monospace,Menlo,monospace;letter-spacing:.06em;border:1px solid #b4c0b9;border-radius:99px;padding:1px 7px;color:#1a655d;vertical-align:2px}" +
      ".val b{font:600 18px system-ui,sans-serif}.sc li{margin-bottom:8px}" +
      ".imgs{display:flex;flex-wrap:wrap;gap:10px;margin:8px 0 4px}figure{margin:0;max-width:48%}figure img{display:block;max-width:100%;max-height:300px;border:1px solid #d4ddd6;border-radius:3px}" +
      "figcaption{font:12.5px/1.4 system-ui,sans-serif;color:#42534e;margin-top:4px}" +
      "footer{margin-top:40px;font:12px system-ui,sans-serif;color:#6d7f79}" +
      "@media print{body{background:#fff}main{padding:0}h2{break-after:avoid}.q{break-inside:avoid}}" +
      "</style></head><body><main>" +
      "<p class=\"eyebrow\">Bærel · " + esc(T0.modeForm) + "</p><h1>" + esc(title) + "</h1>" +
      "<table>" + meta.map(function (m) { return "<tr><td>" + esc(m[0]) + "</td><td>" + esc(m[1]) + "</td></tr>"; }).join("") + "</table>" +
      body +
      "<footer>" + esc(T0.docGenerated) + " · " + esc(when.toISOString()) + "</footer>" +
      "</main></body></html>";
  }

  /* Rebuild a draft from an exported file: exact when the file carries its draft,
     reconstructed from the answer records otherwise. */
  function draftFromExport(obj) {
    if (obj.draft && obj.draft.answers) return obj.draft;
    var answers = {}, notes = {};
    (obj.answers || []).forEach(function (r) {
      var q = Q_BY_ID[r.id];
      if (!q) return;
      if (q.t === "text" || q.t === "longtext") { if (r.text) answers[q.id] = r.text; }
      else if (q.t === "scale") { if (typeof r.value === "number") answers[q.id] = r.value; }
      else if (q.t === "single") {
        if (r.selected && r.selected.length) answers[q.id] = { i: r.selected[0] };
        if (r.other) { answers[q.id] = answers[q.id] || {}; answers[q.id].other = r.other; }
      } else if (q.t === "multi") {
        if ((r.selected && r.selected.length) || r.other) answers[q.id] = { i: (r.selected || []).slice() };
        if (r.other) answers[q.id].other = r.other;
      } else if (q.t === "scenarios") {
        if (r.scenarios && r.scenarios.length) answers[q.id] = r.scenarios.map(function (sc) {
          var o = {}; SC_FIELDS.forEach(function (f) { if (sc[f]) o[f] = sc[f]; });
          if (sc.priority) o.priority = sc.priority;
          if (sc.images && sc.images.length) o.images = sc.images.map(function (im) { return { id: im.id, data: im.data, caption: im.caption || "", w: im.w, h: im.h }; });
          return o;
        });
      }
      if (r.note || r.option_notes) {
        var n = {};
        if (r.note) n.q = r.note;
        (r.option_notes || []).forEach(function (o) { n[String(o.index)] = o.note; });
        notes[q.id] = n;
      }
    });
    return { answers: answers, notes: notes, meta: obj.interview || {}, path: obj.path === "full" ? "full" : "core",
      tracks: obj.tracks || [], lang: obj.language, started: obj.started_at, updated_at: obj.updated_at, export_seq: obj.export_seq || 0 };
  }

  function importInterview(obj) {
    if (!obj || obj.schema !== SCHEMA || !obj.answers) { setStatus(t("importBad")); return false; }
    var d = draftFromExport(obj);
    state.answers = d.answers || {};
    state.notes = d.notes || {};
    state.meta = { interviewer: (d.meta && d.meta.interviewer) || "", interviewee: (d.meta && d.meta.interviewee) || "", date: (d.meta && d.meta.date) || "" };
    state.path = d.path === "full" ? "full" : "core";
    state.tracks = d.tracks || [];
    state.started = d.started || new Date().toISOString();
    state.updatedAt = d.updated_at || obj.updated_at || obj.exported_at || null;
    state.exportSeq = d.export_seq || obj.export_seq || 0;
    if (d.lang === "nb" || d.lang === "en") state.lang = d.lang;
    // Same workspace interview as this browser's? Keep updating it; otherwise it files as a new one.
    var mine = mySubmission();
    if (SUB_KEY && !(mine && obj.workspace_submission === mine.id)) store.del(SUB_KEY);
    sync.last = null; sync.version = null; sync.err = "";
    state.section = 0; state.view = "form";
    saveDraft();
    render(); window.scrollTo(0, 0);
    setStatus(t("importOk"));
    if (WS) { scheduleSync(); migrateImagesToServer(); }
    return true;
  }

  function importControl() {
    var input = el("input", { type: "file", accept: ".json,application/json", class: "sr", id: "import-file" });
    var btn = el("button", { class: "btn ghost", type: "button", text: t("importBtn") });
    btn.addEventListener("click", function () {
      if (hasContent() && btn.getAttribute("data-armed") !== "1") {
        btn.setAttribute("data-armed", "1"); btn.textContent = t("importReplace");
        setTimeout(function () { btn.removeAttribute("data-armed"); btn.textContent = t("importBtn"); }, 5000);
        return;
      }
      input.click();
    });
    input.addEventListener("change", function () {
      var f = input.files && input.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () { try { importInterview(JSON.parse(String(fr.result))); } catch (e) { setStatus(t("importBad")); } };
      fr.readAsText(f);
      input.value = "";
    });
    return el("span", {}, [btn, input]);
  }

  /* Export menu: available from the top bar on every interview page. */
  var exportMenu = null;
  function closeExportMenu() { if (exportMenu) { exportMenu.remove(); exportMenu = null; } }
  function exportButton() {
    var b = el("button", { class: "btn export-btn", type: "button", "aria-haspopup": "menu", text: t("exportBtn") + " ▾" });
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      if (exportMenu) { closeExportMenu(); return; }
      var items = [["doc", t("exportDoc")], ["json", t("exportData")], ["csv", t("exportTable")]];
      exportMenu = el("div", { class: "export-menu", role: "menu" });
      items.forEach(function (it) {
        exportMenu.appendChild(el("button", { type: "button", role: "menuitem", text: it[1],
          onclick: function () { closeExportMenu(); doExport(it[0]); } }));
      });
      if (WS && ws.info.company.open && !ws.gone) {
        exportMenu.appendChild(el("button", { type: "button", role: "menuitem", class: "sep", text: t("saveVersion"),
          onclick: function () { closeExportMenu(); doSync("manual"); } }));
      }
      var r = b.getBoundingClientRect();
      exportMenu.style.top = (r.bottom + 6) + "px";
      exportMenu.style.right = Math.max(12, window.innerWidth - r.right) + "px";
      document.body.appendChild(exportMenu);
      var first = exportMenu.querySelector("button"); if (first) first.focus();
    });
    return b;
  }
  document.addEventListener("click", function (e) { if (exportMenu && !exportMenu.contains(e.target)) closeExportMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeExportMenu(); });
  window.addEventListener("scroll", closeExportMenu, { passive: true });

  /* ---------------------------------------------------------------- usage scenarios

     "When [situation], [actor] needs to [goal], using [data], which comes from
     [source], so that [outcome]." Several per interview; each field is optional. */

  var SC_FIELDS = ["situation", "actor", "goal", "data", "source", "outcome"];
  var MAX_IMG_PER_SC = 6;

  /* Where an image is served from: the admin endpoint, the workspace endpoint, or
     the image itself when there is no server (or it has not been uploaded yet). */
  function imgSrc(im) {
    if (im.data) return im.data;
    if (!im.id) return "";
    if (ADMIN) return "/api/admin/attachments/" + im.id;
    if (WS) return "/api/w/" + WS.token + "/attachments/" + im.id;
    return "";
  }

  /* Downscale and re-encode in the browser: photos from phones are 3–12 MB, and
     1600 px JPEG is plenty to show a label, a fault or a workstation. */
  function downscale(file, max, quality) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onerror = reject;
      fr.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("decode")); };
        img.onload = function () {
          var k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          var w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
          var c = document.createElement("canvas");
          c.width = w; c.height = h;
          var cx = c.getContext("2d");
          cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h);
          cx.drawImage(img, 0, 0, w, h);
          c.toBlob(function (b) {
            if (!b) return reject(new Error("encode"));
            resolve({ blob: b, w: w, h: h, dataUrl: WS ? null : c.toDataURL("image/jpeg", quality) });
          }, "image/jpeg", quality);
        };
        img.src = String(fr.result);
      };
      fr.readAsDataURL(file);
    });
  }

  function uploadImage(blob) {
    return fetch("/api/w/" + WS.token + "/attachments", {
      method: "POST", headers: { "Content-Type": blob.type || "image/jpeg" }, body: blob,
      credentials: "omit", referrerPolicy: "no-referrer"
    }).then(function (r) {
      return r.json()["catch"](function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.message || "upload"); e.status = r.status; throw e; }
        return d;
      });
    });
  }

  function dataUrlToBlob(u) {
    var m = /^data:([^;,]+)(;base64)?,(.*)$/.exec(u || "");
    if (!m) return null;
    var bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: m[1] });
  }

  function blobToDataUrl(b) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result)); };
      fr.onerror = reject;
      fr.readAsDataURL(b);
    });
  }

  function eachScenarioImage(fn) {
    ALL_Q.forEach(function (q) {
      if (q.t !== "scenarios" || !Array.isArray(state.answers[q.id])) return;
      state.answers[q.id].forEach(function (sc) { (sc.images || []).forEach(function (im) { fn(im, sc); }); });
    });
  }

  /* Fetch every server-held image once, so exports can carry the pictures themselves. */
  function imageDataMap() {
    var ids = [];
    eachScenarioImage(function (im) { if (im.id && !im.data && ids.indexOf(im.id) === -1) ids.push(im.id); });
    var map = {};
    return Promise.all(ids.map(function (id) {
      return fetch(imgSrc({ id: id }), { credentials: ADMIN ? "same-origin" : "omit" })
        .then(function (r) { if (!r.ok) throw new Error("img"); return r.blob(); })
        .then(blobToDataUrl).then(function (d) { map[id] = d; })["catch"](function () {});
    })).then(function () { return map; });
  }

  /* After opening an exported file inside a workspace, move embedded images to the server. */
  function migrateImagesToServer() {
    if (!WS) return Promise.resolve();
    var jobs = [];
    eachScenarioImage(function (im) {
      if (!im.data) return;
      var b = dataUrlToBlob(im.data);
      if (!b) return;
      jobs.push(uploadImage(b).then(function (d) { im.id = d.id; delete im.data; })["catch"](function () {}));
    });
    return Promise.all(jobs).then(function () { if (jobs.length) { saveDraft(); scheduleSync(); render(); } });
  }

  function scenarioFilled(sc) {
    return !!sc && (SC_FIELDS.some(function (f) { return sc[f] && String(sc[f]).trim(); }) || !!(sc.images && sc.images.length));
  }

  function scPart(sc, f, lang) {
    var v = String((sc && sc[f]) || "").trim().replace(/[.\s]+$/, "");
    return v || "[" + T[lang].scPh[f].split(/ [–—] /)[0] + "]";
  }

  function scenarioSentence(sc, lang) {
    var p = function (f) { return scPart(sc, f, lang); };
    return lang === "nb"
      ? "Når " + p("situation") + ", trenger " + p("actor") + " å " + p("goal") + ", ved hjelp av " + p("data") + ", som kommer fra " + p("source") + ", slik at " + p("outcome") + "."
      : "When " + p("situation") + ", " + p("actor") + " needs to " + p("goal") + ", using " + p("data") + ", which comes from " + p("source") + ", so that " + p("outcome") + ".";
  }

  /* The same sentence as DOM, with filled parts emphasised and gaps muted. */
  function scenarioSentenceNode(sc, lang) {
    var frag = document.createDocumentFragment();
    var parts = lang === "nb"
      ? ["Når ", "situation", ", trenger ", "actor", " å ", "goal", ", ved hjelp av ", "data", ", som kommer fra ", "source", ", slik at ", "outcome", "."]
      : ["When ", "situation", ", ", "actor", " needs to ", "goal", ", using ", "data", ", which comes from ", "source", ", so that ", "outcome", "."];
    parts.forEach(function (x) {
      if (SC_FIELDS.indexOf(x) === -1) { frag.appendChild(document.createTextNode(x)); return; }
      var v = String((sc && sc[x]) || "").trim().replace(/[.\s]+$/, "");
      frag.appendChild(v ? el("b", { class: "sc-fill", text: v }) : el("span", { class: "sc-gap", text: scPart(sc, x, lang) }));
    });
    return frag;
  }

  function scenarioCount() {
    var n = 0;
    ALL_Q.forEach(function (q) {
      if (q.t === "scenarios" && Array.isArray(state.answers[q.id])) n += state.answers[q.id].filter(scenarioFilled).length;
    });
    return n;
  }

  function ensureDatalists() {
    ["scActors", "scSources"].forEach(function (key) {
      var id = "dl-" + key + "-" + state.lang;
      if (document.getElementById(id)) return;
      var dl = el("datalist", { id: id });
      T[state.lang][key].forEach(function (v) { dl.appendChild(el("option", { value: v })); });
      document.body.appendChild(dl);
    });
  }

  function scenarioEditor(q) {
    var box = el("div", { class: "sc-box" });
    var list = el("div", { class: "sc-list" });
    box.appendChild(el("p", { class: "q-hint", style: "margin-left:0", text: t("scHint") }));
    box.appendChild(list);
    ensureDatalists();

    function arr() {
      if (!Array.isArray(state.answers[q.id])) state.answers[q.id] = [];
      return state.answers[q.id];
    }
    function commit() { persist(); refreshSpine(); }

    function card(sc, idx) {
      var c = el("article", { class: "sc-card" });
      var preview = el("p", { class: "sc-preview" });
      function drawPreview() { preview.textContent = ""; preview.appendChild(scenarioSentenceNode(sc, state.lang)); }

      var prio = el("select", { class: "sc-prio", "aria-label": t("scPriority") });
      [["", t("scPrioNone")], ["high", t("scPrio").high], ["medium", t("scPrio").medium], ["low", t("scPrio").low]].forEach(function (o) {
        var op = el("option", { value: o[0], text: o[1] });
        if ((sc.priority || "") === o[0]) op.selected = true;
        prio.appendChild(op);
      });
      function keep() { if (arr().indexOf(sc) === -1) arr().push(sc); }
      prio.addEventListener("change", function () { keep(); if (prio.value) sc.priority = prio.value; else delete sc.priority; commit(); });

      var rm = el("button", { class: "btn ghost sc-rm", type: "button", text: t("scRemove") });
      rm.addEventListener("click", function () {
        if (rm.getAttribute("data-armed") !== "1") {
          rm.setAttribute("data-armed", "1"); rm.textContent = t("scRemoveConfirm");
          setTimeout(function () { rm.removeAttribute("data-armed"); rm.textContent = t("scRemove"); }, 4000);
          return;
        }
        var a = arr(); a.splice(idx, 1); commit(); draw();
      });
      var dup = el("button", { class: "btn ghost", type: "button", text: t("scDup") });
      dup.addEventListener("click", function () {
        keep(); var a = arr(); var copy = JSON.parse(JSON.stringify(sc)); a.splice(a.indexOf(sc) + 1, 0, copy); commit(); draw(a.indexOf(copy));
      });

      c.appendChild(el("header", { class: "sc-head" }, [
        el("span", { class: "eyebrow", text: t("scTitle") + " " + (idx + 1) }),
        el("label", { class: "sc-prio-l" }, [el("span", { class: "eyebrow", text: t("scPriority") }), prio]),
        dup, rm
      ]));

      var grid = el("div", { class: "sc-grid" });
      SC_FIELDS.forEach(function (f) {
        var long = f === "situation" || f === "goal" || f === "outcome";
        var id = q.id + "-sc" + idx + "-" + f;
        var inp = long
          ? el("textarea", { id: id, rows: "1", placeholder: t("scPh")[f] })
          : el("input", { id: id, type: "text", placeholder: t("scPh")[f],
              list: f === "actor" ? "dl-scActors-" + state.lang : f === "source" ? "dl-scSources-" + state.lang : null });
        inp.value = sc[f] || "";
        inp.addEventListener("input", function () {
          sc[f] = inp.value;
          if (arr().indexOf(sc) === -1) arr().push(sc);
          persist(); drawPreview();
          if (long) autoGrow(inp);
        });
        inp.addEventListener("change", refreshSpine);
        inp.addEventListener("blur", flushDraft);
        grid.appendChild(el("label", { class: "sc-lab", "for": id, text: t("scLab")[f] }));
        grid.appendChild(inp);
      });
      c.appendChild(grid);

      var pendingN = 0;
      var imgWrap = el("div", { class: "sc-imgs" });
      function drawImgs() {
        imgWrap.textContent = "";
        (sc.images || []).forEach(function (im, k) {
          var src = imgSrc(im);
          var pic = el("img", { src: src, alt: im.caption || (t("scTitle") + " " + (idx + 1)), loading: "lazy" });
          var fig = el("figure", { class: "sc-img" }, [
            src && !im.data ? el("a", { href: src, target: "_blank", rel: "noopener noreferrer" }, [pic]) : pic
          ]);
          var x = el("button", { type: "button", class: "sc-img-x", title: t("scRemove"), "aria-label": t("scRemove"), text: "×" });
          x.addEventListener("click", function () {
            sc.images.splice(k, 1);
            if (!sc.images.length) delete sc.images;
            commit(); drawImgs(); drawPreview();
          });
          var cap = el("input", { type: "text", class: "sc-cap", placeholder: t("scImgCaption"), "aria-label": t("scImgCaption") });
          cap.value = im.caption || "";
          cap.addEventListener("input", function () { im.caption = cap.value; persist(); });
          cap.addEventListener("blur", flushDraft);
          fig.appendChild(x);
          fig.appendChild(cap);
          imgWrap.appendChild(fig);
        });
        for (var i = 0; i < pendingN; i++) imgWrap.appendChild(el("div", { class: "sc-img sc-img-pending", text: t("scUploading") }));
        addImg.disabled = ((sc.images || []).length + pendingN) >= MAX_IMG_PER_SC;
      }
      var fileIn = el("input", { type: "file", accept: "image/*", multiple: "multiple", class: "sr" });
      var addImg = el("button", { type: "button", class: "btn ghost sc-addimg", text: t("scAddImg") });
      addImg.addEventListener("click", function () { fileIn.click(); });
      fileIn.addEventListener("change", function () {
        var files = Array.prototype.slice.call(fileIn.files || []);
        fileIn.value = "";
        keep();
        sc.images = sc.images || [];
        var room = MAX_IMG_PER_SC - sc.images.length - pendingN;
        if (files.length > room) { setStatus(t("scImgMax")); files = files.slice(0, Math.max(0, room)); }
        files.forEach(function (f) {
          pendingN++; drawImgs();
          downscale(f, WS ? 1600 : 1280, WS ? 0.82 : 0.78).then(function (r) {
            if (WS) return uploadImage(r.blob).then(function (d) { return { id: d.id, w: r.w, h: r.h }; });
            return { data: r.dataUrl, w: r.w, h: r.h };
          }).then(function (im) {
            sc.images = sc.images || [];
            sc.images.push(im); commit();
          })["catch"](function () { setStatus(t("scImgFail")); }).then(function () { pendingN--; drawImgs(); });
        });
      });
      c.appendChild(el("div", { class: "sc-imgrow" }, [
        el("p", { class: "eyebrow sc-prev-l", text: t("scImages") }), imgWrap, addImg, fileIn
      ]));
      drawImgs();

      c.appendChild(el("p", { class: "eyebrow sc-prev-l", text: t("scPreview") }));
      c.appendChild(preview);
      drawPreview();
      return c;
    }

    function autoGrow(ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + 2 + "px"; }

    function draw(focusIdx) {
      list.textContent = "";
      var a = Array.isArray(state.answers[q.id]) ? state.answers[q.id] : [];
      var shown = a.length ? a : [{}];   // an empty card to start typing into; stored on first keystroke
      shown.forEach(function (sc, i) { list.appendChild(card(sc, i)); });
      Array.prototype.forEach.call(list.querySelectorAll("textarea"), function (ta) { setTimeout(function () { autoGrow(ta); }, 0); });
      if (focusIdx !== undefined) {
        var f = list.querySelectorAll(".sc-card")[focusIdx];
        if (f) { f.scrollIntoView({ block: "nearest" }); var first = f.querySelector("textarea, input"); if (first) first.focus(); }
      }
    }

    var add = el("button", { class: "btn sc-add", type: "button", text: t("scAdd") });
    add.addEventListener("click", function () {
      var a = arr();
      if (!a.length && list.querySelector(".sc-card")) a.push({});   // keep the visible blank card
      a.push({}); commit(); draw(a.length - 1);
    });
    box.appendChild(add);
    draw();
    return box;
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


  /* ---------------------------------------------------------------- glossary

     Terms from glossary.js are marked in question text, options, section leads and
     the introduction. Hover, focus or tap shows a short definition and the source.
     Only the first occurrence of a term in each piece of text is marked. */

  var GL = (typeof GLOSSARY !== "undefined") ? GLOSSARY : [];
  var GL_BY = {};
  var glRe = null;
  (function () {
    var keys = [];
    GL.forEach(function (g, i) { g.m.forEach(function (k) { GL_BY[k] = i; keys.push(k); }); });
    keys.sort(function (a, b) { return b.length - a.length; });
    if (!keys.length) return;
    var W = "A-Za-z0-9ÆØÅæøåÀ-ÿ_";
    var esc = keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&"); });
    // Whole words only; a trailing hyphen is allowed so Norwegian compounds ("RoHS-krav") still match.
    glRe = new RegExp("(^|[^" + W + "-])(" + esc.join("|") + ")(?=$|[^" + W + "])", "g");
  })();

  function termNode(gi, word, extraClass) {
    return el("span", {
      class: "term" + (extraClass ? " " + extraClass : ""), role: "button", tabindex: "0",
      "data-g": String(gi), "aria-haspopup": "true", text: word
    });
  }

  function rich(text) {
    var frag = document.createDocumentFragment();
    if (!glRe || !text) { frag.appendChild(document.createTextNode(text || "")); return frag; }
    var seen = {}, last = 0, m;
    glRe.lastIndex = 0;
    while ((m = glRe.exec(text))) {
      var start = m.index + m[1].length, word = m[2], gi = GL_BY[word];
      if (gi === undefined || seen[gi]) continue;
      seen[gi] = true;
      if (start > last) frag.appendChild(document.createTextNode(text.slice(last, start)));
      frag.appendChild(termNode(gi, word));
      last = start + word.length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    return frag;
  }

  function stdPill(std) {
    var gi = GL_BY[std];
    return gi === undefined ? el("span", { class: "pill std", text: std }) : termNode(gi, std, "pill std");
  }

  var tip = null, tipFor = null, hideT = null, showT = null, pinned = false;

  function ensureTip() {
    if (tip) return tip;
    tip = el("div", { class: "gloss-tip", role: "tooltip", id: "gloss-tip" });
    tip.hidden = true;
    tip.addEventListener("mouseenter", function () { clearTimeout(hideT); });
    tip.addEventListener("mouseleave", function () { if (!pinned) scheduleHide(); });
    document.body.appendChild(tip);
    return tip;
  }

  function placeTip() {
    if (!tip || !tipFor) return;
    var r = tipFor.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    var w = Math.min(340, vw - 24);
    tip.style.width = w + "px";
    var left = Math.max(12, Math.min(r.left, vw - w - 12));
    var th = tip.offsetHeight;
    var top = r.bottom + 8;
    if (top + th > vh - 8 && r.top - th - 8 > 8) top = r.top - th - 8;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }

  function showTip(node) {
    ensureTip();
    clearTimeout(hideT);
    var g = GL[+node.getAttribute("data-g")];
    if (!g) return;
    var d = g[state.lang] || g.en, host = "";
    try { host = new URL(g.url).hostname.replace(/^www\./, ""); } catch (e) {}
    tip.textContent = "";
    tip.appendChild(el("b", { text: d[0] }));
    tip.appendChild(el("p", { text: d[1] }));
    tip.appendChild(el("a", {
      href: g.url, target: "_blank", rel: "noopener noreferrer",
      text: (state.lang === "nb" ? "Kilde: " : "Source: ") + host + " ↗"
    }));
    if (tipFor && tipFor !== node) tipFor.removeAttribute("aria-describedby");
    tipFor = node;
    node.setAttribute("aria-describedby", "gloss-tip");
    tip.hidden = false;
    placeTip();
  }

  function hideTip() {
    clearTimeout(hideT); clearTimeout(showT);
    pinned = false;
    if (tip) tip.hidden = true;
    if (tipFor) { tipFor.removeAttribute("aria-describedby"); tipFor = null; }
  }
  function scheduleHide() { clearTimeout(hideT); hideT = setTimeout(hideTip, 220); }

  document.addEventListener("mouseover", function (e) {
    var n = e.target.closest && e.target.closest(".term");
    if (!n || pinned) return;
    clearTimeout(hideT); clearTimeout(showT);
    showT = setTimeout(function () { showTip(n); }, 120);
  });
  document.addEventListener("mouseout", function (e) {
    var n = e.target.closest && e.target.closest(".term");
    if (!n || pinned) return;
    clearTimeout(showT);
    if (!(e.relatedTarget && tip && tip.contains(e.relatedTarget))) scheduleHide();
  });
  document.addEventListener("focusin", function (e) {
    var n = e.target.closest && e.target.closest(".term");
    if (n) showTip(n);
  });
  document.addEventListener("focusout", function (e) {
    var n = e.target.closest && e.target.closest(".term");
    if (n && !pinned && !(e.relatedTarget && tip && tip.contains(e.relatedTarget))) scheduleHide();
  });
  // A click or tap pins the definition open. Cancelling the click also stops a term
  // inside an answer option from ticking that option.
  document.addEventListener("click", function (e) {
    var n = e.target.closest && e.target.closest(".term");
    if (n) {
      e.preventDefault(); e.stopPropagation();
      if (pinned && tipFor === n) { hideTip(); return; }
      showTip(n); pinned = true;
      return;
    }
    if (pinned && tip && !tip.contains(e.target)) hideTip();
  }, true);
  document.addEventListener("keydown", function (e) {
    var n = e.target.closest && e.target.closest(".term");
    if (n && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      if (pinned && tipFor === n) hideTip(); else { showTip(n); pinned = true; }
      return;
    }
    if (e.key === "Escape" && tip && !tip.hidden) { var back = tipFor; hideTip(); if (back) back.focus(); }
  });
  window.addEventListener("scroll", function () { if (tip && !tip.hidden) { if (pinned) placeTip(); else hideTip(); } }, { passive: true });
  window.addEventListener("resize", function () { if (tip && !tip.hidden) placeTip(); });

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
    if (WS && !ADMIN) {
      if (ws.gone) msg += " · " + t("linkGone").split(".")[0];
      else if (ws.info && !ws.info.company.open) msg += " · " + t("syncClosed");
      else if (sync.err) msg += " · " + sync.err;
      else if (sync.inflight || sync.dirty) msg += " · " + t("syncPending");
      else if (sync.last) msg += " · " + t("syncedAt") + " " + clockTime(sync.last) + (sync.version ? " (" + t("versionWord") + " " + sync.version + ")" : "");
    }
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
    if (!ADMIN) bar.appendChild(exportButton());
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
      intro.appendChild(el("p", { class: i === 0 ? "lede" : "" }, [rich(para)]));
    });
    var side = el("aside", { class: "hero-side" });
    side.appendChild(el("ul", { class: "facts" }, [
      el("li", {}, [el("b", { class: "num", text: String(SURVEY.sections.length) }), el("span", { text: t("sections") })]),
      el("li", {}, [el("b", { class: "num", text: String(coreTotal()) + "–" + String(ALL_Q.length) }), el("span", { text: t("questions") })]),
      el("li", {}, [el("b", { class: "num", text: t("minutesRange") }), el("span", { text: t("estimate") + " (" + t("minutes") + ")" })])
    ]));
    side.appendChild(el("p", { class: "notice", text: SURVEY.notice[state.lang] }));
    side.appendChild(el("p", { class: "notice calm", text: SURVEY.privacy[state.lang] + " " + SURVEY.techNote[state.lang] + " " + t("requiredNone") }));
    if (WS) side.appendChild(el("p", { class: "notice calm", text: t("ivPrivacy") }));
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
            state.updatedAt = draft.updated_at || draft.saved_at || null;
            state.exportSeq = draft.export_seq || 0;
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

    hero.appendChild(el("div", { class: "row", style: "margin-top:14px" }, [importControl()]));

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
    if (WS) hero.appendChild(interviewsPanel());
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
        rich(L(q).q + " "),
        q.tech ? el("span", { class: "pill", text: t("tech") }) : null,
        q.std ? document.createTextNode(" ") : null,
        q.std ? stdPill(q.std) : null
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
          el("label", { class: "opt", "for": q.id + "-o" + i }, [input, el("span", {}, [rich(label)])])
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
    } else if (q.t === "scenarios") {
      node.appendChild(scenarioEditor(q));
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
    state.updatedAt = new Date().toISOString();
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(function () { persistTimer = null; saveDraft(); }, 600);
    scheduleSync();
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
    if (WS) loadWorkspace().then(function () { if (state.view === "start") render(); });
    if (state.view === "form" || state.view === "review") state.lastView = state.view;
    state.mode = "form";
    state.view = "start";
    render();
    window.scrollTo(0, 0);
  }

  function resetForm() {
    if (WS) { newInterview(); return; }
    state.answers = {};
    state.notes = {};
    state.updatedAt = null;
    state.exportSeq = 0;
    sync.last = null; sync.version = null; sync.err = "";
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
      el("p", {}, [rich(L(s).lead)])
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
      scenarioCount() ? el("li", {}, [el("b", { class: "num", text: String(scenarioCount()) }), el("span", { text: t("scCount") })]) : null,
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
        class: WS ? "btn" : "btn primary", type: "button", text: t("exportDoc"),
        onclick: function () { doExport("doc"); }
      }),
      el("button", {
        class: "btn", type: "button", text: t("exportData"),
        onclick: function () { doExport("json"); }
      }),
      el("button", {
        class: "btn", type: "button", text: t("exportTable"),
        onclick: function () { doExport("csv"); }
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
          rich(L(q).q)
        ]));

        if (q.t === "scenarios") {
          var scs = [], fromN = 0;
          rows.forEach(function (r) {
            var rec = r.answers.filter(function (x) { return x.id === q.id; })[0];
            if (!rec || !rec.scenarios || !rec.scenarios.length) return;
            fromN++;
            var who = (r.respondent && r.respondent.organisation) || t("anonymous");
            if (r.respondent && r.respondent.role) who += " · " + r.respondent.role;
            rec.scenarios.forEach(function (sc) { scs.push({ sc: sc, who: who }); });
          });
          var rank = { high: 0, medium: 1, low: 2 };
          scs.sort(function (a, b) { return (rank[a.sc.priority] === undefined ? 3 : rank[a.sc.priority]) - (rank[b.sc.priority] === undefined ? 3 : rank[b.sc.priority]); });
          if (!scs.length) block.appendChild(el("p", { class: "a-meta", text: t("noAnswers") }));
          else {
            block.appendChild(el("p", { class: "a-meta", text: scs.length + " " + t("scFrom") + " " + fromN + " " + (fromN === 1 ? t("scInterview1") : t("scInterviews")) }));
            var sv = el("div", { class: "verbatims" });
            scs.forEach(function (x) {
              var cite = x.who + (x.sc.priority ? " · " + t("scPriority").toLowerCase() + ": " + t("scPrio")[x.sc.priority] : "");
              var thumbs = null;
              if (x.sc.images && x.sc.images.length) {
                thumbs = el("div", { class: "sc-thumbs" });
                x.sc.images.forEach(function (im) {
                  var src = imgSrc(im);
                  if (!src) return;
                  var pic = el("img", { src: src, alt: im.caption || "", loading: "lazy", title: im.caption || "" });
                  thumbs.appendChild(im.data ? pic : el("a", { href: src, target: "_blank", rel: "noopener noreferrer" }, [pic]));
                });
              }
              sv.appendChild(el("blockquote", { class: "verbatim sc-v", style: "margin:0" }, [
                el("span", {}, [scenarioSentenceNode(x.sc, state.lang)]),
                thumbs,
                el("cite", { text: cite })
              ]));
            });
            block.appendChild(sv);
          }
        } else if (q.t === "scale") {
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
    hideTip();
    renderTopbar();
    app.textContent = "";
    document.documentElement.lang = state.lang === "nb" ? "nb" : "en";
    if (state.mode === "analyse") { renderAnalyse(); return; }
    if (state.mode === "opps") { renderOpportunities(); return; }
    if (state.view === "start") renderStart();
    else if (state.view === "review") renderReview();
    else renderForm();
  }

  if (WS) setupInterviews();
  var boot = loadDraft();
  if (boot && boot.lang) state.lang = boot.lang;
  if (boot && boot.answers && Object.keys(boot.answers).length) {
    state.answers = boot.answers;
    state.notes = boot.notes || {};
    if (boot.meta) state.meta = boot.meta;
    state.updatedAt = boot.updated_at || boot.saved_at || null;
    state.exportSeq = boot.export_seq || 0;
    state.path = boot.path === "full" ? "full" : "core";
    state.tracks = boot.tracks && boot.tracks.length ? boot.tracks : [];
    state.section = boot.section || 0;
    state.started = boot.started || new Date().toISOString();
    state.view = boot.view === "review" ? "review" : "form";
    if (boot.saved_at) { var d = new Date(boot.saved_at); if (!isNaN(d.getTime())) lastSaved = d; }
    restored = true;
  }
  loadAnalysis();
  if (WS && ACTIVE_IV && hasContent()) ivPatch(ACTIVE_IV, ivSummary());   // keep the device list labelled after a migration

  if (WS) {
    render();
    loadWorkspace().then(function () {
      return resumeFromHash();
    }).then(function (resumed) {
      render();
      var mine = mySubmission();
      if (hasContent() && (!mine || mine.sig !== answersSig())) scheduleSync();
      if (!resumed) refreshFromServer();
    });
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
