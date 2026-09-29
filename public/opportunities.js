/* What could be built, sold or offered given the answers a respondent gives.
   Each opportunity lists the concrete choices it rests on; the app shows which
   are already in place, which are missing, and what that unlocks. Conditions:
     any:   [option indices] — met if the respondent selected any of them
     scale: n                — met if the rated answer is n or higher
   Indices refer to option positions in questions.js and move with it. */

var OPP_TYPES = {
  data: { nb: "Dataprodukt", en: "Data product" },
  ai: { nb: "KI-tjeneste", en: "AI service" },
  platform: { nb: "Plattformtjeneste", en: "Platform service" },
  trust: { nb: "Tillitstjeneste", en: "Trust service" },
  ops: { nb: "Driftstjeneste", en: "Operations service" },
  model: { nb: "Ny forretningsmodell", en: "New business model" }
};

var OPPORTUNITIES = [
  {
    id: "pcf", type: "data",
    nb: { title: "Verifisert klimaavtrykk per produkt",
      pitch: "Selg dokumentert PCF per serienummer til kunder som selv må rapportere – i stedet for et årlig snitt de ikke kan bruke i sin egen rapportering." },
    en: { title: "Verified carbon footprint per product",
      pitch: "Sell documented PCF per serial number to customers who must report themselves — instead of an annual average they cannot use in their own reporting." },
    needs: [
      { q: "q114", any: [2, 3, 4], nb: "Fotavtrykk kan registreres per batch eller finere", en: "Footprint recordable per batch or finer" },
      { q: "q119", scale: 4, nb: "Fotavtrykket skal følge produktet, ikke rapporteres årlig", en: "Footprint follows the product rather than an annual report" },
      { q: "q121", scale: 4, nb: "Tallene skal kunne revideres", en: "The figures must be auditable" }
    ]
  },
  {
    id: "dpp", type: "platform",
    nb: { title: "Digitalt produktpass som tjeneste",
      pitch: "Drift produktpasset for andre i kjeden: identitet, materialdata, hendelser og dokumentasjon samlet ett sted, klart for ESPR." },
    en: { title: "Digital Product Passport as a service",
      pitch: "Operate the passport for others in the chain: identity, material data, events and documentation in one place, ESPR-ready." },
    needs: [
      { q: "q25", any: [3, 2], nb: "Produktpass-ID eller serienummer brukes som nøkkel", en: "DPP identifier or serial number used as the key" },
      { q: "q117", any: [3, 0, 1], nb: "Noen krever allerede slik dokumentasjon", en: "Someone already requires this documentation" },
      { q: "q28", scale: 4, nb: "Sporbarhet på tvers av virksomheter er viktig", en: "Cross-company traceability matters" }
    ]
  },
  {
    id: "dppagent", type: "ai",
    nb: { title: "Agent som holder produktpasset levende",
      pitch: "Abonnement der en agent oppdaterer passet automatisk ved reparasjon, oppgradering, komponentbytte og eierskifte – den løpende kostnaden ved DPP forsvinner." },
    en: { title: "An agent that keeps the passport alive",
      pitch: "A subscription where an agent updates the passport automatically on repair, upgrade, component swap and change of ownership — the running cost of a DPP disappears." },
    needs: [
      { q: "q56", scale: 4, nb: "En slik agent vurderes som verdifull", en: "Such an agent is seen as valuable" },
      { q: "q58", any: [2, 3, 4], nb: "Agenter får skrive, med eller uten godkjenning", en: "Agents are allowed to write, with or without approval" },
      { q: "q60", scale: 3, nb: "Agentgenererte data skilles fra målte data", en: "Agent-generated data is kept distinct from measured data" }
    ]
  },
  {
    id: "reuse", type: "ai",
    nb: { title: "Ombruksvurdering av brukte enheter",
      pitch: "Score hver returnerte enhet på gjenværende levetid og ombruksverdi fra bruks- og testdata – grunnlaget for å prise brukt utstyr i stedet for å gjette." },
    en: { title: "Reuse scoring of used units",
      pitch: "Score every returned unit on remaining life and reuse value from usage and test data — the basis for pricing used equipment instead of guessing." },
    needs: [
      { q: "q55", any: [7, 9], nb: "Prediksjon av levetid eller ombrukspotensial er ønsket", en: "Remaining-life or reuse-potential prediction is wanted" },
      { q: "q71", any: [4, 5, 6], nb: "Bruks-, tilstands- eller reparasjonshistorikk er tilgjengelig", en: "Usage, condition or repair history is available" },
      { q: "q28", scale: 4, nb: "Sporbarhet gjennom livsløpet er på plass", en: "Lifecycle traceability is in place" }
    ]
  },
  {
    id: "compliance", type: "ai",
    nb: { title: "Etterlevelsesrapportering på autopilot",
      pitch: "Utkast til ESPR-, CSRD-, RoHS- og REACH-dokumentasjon genereres fra plattformdataene – selges til de mange i kjeden som mangler folk til dette." },
    en: { title: "Compliance reporting on autopilot",
      pitch: "Draft ESPR, CSRD, RoHS and REACH documentation generated from platform data — sold to the many in the chain who lack the people for it." },
    needs: [
      { q: "q117", any: [0, 1, 2, 3, 4], nb: "Noen krever rapportering fra dere", en: "Someone requires reporting from you" },
      { q: "q55", any: [4], nb: "Automatiske rapportutkast er etterspurt", en: "Automatic report drafting is wanted" },
      { q: "q121", scale: 3, nb: "Tallene må kunne etterprøves", en: "The figures must stand up to checking" }
    ]
  },
  {
    id: "materials", type: "data",
    nb: { title: "Material- og stoffdata som delt datasett",
      pitch: "Maskinlesbare stykklister og stoffdeklarasjoner på tvers av leverandører – det gjenvinnere, reparatører og innkjøpere i dag ikke får tak i." },
    en: { title: "Material and substance data as a shared dataset",
      pitch: "Machine-readable bills of materials and substance declarations across suppliers — what recyclers, repairers and buyers cannot get hold of today." },
    needs: [
      { q: "q41", any: [2, 6], nb: "IPC-, IMDS- eller SCIP-standarder brukes", en: "IPC, IMDS or SCIP standards are in use" },
      { q: "q71", any: [0], nb: "Stykkliste og stoffsammensetning trengs fra andre", en: "BOM and substance composition needed from others" },
      { q: "q120", any: [0, 1], nb: "Leverandørdata mangler eller kommer som PDF", en: "Supplier data is missing or arrives as PDF" }
    ]
  },
  {
    id: "claims", type: "trust",
    nb: { title: "Verifiserbare påstander uten blokkjede",
      pitch: "Signerte, reviderbare bevis for resirkulert innhold, eierskifte og forsvarlig gjenvinning – tillit selges som tjeneste, ikke som infrastrukturprosjekt." },
    en: { title: "Verifiable claims without a blockchain",
      pitch: "Signed, auditable evidence for recycled content, change of ownership and proper recycling — trust sold as a service, not as an infrastructure project." },
    needs: [
      { q: "q47", any: [0, 1, 2, 4, 5, 7], nb: "Noen data trenger manipulasjonssikring", en: "Some data needs tamper-evidence" },
      { q: "q163", any: [0, 1, 2, 3], nb: "Signaturer, legitimasjoner, signerte logger eller revisjon er akseptert", en: "Signatures, credentials, signed logs or audit are accepted" },
      { q: "q14", scale: 4, nb: "Opphav og sporbarhet i data er viktig", en: "Data lineage and provenance matter" }
    ]
  },
  {
    id: "market", type: "model",
    nb: { title: "Markedsplass for gjenvunne deler og materialer",
      pitch: "Når tilstand, sammensetning og historikk er kjent, blir brukte komponenter omsettelige – plattformen tar en andel av handelen den muliggjør." },
    en: { title: "Marketplace for recovered parts and materials",
      pitch: "Once condition, composition and history are known, used components become tradable — the platform takes a share of the trade it enables." },
    needs: [
      { q: "q55", any: [10], nb: "Å finne annenhåndsmarkeder er av interesse", en: "Finding secondary markets is of interest" },
      { q: "q69", any: [5, 6, 7], nb: "Deling med ombruksaktører og gjenvinnere er aktuelt", en: "Sharing with refurbishers and recyclers is realistic" },
      { q: "q10", any: [1, 2, 3], nb: "Ombruk av produkter eller komponenter er et mål", en: "Reuse of products or components is a goal" }
    ]
  },
  {
    id: "knowledge", type: "ai",
    nb: { title: "Ekspertkunnskap som opplærings- og veiledningsprodukt",
      pitch: "Registrert arbeid fra de erfarne blir til veiledning for de neste – og til en tjeneste andre i bransjen med samme kompetansetap vil kjøpe." },
    en: { title: "Expert knowledge as a training and guidance product",
      pitch: "Recorded work from experienced people becomes guidance for the next ones — and a service others facing the same knowledge loss will buy." },
    needs: [
      { q: "q85", scale: 3, nb: "Virksomheten er utsatt for kunnskapstap", en: "The organisation is exposed to knowledge loss" },
      { q: "q86", any: [3, 4, 5, 7, 9], nb: "Registrering av arbeid er akseptabelt", en: "Capturing work is acceptable" },
      { q: "q88", scale: 4, nb: "En assistent lært av ekspertarbeid har verdi", en: "An assistant trained on expert work has value" }
    ]
  },
  {
    id: "remote", type: "ops",
    nb: { title: "Fjernstøtte med AR i felt",
      pitch: "Én ekspert dekker mange anlegg gjennom briller på montørens hode – reiser bort, responstid ned, kompetansen skalerer." },
    en: { title: "Remote AR support in the field",
      pitch: "One expert covers many sites through glasses on the technician's head — travel gone, response time down, competence scales." },
    needs: [
      { q: "q87", any: [1, 5], nb: "Feltveiledning eller fjernstøtte er et bruksområde", en: "Field guidance or remote support is a use case" },
      { q: "q86", any: [3, 4], nb: "Hodemontert kamera eller AR-briller er akseptabelt", en: "Head-mounted camera or AR glasses are acceptable" },
      { q: "q92", any: [0, 1, 2, 3, 4, 5], nb: "Ansatte kan akseptere utstyret under gitte vilkår", en: "Staff could accept the devices on defined terms" }
    ]
  },
  {
    id: "raas", type: "model",
    nb: { title: "Robotisert demontering som tjeneste",
      pitch: "Demontering og sortering selges per enhet i stedet for per time – det som gjør sirkulær behandling lønnsom i et høykostland." },
    en: { title: "Robotic disassembly as a service",
      pitch: "Disassembly and sorting sold per unit rather than per hour — what makes circular processing viable in a high-wage country." },
    needs: [
      { q: "q99", any: [8, 9], nb: "Demontering eller sortering er verdt å automatisere", en: "Disassembly or sorting is worth automating" },
      { q: "q101", scale: 4, nb: "Automatisering avgjør lønnsomheten i sirkulært arbeid", en: "Automation decides the economics of circular work" },
      { q: "q109", any: [0, 1, 2, 3], nb: "Robotene kan få geometri, stykkliste eller demonteringsdata", en: "Robots can be given geometry, BOM or disassembly data" }
    ]
  },
  {
    id: "skills", type: "ai",
    nb: { title: "Robotferdigheter lært fra mennesker",
      pitch: "Et bibliotek av ferdigheter utledet fra registrert håndarbeid, ikke håndprogrammert – det som gjør små serier og stor variasjon mulig å automatisere." },
    en: { title: "Robot skills learned from people",
      pitch: "A library of skills derived from recorded manual work rather than hand-programmed — what makes small batches and high variety automatable." },
    needs: [
      { q: "q110", scale: 4, nb: "Læring fra demonstrasjon er viktig", en: "Learning from demonstration matters" },
      { q: "q86", any: [3, 4, 7, 9], nb: "Arbeid kan registreres med kamera eller sensorer", en: "Work can be captured with cameras or sensors" },
      { q: "q102", any: [0, 4, 5], nb: "Variasjon og omstillingskostnad blokkerer i dag", en: "Variety and changeover cost are today's blockers" }
    ]
  },
  {
    id: "graph", type: "data",
    nb: { title: "Spørretjeneste mot verdikjedens kunnskapsgraf",
      pitch: "«Hvilke produkter i felt inneholder denne komponenten, og hva er tilstanden deres?» besvart på sekunder – selges som tilgang, ikke som prosjekt." },
    en: { title: "Query service over the value chain's knowledge graph",
      pitch: "“Which products in the field contain this component, and what condition are they in?” answered in seconds — sold as access, not as a project." },
    needs: [
      { q: "q34", any: [5, 6], nb: "Kunnskapsgraf er en aktuell lagringsform", en: "A knowledge graph is on the table" },
      { q: "q29", scale: 4, nb: "Felles semantisk modell er viktig", en: "A common semantic model matters" },
      { q: "q55", any: [0], nb: "Søk på naturlig språk er etterspurt", en: "Natural-language search is wanted" }
    ]
  },
  {
    id: "dataspace", type: "platform",
    nb: { title: "Nøytral operatør av et føderert datarom",
      pitch: "Ingen vil gi dataene sine til konkurrentens plattform. Den som drifter det nøytrale rommet mellom dem, har en posisjon ingen andre kan ta." },
    en: { title: "Neutral operator of a federated data space",
      pitch: "Nobody hands their data to a competitor's platform. Whoever runs the neutral space between them holds a position no one else can take." },
    needs: [
      { q: "q21", any: [1, 2, 3], nb: "Konsortium, nøytral operatør eller føderert modell foretrekkes", en: "Consortium, neutral operator or federated model preferred" },
      { q: "q49", scale: 4, nb: "Ingen enkeltaktør bør kontrollere infrastrukturen", en: "No single company should control the infrastructure" },
      { q: "q42", any: [1, 5], nb: "Føderert eller hybrid integrasjon er ønsket", en: "Federated or hybrid integration is wanted" }
    ]
  },
  {
    id: "onboarding", type: "ops",
    nb: { title: "Leverandør-onboarding som tjeneste",
      pitch: "De små leverandørene får aldri IT-avdeling. Å ta imot regnearket deres og gjøre det om til gyldige data er en betalt tjeneste, ikke et hinder." },
    en: { title: "Supplier onboarding as a service",
      pitch: "Small suppliers will never get an IT department. Taking their spreadsheet and turning it into valid data is a paid service, not an obstacle." },
    needs: [
      { q: "q31", scale: 4, nb: "Lav terskel for små leverandører er viktig", en: "A low barrier for small suppliers matters" },
      { q: "q55", any: [2], nb: "Automatisk kartlegging av leverandørdata er ønsket", en: "Automatic mapping of supplier data is wanted" },
      { q: "q11", any: [2, 9], nb: "Inkonsistente formater eller data låst i PDF er et problem", en: "Inconsistent formats or data locked in PDFs is a problem" }
    ]
  },
  {
    id: "greenops", type: "ops",
    nb: { title: "Fotavtrykksbevisst datadrift",
      pitch: "En plattform som viser og styrer sitt eget energibruk skiller seg ut i anbud der kunden selv rapporterer Scope 3 – og kutter driftskostnaden samtidig." },
    en: { title: "Footprint-aware data operations",
      pitch: "A platform that shows and manages its own energy use stands out in tenders where the customer reports Scope 3 — and cuts running cost at the same time." },
    needs: [
      { q: "q178", any: [10], nb: "Plattformens eget fotavtrykk skal rapporteres", en: "The platform's own footprint should be reported" },
      { q: "q178", any: [3, 4, 5, 6, 7, 8], nb: "Konkrete tiltak på datasiden aksepteres", en: "Concrete measures on the data side are accepted" },
      { q: "q177", scale: 4, nb: "Energibruken fra KI og data er en reell bekymring", en: "The energy use of AI and data is a real concern" }
    ]
  },
  {
    id: "watch", type: "ops",
    nb: { title: "Tilsyn som tjeneste for ubemannet drift",
      pitch: "Noen må se på skjermen når fabrikken går tom om natten. Overvåking, varsling og kvalitetsbevis for det som lages uten tilsyn, solgt til flere anlegg samtidig." },
    en: { title: "Supervision as a service for unattended operation",
      pitch: "Someone has to watch the screen when the factory runs empty at night. Monitoring, alerting and quality evidence for what is made unsupervised, sold across several sites at once." },
    needs: [
      { q: "q143", any: [2, 3, 4, 5], nb: "Ubemannet drift er realistisk eller allerede i gang", en: "Unattended operation is realistic or already happening" },
      { q: "q146", any: [0, 1, 2], nb: "Sanntidsbilde, varsling og beslutningsgrunnlag utenfra kreves", en: "Live picture, alerting and decision context from outside are required" },
      { q: "q148", scale: 4, nb: "Enheter laget uten tilsyn må kunne dokumenteres like godt", en: "Units made unsupervised must be documented just as well" }
    ]
  },
  {
    id: "continuity", type: "trust",
    nb: { title: "Kontinuitetsordning for produktdata",
      pitch: "Noen må garantere at dataene overlever plattformen – deponi, nøytral forvalter og leseklare formater selges som en forsikring kundene faktisk trenger." },
    en: { title: "Continuity arrangement for product data",
      pitch: "Someone has to guarantee the data outlives the platform — escrow, a neutral custodian and readable formats, sold as the insurance customers actually need." },
    needs: [
      { q: "q136", any: [9, 0, 1], nb: "Eksport, åpne formater eller avtalt ordning ved opphør kreves", en: "Export, open formats or an agreed wind-down arrangement is required" },
      { q: "q137", any: [0, 1, 2], nb: "Dataene skal tilbake til deltakerne, til en nøytral instans eller i deponi", en: "Data should return to participants, to a neutral body or into escrow" },
      { q: "q40", any: [4, 5], nb: "Dataene må være tilgjengelige hele produktets levetid eller lenger", en: "Data must stay available for the product's lifetime or longer" }
    ]
  },
  {
    id: "sovereign", type: "platform",
    nb: { title: "Suveren europeisk drift",
      pitch: "En plattform som beviselig kjører på europeisk infrastruktur, under europeisk jurisdiksjon, blir det trygge valget når suverenitet går fra ønske til krav." },
    en: { title: "Sovereign European operation",
      pitch: "A platform that demonstrably runs on European infrastructure, under European jurisdiction, becomes the safe choice when sovereignty turns from preference into requirement." },
    needs: [
      { q: "q170", any: [0], nb: "Europeisk jurisdiksjon og kontroll er et krav", en: "European jurisdiction and control is a requirement" },
      { q: "q50", any: [0, 1, 2, 4], nb: "Lokal, privat, europeisk eller føderert drift foretrekkes", en: "On-premise, private, European or federated hosting preferred" },
      { q: "q127", any: [3], nb: "Datasuverenitet vurderes som et sannsynlig utviklingstrekk", en: "Data sovereignty is considered a plausible development" }
    ]
  },
  {
    id: "edge", type: "data",
    nb: { title: "Edge-analyse som produkt",
      pitch: "Behandling ved maskinen gir innsikt uten å sende rådata ut av huset – det gjør IP-sensitive kunder til mulige kunder." },
    en: { title: "Edge analytics as a product",
      pitch: "Processing at the machine gives insight without raw data leaving the building — which turns IP-sensitive customers into possible customers." },
    needs: [
      { q: "q65", any: [4, 5, 6], nb: "Avviksdeteksjon eller lokal analyse hører hjemme i kanten", en: "Anomaly detection or local analytics belong at the edge" },
      { q: "q67", any: [3, 4], nb: "Konfidensialitet eller IP-beskyttelse driver lokal behandling", en: "Confidentiality or IP protection drives local processing" },
      { q: "q12", scale: 4, nb: "Konfidensialitet er kritisk", en: "Confidentiality is critical" }
    ]
  },
  {
    id: "dppkit", type: "platform",
    nb: { title: "Standardklart produktpass, levert ferdig",
      pitch: "De fleste står på startstreken. Et ferdig oppsett etter EN 18216–18223 – identifikator, databærer, lagring med persistens, API-er og registrering i EUs register – selges til alle som må ha pass fra 2027." },
    en: { title: "Standards-ready product passport, delivered",
      pitch: "Most are at the starting line. A ready set-up under EN 18216–18223 — identifier, data carrier, persistent storage, APIs and registration in the EU registry — sold to everyone who needs passports from 2027." },
    needs: [
      { q: "q181", any: [1, 2, 3], nb: "Forberedelsene til produktpass er i gang, men ikke ferdige", en: "Passport preparations have started but are not finished" },
      { q: "q188", any: [1, 2, 3], nb: "En tjenesteleverandør eller felles plattform skal drifte passene", en: "A service provider or shared platform should operate the passports" },
      { q: "q186", any: [0, 1, 2, 3], nb: "En standard databærer er realistisk på produktene", en: "A standard data carrier is realistic on the products" }
    ]
  },
  {
    id: "agentgov", type: "trust",
    nb: { title: "Styring av agenttrafikk som tjeneste",
      pitch: "Når agenter handler med agenter, trengs noen som utsteder identitet, håndhever kvoter og datakontrakter og fører revisjonslogg – en nøytral trafikkontroll for verdikjeden." },
    en: { title: "Agent traffic governance as a service",
      pitch: "When agents deal with agents, someone must issue identity, enforce quotas and data contracts and keep the audit trail — a neutral traffic control for the value chain." },
    needs: [
      { q: "q155", scale: 4, nb: "Datavolum fra agenter blir en bekymring om fem år", en: "Agent-driven data volume becomes a concern within five years" },
      { q: "q158", any: [1, 2], nb: "Agentutveksling skal skje via datakontrakter eller en felles ramme", en: "Agent exchange should run through data contracts or a shared framework" },
      { q: "q160", scale: 4, nb: "Det må kunne settes grenser for hva agenter genererer", en: "Limits on what agents generate must be possible" }
    ]
  },
  {
    id: "opencore", type: "model",
    nb: { title: "Felles åpen kildekode-kjerne for bransjen",
      pitch: "En kjerne som eies i fellesskap og er åpen for innsyn, med betalt drift, support og tilpasning rundt – kostnaden deles etter bruk, og ingen blir låst til én leverandør." },
    en: { title: "A shared open-source core for the industry",
      pitch: "A jointly owned core open to inspection, with paid operations, support and adaptation around it — cost shared by use, and nobody locked to one vendor." },
    needs: [
      { q: "q208", any: [0, 1], nb: "Åpen kildekode er et krav eller foretrukket", en: "Open source is required or preferred" },
      { q: "q210", any: [1, 4], nb: "Åpen kildekode eller en felles bransjeplattform er riktig vei", en: "Open source or a shared industry platform is the right route" },
      { q: "q201", any: [1, 3, 4], nb: "Kostnaden bør deles etter bruk eller med det offentlige", en: "Cost should be shared by use or with the public sector" }
    ]
  },
  {
    id: "blackbox", type: "trust",
    nb: { title: "Uavhengig innsyn i svarte bokser",
      pitch: "Test, revisjon og dokumentasjon av KI-modeller, algoritmer og fastvare i verdikjeden – en tillitstjeneste for dem som ikke kan godta beslutninger ingen kan forklare." },
    en: { title: "Independent insight into black boxes",
      pitch: "Testing, audit and documentation of AI models, algorithms and firmware in the value chain — a trust service for those who cannot accept decisions nobody can explain." },
    needs: [
      { q: "q174", scale: 4, nb: "Svarte bokser er en stor bekymring", en: "Black boxes are a major concern" },
      { q: "q175", any: [0, 1, 4], nb: "Innsyn i KI, fastvare eller algoritmer mangler", en: "Transparency into AI, firmware or algorithms is lacking" },
      { q: "q176", any: [2, 3, 4], nb: "Revisjon, egen testing eller modellkort ville gjort dem akseptable", en: "Audit, own testing or model cards would make them acceptable" }
    ]
  },
  {
    id: "origin", type: "data",
    nb: { title: "Kart over opprinnelse og jurisdiksjon",
      pitch: "Hvor komponenter, råvarer, data og tjenester kommer fra – og hvilke lover de er underlagt – samlet fra plattformdataene og solgt som risikobilde for innkjøp og beredskap." },
    en: { title: "Map of origin and jurisdiction",
      pitch: "Where components, raw materials, data and services come from — and which laws apply to them — assembled from platform data and sold as a risk picture for procurement and preparedness." },
    needs: [
      { q: "q171", scale: 4, nb: "Verdikjeden er utsatt for geopolitiske spenninger", en: "The value chain is exposed to geopolitical tensions" },
      { q: "q172", any: [0, 1, 2, 3, 4], nb: "Konsekvensene merkes i råvarer, komponenter eller dokumentasjon av opprinnelse", en: "Consequences are felt in raw materials, components or origin documentation" },
      { q: "q173", any: [0, 1], nb: "Plattformen bør vise opprinnelse og jurisdiksjon", en: "The platform should show origin and jurisdiction" }
    ]
  }
];

/* get(qid) -> { sel: [indices], val: number|null } */
function evalOpportunities(get) {
  return OPPORTUNITIES.map(function (o) {
    var met = [], missing = [];
    o.needs.forEach(function (need) {
      var a = get(need.q) || { sel: [], val: null };
      var ok = false;
      if (need.any) {
        ok = need.any.some(function (i) { return a.sel.indexOf(i) > -1; });
      } else if (need.scale) {
        ok = typeof a.val === "number" && a.val >= need.scale;
      }
      (ok ? met : missing).push(need);
    });
    var ratio = met.length / o.needs.length;
    return {
      opp: o, met: met, missing: missing, ratio: ratio,
      status: ratio === 1 ? "ready" : (ratio >= 0.5 ? "near" : "far")
    };
  });
}
