/* Which features the data platform needs, derived from the answers.

   Every feature lists the answers that argue for it (signals). Each signal that
   is met adds its weight; the sum sets the priority:
     score >= 4  → must     score >= 2 → should     score >= 1 → could     else → not indicated
   A negative weight argues against the feature (e.g. "no agent access at all").

   Signal kinds:
     any:   [option indices] — met if any of them is selected
     scale: n                — met if the rating is n or higher
     count: n (+ of: [...])  — met if at least n options (out of `of`, if given) are selected
   `detail` lists questions whose selected options configure the feature (e.g. which
   systems the connectors must reach). Indices refer to option positions in questions.js.

   q228 is the sample-data section: its "selected" options are the formats of the
   samples the organisation described (0 spreadsheet … 9 other). */

var FEATURE_AREAS = {
  ingest: { nb: "Innhenting og integrasjon", en: "Ingestion and integration" },
  model: { nb: "Datamodell og lagring", en: "Data model and storage" },
  trust: { nb: "Tillit, sikkerhet og styring", en: "Trust, security and governance" },
  dpp: { nb: "Produktpass og etterlevelse", en: "Product passport and compliance" },
  green: { nb: "Bærekraft", en: "Sustainability" },
  ai: { nb: "KI, agenter og modeller", en: "AI, agents and models" },
  ops: { nb: "Drift, deling og automatisering", en: "Operations, sharing and automation" }
};

var PRIORITY = {
  must: { nb: "Må ha", en: "Must have", rank: 0 },
  should: { nb: "Bør ha", en: "Should have", rank: 1 },
  could: { nb: "Kan ha", en: "Could have", rank: 2 },
  none: { nb: "Ikke indikert", en: "Not indicated", rank: 3 }
};

