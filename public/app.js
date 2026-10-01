/* Bærel requirements specification — wizard, bilingual UI, local draft, export and analysis.
   Served by the server in one of two modes (see the #boot data block):
     spec            — the company's own self-reported requirements specification, opened
                       with its access code; one shared, living document per company,
                       saved to the server as you go, with versions that can be restored
     admin-analysis  — the admin's analysis view, loaded with specifications from the server
   With no boot data it works on its own: local draft, export a file, local analysis. */

(function () {
  "use strict";

  var BOOT = (function () {
    try { var n = document.getElementById("boot"); return n ? JSON.parse(n.textContent) : {}; }
    catch (e) { return {}; }
  })();
  var WS = BOOT.mode === "spec" && BOOT.company ? BOOT : null;
  var ADMIN = BOOT.mode === "admin-analysis" ? BOOT : null;
  // The admin chooses the question set (full or lean); the lean set is built from the full bank.
  var LEAN = typeof applyQuestionSet === "function" && applyQuestionSet(SURVEY, BOOT.questionSet);

  var SCHEMA = "baerel-circular-electronics-requirements";
  var SCHEMA_VERSION = 1;
  // One working copy per company, so the same browser can serve two companies.
  var DRAFT_KEY = WS ? "baerel-spec-draft-v1:" + WS.company.id : "baerel-survey-draft-v1";
  var BASE_KEY = WS ? "baerel-spec-base-v1:" + WS.company.id : null;
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
      home: "Til forsiden",
      modeOpps: "Muligheter",
      oppsTitle: "Hva kan dette bli?",
      oppsLede: "Svarene dine peker mot konkrete produkter og tjenester – dataprodukter, KI-tjenester, plattform- og driftstjenester – som blir mulige hvis valgene under er på plass. Listen oppdateres mens du fyller ut.",
      oppsEarly: "Svar på noen flere spørsmål, så blir bildet skarpere. Foreløpig viser vi alt som kan åpne seg, og hva hver enkelt mulighet hviler på.",
      oppsCaveat: "Dette er en pekepinn generert av svarene dine, ikke en anbefaling. Bruk den til å se hvilke valg som faktisk låser opp verdi – og ta gjerne opp de nære mulighetene i oppfølgingssamtalen.",
      st_ready: "Klar", st_near: "Nær", st_far: "Ikke ennå",
      restsOn: "Hviler på svarene dine:", stillNeeds: "Forutsetninger:",
      oppsTop: "Dette åpner svarene dine for:", oppsSeeAll: "Se alle mulighetene",
      oppsAgg: "Muligheter på tvers av respondentene", oppsAggLede: "Antall virksomheter der alle forutsetningene for hver mulighet er på plass."
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
      home: "Back to the start page",
      modeOpps: "Opportunities",
      oppsTitle: "What could this become?",
      oppsLede: "Your answers point at concrete products and services — data products, AI services, platform and operations services — that become possible once the choices below are in place. The list updates as you fill in the survey.",
      oppsEarly: "Answer a few more questions and the picture sharpens. For now we show everything that could open up, and what each one rests on.",
      oppsCaveat: "This is an indication generated from your answers, not a recommendation. Use it to see which choices actually unlock value — and bring the near ones to the follow-up conversation.",
      st_ready: "Ready", st_near: "Close", st_far: "Not yet",
      restsOn: "Rests on your answers:", stillNeeds: "Preconditions:",
      oppsTop: "What your answers open up:", oppsSeeAll: "See all the opportunities",
      oppsAgg: "Opportunities across respondents", oppsAggLede: "Number of organisations where every precondition for an opportunity is already in place.",
    }
  };


  /* Specification wording. The form is filled in by the organisation itself — a
     self-reported requirements specification — so the copy speaks to whoever is
     filling it in, on behalf of the organisation. */
  var SPEC_T = {
    nb: {
      modeForm: "Kravspesifikasjon",
      autosaveOn: "Svar og kommentarer lagres automatisk i denne nettleseren underveis",
      restoredHere: "Vi fortsatte der du slapp – kravspesifikasjonen var lagret i denne nettleseren.",
      newRespondent: "Tøm skjemaet og start på nytt", confirmReset: "Bekreft – tøm svar og kommentarer",
      requiredNone: "Ingen spørsmål er obligatoriske – hopp over det som ikke er relevant for virksomheten.",
      reviewTitle: "Oppsummering av kravspesifikasjonen",
      reviewLede: "Gå gjennom hva kravspesifikasjonen dekker, og eksporter svar og kommentarer som fil.",
      analyseTitle: "Analyse av kravspesifikasjonene",
      analyseLede: "Legg inn kravspesifikasjonsfilene. Alt regnes ut lokalt i nettleseren – ingenting lastes opp.",
      responses: "kravspesifikasjoner", respondents: "Kravspesifikasjoner", noData: "Ingen kravspesifikasjoner lagt inn ennå.",
      notePh: "Kommentar …", noteFor: "Kommentar til", qNote: "Kommentar til spørsmålet",
      qNotePh: "Utdyping, forbehold, eksempler, behov for oppfølging …", notesCount: "kommentarer",
      notSelected: "ikke valgt", notesHead: "Kommentarer",
      exportBtn: "Eksporter", exportDoc: "Lesbart dokument (HTML)", exportData: "Data (JSON) – kan åpnes igjen", exportTable: "Tabell (CSV)",
      exportedAt: "Eksportert", saveVersion: "Lagre versjon nå", versionWord: "versjon",
      syncedAt: "lagret i prosjektet", syncPending: "lagres …", syncFail: "kunne ikke lagre til prosjektet – beholdt lokalt, prøver igjen ved neste endring",
      syncClosed: "kravspesifikasjonen er stengt for endringer",
      importBtn: "Åpne eksportert kravspesifikasjon (JSON)", importOk: "Kravspesifikasjonen er lastet inn.", importBad: "Filen er ikke en kravspesifikasjon fra dette skjemaet.",
      importReplace: "Bekreft – erstatt innholdet som er åpent nå",
      liveTitle: "Levende dokument", lastChanged: "Sist endret",
      docAnswer: "Svar", docNotes: "Kommentarer", docNotSelected: "ikke valgt", docOther: "Annet", docOf: "av", docGenerated: "Generert av Bærel kravspesifikasjon",
      scImages: "Bilder (valgfritt)", scAddImg: "+ Legg til bilde", scImgCaption: "Bildetekst (valgfritt)",
      scUploading: "Laster opp …", scImgFail: "Bildet kunne ikke lastes opp – prøv igjen.", scImgMax: "Maks 6 bilder per scenario.",
      scImgWord: "bilder",
      scTitle: "Scenario", scAdd: "+ Legg til scenario", scDup: "Dupliser", scRemove: "Fjern", scRemoveConfirm: "Bekreft – fjern",
      scPriority: "Prioritet", scPrioNone: "–", scPrio: { high: "Høy", medium: "Middels", low: "Lav" },
      scCount: "scenarier", scPreview: "Slik leses scenarioet",
      scHint: "Ett scenario per konkret situasjon. Fyll inn det dere vet – resten kan stå åpent.",
      scFrom: "scenarier fra", scInterviews: "virksomheter", scInterview1: "virksomhet",
      scLab: { situation: "Når", actor: "trenger", goal: "å", data: "ved hjelp av", source: "som kommer fra", outcome: "slik at" },
      scPh: { situation: "situasjon eller utløser – f.eks. en returnert enhet kommer inn til reparasjon",
              actor: "hvem – f.eks. reparatøren",
              goal: "mål eller beslutning – f.eks. avgjøre om kretskortet kan gjenbrukes",
              data: "hvilke data – f.eks. feillogg, reparasjonshistorikk og komponentdata",
              source: "hvor dataene kommer fra – f.eks. produktpasset og produsentens servicesystem",
              outcome: "utfall – f.eks. enheten repareres i stedet for å kasseres" },
      scActors: ["designeren", "innkjøperen", "produksjonslederen", "kvalitetsingeniøren", "serviceteknikeren", "reparatøren", "ombruksaktøren", "gjenvinneren", "kunden", "sluttbrukeren", "myndigheten", "revisoren", "en KI-agent"],
      scSources: ["ERP-systemet", "PLM-systemet", "MES", "leverandøren", "produktpasset", "sensorer i produksjonen", "testutstyret", "servicesystemet", "kunden", "offentlige registre"],
      minutesRange: "90–150",
      startTitle: "Kravspesifikasjonen", startBtn: "Start kravspesifikasjonen",
      startBody: "Alle temaene: virksomheten, bruksscenarioer og eksempeldata, sikkerhet og styring, livsløpsdata, bærekraft, datamodell, produktpass, teknologi og kostnad, KI og agenter, modeller, robotisering og fremtidsbilder. Ingen spørsmål er obligatoriske, og arbeidet kan gjerne fordeles mellom flere fagpersoner.",
      start: "Start", notSurvey: "Filen er ikke fra dette skjemaet",
      oppsLede: "Svarene peker mot konkrete produkter og tjenester – dataprodukter, KI-tjenester, plattform- og driftstjenester – som blir mulige hvis valgene under er på plass. Listen oppdateres etter hvert som kravspesifikasjonen fylles ut."
    },
    en: {
      modeForm: "Specification",
      autosaveOn: "Answers and comments are saved automatically in this browser as you go",
      restoredHere: "Picked up where you left off — the specification was saved in this browser.",
      newRespondent: "Clear the form and start again", confirmReset: "Confirm — clear answers and comments",
      requiredNone: "No question is mandatory — skip anything that is not relevant to your organisation.",
      reviewTitle: "Specification summary",
      reviewLede: "Check what the specification covers, then export the answers and comments as a file.",
      analyseTitle: "Analysis of the specifications",
      analyseLede: "Load the specification files. Everything is computed locally in your browser — nothing is uploaded.",
      responses: "specifications", respondents: "Specifications", noData: "No specification files loaded yet.",
      notePh: "Comment …", noteFor: "Comment on", qNote: "Comment on the question",
      qNotePh: "Detail, caveats, examples, follow-up needed …", notesCount: "comments",
      notSelected: "not selected", notesHead: "Comments",
      exportBtn: "Export", exportDoc: "Readable document (HTML)", exportData: "Data (JSON) — can be reopened", exportTable: "Table (CSV)",
      exportedAt: "Exported", saveVersion: "Save a version now", versionWord: "version",
      syncedAt: "saved to the project", syncPending: "saving …", syncFail: "could not save to the project — kept locally, will retry on the next change",
      syncClosed: "the specification is closed for changes",
      importBtn: "Open an exported specification (JSON)", importOk: "The specification is loaded.", importBad: "That file is not a specification from this form.",
      importReplace: "Confirm — replace what is open now",
      liveTitle: "Living document", lastChanged: "Last changed",
      docAnswer: "Answer", docNotes: "Comments", docNotSelected: "not selected", docOther: "Other", docOf: "of", docGenerated: "Generated by the Bærel requirements specification",
      scImages: "Images (optional)", scAddImg: "+ Add image", scImgCaption: "Caption (optional)",
      scUploading: "Uploading …", scImgFail: "The image could not be uploaded — try again.", scImgMax: "At most 6 images per scenario.",
      scImgWord: "images",
      scTitle: "Scenario", scAdd: "+ Add scenario", scDup: "Duplicate", scRemove: "Remove", scRemoveConfirm: "Confirm — remove",
      scPriority: "Priority", scPrioNone: "–", scPrio: { high: "High", medium: "Medium", low: "Low" },
      scCount: "scenarios", scPreview: "How the scenario reads",
      scHint: "One scenario per concrete situation. Fill in what you know — the rest can stay open.",
      scFrom: "scenarios from", scInterviews: "organisations", scInterview1: "organisation",
      scLab: { situation: "When", actor: "who", goal: "needs to", data: "using", source: "which comes from", outcome: "so that" },
      scPh: { situation: "situation or trigger — e.g. a returned unit arrives for repair",
              actor: "actor — e.g. the repair technician",
              goal: "goal or decision — e.g. decide whether the circuit board can be reused",
              data: "which data — e.g. fault log, repair history and component data",
              source: "where the data comes from — e.g. the product passport and the manufacturer’s service system",
              outcome: "outcome — e.g. the unit is repaired instead of scrapped" },
      scActors: ["the designer", "the buyer", "the production manager", "the quality engineer", "the service technician", "the repair technician", "the refurbisher", "the recycler", "the customer", "the end user", "the authority", "the auditor", "an AI agent"],
      scSources: ["the ERP system", "the PLM system", "MES", "the supplier", "the product passport", "sensors in production", "test equipment", "the service system", "the customer", "public registers"],
      minutesRange: "90–150",
      startTitle: "The specification", startBtn: "Start the specification",
      startBody: "Every subject: the organisation, usage scenarios and sample data, security and governance, lifecycle data, sustainability, data model, product passports, technology and cost, AI and agents, models, robotics and future worlds. No question is mandatory, and the work can well be split between several specialists.",
      start: "Start", notSurvey: "That file is not from this form",
      oppsLede: "The answers point at concrete products and services — data products, AI services, platform and operations services — that become possible once the choices below are in place. The list updates as the specification is filled in."
    }
  };
  ["nb", "en"].forEach(function (l) { Object.keys(SPEC_T[l]).forEach(function (k) { T[l][k] = SPEC_T[l][k]; }); });

  /* Platform features and sample data. */
  var FEAT_T = {
    nb: {
      modeFeatures: "Plattformfunksjoner",
      featTitle: "Hvilke funksjoner trenger plattformen?",
      featLede: "Svarene i kravspesifikasjonen avgjør hvilke funksjoner dataplattformen må ha. Hver funksjon får en prioritet – må, bør eller kan ha – ut fra svarene som taler for og imot den, og du ser nøyaktig hvilke svar det er. Listen oppdateres mens dere fyller ut, og følger med i eksporten.",
      featEarly: "Svar på flere spørsmål, så blir prioriteringene skarpere. Under hvert spørsmål står det hvilke funksjoner svaret former.",
      featBecause: "Begrunnet i svarene:", featAgainst: "Taler imot:", featOpen: "Andre svar som ville styrket behovet ({n})",
      featConfig: "Utformet av svarene:", featProfile: "Plattformprofil",
      featProfileLede: "Rammene plattformen må dimensjoneres for, slik dere har svart.",
      featNotAnswered: "ikke besvart", featFeeds: "Former:", featGo: "til spørsmålet",
      featTop: "Plattformfunksjoner svarene gjør nødvendige:", featSeeAll: "Se alle plattformfunksjonene",
      featAgg: "Plattformfunksjoner på tvers av virksomhetene", featAggLede: "Antall virksomheter der funksjonen er «må ha»; «bør ha» i parentes.",
      featShowNone: "Funksjoner uten indikasjon ennå ({n})",
      featOr: " eller ", featRated: "vurdert {v} av 5", featRatedMin: "vurdert {v} eller høyere", featChosen: "{n} valgt", featChooseMin: "minst {n} valgt",
      smTitle: "Eksempeldata", smStatus: "Status", smAvailable: "Finnes i dag", smDesired: "Ønsket",
      smName: "Navn", smNamePh: "f.eks. Reparasjonslogg fra servicesystemet",
      smDesc: "Beskrivelse", smDescPh: "Hva viser dataene, hva brukes de til, hva mangler i dem?",
      smSource: "Kilde", smSourcePh: "Kildesystem, eller hvem som har dataene",
      smFormat: "Format", smVolume: "Omfang", smVolumePh: "f.eks. 2 000 rader per uke, 50 MB i måneden",
      smSens: "Hva slags data", smSensOpts: ["Syntetiske eller fiktive", "Anonymiserte eller maskerte", "Ekte, men ikke sensitive", "Sensitive – beskriv bare, ikke last opp"],
      smScenario: "Støtter scenario", smFiles: "Filer", smAddFile: "+ Legg til filer", smAddTemplate: "+ Legg til skisse eller mal",
      smUploading: "Laster opp …", smUploadFail: "Kunne ikke laste opp", smTooBig: "filen er for stor (maks 25 MB)",
      smBadType: "filtypen tas ikke imot", smAdd: "+ Legg til eksempeldata",
      smHint: "Legg til eksempeldata og metadata hver for seg – ett kort per datasett eller metadatabeskrivelse. Metadata kan være skjema, dataordbok eller katalogpost, og kan deles selv om dataene ikke kan det. Små utdrag holder. Maks 25 MB per fil.",
      smNoUpload: "Filopplasting er tilgjengelig når kravspesifikasjonen åpnes med tilgangskoden. Her kan dere beskrive eksemplene.",
      smSensBlocked: "Sensitive data skal ikke lastes opp. Beskriv datasettet i stedet – eller lag en syntetisk variant.",
      smCount: "eksempeldata", smWhich: "Formater i eksemplene",
      smMeta: "Metadata", smMetaStd: "Metadatastandard", smMetaDesc: "Hvilke metadata finnes",
      smMetaDescPh: "f.eks. enheter, tidsstempler, kilde og opphav, eier, lisens, kvalitet, kobling til produkt-ID",
      smMetaFiles: "Metadatafiler", smAddMeta: "+ Legg til metadata", smAddMetaFile: "+ Legg til metadatafiler",
      smMetaTitle: "Metadata", smMetaNamePh: "f.eks. Dataordbok for reparasjonslogg",
      smDescribes: "Beskriver", smDescribesPh: "Hvilket datasett eller system metadataene gjelder (valgfritt)",
      smEmpty: "Ingen eksempler ennå. Legg til eksempeldata, metadata – eller begge, hver for seg.",
      smMetaCount: "metadataeksempler",
      smMetaOpts: ["DCAT-AP-NO / DCAT-AP (Felles datakatalog)", "Dublin Core", "JSON Schema", "XML Schema (XSD)", "SHACL eller OWL-ontologi", "AAS-delmodellmaler (IDTA)", "ECLASS / IEC 61360-egenskaper", "CSV on the Web (CSVW)", "Dataordbok eller kodebok i regneark", "Egen intern modell", "Ingen metadata i dag"],
      smMetaWhich: "Metadatastandarder i eksemplene"
    },
    en: {
      modeFeatures: "Platform features",
      featTitle: "Which features does the platform need?",
      featLede: "The answers in the specification decide which features the data platform must have. Each feature gets a priority — must, should or could have — from the answers that argue for and against it, and you see exactly which answers they are. The list updates as you fill in, and goes with the export.",
      featEarly: "Answer more questions and the priorities sharpen. Under every question it says which features the answer shapes.",
      featBecause: "Based on the answers:", featAgainst: "Argues against:", featOpen: "Other answers that would strengthen the need ({n})",
      featConfig: "Shaped by the answers:", featProfile: "Platform profile",
      featProfileLede: "The limits the platform must be dimensioned for, as you answered.",
      featNotAnswered: "not answered", featFeeds: "Shapes:", featGo: "to the question",
      featTop: "Platform features the answers make necessary:", featSeeAll: "See all platform features",
      featAgg: "Platform features across organisations", featAggLede: "Number of organisations where the feature is “must have”; “should have” in brackets.",
      featShowNone: "Features not indicated yet ({n})",
      featOr: " or ", featRated: "rated {v} of 5", featRatedMin: "rated {v} or higher", featChosen: "{n} selected", featChooseMin: "at least {n} selected",
      smTitle: "Sample data", smStatus: "Status", smAvailable: "Available today", smDesired: "Desired",
      smName: "Name", smNamePh: "e.g. Repair log from the service system",
      smDesc: "Description", smDescPh: "What does the data show, what is it used for, what is missing from it?",
      smSource: "Source", smSourcePh: "Source system, or who holds the data",
      smFormat: "Format", smVolume: "Volume", smVolumePh: "e.g. 2,000 rows a week, 50 MB a month",
      smSens: "Kind of data", smSensOpts: ["Synthetic or fictional", "Anonymised or masked", "Real, but not sensitive", "Sensitive — describe only, do not upload"],
      smScenario: "Supports scenario", smFiles: "Files", smAddFile: "+ Add files", smAddTemplate: "+ Add sketch or template",
      smUploading: "Uploading …", smUploadFail: "Could not upload", smTooBig: "the file is too large (max 25 MB)",
      smBadType: "this file type is not accepted", smAdd: "+ Add sample data",
      smHint: "Add sample data and metadata separately — one card per dataset or metadata description. Metadata can be a schema, data dictionary or catalogue record, and can be shared even when the data cannot. Small extracts are enough. Max 25 MB per file.",
      smNoUpload: "File upload is available when the specification is opened with the access code. Here you can describe the samples.",
      smSensBlocked: "Sensitive data must not be uploaded. Describe the dataset instead — or make a synthetic version.",
      smCount: "data samples", smWhich: "Formats in the samples",
      smMeta: "Metadata", smMetaStd: "Metadata standard", smMetaDesc: "Which metadata exists",
      smMetaDescPh: "e.g. units, timestamps, source and provenance, owner, licence, quality, link to product ID",
      smMetaFiles: "Metadata files", smAddMeta: "+ Add metadata", smAddMetaFile: "+ Add metadata files",
      smMetaTitle: "Metadata", smMetaNamePh: "e.g. Data dictionary for the repair log",
      smDescribes: "Describes", smDescribesPh: "Which dataset or system the metadata is about (optional)",
      smEmpty: "No samples yet. Add sample data, metadata — or both, each on its own.",
      smMetaCount: "metadata examples",
      smMetaOpts: ["DCAT-AP-NO / DCAT-AP (Norwegian national data catalogue)", "Dublin Core", "JSON Schema", "XML Schema (XSD)", "SHACL or OWL ontology", "AAS submodel templates (IDTA)", "ECLASS / IEC 61360 properties", "CSV on the Web (CSVW)", "Data dictionary or codebook in a spreadsheet", "Own internal model", "No metadata today"],
      smMetaWhich: "Metadata standards in the samples"
    }
  };
  ["nb", "en"].forEach(function (l) { Object.keys(FEAT_T[l]).forEach(function (k) { T[l][k] = FEAT_T[l][k]; }); });


  /* Wording when the specification is opened with the company's access code: it is
     one shared, living document stored with the project. */
  var WS_T = {
    nb: {
      wsLabel: "Kravspesifikasjon for", wsOpen: "Åpen for endringer", wsClosed: "Stengt for endringer",
      finish: "Til oppsummering", review: "Til oppsummering",
      reviewLede: "Gå gjennom hva kravspesifikasjonen dekker. Alt lagres fortløpende i prosjektet; her kan du også lagre en navngitt versjon, eksportere eller hente fram en eldre versjon.",
      submitTitle: "Levende dokument for {org}",
      submitBody: "Kravspesifikasjonen lagres i prosjektet noen sekunder etter hver endring. Alle med tilgangskoden jobber i det samme dokumentet – endrer to personer ulike spørsmål samtidig, beholdes begges endringer. Ved hver eksport, når du lagrer en versjon, og minst hvert kvarter tas en tidsstemplet versjon.",
      closedBody: "Prosjektet har stengt kravspesifikasjonen for endringer. Du kan fortsatt lese den og eksportere den.",
      signedOut: "Tilgangen er avsluttet – koden kan være byttet ut. Endringene dine er beholdt i denne nettleseren og lagres når du skriver inn gyldig kode igjen.",
      signedOutShort: "ikke pålogget – endringer beholdes lokalt",
      reenter: "Skriv inn tilgangskoden", signOut: "Logg ut",
      signOutHint: "Logger ut og fjerner den lokale kopien fra denne nettleseren. Alt er lagret i prosjektet.",
      backupLabel: "Sikkerhetskopi:",
      verTitle: "Versjoner", verLede: "Tidsstemplede versjoner av kravspesifikasjonen. Å gjenopprette en eldre versjon lagrer først dagens innhold som en egen versjon, så ingenting går tapt.",
      verLoading: "Henter versjoner …", verNone: "Ingen versjoner ennå – den første lagres når noe er fylt ut.",
      verRestore: "Gjenopprett", verRestoreConfirm: "Bekreft – gjenopprett", verDownload: "Last ned", verLatest: "gjeldende",
      verShowAll: "Vis alle {n} versjoner", verShowFewer: "Vis færre",
      verRestored: "Versjon {n} er gjenopprettet. Innholdet før gjenopprettingen er lagret som en egen versjon.",
      verFail: "Kunne ikke gjenopprette – prøv igjen.",
      reason: { first: "første lagring", auto: "automatisk", manual: "lagret manuelt", "export": "eksport", migrated: "overført", "before-restore": "før gjenoppretting", restored: "gjenopprettet fra v{n}" },
      mergedRemote: "Andre har lagret endringer i mellomtiden – de er flettet inn sammen med dine.",
      loadedRemote: "Hentet siste lagrede versjon fra prosjektet.",
      specPrivacy: "Kravspesifikasjonen lagres hos Bærel-prosjektet og er bare tilgjengelig for dem som har virksomhetens tilgangskode – og for prosjektet. Ikke oppgi personnavn.",
      newRespondent: null
    },
    en: {
      wsLabel: "Requirements specification for", wsOpen: "Open for changes", wsClosed: "Closed for changes",
      finish: "Go to summary", review: "Go to summary",
      reviewLede: "Check what the specification covers. Everything is saved to the project as you go; here you can also save a named version, export, or bring back an earlier version.",
      submitTitle: "Living document for {org}",
      submitBody: "The specification is saved to the project a few seconds after every change. Everyone with the access code works in the same document — if two people change different questions at the same time, both keep their changes. A timestamped version is taken on every export, whenever you save a version, and at least every fifteen minutes.",
      closedBody: "The project has closed the specification for changes. You can still read and export it.",
      signedOut: "Access has ended — the code may have been replaced. Your changes are kept in this browser and will be saved once you enter a valid code again.",
      signedOutShort: "signed out — changes kept locally",
      reenter: "Enter the access code", signOut: "Sign out",
      signOutHint: "Signs out and removes the local copy from this browser. Everything is saved with the project.",
      backupLabel: "Backup:",
      verTitle: "Versions", verLede: "Timestamped versions of the specification. Restoring an earlier version first saves the current content as a version of its own, so nothing is lost.",
      verLoading: "Loading versions …", verNone: "No versions yet — the first is saved once something is filled in.",
      verRestore: "Restore", verRestoreConfirm: "Confirm — restore", verDownload: "Download", verLatest: "current",
      verShowAll: "Show all {n} versions", verShowFewer: "Show fewer",
      verRestored: "Version {n} is restored. The content from before the restore is saved as a version of its own.",
      verFail: "Could not restore — try again.",
      reason: { first: "first save", auto: "automatic", manual: "saved manually", "export": "export", migrated: "carried over", "before-restore": "before restore", restored: "restored from v{n}" },
      mergedRemote: "Others saved changes in the meantime — they are merged in together with yours.",
      loadedRemote: "Loaded the latest saved version from the project.",
      specPrivacy: "The specification is stored with the Bærel project and is available only to holders of your organisation's access code — and to the project. Do not enter personal names.",
      newRespondent: null
    }
  };
  if (WS) ["nb", "en"].forEach(function (l) { Object.keys(WS_T[l]).forEach(function (k) { T[l][k] = WS_T[l][k]; }); });

  T.nb.adminLede = "Kravspesifikasjonene fra virksomhetene, hentet fra serveren. Du kan fortsatt legge til filer som har kommet på e-post.";
  T.en.adminLede = "The organisations' specifications, fetched from the server. You can still add files that arrived by email.";
  T.nb.adminBack = "Tilbake til virksomhetene"; T.en.adminBack = "Back to organisations";

  /* ---------------------------------------------------------------- state */

  var ALL_Q = [];
  var Q_BY_ID = {};
  SURVEY.sections.forEach(function (s) {
    s.questions.forEach(function (q) { q._section = s.id; ALL_Q.push(q); Q_BY_ID[q.id] = q; });
  });
  if (typeof setActiveQuestions === "function") setActiveQuestions(ALL_Q.map(function (q) { return q.id; }));
  if (LEAN) ["nb", "en"].forEach(function (l) { T[l].minutesRange = LEAN_SET.minutes[l]; });

  /* Normalised access to an answer, for the opportunity rules. */
  function localGet(qid) {
    var q = Q_BY_ID[qid], a = state.answers[qid];
    if (!q) return { sel: [], val: null };
    if (q.t === "scale") return { sel: [], val: typeof a === "number" ? a : null };
    if (q.t === "multi") return { sel: (a && a.i) ? a.i : [], val: null };
    if (q.t === "single") return { sel: (a && typeof a.i === "number") ? [a.i] : [], val: null };
    if (q.t === "samples") return { sel: sampleFormats(a), val: null };
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
    path: "full",      // kept for file compatibility: there is only the full specification
    tracks: [],
    lastView: "form",
    section: 0,
    answers: {},
    notes: {},         // comments: notes[qid][optionIndex] and notes[qid].q (whole question)
    started: null,
    updatedAt: null,   // last change to answers, notes or details
    exportSeq: 0       // how many times this specification has been exported
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

  var leaving = false;   // set on sign-out, so unload handlers don't write the copy back
  function saveDraft() {
    if (leaving) return true;
    try {
      store.set(DRAFT_KEY, JSON.stringify({
        lang: state.lang, section: state.section, view: state.view,
        path: state.path, tracks: state.tracks,
        answers: state.answers, notes: state.notes,
        started: state.started, updated_at: state.updatedAt, export_seq: state.exportSeq,
        saved_at: new Date().toISOString()
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

  /* One full specification: every section shows all its questions. */
  function visibleQs(sec) { return sec.questions; }

  function isAnswered(q) {
    var a = state.answers[q.id];
    if (a === undefined || a === null) return false;
    if (q.t === "text" || q.t === "longtext") return String(a).trim().length > 0;
    if (q.t === "scale") return typeof a === "number";
    if (q.t === "single") return a && (typeof a.i === "number");
    if (q.t === "multi") return a && a.i && a.i.length > 0;
    if (q.t === "scenarios") return Array.isArray(a) && a.some(scenarioFilled);
    if (q.t === "samples") return Array.isArray(a) && a.some(sampleFilled);
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
    } else if (q.t === "samples") {
      rec.samples = sampleRecords(q, a);
      rec.selected = sampleFormats(a);
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
      format: "specification",
      answered_count: p.done,
      asked_count: p.total,
      started_at: state.started,
      updated_at: state.updatedAt,
      exported_at: new Date().toISOString(),
      completion: Math.round((p.done / p.total) * 100),
      respondent: {
        role: state.answers.q1 ? String(state.answers.q1) : "",
        organisation: WS ? WS.company.name : ""
      },
      // The exact working state, so a saved or restored version reopens precisely.
      draft: { answers: state.answers, notes: state.notes, path: state.path, tracks: state.tracks.slice() },
      answers: ALL_Q.map(answerRecord),
      platform_features: featureSummary(localGet),
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
    if (rec.type === "samples") {
      return sampleRecs(rec.samples).map(function (sm, i) {
        var meta = sm.kind === "metadata";
        var st = (meta ? "metadata, " : "") + (sm.status === "desired" ? (lang === "nb" ? "ønsket" : "desired") : (lang === "nb" ? "finnes" : "available"));
        var bits = (meta
          ? [sm.title, lang === "nb" ? sm.standard_nb : sm.standard_en, sm.describes ? "→ " + sm.describes : "", sm.source]
          : [sm.title, lang === "nb" ? sm.format_nb : sm.format_en, sm.source, sm.volume]).filter(Boolean).join(", ");
        return (i + 1) + " [" + st + "] " + bits + (sm.description ? ": " + sm.description : "") + (sm.files && sm.files.length ? " [" + sm.files.map(function (f) { return f.name; }).join("; ") + "]" : "");
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

  /* ---------------------------------------------------------------- the company's specification

     One living specification per company, opened with the company's access code.
     This browser keeps a working copy (the draft) plus the "base": the last state it
     saw on the server. Every save sends the base's timestamp; if someone else saved
     in between, the server answers 409 with its current state and the two are merged
     question by question — what changed here wins, everything else is taken from the
     server — so two people working on different questions both keep their work. */

  var ws = {
    info: WS ? { company: WS.company } : null,
    gone: false,       // signed out: the code was replaced or revoked, or the session expired
    msg: ""
  };

  if (WS) {
    SURVEY.privacy = {
      nb: "Svar og kommentarer lagres fortløpende hos prosjektet, og en arbeidskopi holdes i denne nettleseren.",
      en: "Answers and comments are saved to the project as you go, and a working copy is kept in this browser."
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

  function specFetch(method, path, body) {
    return fetch("/api/s/" + path, {
      method: method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin", cache: "no-store"
    }).then(function (r) {
      return r.json()["catch"](function () { return {}; }).then(function (d) {
        if (r.status === 401) signedOut();
        if (!r.ok) { var e = new Error(d.message || ("HTTP " + r.status)); e.status = r.status; e.code = d.error; e.data = d; throw e; }
        return d;
      });
    });
  }

  function signedOut() {
    if (ws.gone) return;
    ws.gone = true;
    render();
  }

  /* -------- base: the last server state this browser has seen */

  function loadBase() {
    try { var b = JSON.parse(store.get(BASE_KEY) || "null"); return b && b.answers ? b : null; } catch (e) { return null; }
  }
  function saveBase(b) {
    base = b;
    try { store.set(BASE_KEY, JSON.stringify(b)); } catch (e) {}
  }
  var base = null;

  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

  /* Stable comparison, independent of key order. */
  function canon(x) {
    if (x === undefined || x === null) return "";
    if (Array.isArray(x)) return "[" + x.map(canon).join(",") + "]";
    if (typeof x === "object") {
      return "{" + Object.keys(x).sort().filter(function (k) { return x[k] !== undefined && x[k] !== ""; })
        .map(function (k) { return JSON.stringify(k) + ":" + canon(x[k]); }).join(",") + "}";
    }
    return JSON.stringify(x);
  }
  function same(a, b) { return canon(a) === canon(b); }

  /* Server state -> { answers, notes, path, tracks }. */
  function serverDraft(resp) {
    if (!resp) return { answers: {}, notes: {}, path: "core", tracks: [] };
    var d = draftFromExport(resp);
    return { answers: d.answers || {}, notes: d.notes || {}, path: d.path === "full" ? "full" : "core", tracks: d.tracks || [] };
  }

  /* Three-way merge of one map (answers or notes), key by key. */
  function merge3(b, mine, theirs) {
    var out = {}, keys = {};
    [b, mine, theirs].forEach(function (m) { Object.keys(m || {}).forEach(function (k) { keys[k] = 1; }); });
    Object.keys(keys).forEach(function (k) {
      var v = same((mine || {})[k], (b || {})[k]) ? (theirs || {})[k] : (mine || {})[k];
      if (v !== undefined) out[k] = clone(v);
    });
    return out;
  }

  function localChanged() {
    var b = base || { answers: {}, notes: {} };
    return !same(state.answers, b.answers) || !same(state.notes, b.notes);
  }

  /* Bring server state into the page. Local edits not yet saved are merged on top. */
  function absorbServer(d) {
    var s = serverDraft(d.response);
    var b = base || { answers: {}, notes: {} };
    var hadLocal = localChanged();
    if (hadLocal) {
      state.answers = merge3(b.answers, state.answers, s.answers);
      state.notes = merge3(b.notes, state.notes, s.notes);
    } else {
      state.answers = clone(s.answers);
      state.notes = clone(s.notes);
    }
    saveBase({ updated_at: d.updated_at || null, answers: clone(s.answers), notes: clone(s.notes) });
    state.updatedAt = d.updated_at || state.updatedAt;
    if (!state.started && d.response) state.started = d.response.started_at || new Date().toISOString();
    if (d.version) { sync.version = d.version; sync.last = new Date(d.updated_at); }
    return hadLocal && localChanged();   // true if there is still something of ours to save
  }

  /* Fetch the server's state; used at start-up and when returning to the start page. */
  function pullServer() {
    if (!WS || ws.gone) return Promise.resolve();
    return specFetch("GET", "spec").then(function (d) {
      ws.info.company = d.company || ws.info.company;
      if (sync.inflight) return;                       // a save in flight will reconcile itself
      var remoteMoved = (d.updated_at || null) !== (base ? base.updated_at : null);
      if (remoteMoved && d.response) {
        var view = state.view, section = state.section;
        var ours = absorbServer(d);
        state.view = view; state.section = section;
        saveDraft(); render();
        setStatus(ours ? t("mergedRemote") : t("loadedRemote"));
        if (ours) scheduleSync();
      } else if (localChanged() && hasContent()) {
        scheduleSync();
      } else if (d.version) {
        sync.version = d.version; sync.last = new Date(d.updated_at); setSaveState();
      }
    })["catch"](function () {});
  }

  /* -------- saving */

  var sync = { timer: null, inflight: null, dirty: false, again: false, last: null, version: null, err: "", pendingReason: null };

  function hasContent() {
    return ALL_Q.some(isAnswered) || noteCount() > 0;
  }

  function canWrite() { return WS && !ADMIN && !ws.gone && ws.info.company.open; }

  function scheduleSync() {
    if (!canWrite()) return;
    sync.dirty = true;
    clearTimeout(sync.timer);
    sync.timer = setTimeout(function () { doSync(); }, 5000);
    setSaveState();
  }

  function doSync(reason) {
    if (!canWrite()) return Promise.resolve(null);
    if (!reason && !localChanged()) { sync.dirty = false; setSaveState(); return Promise.resolve(null); }
    if (sync.inflight) { sync.again = true; if (reason) sync.pendingReason = reason; return sync.inflight; }
    clearTimeout(sync.timer);
    sync.dirty = false;
    sync.inflight = attemptSave(reason, 0).then(function (d) {
      var again = sync.again, pr = sync.pendingReason;
      sync.inflight = null; sync.again = false; sync.pendingReason = null;
      setSaveState();
      if (pr) doSync(pr); else if (again || sync.dirty) scheduleSync();
      return d;
    });
    setSaveState();
    return sync.inflight;
  }

  function attemptSave(reason, attempt) {
    var sentAnswers = clone(state.answers), sentNotes = clone(state.notes);
    var body = { response: buildResponse(), base_updated_at: base ? base.updated_at : null };
    if (reason) body.snapshot = reason;
    return specFetch("PUT", "spec", body).then(function (d) {
      saveBase({ updated_at: d.updated_at, answers: sentAnswers, notes: sentNotes });
      state.updatedAt = d.updated_at;
      sync.last = new Date(); sync.version = d.version; sync.err = "";
      saveDraft();
      if (d.snapshot) refreshVersions();
      return d;
    }, function (e) {
      if (e.status === 409 && e.data && attempt < 3) {
        // Someone saved in between: merge their state with ours, then save again.
        var view = state.view, section = state.section;
        absorbServer(e.data);
        state.view = view; state.section = section;
        saveDraft();
        if (!isTyping()) render();
        setStatus(t("mergedRemote"));
        return attemptSave(reason, attempt + 1);
      }
      if (e.status === 423) ws.info.company.open = false;
      else if (e.status !== 401) sync.err = t("syncFail");
      return null;
    });
  }

  /* A re-render while someone types would steal the caret; merged values show on the next render. */
  function isTyping() {
    var a = document.activeElement;
    return !!a && (a.tagName === "TEXTAREA" || (a.tagName === "INPUT" && /^(text|email|search|url|tel)?$/.test(a.type || "")));
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden" && sync.dirty) doSync();
  });

  /* -------- versions */

  var versions = { list: null, open: false, err: "", busy: false };
  var versionsBoxes = [];

  function reasonText(r) {
    var R = t("reason") || {};
    var m = /^restored-v(\d+)$/.exec(r || "");
    if (m) return (R.restored || "restored from v{n}").replace("{n}", m[1]);
    return R[r] || r;
  }

  function refreshVersions() {
    if (!WS || ws.gone) return Promise.resolve();
    return specFetch("GET", "versions").then(function (d) {
      versions.list = d.versions || [];
      drawVersions();
    })["catch"](function () {});
  }

  function restoreVersion(n) {
    versions.busy = true; versions.err = ""; drawVersions();
    var go = function () {
      return specFetch("POST", "versions/" + n + "/restore", {}).then(function (d) {
        var s = serverDraft(d.response);
        state.answers = clone(s.answers); state.notes = clone(s.notes);
        saveBase({ updated_at: d.updated_at, answers: clone(s.answers), notes: clone(s.notes) });
        state.updatedAt = d.updated_at;
        sync.version = d.version; sync.last = new Date(); sync.err = ""; sync.dirty = false;
        clearTimeout(sync.timer);
        saveDraft();
        versions.busy = false;
        render();
        setStatus(t("verRestored").replace("{n}", String(n)));
        return refreshVersions();
      });
    };
    // Unsaved local work goes in first, so the restore's "before" version includes it.
    var pre = localChanged() ? doSync("manual") : Promise.resolve();
    return pre.then(go)["catch"](function (e) {
      if (e && !e.status && window.console) console.error(e);
      versions.busy = false;
      if (e && e.status === 423) ws.info.company.open = false;
      versions.err = t("verFail");
      drawVersions();
    });
  }

  function drawVersions() {
    versionsBoxes = versionsBoxes.filter(function (b) { return b.isConnected; });
    versionsBoxes.forEach(fillVersions);
  }

  function fillVersions(box) {
    box.textContent = "";
    box.appendChild(el("p", { class: "eyebrow", text: t("verTitle") }));
    box.appendChild(el("p", { class: "a-meta", text: t("verLede") }));
    if (versions.list === null) { box.appendChild(el("p", { class: "a-meta", text: t("verLoading") })); return; }
    if (!versions.list.length) { box.appendChild(el("p", { class: "a-meta", text: t("verNone") })); return; }
    var shown = versions.open ? versions.list : versions.list.slice(0, 5);
    var ul = el("ul", { class: "ver-list" });
    shown.forEach(function (v, i) {
      var acts = el("span", { class: "ver-acts" }, [
        el("a", { class: "btn ghost", href: "/api/s/versions/" + v.n + "?download", text: t("verDownload") })
      ]);
      if (v === versions.list[0]) acts.appendChild(el("span", { class: "pill open", text: t("verLatest") }));
      else if (canWrite()) {
        var b = el("button", { class: "btn", type: "button", text: t("verRestore") });
        if (versions.busy) b.disabled = true;
        b.addEventListener("click", function () {
          if (b.getAttribute("data-armed") !== "1") {
            b.setAttribute("data-armed", "1"); b.classList.add("armed"); b.textContent = t("verRestoreConfirm") + " v" + v.n;
            setTimeout(function () { if (b.isConnected) { b.removeAttribute("data-armed"); b.classList.remove("armed"); b.textContent = t("verRestore"); } }, 4000);
            return;
          }
          restoreVersion(v.n);
        });
        acts.appendChild(b);
      }
      ul.appendChild(el("li", {}, [
        el("span", { class: "mono", text: "v" + v.n }),
        el("span", { text: fmtWhen(v.saved_at) + " · " + reasonText(v.reason) + " · " + v.completion + " %" }),
        acts
      ]));
    });
    box.appendChild(ul);
    if (versions.list.length > 5) {
      box.appendChild(el("button", { class: "btn ghost", type: "button", style: "margin-top:8px;padding-inline:0;text-decoration:underline",
        text: versions.open ? t("verShowFewer") : t("verShowAll").replace("{n}", String(versions.list.length)),
        onclick: function () { versions.open = !versions.open; drawVersions(); } }));
    }
    if (versions.err) box.appendChild(el("p", { class: "err", role: "alert", text: versions.err }));
  }

  function versionsPanel() {
    var box = el("div", { class: "ver-panel" });
    versionsBoxes.push(box);
    fillVersions(box);
    if (versions.list === null) refreshVersions();
    return box;
  }

  /* -------- page furniture */

  function wsBand() {
    var c = ws.info.company;
    return el("div", { class: "ws-band" }, [
      el("span", { class: "eyebrow", text: t("wsLabel") }),
      el("b", { text: c.name }),
      el("span", { class: "pill " + (ws.gone ? "closed" : c.open ? "open" : "closed"), text: ws.gone ? t("signedOutShort") : c.open ? t("wsOpen") : t("wsClosed") })
    ]);
  }

  function signedOutNotice() {
    return el("div", { class: "notice", role: "alert", style: "margin:0 0 18px" }, [
      el("span", { text: t("signedOut") + " " }),
      el("a", { href: "/", class: "btn primary", style: "margin-top:10px", text: t("reenter") })
    ]);
  }

  function wsSubmitBox() {
    var c = ws.info.company;
    var box = el("div", { class: "submit-box" });
    box.appendChild(el("h3", { text: fill(t("submitTitle")) }));
    if (ws.gone) { box.appendChild(signedOutNotice()); return box; }
    box.appendChild(el("p", { text: c.open ? t("submitBody") : t("closedBody") }));
    if (sync.last) box.appendChild(el("p", { class: "a-meta", text: t("lastChanged") + " " + fmtWhen(state.updatedAt || sync.last.toISOString()) + (sync.version ? " · " + t("versionWord") + " " + sync.version : "") }));
    var row = el("div", { class: "row" });
    if (c.open) row.appendChild(el("button", { class: "btn primary", type: "button", text: t("saveVersion"),
      onclick: function (e) { var b = e.currentTarget; b.disabled = true; doSync("manual").then(function () { render(); }); } }));
    row.appendChild(el("button", { class: "btn", type: "button", text: t("exportDoc"), onclick: function () { doExport("doc"); } }));
    box.appendChild(row);
    if (sync.err) box.appendChild(el("p", { class: "err", role: "alert", text: sync.err }));
    box.appendChild(versionsPanel());
    return box;
  }

  function signOut() {
    var done = function () {
      fetch("/api/access/logout", { method: "POST", credentials: "same-origin" })["catch"](function () {}).then(function () {
        // The project holds everything; leave nothing behind on a shared device —
        // unless something could not be saved, which then waits here for the next sign-in.
        if (!localChanged()) { leaving = true; store.del(DRAFT_KEY); store.del(BASE_KEY); }
        location.href = "/";
      });
    };
    (localChanged() ? doSync() : Promise.resolve()).then(done);
  }

  /* Admin analysis: pull every stored specification (or one company's) from the server. */
  function loadServerResponses() {
    var url = ADMIN.company ? "/api/admin/companies/" + encodeURIComponent(ADMIN.company) + "/submissions" : "/api/admin/submissions";
    return fetch(url, { credentials: "same-origin", cache: "no-store" }).then(function (r) {
      if (r.status === 401) { location.href = "/admin"; return { responses: [] }; }
      return r.json();
    }).then(function (d) {
      (d.responses || []).forEach(function (r) { addResponse(r, r._server ? r._server.company_name : ""); });
    });
  }

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
      Promise.all([imageDataMap(), logoData()]).then(function (r) { finishExport(kind, r[0]); });
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
    var who = resp.respondent.organisation || t("anonymous");
    var fileBase = "baerel-kravspesifikasjon-" + slug(who) + "-" + fileStamp(now) + "-v" + state.exportSeq;
    if (kind === "json") {
      // The draft travels with the data so the file can be opened and continued later.
      var answersCopy = JSON.parse(JSON.stringify(state.answers));
      ALL_Q.forEach(function (q) {
        if (q.t !== "scenarios" || !Array.isArray(answersCopy[q.id])) return;
        answersCopy[q.id].forEach(function (sc) { (sc.images || []).forEach(function (im) { if (!im.data && im.id && imgMap[im.id]) im.data = imgMap[im.id]; }); });
      });
      resp.draft = { answers: answersCopy, notes: state.notes, path: state.path, tracks: state.tracks,
        lang: state.lang, started: state.started, updated_at: state.updatedAt, export_seq: state.exportSeq };
      saveFile(fileBase + ".json", JSON.stringify(resp, null, 2), setStatus);
    } else if (kind === "csv") {
      saveFile(fileBase + ".csv", responseCsv(resp), setStatus);
    } else {
      saveFile(fileBase + ".html", specDocument(resp, now, imgMap), setStatus);
    }
    if (WS) doSync("export");
  }

  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  /* A self-contained, printable record of the specification in the current language. */
  function specDocument(resp, when, imgMap) {
    imgMap = imgMap || {};
    var lang = state.lang, T0 = T[lang];
    var recById = {};
    resp.answers.forEach(function (r) { recById[r.id] = r; });
    var meta = [
      [T0.org, resp.respondent.organisation || T0.anonymous],
      [T0.role + " (" + (lang === "nb" ? "bidragsytere" : "contributors") + ")", resp.respondent.role],
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
        } else if (q.t === "samples") {
          if (r.samples && r.samples.length) {
            has = true;
            ans = ["data", "metadata"].map(function (kind) {
              var items = sampleRecs(r.samples).filter(function (sm) { return sm.kind === kind; });
              if (!items.length) return "";
              return "<p class=\"uns\"><b>" + esc(kind === "metadata" ? T0.smMeta : T0.smTitle) + "</b></p><ol class=\"sc\">" + items.map(function (sm) {
                var st = sm.status === "desired" ? T0.smDesired : T0.smAvailable;
                var meta = (kind === "metadata"
                  ? [lang === "nb" ? sm.standard_nb : sm.standard_en, sm.describes ? T0.smDescribes + ": " + sm.describes : "", sm.source]
                  : [lang === "nb" ? sm.format_nb : sm.format_en, sm.source, sm.volume, lang === "nb" ? sm.sensitivity_nb : sm.sensitivity_en]).filter(Boolean).join(" · ");
                return "<li><b>" + esc(sm.title || (kind === "metadata" ? T0.smMetaTitle : T0.smTitle)) + "</b> <span class=\"tag\">" + esc(st) + "</span>" +
                  (meta ? "<div class=\"note\">" + esc(meta) + "</div>" : "") +
                  (sm.description ? "<p>" + esc(sm.description) + "</p>" : "") +
                  (sm.files && sm.files.length ? "<p class=\"uns\">" + esc((kind === "metadata" ? T0.smMetaFiles : T0.smFiles) + ": " + sm.files.map(function (f) { return f.name + " (" + fmtSize(f.size) + ")"; }).join(", ")) + "</p>" : "") + "</li>";
              }).join("") + "</ol>";
            }).join("");
          }
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

    // The platform features the answers lead to, with their reasons.
    var feats = sortedFeatures(localGet).filter(function (r) { return r.priority !== "none"; });
    if (feats.length) {
      body += "<h2>" + esc(T0.modeFeatures) + "</h2><p>" + esc(T0.featLede) + "</p>";
      body += "<h3>" + esc(T0.featProfile) + "</h3><table>" + PLATFORM_PROFILE.map(function (p) {
        var labs = answerLabels(p.q, localGet);
        if (!Q_BY_ID[p.q]) return "";
        return "<tr><td>" + esc(p[lang]) + "</td><td>" + esc(labs.length ? labs.join(" · ") : T0.featNotAnswered) + "</td></tr>";
      }).join("") + "</table>";
      ["must", "should", "could"].forEach(function (pr) {
        var rs = feats.filter(function (r) { return r.priority === pr; });
        if (!rs.length) return;
        body += "<h3>" + esc(PRIORITY[pr][lang]) + " (" + rs.length + ")</h3><ul>" + rs.map(function (r) {
          var why = r.met.map(function (sg) { var x = signalText(sg, localGet); return x.head + " — " + shortQ(x.q); });
          return "<li><b>" + esc(r.feature[lang].title) + "</b> — " + esc(r.feature[lang].desc) +
            (why.length ? "<div class=\"note\">" + esc(T0.featBecause + " " + why.join("; ")) + "</div>" : "") + "</li>";
        }).join("") + "</ul>";
      });
    }

    var title = (lang === "nb" ? "Kravspesifikasjon – " : "Requirements specification — ") + (resp.respondent.organisation || T0.anonymous);
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
      "footer{margin-top:40px;font:12px system-ui,sans-serif;color:#6d7f79}img.logo{display:block;height:44px;width:auto;margin:0 0 22px}" +
      "@media print{body{background:#fff}main{padding:0}h2{break-after:avoid}.q{break-inside:avoid}}" +
      "</style></head><body><main>" +
      (logoDataUrl ? "<img class=\"logo\" src=\"" + logoDataUrl + "\" alt=\"Bærel\">" : "") +
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
      } else if (q.t === "samples") {
        if (r.samples && r.samples.length) answers[q.id] = sampleRecs(r.samples).map(function (sm) {
          var o = { kind: sm.kind === "metadata" ? "metadata" : "data", status: sm.status === "desired" ? "desired" : "available", title: sm.title || "", desc: sm.description || "", source: sm.source || "" };
          if (o.kind === "metadata") {
            o.describes = sm.describes || "";
            if (typeof sm.standard === "number") o.metaStd = sm.standard;
          } else {
            o.volume = sm.volume || "";
            if (typeof sm.format === "number") o.format = sm.format;
            if (typeof sm.sensitivity === "number") o.sensitivity = sm.sensitivity;
            if (typeof sm.scenario === "number") o.scenario = sm.scenario - 1;
          }
          if (sm.files && sm.files.length) o.files = sm.files.map(function (f) { return { id: f.id, name: f.name, size: f.size }; });
          return o;
        });
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
    return { answers: answers, notes: notes, path: obj.path === "full" ? "full" : "core",
      tracks: obj.tracks || [], lang: obj.language, started: obj.started_at, updated_at: obj.updated_at, export_seq: obj.export_seq || 0 };
  }

  function importSpec(obj) {
    if (!obj || obj.schema !== SCHEMA || !obj.answers) { setStatus(t("importBad")); return false; }
    var d = draftFromExport(obj);
    state.answers = d.answers || {};
    state.notes = d.notes || {};
    state.started = d.started || new Date().toISOString();
    state.updatedAt = d.updated_at || obj.updated_at || obj.exported_at || null;
    state.exportSeq = d.export_seq || obj.export_seq || 0;
    if (d.lang === "nb" || d.lang === "en") state.lang = d.lang;
    // In the shared specification, the imported content replaces what is there (as a
    // new save — earlier versions stay available to restore).
    sync.err = "";
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
      fr.onload = function () { try { importSpec(JSON.parse(String(fr.result))); } catch (e) { setStatus(t("importBad")); } };
      fr.readAsText(f);
      input.value = "";
    });
    return el("span", {}, [btn, input]);
  }

  /* Export menu: available from the top bar on every page. */
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
      if (canWrite()) {
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
     [source], so that [outcome]." As many as needed; each field is optional. */

  var SC_FIELDS = ["situation", "actor", "goal", "data", "source", "outcome"];
  var MAX_IMG_PER_SC = 6;

  /* Where an image is served from: the admin endpoint, the specification endpoint, or
     the image itself when there is no server (or it has not been uploaded yet). */
  function imgSrc(im) {
    if (im.data) return im.data;
    if (!im.id) return "";
    if (ADMIN) return "/api/admin/attachments/" + im.id;
    if (WS) return "/api/s/attachments/" + im.id;
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
    return fetch("/api/s/attachments", {
      method: "POST", headers: { "Content-Type": blob.type || "image/jpeg" }, body: blob,
      credentials: "same-origin"
    }).then(function (r) {
      if (r.status === 401) signedOut();
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
      return fetch(imgSrc({ id: id }), { credentials: "same-origin" })
        .then(function (r) { if (!r.ok) throw new Error("img"); return r.blob(); })
        .then(blobToDataUrl).then(function (d) { map[id] = d; })["catch"](function () {});
    })).then(function () { return map; });
  }

  /* After opening an exported file, move embedded images to the server. */
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

  /* ---------------------------------------------------------------- sample data

     Two kinds of entry, added separately:
       data      — one dataset: available today or desired, what it is, where it
                   comes from, and (when not sensitive) the files themselves
       metadata  — a description of data: the metadata standard, what metadata
                   exists, which dataset it describes (optional), and example files
                   such as schemas, data dictionaries or catalogue records
     Files are uploaded to the company's specification on the server. */

  var SM_DATA_TEXT = ["title", "desc", "source", "volume"];
  var SM_META_TEXT = ["title", "desc", "source", "describes"];
  var META_BASE = 100;   // metadata standards are reported to the feature rules as 100 + index
  var SENSITIVE = 3;

  function isMeta(sm) { return !!sm && sm.kind === "metadata"; }

  function sampleFilled(sm) {
    if (!sm) return false;
    var fields = isMeta(sm) ? SM_META_TEXT : SM_DATA_TEXT;
    return fields.some(function (f) { return sm[f] && String(sm[f]).trim(); }) || !!(sm.files && sm.files.length);
  }

  function sampleCount(kind) {
    var n = 0;
    ALL_Q.forEach(function (q) {
      if (q.t !== "samples" || !Array.isArray(state.answers[q.id])) return;
      n += state.answers[q.id].filter(function (sm) { return sampleFilled(sm) && (!kind || (kind === "metadata") === isMeta(sm)); }).length;
    });
    return n;
  }

  function sampleFormats(list) {
    var out = [];
    (list || []).forEach(function (sm) {
      if (!sampleFilled(sm)) return;
      var v = isMeta(sm) ? (typeof sm.metaStd === "number" ? META_BASE + sm.metaStd : null) : (typeof sm.format === "number" ? sm.format : null);
      if (v !== null && out.indexOf(v) === -1) out.push(v);
    });
    return out.sort(function (a, b) { return a - b; });
  }

  /* Cards saved by the earlier version carried metadata inside a data card;
     split them into a data card and a metadata card that describes it. */
  function splitLegacy(list) {
    var changed = false;
    for (var i = 0; i < list.length; i++) {
      var sm = list[i];
      if (isMeta(sm) || !(typeof sm.metaStd === "number" || (sm.metaDesc && sm.metaDesc.trim()) || (sm.metaFiles && sm.metaFiles.length))) continue;
      var m = { kind: "metadata", status: sm.status || "available", describes: sm.title || "" };
      if (typeof sm.metaStd === "number") m.metaStd = sm.metaStd;
      if (sm.metaDesc) m.desc = sm.metaDesc;
      if (sm.metaFiles && sm.metaFiles.length) m.files = sm.metaFiles;
      delete sm.metaStd; delete sm.metaDesc; delete sm.metaFiles;
      list.splice(i + 1, 0, m); i++; changed = true;
    }
    return changed;
  }

  function fmtSize(n) {
    if (n == null) return "";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return Math.round(n / 1024) + " kB";
    return (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + " MB";
  }

  function sampleHref(f) {
    if (!f || !f.id) return null;
    if (ADMIN) return "/api/admin/samples/" + f.id;
    if (WS) return "/api/s/samples/" + f.id;
    return null;
  }

  function uploadSample(file) {
    return fetch("/api/s/samples", {
      method: "POST", body: file, credentials: "same-origin",
      headers: { "Content-Type": "application/octet-stream", "X-File-Name": encodeURIComponent(file.name) }
    }).then(function (r) {
      if (r.status === 401) signedOut();
      return r.json()["catch"](function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.message || ("HTTP " + r.status)); e.status = r.status; throw e; }
        return d;
      });
    });
  }

  function scenarioOptions() {
    var out = [];
    ALL_Q.forEach(function (q) {
      if (q.t !== "scenarios" || !Array.isArray(state.answers[q.id])) return;
      state.answers[q.id].forEach(function (sc, i) {
        if (!scenarioFilled(sc)) return;
        var txt = scenarioSentence(sc, state.lang);
        out.push({ i: i, label: (i + 1) + ". " + (txt.length > 70 ? txt.slice(0, 67) + " …" : txt) });
      });
    });
    return out;
  }

  function sampleEditor(q) {
    var box = el("div", { class: "sc-box sm-box" });
    var list = el("div", { class: "sc-list" });
    box.appendChild(el("p", { class: "q-hint", style: "margin-left:0", text: t("smHint") }));
    if (!WS) box.appendChild(el("p", { class: "notice calm", style: "margin:8px 0 12px", text: t("smNoUpload") }));
    box.appendChild(list);

    function arr() {
      if (!Array.isArray(state.answers[q.id])) state.answers[q.id] = [];
      return state.answers[q.id];
    }
    function commit() { persist(); refreshSpine(); }

    function card(sm, nth) {
      var meta = isMeta(sm);
      if (!sm.status) sm.status = "available";
      var c = el("article", { class: "sc-card sm-card" + (meta ? " sm-metacard" : "") + (sm.status === "desired" ? " sm-desired" : "") });
      var idx = arr().indexOf(sm);
      var pfx = q.id + "-" + (meta ? "md" : "sm") + nth + "-";

      var status = el("div", { class: "seg sm-status", role: "group", "aria-label": t("smStatus") });
      [["available", t("smAvailable")], ["desired", t("smDesired")]].forEach(function (o) {
        status.appendChild(el("button", { type: "button", "aria-pressed": String(sm.status === o[0]), text: o[1], onclick: function () {
          sm.status = o[0]; commit(); draw();
        } }));
      });
      var rm = el("button", { class: "btn ghost sc-rm", type: "button", text: t("scRemove") });
      rm.addEventListener("click", function () {
        if (rm.getAttribute("data-armed") !== "1") {
          rm.setAttribute("data-armed", "1"); rm.textContent = t("scRemoveConfirm");
          setTimeout(function () { rm.removeAttribute("data-armed"); rm.textContent = t("scRemove"); }, 4000);
          return;
        }
        var a = arr(), at = a.indexOf(sm); if (at > -1) a.splice(at, 1); commit(); draw();
      });
      c.appendChild(el("header", { class: "sc-head" }, [
        el("span", { class: "eyebrow", text: (meta ? t("smMetaTitle") : t("smTitle")) + " " + nth }), status, rm
      ]));

      var grid = el("div", { class: "sc-grid" });
      function text(f, labKey, phKey, long, listId) {
        var id = pfx + f;
        var inp = long ? el("textarea", { id: id, rows: "2", placeholder: t(phKey) })
          : el("input", { id: id, type: "text", placeholder: t(phKey), list: listId || null });
        inp.value = sm[f] || "";
        inp.addEventListener("input", function () { sm[f] = inp.value; persist(); });
        inp.addEventListener("change", refreshSpine);
        inp.addEventListener("blur", flushDraft);
        grid.appendChild(el("label", { class: "sc-lab", "for": id, text: t(labKey) }));
        grid.appendChild(inp);
      }
      function select(f, labKey, options) {
        var id = pfx + f;
        var s = el("select", { id: id });
        s.appendChild(el("option", { value: "", text: "–" }));
        options.forEach(function (o) {
          var op = el("option", { value: String(o.v), text: o.label });
          if (sm[f] === o.v) op.selected = true;
          s.appendChild(op);
        });
        s.addEventListener("change", function () {
          if (s.value === "") delete sm[f]; else sm[f] = Number(s.value);
          commit();
          if (f === "sensitivity") draw();
        });
        grid.appendChild(el("label", { class: "sc-lab", "for": id, text: t(labKey) }));
        grid.appendChild(s);
      }

      if (meta) {
        // Which dataset the metadata describes: pick from the data samples or type freely.
        var dlId = q.id + "-dl-data-" + idx;
        var dl = el("datalist", { id: dlId });
        arr().forEach(function (x) { if (!isMeta(x) && x.title && x.title.trim()) dl.appendChild(el("option", { value: x.title.trim() })); });
        c.appendChild(dl);
        text("title", "smName", "smMetaNamePh");
        text("describes", "smDescribes", "smDescribesPh", false, dlId);
        select("metaStd", "smMetaStd", t("smMetaOpts").map(function (l, i) { return { v: i, label: l }; }));
        text("desc", "smMetaDesc", "smMetaDescPh", true);
        text("source", "smSource", "smSourcePh");
      } else {
        text("title", "smName", "smNamePh");
        text("desc", "smDesc", "smDescPh", true);
        text("source", "smSource", "smSourcePh");
        select("format", "smFormat", L(q).o.map(function (l, i) { return { v: i, label: l }; }));
        text("volume", "smVolume", "smVolumePh");
        select("sensitivity", "smSens", t("smSensOpts").map(function (l, i) { return { v: i, label: l }; }));
        var scs = scenarioOptions();
        if (scs.length) select("scenario", "smScenario", scs.map(function (o) { return { v: o.i, label: o.label }; }));
      }
      c.appendChild(grid);

      /* Files */
      var pending = 0, errs = [];
      var wrap = el("ul", { class: "sm-files" });
      var input = el("input", { type: "file", multiple: "multiple", class: "sr" });
      var btn = el("button", { type: "button", class: "btn ghost",
        text: meta ? t("smAddMetaFile") : (sm.status === "desired" ? t("smAddTemplate") : t("smAddFile")) });
      function drawFiles() {
        wrap.textContent = "";
        (sm.files || []).forEach(function (f, k) {
          var href = sampleHref(f);
          var x = el("button", { type: "button", class: "sc-img-x sm-x", title: t("scRemove"), "aria-label": t("scRemove") + " " + f.name, text: "×" });
          x.addEventListener("click", function () { sm.files.splice(k, 1); if (!sm.files.length) delete sm.files; commit(); drawFiles(); });
          wrap.appendChild(el("li", {}, [
            href ? el("a", { href: href, text: f.name, download: f.name }) : el("span", { text: f.name }),
            el("span", { class: "count", text: fmtSize(f.size) }),
            canWrite() || !WS ? x : null
          ]));
        });
        for (var i = 0; i < pending; i++) wrap.appendChild(el("li", { class: "pending" }, [el("span", { text: t("smUploading") })]));
        errs.forEach(function (e) { wrap.appendChild(el("li", { class: "err" }, [el("span", { text: e })])); });
      }
      btn.addEventListener("click", function () { input.click(); });
      input.addEventListener("change", function () {
        var files = Array.prototype.slice.call(input.files || []);
        input.value = ""; errs = [];
        files.forEach(function (file) {
          pending++; drawFiles();
          uploadSample(file).then(function (d) {
            sm.files = sm.files || [];
            sm.files.push({ id: d.id, name: d.name, size: d.size });
            commit();
          })["catch"](function (e) {
            errs.push(t("smUploadFail") + " " + file.name + " — " + (e.status === 413 ? t("smTooBig") : e.status === 415 ? t("smBadType") : e.message));
          }).then(function () { pending--; drawFiles(); });
        });
      });
      var blocked = !meta && sm.sensitivity === SENSITIVE;
      var row = el("div", { class: "sc-imgrow" }, [el("p", { class: "eyebrow sc-prev-l", text: meta ? t("smMetaFiles") : t("smFiles") }), wrap]);
      if (blocked) row.appendChild(el("p", { class: "notice", style: "margin:6px 0 0", text: t("smSensBlocked") }));
      else if (WS && canWrite()) { row.appendChild(btn); row.appendChild(input); }
      c.appendChild(row);
      drawFiles();
      return c;
    }

    function draw() {
      list.textContent = "";
      var a = arr();
      if (splitLegacy(a)) persist();
      var nData = 0, nMeta = 0;
      a.forEach(function (sm) { list.appendChild(card(sm, isMeta(sm) ? ++nMeta : ++nData)); });
      if (!a.length) list.appendChild(el("p", { class: "a-meta sm-empty", text: t("smEmpty") }));
    }

    function addEntry(kind) {
      var sm = { kind: kind, status: "available" };
      arr().push(sm); commit(); draw();
      var cards = list.querySelectorAll(".sm-card"), last = cards[cards.length - 1];
      if (last) { last.scrollIntoView({ block: "nearest" }); var f = last.querySelector("input[type=text]"); if (f) f.focus(); }
    }
    box.appendChild(el("div", { class: "row sm-adds" }, [
      el("button", { class: "btn sc-add", type: "button", text: t("smAdd"), onclick: function () { addEntry("data"); } }),
      el("button", { class: "btn sc-add", type: "button", text: t("smAddMeta"), onclick: function () { addEntry("metadata"); } })
    ]));
    draw();
    return box;
  }

  /* Answer records for a samples question (export, server, analysis). */
  function sampleRecords(q, list) {
    var sens = { nb: T.nb.smSensOpts, en: T.en.smSensOpts };
    var arr = Array.isArray(list) ? JSON.parse(JSON.stringify(list)) : [];
    splitLegacy(arr);
    return arr.filter(sampleFilled).map(function (sm) {
      var o = { kind: isMeta(sm) ? "metadata" : "data", status: sm.status === "desired" ? "desired" : "available" };
      o.title = String(sm.title || "").trim();
      o.description = String(sm.desc || "").trim();
      o.source = String(sm.source || "").trim();
      if (isMeta(sm)) {
        o.describes = String(sm.describes || "").trim();
        if (typeof sm.metaStd === "number") { o.standard = sm.metaStd; o.standard_en = T.en.smMetaOpts[sm.metaStd]; o.standard_nb = T.nb.smMetaOpts[sm.metaStd]; }
      } else {
        o.volume = String(sm.volume || "").trim();
        if (typeof sm.format === "number") { o.format = sm.format; o.format_en = q.en.o[sm.format]; o.format_nb = q.nb.o[sm.format]; }
        if (typeof sm.sensitivity === "number") { o.sensitivity = sm.sensitivity; o.sensitivity_en = sens.en[sm.sensitivity]; o.sensitivity_nb = sens.nb[sm.sensitivity]; }
        if (typeof sm.scenario === "number") o.scenario = sm.scenario + 1;
      }
      o.files = (sm.files || []).map(function (f) { return { id: f.id, name: f.name, size: f.size }; });
      return o;
    });
  }

  /* Stored records, normalised: older records nested metadata inside a data record. */
  function sampleRecs(list) {
    var out = [];
    (list || []).forEach(function (sm) {
      var d = {}; Object.keys(sm).forEach(function (k) { if (k !== "metadata") d[k] = sm[k]; });
      if (!d.kind) d.kind = "data";
      out.push(d);
      if (sm.metadata) out.push({ kind: "metadata", status: sm.status, title: "", describes: sm.title || "", description: sm.metadata.description || "",
        standard: sm.metadata.standard, standard_en: sm.metadata.standard_en, standard_nb: sm.metadata.standard_nb, files: sm.metadata.files || [] });
    });
    return out;
  }

  /* ---------------------------------------------------------------- comments */

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
    if (statusBox && !statusBox.isConnected) statusBox = null;
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
      if (ws.gone) msg += " · " + t("signedOutShort");
      else if (ws.info && !ws.info.company.open) msg += " · " + t("syncClosed");
      else if (sync.err) msg += " · " + sync.err;
      else if (sync.inflight || sync.dirty) msg += " · " + t("syncPending");
      else if (sync.last) msg += " · " + t("syncedAt") + " " + clockTime(sync.last) + (sync.version ? " (" + t("versionWord") + " " + sync.version + ")" : "");
    }
    statusBox.textContent = msg;
  }

  /* ---------------------------------------------------------------- chrome */

  /* The Bærel logo, with a lighter rendering for dark mode. */
  function logoNode(cls) {
    var pic = document.createElement("picture");
    pic.className = "logo" + (cls ? " " + cls : "");
    var src = document.createElement("source");
    src.setAttribute("srcset", "/assets/logo-light.png");
    src.setAttribute("media", "(prefers-color-scheme: dark)");
    pic.appendChild(src);
    pic.appendChild(el("img", { src: "/assets/logo.png", alt: "Bærel", width: "99", height: "30" }));
    return pic;
  }

  var logoDataUrl = null;
  function logoData() {
    if (logoDataUrl !== null) return Promise.resolve(logoDataUrl);
    return fetch("/assets/logo.png").then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(blobToDataUrl)
      .then(function (d) { logoDataUrl = d; return d; })["catch"](function () { logoDataUrl = ""; return ""; });
  }

  function renderTopbar() {
    var bar = document.getElementById("topbar-in");
    bar.textContent = "";
    bar.appendChild(el("button", {
      class: "brand", type: "button", title: t("home"), "aria-label": t("home"),
      onclick: ADMIN ? function () { location.href = "/admin"; } : goHome
    }, [
      logoNode(),
      WS ? el("span", { class: "eyebrow", text: WS.company.name }) : null,
      el("b", { text: L(SURVEY.title) })
    ]));

    var modes = el("div", { class: "seg", role: "group" }, [
      el("button", {
        type: "button", "aria-pressed": String(state.mode === "form"), text: t("modeForm"),
        onclick: function () { state.mode = "form"; render(); }
      }),
      el("button", {
        type: "button", "aria-pressed": String(state.mode === "features"), text: t("modeFeatures"),
        onclick: function () { state.mode = "features"; render(); window.scrollTo(0, 0); }
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
    if (WS && !ws.gone) bar.appendChild(el("button", { class: "btn ghost", type: "button", text: t("signOut"), title: t("signOutHint"), onclick: signOut }));
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
    kids.forEach(function (k) { if (k) inner.appendChild(k); });
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
    hero.appendChild(el("p", { class: "eyebrow", text: t("program") + " · " + (state.lang === "nb" ? "Egenrapportert kravspesifikasjon" : "Self-reported requirements specification") }));
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
      el("li", {}, [el("b", { class: "num", text: String(ALL_Q.length) }), el("span", { text: t("questions") })]),
      el("li", {}, [el("b", { class: "num", text: t("minutesRange") }), el("span", { text: t("estimate") + " (" + t("minutes") + ")" })])
    ]));
    side.appendChild(el("p", { class: "notice", text: SURVEY.notice[state.lang] }));
    side.appendChild(el("p", { class: "notice calm", text: SURVEY.privacy[state.lang] + " " + SURVEY.techNote[state.lang] + " " + t("requiredNone") }));
    if (WS) side.appendChild(el("p", { class: "notice calm", text: t("specPrivacy") }));
    hero.appendChild(el("div", { class: "hero-grid" }, [intro, side]));

    function begin() {
      if (!state.started) state.started = new Date().toISOString();
      state.section = 0;
      state.view = "form";
      saveDraft();
      render();
      window.scrollTo(0, 0);
    }

    var hasAny = Object.keys(state.answers).length > 0 || (draft && Object.keys(draft.answers).length > 0);
    if (!hasAny) {
      hero.appendChild(el("div", { class: "paths" }, [
        el("div", { class: "path-card" }, [
          el("h3", { text: t("startTitle") }),
          el("p", { class: "num", text: ALL_Q.length + " " + t("questions") + " · " + SURVEY.sections.length + " " + t("sections") + " · " + t("minutesRange") + " " + t("minutes") }),
          el("p", { text: t("startBody") }),
          el("button", { class: "btn primary", type: "button", text: t("startBtn"), onclick: begin })
        ])
      ]));
    }

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
            state.updatedAt = draft.updated_at || draft.saved_at || null;
            state.exportSeq = draft.export_seq || 0;
            state.section = draft.section || 0;
            state.started = draft.started || new Date().toISOString();
          }
          state.view = state.lastView === "review" ? "review" : "form";
          render(); window.scrollTo(0, 0);
        }
      }));
      if (!WS) row.appendChild(el("button", {
        class: "btn ghost", type: "button", text: t("newRespondent"),
        onclick: function (e) {
          if (e.target.getAttribute("data-armed") === "1") { resetForm(); return; }
          e.target.setAttribute("data-armed", "1");
          e.target.textContent = t("confirmReset");
        }
      }));
      hero.appendChild(row);
    }

    if (!WS || canWrite()) hero.appendChild(el("div", { class: "row", style: "margin-top:14px" }, [importControl()]));

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
    if (WS && !ws.gone) {
      hero.appendChild(versionsPanel());
      statusBox = el("p", { class: "spec-status", role: "status", "aria-live": "polite" });
      hero.appendChild(statusBox);
      setSaveState();
    }
    hero.appendChild(toc);

    if (WS) main.appendChild(wsBand());
    if (WS && ws.gone) main.appendChild(signedOutNotice());
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
    } else if (q.t === "samples") {
      node.appendChild(sampleEditor(q));
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
    var hint = featureHint(q);
    if (hint) node.appendChild(hint);
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
    if (WS) pullServer();
    if (state.view === "form" || state.view === "review") state.lastView = state.view;
    state.mode = "form";
    state.view = "start";
    render();
    window.scrollTo(0, 0);
  }

  function resetForm() {
    state.answers = {};
    state.notes = {};
    state.updatedAt = null;
    state.exportSeq = 0;
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
    if (WS && ws.gone) main.appendChild(signedOutNotice());

    if (restored && !WS) {
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
      el("li", {}, [el("b", { class: "num", text: resp.completion + "%" }), el("span", { text: state.lang === "nb" ? "utfylt" : "complete" })]),
      el("li", {}, [el("b", { text: resp.respondent.organisation || t("anonymous") }), el("span", { text: t("org") })]),
      el("li", {}, [el("b", { class: "num", text: String(noteCount()) }), el("span", { text: t("notesCount") })]),
      scenarioCount() ? el("li", {}, [el("b", { class: "num", text: String(scenarioCount()) }), el("span", { text: t("scCount") })]) : null,
      sampleCount("data") ? el("li", {}, [el("b", { class: "num", text: String(sampleCount("data")) }), el("span", { text: t("smCount") })]) : null,
      sampleCount("metadata") ? el("li", {}, [el("b", { class: "num", text: String(sampleCount("metadata")) }), el("span", { text: t("smMetaCount") })]) : null
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

    var mustF = sortedFeatures(localGet).filter(function (r) { return r.priority === "must"; });
    if (mustF.length) {
      var fBox = el("div", { class: "opp-summary" });
      fBox.appendChild(el("p", { class: "eyebrow", text: t("featTop") }));
      var ful = el("ul", { class: "opp-list" });
      mustF.slice(0, 8).forEach(function (r) {
        ful.appendChild(el("li", {}, [
          el("span", { class: "pill prio-must", text: PRIORITY.must[state.lang] }),
          el("span", { text: L(r.feature).title })
        ]));
      });
      fBox.appendChild(ful);
      fBox.appendChild(el("button", {
        class: "btn ghost", type: "button", style: "padding-inline:0;text-decoration:underline",
        text: t("featSeeAll") + " (" + mustF.length + ")",
        onclick: function () { state.mode = "features"; render(); window.scrollTo(0, 0); }
      }));
      panel.appendChild(fBox);
    }

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
      WS ? null : el("button", {
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

  /* ---------------------------------------------------------------- platform features

     The answers decide which features the data platform must have (features.js).
     Every feature shows the answers that argue for it, so the priority can be
     traced back — and every question shows which features it feeds. */

  function shortQ(q) {
    var s = String(L(q).q).replace(/\s+/g, " ");
    return s.length > 96 ? s.slice(0, 93).replace(/\s+\S*$/, "") + " …" : s;
  }

  /* What a signal says, in words, using the answer actually given where there is one. */
  function signalText(sig, get) {
    var q = Q_BY_ID[sig.q];
    if (!q) return sig.q;
    var a = get(sig.q) || { sel: [], val: null };
    var opts = L(q).o || [];
    var head;
    if (sig.any) {
      var hit = sig.any.filter(function (i) { return a.sel.indexOf(i) > -1; });
      var show = (hit.length ? hit : sig.any).map(function (i) { return "«" + opts[i] + "»"; });
      head = show.slice(0, 3).join(t("featOr")) + (show.length > 3 ? " …" : "");
    } else if (sig.scale) {
      head = typeof a.val === "number" ? t("featRated").replace("{v}", String(a.val)) : t("featRatedMin").replace("{v}", String(sig.scale));
    } else if (sig.count) {
      var n = (sig.of ? a.sel.filter(function (i) { return sig.of.indexOf(i) > -1; }) : a.sel).length;
      head = n >= sig.count ? t("featChosen").replace("{n}", String(n)) : t("featChooseMin").replace("{n}", String(sig.count));
    }
    return { head: head, q: q };
  }

  function goToQuestion(qid) {
    var q = Q_BY_ID[qid];
    if (!q) return;
    var idx = 0;
    SURVEY.sections.forEach(function (s, i) { if (s.id === q._section) idx = i; });
    if (!state.started) state.started = new Date().toISOString();
    state.mode = "form"; state.view = "form"; state.section = idx;
    saveDraft(); render();
    var node = document.getElementById("q-" + qid);
    if (node) { node.scrollIntoView({ block: "start" }); node.classList.add("flash"); setTimeout(function () { node.classList.remove("flash"); }, 1600); }
  }

  function goToFeature(fid) {
    state.mode = "features"; render();
    var node = document.getElementById("feat-" + fid);
    if (node) {
      var d = node.closest("details"); if (d) d.open = true;
      node.scrollIntoView({ block: "center" }); node.classList.add("flash");
      setTimeout(function () { node.classList.remove("flash"); }, 1600);
    }
  }

  /* The line under a question: which features (and profile parameters) it feeds. */
  function featureHint(q) {
    var fs = FEATURES_BY_Q[q.id];
    if (!fs || (!fs.length && !fs.profile)) return null;
    var p = el("p", { class: "q-feeds" }, [el("span", { class: "q-feeds-l", text: t("featFeeds") + " " })]);
    fs.forEach(function (f, i) {
      if (i) p.appendChild(document.createTextNode(" · "));
      p.appendChild(el("button", { type: "button", class: "q-feed", text: L(f).title, onclick: function () { goToFeature(f.id); } }));
    });
    if (fs.profile) {
      if (fs.length) p.appendChild(document.createTextNode(" · "));
      p.appendChild(el("button", { type: "button", class: "q-feed", text: t("featProfile"), onclick: function () { state.mode = "features"; render(); } }));
    }
    return p;
  }

  function answerLabels(qid, get) {
    var q = Q_BY_ID[qid], a = get(qid) || { sel: [], val: null };
    if (!q || !L(q).o) return [];
    return a.sel.slice().sort(function (x, y) { return x - y; }).map(function (i) { return L(q).o[i]; }).filter(Boolean);
  }

  function featureCard(r, get) {
    var f = r.feature;
    var card = el("article", { class: "feat feat-" + r.priority, id: "feat-" + f.id });
    card.appendChild(el("div", { class: "opp-top" }, [
      el("span", { class: "pill prio-" + r.priority, text: PRIORITY[r.priority][state.lang] }),
      el("span", { class: "pill", text: FEATURE_AREAS[f.area][state.lang] })
    ]));
    card.appendChild(el("h3", { text: L(f).title }));
    card.appendChild(el("p", { class: "opp-pitch", text: L(f).desc }));

    var conf = [];
    (f.detail || []).forEach(function (qid) {
      if (!Q_BY_ID[qid]) return;
      var labs = answerLabels(qid, get);
      if (labs.length) conf.push({ q: Q_BY_ID[qid], labs: labs });
    });
    if (conf.length) {
      card.appendChild(el("p", { class: "opp-lead", text: t("featConfig") }));
      conf.forEach(function (c) {
        var row = el("div", { class: "feat-conf" });
        c.labs.forEach(function (l) { row.appendChild(el("span", { class: "chip", text: l })); });
        row.appendChild(el("button", { type: "button", class: "feat-q", title: L(c.q).q, text: "→ " + t("featGo"), onclick: function () { goToQuestion(c.q.id); } }));
        card.appendChild(row);
      });
    }

    function sigList(sigs, cls) {
      var ul = el("ul", { class: "opp-needs" });
      sigs.forEach(function (s) {
        var tx = signalText(s, get);
        ul.appendChild(el("li", { class: cls }, [
          el("span", { class: "tick", "aria-hidden": "true", text: cls === "met" ? "✓" : cls === "against" ? "−" : "·" }),
          el("span", {}, [
            el("b", { text: tx.head + " " }),
            el("button", { type: "button", class: "feat-q", title: L(tx.q).q, text: shortQ(tx.q), onclick: function () { goToQuestion(s.q); } })
          ])
        ]));
      });
      return ul;
    }
    if (r.met.length) { card.appendChild(el("p", { class: "opp-lead", text: t("featBecause") })); card.appendChild(sigList(r.met, "met")); }
    if (r.against.length) { card.appendChild(el("p", { class: "opp-lead", text: t("featAgainst") })); card.appendChild(sigList(r.against, "against")); }
    if (r.open.length) {
      card.appendChild(el("details", { class: "feat-open" }, [
        el("summary", { text: t("featOpen").replace("{n}", String(r.open.length)) }),
        sigList(r.open, "unmet")
      ]));
    }
    return card;
  }

  function profileTable(get) {
    var tbl = el("table", { class: "profile" });
    var tb = el("tbody");
    PLATFORM_PROFILE.forEach(function (p) {
      if (!Q_BY_ID[p.q]) return;
      var labs = answerLabels(p.q, get);
      tb.appendChild(el("tr", {}, [
        el("th", { text: p[state.lang] }),
        el("td", { class: labs.length ? "" : "muted", text: labs.length ? labs.join(" · ") : t("featNotAnswered") }),
        el("td", {}, [el("button", { type: "button", class: "feat-q", title: L(Q_BY_ID[p.q]).q, text: "→ " + t("featGo"), onclick: function () { goToQuestion(p.q); } })])
      ]));
    });
    tbl.appendChild(tb);
    return tbl;
  }

  function sortedFeatures(get) {
    // Features with no question behind them in this question set are left out.
    return evalFeatures(get).filter(function (r) { return r.reach > 0; }).sort(function (a, b) {
      return (PRIORITY[a.priority].rank - PRIORITY[b.priority].rank) || (b.score - a.score);
    });
  }

  function renderFeatures() {
    var results = sortedFeatures(localGet);
    var by = { must: 0, should: 0, could: 0, none: 0 };
    results.forEach(function (r) { by[r.priority]++; });
    var p = totalProgress();

    var wrap = el("div", { class: "shell single" });
    var main = el("main");
    if (WS) main.appendChild(wsBand());
    var head = el("section", { class: "panel" });
    head.appendChild(el("p", { class: "eyebrow", text: t("program") + " · " + t("modeFeatures") }));
    head.appendChild(el("h2", { style: "font-size:clamp(24px,3.4vw,33px);margin-top:6px", text: t("featTitle") }));
    head.appendChild(el("p", { style: "color:var(--ink-2);max-width:64ch", text: t("featLede") }));
    head.appendChild(el("ul", { class: "facts" }, ["must", "should", "could"].map(function (k) {
      return el("li", {}, [el("b", { class: "num", text: String(by[k]) }), el("span", { text: PRIORITY[k][state.lang] })]);
    }).concat([el("li", {}, [el("b", { class: "num", text: p.done + "/" + p.total }), el("span", { text: t("answered") })])])));
    if (p.done < 10) head.appendChild(el("p", { class: "notice calm", text: t("featEarly") }));
    head.appendChild(el("p", { class: "eyebrow", style: "margin-top:28px", text: t("featProfile") }));
    head.appendChild(el("p", { class: "a-meta", style: "margin:4px 0 10px", text: t("featProfileLede") }));
    head.appendChild(el("div", { class: "scroll-x" }, [profileTable(localGet)]));
    main.appendChild(head);

    Object.keys(FEATURE_AREAS).forEach(function (area) {
      var rs = results.filter(function (r) { return r.feature.area === area && r.priority !== "none"; });
      var none = results.filter(function (r) { return r.feature.area === area && r.priority === "none"; });
      main.appendChild(el("h3", { class: "eyebrow feat-area", text: FEATURE_AREAS[area][state.lang] + " · " + rs.length + "/" + (rs.length + none.length) }));
      if (rs.length) {
        var grid = el("div", { class: "opp-grid" });
        rs.forEach(function (r) { grid.appendChild(featureCard(r, localGet)); });
        main.appendChild(grid);
      }
      if (none.length) {
        var g2 = el("div", { class: "opp-grid" });
        none.forEach(function (r) { g2.appendChild(featureCard(r, localGet)); });
        main.appendChild(el("details", { class: "feat-none" }, [
          el("summary", { text: t("featShowNone").replace("{n}", String(none.length)) }), g2
        ]));
      }
    });

    wrap.appendChild(main);
    app.appendChild(wrap);
    app.appendChild(actionBar([
      el("button", { class: "btn primary", type: "button", text: t("backToForm"),
        onclick: function () { state.mode = "form"; if (state.view === "start") state.view = "form"; render(); window.scrollTo(0, 0); } })
    ]));
  }

  /* For exports: the derived feature list in plain data. */
  function featureSummary(get) {
    return sortedFeatures(get).filter(function (r) { return r.priority !== "none"; }).map(function (r) {
      return { id: r.feature.id, priority: r.priority, score: r.score, title_nb: r.feature.nb.title, title_en: r.feature.en.title };
    });
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

    // which platform features the organisations collectively need
    var fAgg = {};
    FEATURES.forEach(function (f) { fAgg[f.id] = { must: 0, should: 0 }; });
    rows.forEach(function (r) {
      evalFeatures(responseGet(r)).forEach(function (res) {
        if (res.priority === "must") fAgg[res.feature.id].must++;
        else if (res.priority === "should") fAgg[res.feature.id].should++;
      });
    });
    var fItems = FEATURES.map(function (f) { return { label: L(f).title + (fAgg[f.id].should ? " (+" + fAgg[f.id].should + ")" : ""), n: fAgg[f.id].must, sh: fAgg[f.id].should }; })
      .filter(function (x) { return x.n > 0 || x.sh > 0; })
      .sort(function (a, b) { return (b.n - a.n) || (b.sh - a.sh); });
    if (fItems.length) {
      main.appendChild(el("section", { class: "a-q", style: "border-top:1px solid var(--line-strong);padding-top:22px" }, [
        el("p", { class: "eyebrow", text: t("featAgg") }),
        el("p", { class: "a-meta", style: "margin:6px 0 0", text: t("featAggLede") })
      ]));
      main.appendChild(bars(fItems, rows.length, ""));
    }

    // respondents table
    var tbl = el("table", { class: "resp" });
    tbl.appendChild(el("thead", {}, [el("tr", {}, [
      el("th", { text: t("org") }), el("th", { text: t("role") }), el("th", { text: t("complete") }), el("th", { text: t("when") })
    ])]));
    var tb = el("tbody");
    rows.forEach(function (r) {
      tb.appendChild(el("tr", {}, [
        el("td", { text: (r.respondent && r.respondent.organisation) || t("anonymous") }),
        el("td", { text: (r.respondent && r.respondent.role) || "—" }),
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
        } else if (q.t === "samples") {
          var sms = [], fmt = L(q).o.map(function (lab) { return { label: lab, n: 0 }; });
          var mst = t("smMetaOpts").map(function (lab) { return { label: lab, n: 0 }; });
          rows.forEach(function (r) {
            var rec = r.answers.filter(function (x) { return x.id === q.id; })[0];
            if (!rec || !rec.samples) return;
            var who = (r.respondent && r.respondent.organisation) || t("anonymous");
            sampleRecs(rec.samples).forEach(function (sm) {
              sms.push({ sm: sm, who: who });
              if (sm.kind === "metadata") { if (typeof sm.standard === "number" && mst[sm.standard]) mst[sm.standard].n++; }
              else if (typeof sm.format === "number" && fmt[sm.format]) fmt[sm.format].n++;
            });
          });
          if (!sms.length) block.appendChild(el("p", { class: "a-meta", text: t("noAnswers") }));
          else {
            block.appendChild(el("p", { class: "a-meta", text: t("smWhich") }));
            if (fmt.some(function (x) { return x.n > 0; })) block.appendChild(bars(fmt.filter(function (x) { return x.n > 0; }).sort(function (a, b) { return b.n - a.n; }), sms.length, ""));
            if (mst.some(function (x) { return x.n > 0; })) {
              block.appendChild(el("p", { class: "a-meta", style: "margin-top:12px", text: t("smMetaWhich") }));
              block.appendChild(bars(mst.filter(function (x) { return x.n > 0; }).sort(function (a, b) { return b.n - a.n; }), sms.length, "copper"));
            }
            var smv = el("div", { class: "verbatims", style: "margin-top:14px" });
            sms.forEach(function (x) {
              var sm = x.sm;
              var files = (sm.files || []).length ? el("ul", { class: "sm-files" }, sm.files.map(function (f) {
                var href = sampleHref(f);
                return el("li", {}, [href ? el("a", { href: href, download: f.name, text: f.name }) : el("span", { text: f.name }), el("span", { class: "count", text: fmtSize(f.size) })]);
              })) : null;
              var meta = sm.kind === "metadata";
              smv.appendChild(el("blockquote", { class: "verbatim" + (meta ? " sm-meta-v" : ""), style: "margin:0" }, [
                el("span", {}, [
                  el("span", { class: "eyebrow", text: (meta ? t("smMetaTitle") : t("smTitle")) + " · " }),
                  el("b", { text: (sm.title || "") + " " }),
                  el("span", { class: "pill " + (sm.status === "desired" ? "" : "ok"), text: sm.status === "desired" ? t("smDesired") : t("smAvailable") })
                ]),
                meta && sm.describes ? el("p", { class: "a-meta", style: "margin:4px 0 0", text: t("smDescribes") + ": " + sm.describes }) : null,
                sm.description ? el("p", { style: "margin:4px 0 0", text: sm.description }) : null,
                files,
                el("cite", { text: (meta
                  ? [x.who, state.lang === "nb" ? sm.standard_nb : sm.standard_en, sm.source]
                  : [x.who, state.lang === "nb" ? sm.format_nb : sm.format_en, sm.source, sm.volume]).filter(Boolean).join(" · ") })
              ]));
            });
            block.appendChild(smv);
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

  /* Comments on one question across all loaded specifications. */
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
    var header = ["organisation", "contributing_roles", "language", "completion", "updated_at"];
    ALL_Q.forEach(function (q) { header.push(q.id + " — " + q.en.q); });
    var out = [header];
    rows.forEach(function (r) {
      var line = [
        (r.respondent && r.respondent.organisation) || "",
        (r.respondent && r.respondent.role) || "",
        r.language || "", r.completion == null ? "" : r.completion, r.updated_at || r.exported_at || ""
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
    // A saved position may come from the other question set (or an older version).
    if (!(state.section >= 0 && state.section < SURVEY.sections.length)) state.section = 0;
    hideTip();
    renderTopbar();
    app.textContent = "";
    document.documentElement.lang = state.lang === "nb" ? "nb" : "en";
    if (state.mode === "analyse") { renderAnalyse(); return; }
    if (state.mode === "opps") { renderOpportunities(); return; }
    if (state.mode === "features") { renderFeatures(); return; }
    if (state.view === "start") renderStart();
    else if (state.view === "review") renderReview();
    else renderForm();
  }

  var boot = loadDraft();
  if (boot && boot.lang) state.lang = boot.lang;
  if (boot && boot.answers && Object.keys(boot.answers).length) {
    state.answers = boot.answers;
    state.notes = boot.notes || {};
    state.updatedAt = boot.updated_at || boot.saved_at || null;
    state.exportSeq = boot.export_seq || 0;
    state.section = boot.section || 0;
    state.started = boot.started || new Date().toISOString();
    state.view = boot.view === "review" ? "review" : "form";
    if (boot.saved_at) { var d = new Date(boot.saved_at); if (!isNaN(d.getTime())) lastSaved = d; }
    restored = true;
  }
  loadAnalysis();

  if (WS) {
    base = loadBase();
    if (!boot) state.view = "start";
    render();
    pullServer().then(function () { migrateImagesToServer(); });
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
