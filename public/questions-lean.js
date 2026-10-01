/* The lean question set: 50 questions in 5 sections, built from the full bank.

   Most questions are reused exactly as they are (same id, same options), so answers
   carry over in both directions; two are new merges (q243, q244) and four free-text
   questions get a broader wording. Answers to questions not in this set are kept
   and reappear when the admin switches back to the full set. */

var LEAN_SET = {
  minutes: { nb: "35–50", en: "35–50" },
  sections: [
    { id: "L1",
      nb: { title: "Behov, scenarioer og data", lead: "Hvem dere er, hva dere trenger dataplattformen til, og hvilke data dere har – eller ønsker dere – i dag." },
      en: { title: "Needs, scenarios and data", lead: "Who you are, what you need the data platform for, and which data you have — or wish you had — today." },
      q: ["q3", "q10", "q217", "q218", "q228", "q229", "q23", "q25", "q11", "q31"] },
    { id: "L2",
      nb: { title: "Datamodell, tillit og suverenitet", lead: "Hvordan plattformen bør bygges og styres: integrasjon, historikk, standarder, sikkerhet, eierskap og hvor dataene skal ligge." },
      en: { title: "Data model, trust and sovereignty", lead: "How the platform should be built and governed: integration, history, standards, security, ownership and where the data should live." },
      q: ["q42", "q40", "q43", "q41", "q243", "q17", "q21", "q163", "q18", "q203", "q50"] },
    { id: "L3",
      nb: { title: "Produktpass, fotavtrykk og LCA", lead: "Krav fra regelverk og bærekraft: digitale produktpass etter EN 18216–18223, klimaavtrykk og livsløpsvurdering etter standardene som gjelder i Norge og Europa." },
      en: { title: "Product passport, footprint and LCA", lead: "Requirements from regulation and sustainability: Digital Product Passports under EN 18216–18223, carbon footprint and life cycle assessment under the standards that apply in Norway and Europe." },
      q: ["q181", "q186", "q190", "q195", "q114", "q117", "q118", "q122", "q235", "q238"] },
    { id: "L4",
      nb: { title: "KI, automatisering og drift", lead: "KI-tjenester og agenter på dataene, selvoppdaterende modeller, behandling nær kilden, fangst av taus kunnskap, roboter og drift uten folk til stede." },
      en: { title: "AI, automation and operations", lead: "AI services and agents on the data, self-updating models, processing close to the source, capture of tacit knowledge, robots and operation with nobody present." },
      q: ["q55", "q58", "q59", "q158", "q219", "q65", "q86", "q109", "q146"] },
    { id: "L5",
      nb: { title: "Kostnad, fremtid og prioriteringer", lead: "Hva plattformen kan koste, hvilke fremtider den må tåle, hva som bekymrer, og hva som må komme først." },
      en: { title: "Cost, the future and priorities", lead: "What the platform may cost, which futures it must withstand, what worries you, and what must come first." },
      q: ["q198", "q210", "q127", "q136", "q244", "q139", "q73", "q78", "q81", "q83"] }
  ],

  /* New questions that merge several from the full set. */
  extra: {
    q243: { id: "q243", t: "multi",
      nb: { q: "Hvilke egenskaper er kritiske for dataplattformen?",
        o: ["Konfidensialitet – bare de rette ser dataene", "Integritet – poster kan ikke endres ubemerket", "Opphav og avstamning – hvor en verdi kom fra og hvem som laget den", "Finmasket, rollebasert tilgangsstyring", "Revisjonsspor over all tilgang og alle endringer", "Versjonert historikk – hva visste vi om produktet på et gitt tidspunkt", "Fortsatt drift uten nettforbindelse, med synkronisering etterpå", "Skjemafleksibilitet – nye attributter, produkttyper og partnere uten redesign"] },
      en: { q: "Which properties are critical for the data platform?",
        o: ["Confidentiality — only the right parties see the data", "Integrity — records cannot be altered undetected", "Provenance and lineage — where a value came from and who produced it", "Fine-grained, role-based access control", "An audit trail of all access and all changes", "Versioned history — what we knew about the product at a given time", "Continued operation without a network connection, synchronising afterwards", "Schema flexibility — new attributes, product types and partners without redesign"] } },
    q244: { id: "q244", t: "multi",
      nb: { q: "Hva bekymrer folk i virksomheten mest når det gjelder digitalisering, KI og data i verdikjeden?",
        o: ["Avhengighet av noen få store teknologiselskaper", "Geopolitiske spenninger mellom USA, Kina og Europa", "«Svarte bokser» – KI, algoritmer og fastvare vi ikke kan se inn i", "Energibruk og klimaavtrykk fra KI og datasentre", "Hvor dataene havner, og hvem som kan kreve tilgang til dem", "Cyberangrep og sabotasje", "Tap av forretningshemmeligheter", "Arbeidsplasser og kompetanse som forsvinner", "Overvåking av ansatte", "Liten bekymring – mest optimisme"] },
      en: { q: "What are people in your organisation most worried about when it comes to digitalisation, AI and data in the value chain?",
        o: ["Dependence on a few large technology companies", "Geopolitical tensions between the US, China and Europe", "“Black boxes” — AI, algorithms and firmware we cannot look inside", "Energy use and carbon footprint of AI and data centres", "Where the data ends up, and who can demand access to it", "Cyber attacks and sabotage", "Loss of trade secrets", "Jobs and skills disappearing", "Surveillance of employees", "Little concern — mostly optimism"] } }
  },

  /* Broader wording where one free-text question now covers two. */
  override: {
    q218: { nb: { q: "Hvilket av scenarioene ville gitt størst gevinst – og er det også det beste pilotprosjektet? Hva står i veien i dag?" },
            en: { q: "Which of the scenarios would bring the greatest benefit — and is it also the best pilot? What stands in the way today?" } },
    q18: { nb: { q: "Hvilke data krever strengest beskyttelse – og hvem må godkjenne at andre får tilgang til dem?" },
           en: { q: "Which data requires the strictest protection — and who must approve that others get access to it?" } },
    q78: { nb: { q: "Hva må vises – og hvilket målbart resultat – for at dataplattformen skal regnes som validert?" },
           en: { q: "What must be shown — and which measurable result — for the data platform to count as validated?" } },
    q81: { nb: { q: "Hva måtte vært på plass for at virksomheten faktisk skulle bidra med data – og hva er den største barrieren i dag?" },
           en: { q: "What would have to be true for your organisation to actually contribute data — and what is the biggest barrier today?" } }
  }
};

/* Rebuild survey.sections for the chosen set. Called by the app before anything
   reads the question bank. */
function applyQuestionSet(survey, set) {
  if (set !== "lean") return false;
  var byId = {};
  survey.sections.forEach(function (s) { s.questions.forEach(function (q) { byId[q.id] = q; }); });
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  survey.sections = LEAN_SET.sections.map(function (s) {
    return {
      id: s.id, nb: s.nb, en: s.en,
      questions: s.q.map(function (id) {
        var q = clone(byId[id] || LEAN_SET.extra[id]);
        var o = LEAN_SET.override[id];
        if (o) { q.nb.q = o.nb.q; q.en.q = o.en.q; }
        return q;
      })
    };
  });
  survey.questionSet = "lean";
  return true;
}