var FEATURES = [
  /* ------------------------------------------------ ingestion and integration */
  { id: "connectors", area: "ingest",
    nb: { title: "Koblinger mot kildesystemer", desc: "Ferdige koblinger med kartlegging mot fellesmodellen for systemene virksomheten bruker – slik at data hentes uten manuell eksport." },
    en: { title: "Source-system connectors", desc: "Ready-made connectors, with mapping into the common model, for the systems the organisation runs — so data arrives without manual export." },
    signals: [
      { q: "q23", count: 1, of: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,16,18,19,20,21,22,23,24], w: 2 },
      { q: "q23", count: 4, w: 1 },
      { q: "q73", any: [1], w: 1 },
      { q: "q199", any: [1], w: 1 },
      { q: "q228", any: [6, 7], w: 1 }
    ],
    detail: ["q23"] },
  { id: "docextract", area: "ingest",
    nb: { title: "Uttrekk fra dokumenter og PDF", desc: "Gjør erklæringer, sertifikater og rapporter i PDF og skann om til strukturerte data, med kildehenvisning til dokumentet." },
    en: { title: "Document and PDF extraction", desc: "Turns declarations, certificates and reports in PDF or scans into structured data, with a reference back to the source document." },
    signals: [
      { q: "q11", any: [9], w: 2 },
      { q: "q120", any: [1], w: 2 },
      { q: "q33", any: [0, 1], w: 1 },
      { q: "q23", any: [17], w: 1 },
      { q: "q228", any: [3], w: 1 }
    ] },
  { id: "lowbarrier", area: "ingest",
    nb: { title: "Enkel deltakelse for små leverandører", desc: "Nettskjema, regnearkmaler og opplasting som ikke krever egen IT – med validering som sier fra om hva som mangler." },
    en: { title: "Low-barrier participation for small suppliers", desc: "Web forms, spreadsheet templates and uploads that need no IT of one's own — with validation that says what is missing." },
    signals: [
      { q: "q31", scale: 4, w: 3 },
      { q: "q4", any: [0, 1], w: 1 },
      { q: "q33", any: [2], w: 1 },
      { q: "q73", any: [13], w: 2 },
      { q: "q228", any: [0], w: 1 }
    ] },
  { id: "streaming", area: "ingest",
    nb: { title: "Hendelsesstrømmer og sanntidsinnhenting", desc: "Publiser–abonner for hendelser og måledata, med varsler når noe endres, i stedet for nattlige filoverføringer." },
    en: { title: "Event streaming and real-time ingest", desc: "Publish–subscribe for events and measurements, with notifications when something changes, instead of nightly file transfers." },
    signals: [
      { q: "q26", any: [0, 1, 2], w: 2 },
      { q: "q42", any: [2], w: 2 },
      { q: "q61", any: [1], w: 1 },
      { q: "q38", any: [3, 4], w: 1 },
      { q: "q192", any: [1], w: 1 },
      { q: "q228", any: [7, 8], w: 1 }
    ],
    detail: ["q26"] },
  { id: "federation", area: "ingest",
    nb: { title: "Føderert spørring og dataromskoblinger", desc: "Data blir liggende hos eieren og spørres der den er, gjennom dataromskoblinger (f.eks. Eclipse Dataspace Components) og en felles katalog." },
    en: { title: "Federated query and data-space connectors", desc: "Data stays with its owner and is queried where it lives, through data-space connectors (e.g. Eclipse Dataspace Components) and a shared catalogue." },
    signals: [
      { q: "q42", any: [1, 4, 5], w: 2 },
      { q: "q50", any: [0, 4], w: 2 },
      { q: "q21", any: [1, 3], w: 1 },
      { q: "q41", any: [8], w: 1 },
      { q: "q178", any: [11], w: 1 },
      { q: "q136", any: [3], w: 1 }
    ],
    detail: ["q42"] },
  { id: "mapping", area: "ingest",
    nb: { title: "Semantisk kartlegging av partnerdata", desc: "Kartlegger leverandørers og partneres egne formater inn i fellesmodellen – med KI-forslag som et menneske godkjenner." },
    en: { title: "Semantic mapping of partner data", desc: "Maps suppliers' and partners' own formats into the common model — with AI suggestions a person approves." },
    signals: [
      { q: "q29", scale: 4, w: 2 },
      { q: "q55", any: [2], w: 2 },
      { q: "q11", any: [2, 4], w: 1 },
      { q: "q44", scale: 4, w: 1 }
    ] },
  { id: "edge", area: "ingest",
    nb: { title: "Kantnode: filtrering, fusjon og mellomlagring", desc: "Programvare nær kilden som renser, slår sammen og komprimerer data, og mellomlagrer når forbindelsen er borte." },
    en: { title: "Edge node: filtering, fusion and buffering", desc: "Software close to the source that cleans, fuses and compresses data, and buffers it while the connection is down." },
    signals: [
      { q: "q64", count: 1, of: [0,1,2,3,4,5,6,7,8,9], w: 1 },
      { q: "q65", count: 2, w: 1 },
      { q: "q67", any: [0, 2, 4, 5], w: 1 },
      { q: "q178", any: [5], w: 1 },
      { q: "q73", any: [4], w: 2 },
      { q: "q64", any: [10], w: -2 }
    ],
    detail: ["q64", "q65"] },

  /* ------------------------------------------------ data model and storage */
  { id: "graph", area: "model",
    nb: { title: "Kunnskapsgraf for produkter og livsløp", desc: "Kobler produkter, komponenter, materialer, virksomheter og hendelser, slik at sporbarhet på tvers av kjeden blir et oppslag." },
    en: { title: "Product and lifecycle knowledge graph", desc: "Links products, components, materials, organisations and events, so cross-chain traceability becomes a lookup." },
    signals: [
      { q: "q34", any: [5, 6], w: 2 },
      { q: "q28", scale: 4, w: 2 },
      { q: "q25", count: 3, w: 1 },
      { q: "q41", any: [7], w: 1 },
      { q: "q73", any: [2, 3], w: 1 }
    ] },
  { id: "temporal", area: "model",
    nb: { title: "Versjonert og tidsbevisst historikk", desc: "Ingenting overskrives i stillhet: rettelser lagres som nye fakta, og man kan spørre hva man visste om et produkt på et gitt tidspunkt." },
    en: { title: "Versioned, time-aware history", desc: "Nothing is silently overwritten: corrections are stored as new facts, and one can ask what was known about a product at a given time." },
    signals: [
      { q: "q36", scale: 4, w: 2 },
      { q: "q43", any: [1, 2, 3], w: 2 },
      { q: "q34", any: [6], w: 1 },
      { q: "q136", any: [8], w: 1 },
      { q: "q43", any: [0], w: -1 }
    ],
    detail: ["q43"] },
  { id: "timeseries", area: "model",
    nb: { title: "Tidsserielager for sensor- og prosessdata", desc: "Lagring og nedsampling av høyfrekvente måledata, koblet til produkt, prosesssteg og utstyr." },
    en: { title: "Time-series store for sensor and process data", desc: "Storage and downsampling of high-frequency measurements, linked to product, process step and equipment." },
    signals: [
      { q: "q34", any: [2], w: 2 },
      { q: "q38", any: [3, 4], w: 2 },
      { q: "q23", any: [6, 7, 8], w: 1 },
      { q: "q223", any: [0, 4], w: 1 },
      { q: "q228", any: [8], w: 1 }
    ] },
  { id: "objects", area: "model",
    nb: { title: "Lagring av store filer: bilder, video, CAD og dokumenter", desc: "Objektlager med metadata og tilgangsstyring for store og ustrukturerte filer, koblet til produktet de gjelder." },
    en: { title: "Large-object storage: images, video, CAD and documents", desc: "Object storage with metadata and access control for large and unstructured files, linked to the product they concern." },
    signals: [
      { q: "q38", any: [2, 5, 6, 7], w: 2 },
      { q: "q34", any: [3, 4], w: 1 },
      { q: "q39", any: [2, 3], w: 1 },
      { q: "q228", any: [3, 4, 5], w: 1 }
    ],
    detail: ["q38", "q39"] },
  { id: "idresolver", area: "model",
    nb: { title: "Identifikatorregister og oppslag", desc: "Kobler serienummer, GTIN, batch, komponent- og pass-ID på tvers av livsløp og virksomheter, og slår dem opp fra en lenke eller et merke." },
    en: { title: "Identifier registry and resolver", desc: "Links serial numbers, GTINs, batches, component and passport IDs across lifecycle and organisations, and resolves them from a link or a tag." },
    signals: [
      { q: "q25", count: 2, w: 2 },
      { q: "q183", any: [0, 1, 2, 3, 4], w: 1 },
      { q: "q185", any: [0, 1, 2, 3, 4], w: 1 },
      { q: "q28", scale: 4, w: 1 }
    ],
    detail: ["q25", "q183"] },
  { id: "catalogue", area: "model",
    nb: { title: "Datakatalog med eierskap og metadata", desc: "Søkbar oversikt over hvilke data som finnes, hvem som eier dem, hva de betyr og hvor ferske de er." },
    en: { title: "Data catalogue with ownership and metadata", desc: "A searchable overview of which data exists, who owns it, what it means and how fresh it is." },
    signals: [
      { q: "q27", scale: 4, w: 2 },
      { q: "q11", any: [4, 6], w: 1 },
      { q: "q157", any: [1], w: 1 },
      { q: "q42", any: [5], w: 1 }
    ] },
  { id: "standards", area: "model",
    nb: { title: "Standardiserte informasjonsmodeller", desc: "Fellesmodellen bygger på og kan eksportere til de standardene dere nevner – ikke låst til én." },
    en: { title: "Standards-based information models", desc: "The common model builds on, and exports to, the standards you name — not locked to one." },
    signals: [
      { q: "q41", count: 1, of: [0,1,2,3,4,5,6,7,8], w: 2 },
      { q: "q41", count: 3, of: [0,1,2,3,4,5,6,7,8], w: 1 },
      { q: "q136", any: [7], w: 1 },
      { q: "q29", scale: 4, w: 1 }
    ],
    detail: ["q41"] },

  /* ------------------------------------------------ trust, security, governance */
  { id: "access", area: "trust",
    nb: { title: "Finmasket tilgangsstyring og dataeierskap", desc: "Eieren bestemmer hvem som ser hva, ned på felt og datasett, med roller, attributter og tidsbegrensede tilganger." },
    en: { title: "Fine-grained access control and data ownership", desc: "The owner decides who sees what, down to field and dataset, using roles, attributes and time-limited grants." },
    signals: [
      { q: "q15", scale: 4, w: 2 },
      { q: "q12", scale: 4, w: 1 },
      { q: "q17", count: 2, w: 1 },
      { q: "q59", any: [3], w: 1 },
      { q: "q195", any: [0, 1, 2, 3, 4], w: 1 }
    ],
    detail: ["q17"] },
  { id: "usagecontrol", area: "trust",
    nb: { title: "Bruksvilkår som følger dataene, og datakontrakter", desc: "Maskinlesbare vilkår for hva data kan brukes til (f.eks. ODRL), og avtaler om skjema, kvalitet og tjenestenivå mellom parter." },
    en: { title: "Usage policies that travel with data, and data contracts", desc: "Machine-readable terms for what data may be used for (e.g. ODRL), and agreements on schema, quality and service levels between parties." },
    signals: [
      { q: "q163", any: [5, 6], w: 2 },
      { q: "q158", any: [1, 2], w: 2 },
      { q: "q17", any: [6, 8], w: 1 },
      { q: "q142", any: [0, 1, 5], w: 1 }
    ] },
  { id: "audit", area: "trust",
    nb: { title: "Manipulasjonssikker revisjonslogg", desc: "Hver lesing og endring – av mennesker og agenter – logges i en logg som ikke kan endres ubemerket." },
    en: { title: "Tamper-evident audit log", desc: "Every read and change — by people and agents — is recorded in a log that cannot be altered undetected." },
    signals: [
      { q: "q16", scale: 4, w: 2 },
      { q: "q163", any: [2], w: 2 },
      { q: "q59", any: [2], w: 1 },
      { q: "q13", scale: 4, w: 1 },
      { q: "q150", any: [5], w: 1 }
    ] },
  { id: "signing", area: "trust",
    nb: { title: "Signerte poster og verifiserbare attester", desc: "Data signeres av den som står bak, slik at mottakeren kan sjekke opphav og integritet – også uten plattformen." },
    en: { title: "Signed records and verifiable credentials", desc: "Data is signed by whoever stands behind it, so the recipient can check origin and integrity — even without the platform." },
    signals: [
      { q: "q196", any: [0, 1, 2], w: 2 },
      { q: "q163", any: [0, 1], w: 2 },
      { q: "q136", any: [5], w: 1 },
      { q: "q47", count: 1, of: [0,1,2,3,4,5,6,7], w: 1 },
      { q: "q13", scale: 4, w: 1 }
    ],
    detail: ["q196", "q47"] },
  { id: "ledger", area: "trust",
    nb: { title: "Forankring i distribuert hovedbok", desc: "Utvalgte hendelser (f.eks. eierskifter) forankres i en distribuert hovedbok – bare der dere mener det trengs." },
    en: { title: "Distributed-ledger anchoring", desc: "Selected events (e.g. ownership transfers) are anchored in a distributed ledger — only where you consider it necessary." },
    signals: [
      { q: "q46", any: [0], w: 4 },
      { q: "q46", any: [1], w: 2 },
      { q: "q46", any: [3, 4], w: -3 }
    ] },
  { id: "lineage", area: "trust",
    nb: { title: "Opphav og avstamning – målt, erklært eller utledet", desc: "Hver verdi viser hvor den kom fra, hvem som laget den, og om den er målt, erklært av en part eller utledet av en modell eller agent." },
    en: { title: "Provenance and lineage — measured, declared or inferred", desc: "Every value shows where it came from, who produced it, and whether it was measured, declared by a party, or inferred by a model or agent." },
    signals: [
      { q: "q14", scale: 4, w: 2 },
      { q: "q60", scale: 4, w: 2 },
      { q: "q11", any: [7], w: 1 },
      { q: "q224", any: [1], w: 1 }
    ] },
  { id: "quality", area: "trust",
    nb: { title: "Datakvalitetsregler og kvalitetsporter", desc: "Regler som sjekker fullstendighet, gyldighet og konsistens ved innlasting, og som stopper eller merker data som ikke holder mål." },
    en: { title: "Data-quality rules and quality gates", desc: "Rules that check completeness, validity and consistency on ingest, and stop or flag data that falls short." },
    signals: [
      { q: "q11", count: 2, of: [0,1,2,3,4,5,6,7,8], w: 1 },
      { q: "q55", any: [1], w: 2 },
      { q: "q163", any: [6], w: 1 },
      { q: "q157", any: [2], w: 1 },
      { q: "q75", any: [0], w: 1 }
    ],
    detail: ["q11"] },
  { id: "sovereign", area: "trust",
    nb: { title: "Suveren drift og jurisdiksjon", desc: "Drift, data og nøkkelteknologi under norsk eller europeisk jurisdiksjon, uten avhengighet av én skyleverandør." },
    en: { title: "Sovereign operation and jurisdiction", desc: "Operations, data and key technology under Norwegian or European jurisdiction, without dependence on a single cloud provider." },
    signals: [
      { q: "q203", any: [0, 1], w: 3 },
      { q: "q203", any: [2, 3], w: 1 },
      { q: "q50", any: [0, 1, 2, 4], w: 1 },
      { q: "q17", any: [7], w: 1 },
      { q: "q169", any: [1, 2], w: 1 },
      { q: "q136", any: [11], w: 1 }
    ],
    detail: ["q50", "q203"] },
  { id: "origin", area: "trust",
    nb: { title: "Opprinnelsesland og jurisdiksjon i verdikjeden", desc: "Viser hvilket land og hvilken jurisdiksjon data, komponenter og tjenester hører til langs kjeden." },
    en: { title: "Country of origin and jurisdiction along the chain", desc: "Shows which country and jurisdiction data, components and services belong to along the chain." },
    signals: [
      { q: "q173", any: [0, 1], w: 3 },
      { q: "q173", any: [2], w: 1 },
      { q: "q172", any: [4], w: 1 },
      { q: "q171", scale: 4, w: 1 }
    ] },
  { id: "exit", area: "trust",
    nb: { title: "Full eksport, portabilitet og overtakelse", desc: "Egne data kan når som helst hentes ut i åpne formater, og driften kan overtas av en annen hvis operatøren forsvinner." },
    en: { title: "Full export, portability and hand-over", desc: "One's own data can be exported at any time in open formats, and operations can be taken over if the operator disappears." },
    signals: [
      { q: "q136", any: [0, 1, 2, 9], w: 2 },
      { q: "q137", any: [0, 1, 2], w: 1 },
      { q: "q169", any: [6], w: 1 },
      { q: "q199", any: [8], w: 1 },
      { q: "q209", any: [0], w: 1 }
    ],
    detail: ["q137"] },
  { id: "offline", area: "trust",
    nb: { title: "Drift uten nett og synkronisering", desc: "Lokale noder og lesere fortsetter når forbindelsen er borte, og synkroniserer uten konflikter når den kommer tilbake." },
    en: { title: "Offline operation and synchronisation", desc: "Local nodes and readers keep working when the connection is down, and synchronise without conflicts when it returns." },
    signals: [
      { q: "q152", scale: 4, w: 2 },
      { q: "q136", any: [4], w: 1 },
      { q: "q192", any: [3], w: 1 },
      { q: "q65", any: [8], w: 1 },
      { q: "q67", any: [2], w: 1 }
    ] },
  { id: "privacy", area: "trust",
    nb: { title: "Personvernbevarende beregning", desc: "Analyse på tvers av virksomheter uten å flytte rådata: føderert læring, differensielt personvern eller sikre enklaver." },
    en: { title: "Privacy-preserving computation", desc: "Analysis across organisations without moving raw data: federated learning, differential privacy or secure enclaves." },
    signals: [
      { q: "q163", any: [7], w: 2 },
      { q: "q157", any: [6], w: 1 },
      { q: "q65", any: [9, 10], w: 1 },
      { q: "q67", any: [4], w: 1 },
      { q: "q120", any: [6], w: 1 }
    ] },

  /* ------------------------------------------------ product passport and compliance */
  { id: "dpp", area: "dpp",
    nb: { title: "Produktpass: utstedelse, register og livsløps-API", desc: "Opprette, lese, oppdatere og avslutte produktpass etter EN 18216–18223, med registrering i EUs DPP-register." },
    en: { title: "Product passport: issuance, registry and lifecycle API", desc: "Create, read, update and retire product passports under EN 18216–18223, with registration in the EU DPP Registry." },
    signals: [
      { q: "q181", any: [2, 3, 4], w: 2 },
      { q: "q190", count: 2, w: 2 },
      { q: "q117", any: [3], w: 1 },
      { q: "q10", any: [7], w: 1 },
      { q: "q182", any: [0, 1, 2], w: 1 },
      { q: "q73", any: [7], w: 1 },
      { q: "q181", any: [5], w: -2 }
    ],
    detail: ["q190", "q184", "q188"] },
  { id: "dppviews", area: "dpp",
    nb: { title: "Rollebaserte visninger av produktpasset", desc: "Offentlig del for alle, begrensede deler for reparatører, gjenvinnere og myndigheter – og hvem som får oppdatere." },
    en: { title: "Role-based passport views", desc: "A public part for everyone, restricted parts for repairers, recyclers and authorities — and who may update." },
    signals: [
      { q: "q195", any: [0, 1, 2, 3, 4], w: 2 },
      { q: "q191", any: [1, 2, 3], w: 1 },
      { q: "q15", scale: 4, w: 1 }
    ],
    detail: ["q195", "q191"] },
  { id: "carrier", area: "dpp",
    nb: { title: "Databærere og lenkeoppslag", desc: "Generering og oppslag av QR, Data Matrix, NFC eller RFID med GS1 Digital Link eller IEC 61406 – også når merket er slitt." },
    en: { title: "Data carriers and link resolution", desc: "Generating and resolving QR, Data Matrix, NFC or RFID with GS1 Digital Link or IEC 61406 — even when the mark is worn." },
    signals: [
      { q: "q186", any: [0, 1, 2, 3], w: 2 },
      { q: "q183", any: [0, 1], w: 1 },
      { q: "q187", scale: 4, w: 1 },
      { q: "q25", any: [14], w: 1 }
    ],
    detail: ["q186"] },
  { id: "reporting", area: "dpp",
    nb: { title: "Regelverksrapportering og erklæringer", desc: "Ferdige uttrekk og utkast for CSRD, RoHS, REACH/SCIP, WEEE og produktpass, sporbart tilbake til grunnlagsdataene." },
    en: { title: "Regulatory reporting and declarations", desc: "Ready extracts and drafts for CSRD, RoHS, REACH/SCIP, WEEE and the product passport, traceable back to the underlying data." },
    signals: [
      { q: "q55", any: [3], w: 2 },
      { q: "q117", any: [1, 3], w: 1 },
      { q: "q122", any: [6], w: 1 },
      { q: "q23", any: [18, 20], w: 1 },
      { q: "q75", any: [9], w: 1 },
      { q: "q10", any: [7], w: 1 }
    ] },

  /* ------------------------------------------------ sustainability */
  { id: "footprint", area: "green",
    nb: { title: "Fotavtrykk per produkt eller batch", desc: "Beregner og fører klimaavtrykk på produkt-, batch- eller serienummernivå, og utveksler det i PACT-format." },
    en: { title: "Footprint per product or batch", desc: "Calculates and carries the carbon footprint at product, batch or serial-number level, and exchanges it in PACT format." },
    signals: [
      { q: "q114", any: [2, 3, 4], w: 2 },
      { q: "q119", scale: 4, w: 2 },
      { q: "q116", scale: 4, w: 1 },
      { q: "q118", any: [1, 5], w: 1 },
      { q: "q55", any: [4], w: 1 },
      { q: "q73", any: [8], w: 1 }
    ],
    detail: ["q114", "q118", "q125"] },
  { id: "claims", area: "green",
    nb: { title: "Etterprøvbare bærekraftspåstander", desc: "Påstander om klimaavtrykk og resirkulert innhold kan revideres: grunnlag, metode og hvem som har bekreftet dem." },
    en: { title: "Verifiable sustainability claims", desc: "Footprint and recycled-content claims can be audited: basis, method and who has assured them." },
    signals: [
      { q: "q121", scale: 4, w: 2 },
      { q: "q47", any: [4, 5], w: 1 },
      { q: "q122", any: [3], w: 1 },
      { q: "q127", any: [8], w: 1 }
    ] },
  { id: "decisions", area: "green",
    nb: { title: "Beslutningsstøtte for sirkulære valg", desc: "Sammenligner design, leverandører og reparasjon mot utskifting på fotavtrykk og kostnad, og finner de største utslippspunktene." },
    en: { title: "Decision support for circular choices", desc: "Compares designs, suppliers and repair versus replacement on footprint and cost, and finds the largest emission hotspots." },
    signals: [
      { q: "q122", count: 2, of: [0,1,2,3,4,5,6,7,8], w: 2 },
      { q: "q122", any: [0, 1, 2], w: 1 },
      { q: "q55", any: [8], w: 1 }
    ],
    detail: ["q122"] },
  { id: "greenops", area: "green",
    nb: { title: "Plattformens eget energi- og klimaregnskap", desc: "Måler og viser plattformens og agentenes energibruk, kjører tung beregning når strømmen er ren, og setter energibudsjett." },
    en: { title: "The platform's own energy and carbon accounting", desc: "Measures and shows the energy use of the platform and its agents, runs heavy computation when power is clean, and sets energy budgets." },
    signals: [
      { q: "q177", scale: 4, w: 2 },
      { q: "q178", any: [1, 8, 9, 10], w: 1 },
      { q: "q178", count: 3, of: [0,1,2,3,4,5,6,7,8,9,10,11,12,13], w: 1 },
      { q: "q178", any: [14], w: -2 }
    ],
    detail: ["q178"] },
  { id: "retention", area: "green",
    nb: { title: "Dataminimering og lagringsregler", desc: "Regler for hva som lagres, hvor lenge og i hvilken oppløsning – med automatisk sletting og aggregering." },
    en: { title: "Data minimisation and retention rules", desc: "Rules for what is stored, for how long and at what resolution — with automatic deletion and aggregation." },
    signals: [
      { q: "q178", any: [3, 4, 6, 7, 12], w: 2 },
      { q: "q17", any: [9], w: 1 },
      { q: "q136", any: [6], w: 1 },
      { q: "q157", any: [0, 7], w: 1 }
    ],
    detail: ["q40"] },

  /* ------------------------------------------------ AI, agents and models */
  { id: "nlq", area: "ai",
    nb: { title: "Søk og spørsmål på naturlig språk", desc: "Still spørsmål om produkter, materialer og hendelser i vanlig språk, med svar som viser hvilke data de bygger på." },
    en: { title: "Natural-language search and Q&A", desc: "Ask about products, materials and events in plain language, with answers that show which data they rest on." },
    signals: [
      { q: "q55", any: [0], w: 2 },
      { q: "q55", any: [10], w: 1 },
      { q: "q75", any: [1], w: 1 },
      { q: "q11", any: [10], w: 1 }
    ] },
  { id: "agentgw", area: "ai",
    nb: { title: "Agentgrensesnitt med autonominivåer", desc: "Et kontrollert grensesnitt (f.eks. MCP) der agenter leser og foreslår, og skriver bare innenfor det autonominivået eieren har satt." },
    en: { title: "Agent interface with autonomy levels", desc: "A controlled interface (e.g. MCP) where agents read and propose, and write only within the autonomy level the owner has set." },
    signals: [
      { q: "q58", any: [1, 2, 3, 4, 5], w: 2 },
      { q: "q61", any: [4], w: 2 },
      { q: "q56", scale: 4, w: 1 },
      { q: "q59", any: [5], w: 1 },
      { q: "q161", any: [1], w: 1 },
      { q: "q58", any: [0], w: -4 },
      { q: "q59", any: [9], w: -4 }
    ],
    detail: ["q58", "q59"] },
  { id: "agentguard", area: "ai",
    nb: { title: "Agentvern: identitet, kvoter, overvåking og nødstopp", desc: "Hver agent har egen identitet og budsjett, oppførselen overvåkes, og den kan stoppes umiddelbart." },
    en: { title: "Agent safeguards: identity, quotas, monitoring and kill switch", desc: "Every agent has its own identity and budget, its behaviour is monitored, and it can be stopped at once." },
    signals: [
      { q: "q160", scale: 4, w: 2 },
      { q: "q163", any: [8, 9, 10], w: 2 },
      { q: "q161", any: [0, 2], w: 1 },
      { q: "q157", any: [3, 8], w: 1 },
      { q: "q155", scale: 4, w: 1 }
    ] },
  { id: "analytics", area: "ai",
    nb: { title: "Analyse for ombruk, levetid og feilårsak", desc: "Restlevetid, ombruksverdi, sortering og rotårsak på tvers av produksjons-, test- og feltdata." },
    en: { title: "Analytics for reuse, lifetime and root cause", desc: "Remaining life, reuse value, sorting and root cause across production, test and field data." },
    signals: [
      { q: "q55", any: [5, 6, 7, 8], w: 2 },
      { q: "q71", any: [4, 5, 10], w: 1 },
      { q: "q10", any: [0, 1, 2, 3, 10], w: 1 },
      { q: "q75", any: [2, 3], w: 1 }
    ],
    detail: ["q55"] },
  { id: "models", area: "ai",
    nb: { title: "Drift av selvoppdaterende modeller og tvillinger", desc: "Modellregister med versjoner, datagrunnlag, usikkerhet, validering før endringer går live – og mulighet til å rulle tilbake." },
    en: { title: "Running self-updating models and twins", desc: "A model registry with versions, data basis, uncertainty, validation before changes go live — and the ability to roll back." },
    signals: [
      { q: "q219", any: [0, 1, 3], w: 2 },
      { q: "q223", count: 2, w: 1 },
      { q: "q224", count: 2, w: 1 },
      { q: "q225", any: [1, 3], w: 1 },
      { q: "q219", any: [4], w: -2 }
    ],
    detail: ["q220", "q223"] },
  { id: "transparency", area: "ai",
    nb: { title: "Innsyn i modeller og algoritmer", desc: "Forklaring av enkeltbeslutninger, modellkort og mulighet til å teste med egne data før bruk." },
    en: { title: "Transparency of models and algorithms", desc: "Explanations of individual decisions, model cards, and the ability to test with one's own data before use." },
    signals: [
      { q: "q174", scale: 4, w: 2 },
      { q: "q176", any: [0, 3, 4, 5], w: 1 },
      { q: "q59", any: [4], w: 1 },
      { q: "q175", any: [0, 6], w: 1 }
    ],
    detail: ["q176"] },

  /* ------------------------------------------------ operations, sharing, automation */
  { id: "sharing", area: "ops",
    nb: { title: "Deling med partnere i verdikjeden", desc: "Gi utvalgte partnere tilgang til bestemte data – og motta det dere trenger fra dem – uten å sende filer." },
    en: { title: "Sharing with partners in the value chain", desc: "Give selected partners access to specific data — and receive what you need from them — without sending files." },
    signals: [
      { q: "q69", count: 2, of: [0,1,2,3,4,5,6,7,8,9,10,11,12], w: 2 },
      { q: "q71", count: 2, w: 1 },
      { q: "q73", any: [5], w: 1 },
      { q: "q69", any: [13], w: -2 }
    ],
    detail: ["q69", "q71"] },
  { id: "unattended", area: "ops",
    nb: { title: "Støtte for ubemannet drift", desc: "Sanntidsbilde utenfra, varsling, automatiske stoppregler og et fullstendig hendelsesspor for det som skjedde uten folk til stede." },
    en: { title: "Support for unattended operation", desc: "A live view from outside, alerting, automatic stop rules and a complete event trail of what happened with nobody present." },
    signals: [
      { q: "q143", any: [2, 3, 4, 5], w: 2 },
      { q: "q146", count: 2, w: 2 },
      { q: "q148", scale: 4, w: 1 },
      { q: "q143", any: [0], w: -2 }
    ],
    detail: ["q146", "q147"] },
  { id: "capture", area: "ops",
    nb: { title: "Førstepersonsopptak med samtykke og anonymisering", desc: "Opptak fra briller eller kamera som behandles på enheten eller lokalt, med samtykke, sladding og kobling til produktet." },
    en: { title: "First-person capture with consent and anonymisation", desc: "Recordings from glasses or cameras processed on the device or locally, with consent, redaction and a link to the product." },
    signals: [
      { q: "q86", any: [3, 4, 5], w: 2 },
      { q: "q89", scale: 4, w: 1 },
      { q: "q88", scale: 4, w: 1 },
      { q: "q87", count: 1, of: [0,1,2,3,4,5,6,7], w: 1 },
      { q: "q86", any: [11], w: -2 }
    ],
    detail: ["q93", "q94"] },
  { id: "robots", area: "ops",
    nb: { title: "Data for og fra roboter", desc: "Produktdata roboter trenger for å håndtere nye varianter (geometri, festemidler, demonteringsrekkefølge) – og robotenes prosessdata tilbake." },
    en: { title: "Data for and from robots", desc: "Product data robots need to handle new variants (geometry, fasteners, disassembly sequence) — and the robots' process data back." },
    signals: [
      { q: "q108", scale: 4, w: 2 },
      { q: "q109", count: 2, of: [0,1,2,3,4,5,6,7,8,9], w: 2 },
      { q: "q101", scale: 4, w: 1 },
      { q: "q110", scale: 4, w: 1 }
    ],
    detail: ["q109"] },
  { id: "opencore", area: "ops",
    nb: { title: "Åpen kildekode i kjernen", desc: "Kjernen leveres som åpen kildekode med tydelig lisens og europeisk forvaltning, med profesjonell støtte tilgjengelig." },
    en: { title: "Open-source core", desc: "The core is delivered as open source with a clear licence and European governance, with professional support available." },
    signals: [
      { q: "q208", any: [0], w: 4 },
      { q: "q208", any: [1], w: 2 },
      { q: "q209", any: [0, 1, 3], w: 1 },
      { q: "q210", any: [1], w: 1 },
      { q: "q208", any: [4], w: -3 }
    ],
    detail: ["q209"] }
];

/* Platform profile: key parameters the platform must be dimensioned for, read
   straight off single answers. */
var PLATFORM_PROFILE = [
  { q: "q26", nb: "Hvor raskt data må være tilgjengelig", en: "How fast data must be available" },
  { q: "q39", nb: "Datavolum per år", en: "Data volume per year" },
  { q: "q40", nb: "Lagringstid", en: "Retention" },
  { q: "q50", nb: "Hosting", en: "Hosting" },
  { q: "q203", nb: "Jurisdiksjon og kontroll", en: "Jurisdiction and control" },
  { q: "q21", nb: "Styringsmodell", en: "Governance model" },
  { q: "q42", nb: "Integrasjonsmønster", en: "Integration pattern" },
  { q: "q43", nb: "Rettelser og historikk", en: "Corrections and history" },
  { q: "q58", nb: "Agenters autonomi", en: "Agent autonomy" },
  { q: "q158", nb: "Agent-til-agent mellom virksomheter", en: "Agent-to-agent across organisations" },
  { q: "q184", nb: "Produktpass identifiserer", en: "Passport identifies" },
  { q: "q188", nb: "Hvem drifter produktpassene", en: "Who operates the passports" },
  { q: "q196", nb: "Signering", en: "Signing" },
  { q: "q147", nb: "Avvik midt på natten", en: "Deviation in the middle of the night" },
  { q: "q208", nb: "Åpen kildekode", en: "Open source" },
  { q: "q210", nb: "Vei til plattformen", en: "Route to the platform" },
  { q: "q198", nb: "Budsjett per år", en: "Budget per year" },
  { q: "q200", nb: "Prismodell", en: "Pricing model" }
];

function featureSignalMet(sig, a) {
  if (sig.any) return sig.any.some(function (i) { return a.sel.indexOf(i) > -1; });
  if (sig.scale) return typeof a.val === "number" && a.val >= sig.scale;
  if (sig.count) {
    var sel = sig.of ? a.sel.filter(function (i) { return sig.of.indexOf(i) > -1; }) : a.sel;
    return sel.length >= sig.count;
  }
  return false;
}

function featurePriority(score) {
  return score >= 4 ? "must" : score >= 2 ? "should" : score >= 1 ? "could" : "none";
}

/* get(qid) -> { sel: [indices], val: number|null }. */
function evalFeatures(get) {
  return FEATURES.map(function (f) {
    var met = [], against = [], open = [], score = 0;
    f.signals.forEach(function (s) {
      var ok = featureSignalMet(s, get(s.q) || { sel: [], val: null });
      if (ok) { score += s.w; (s.w > 0 ? met : against).push(s); }
      else if (s.w > 0) open.push(s);
    });
    return { feature: f, score: score, priority: featurePriority(score), met: met, against: against, open: open };
  });
}

/* Which features each question feeds, for the hint under every question. */
var FEATURES_BY_Q = (function () {
  var m = {};
  FEATURES.forEach(function (f) {
    f.signals.concat((f.detail || []).map(function (q) { return { q: q }; })).forEach(function (s) {
      m[s.q] = m[s.q] || [];
      if (m[s.q].indexOf(f) === -1) m[s.q].push(f);
    });
  });
  PLATFORM_PROFILE.forEach(function (p) { m[p.q] = m[p.q] || []; m[p.q].profile = true; });
  return m;
})();
